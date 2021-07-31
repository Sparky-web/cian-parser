const axios = require("axios")
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const {URL} = require("url")
const _ = require("lodash")
const Bx24 = require("./bx24")
const cron = require('node-cron');
const httpsProxyAgent = require('https-proxy-agent');

class Parser {
    proxyList = []
    urls = []

    constructor(parent) {
        this.config = parent.config
        this.logger = parent.logger
        this.strapi = parent.strapi
    }

    async start() {
        this.axios = axios.create()
        this.axios.defaults.headers = {
            "referrer": "https://www.google.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        this.proxies = await this.strapi.get("proxies", {enabled: true})
        this.config = await this.strapi.get("config")

        async function reqMiddleware(config) {
            const proxy = this.proxies[_.random(0, this.proxies.length - 1)]

            if (config.url.match(/cian/ig) && proxy) {
                const agent = new httpsProxyAgent(proxy.proxy)
                config.proxy = false
                config.httpsAgent = agent
            }

            return config;
        }

        async function errorHandler(error) {
            if (!error.config.httpsAgent) throw error

            const ip = error.config.httpsAgent.proxy.host
            const port = error.config.httpsAgent.proxy.port

            let proxy = await this.strapi.getProxies({
                proxy_contains: `${ip}:${port}`
            })
            proxy = proxy[0]

            await this.strapi.update("proxies", {
                ...proxy,
                unsuccesfulAttempts: proxy.unsuccesfulAttempts ? proxy.unsuccesfulAttempts + 1 : 1,
                enabled: proxy.unsuccesfulAttempts < this.config.proxyAttemptsLimit ? true : false
            })

            this.proxies = await this.strapi.get("proxies", {enabled: true})

            throw new Error("proxy error")
        }

        this.axios.interceptors.request.use(reqMiddleware.bind(this));
        this.axios.interceptors.response.use(c => c, errorHandler.bind(this));

        this.jobs = []
        const links = await this.strapi.get("links")

        this.logger.info("Links loaded, ids: " + links.map(e => e.id).join(", "))

        for (let link of links) {
            this.jobs.push(
                cron.schedule(link.frequency, async () => {
                    await this.parseUrl(link)
                        .catch(err => {
                            this.logger.error(`Parsing error. Id: ${link.id}. Error: ${err.message}`)
                        })
                })
            )
        }
    }

    async stop() {
        this.jobs.forEach(job => job.stop())
    }

    getDocument(html) {
        let {document} = (new JSDOM(html)).window;
        return document
    }

    async getPageCount(url) {
        let {data: html} = await this.axiosRetry(url)
        const document = this.getDocument(html)
        const itemsCount = +document.querySelector('*[data-name="SummaryHeader"]')
            .textContent.trim().match(/\d{1,5}/ig)[0]

        const pageCount = Math.ceil(itemsCount / 28)
        return pageCount
    }

    async parseItems(url, options = {}) {
        let res = await this.axios.get(url, options)
        let html = res.data
        const document = this.getDocument(html)

        let js = [...document.querySelectorAll("head script")].filter(e => e.innerHTML)[4].innerHTML
        let config = JSON.parse(js.substring(js.indexOf("["), js.lastIndexOf("]") + 1).match(/(?<== ).*/ig)[0])
        let initialState = _.find(config, {key: "initialState"})
        let {value: {results: {offers: offers}}} = initialState

        let items = offers.map(offer => ({
            title: document.querySelector(`a[href="${offer.fullUrl}"]`).parentNode.querySelector(`div[data-name="TitleComponent"]`).textContent.trim(),
            description: offer.description,
            price: offer.bargainTerms?.priceRur,
            priceInfo: null,
            address: offer.geo?.address.map(e => e.name).join(", "),
            link: offer.fullUrl,
            uId: offer.cianId,
            images: offer.photos?.map(photo => ({url: photo.fullUrl})),
            jk: offer.geo?.jk?.displayName,
            jkLink: offer.geo?.jk?.fullUrl,
            contacts: offer.phones.map(e => ({
                number: e.countryCode + e.number,
                name: offer.user?.agencyName || offer.user?.companyName
            })),
            floorNumber: offer.floorNumber,
            area: offer.totalArea,
            dealType: offer.dealType
        }))

        return items
    }

    async addOffers(offers, link) {
        const oldOffers = await this.strapi.getOffers()

        const oldUIds = _.map(oldOffers, "uId")
        const uIds = _.map(offers, "uId")

        const newUIds = _.difference(uIds, oldUIds)
        const newOffers = newUIds.map(uId => ({
            ..._.find(offers, {uId}),
            parsedFromLink: link.id
        }))

        for (let offer of newOffers) {
            await this.strapi.createOffer(offer)
        }

        return newOffers
    }

    async parseUrl(link) {
        this.logger.info(`Parsed started for link id: ${link.id}`)

        this.proxies = await this.strapi.get("proxies", {enabled: true})
        const pageCount = await this.getPageCount(link.url)

        this.logger.info("get page count: " + pageCount)

        const parsedUrl = new URL(link.url)
        let rawParams = parsedUrl.searchParams
        rawParams = [...rawParams]
        let params = {}
        rawParams.forEach(e => params[e[0]] = e[1])

        let pages = Array.apply(null, Array(Number(pageCount))).map((x, i) => i + 1)

        if (link.mode === "parse_first_pages" && !link.isFirstParse) {
            params.sort = "creation_date_desc"
            pages = pages.slice(0, Math.ceil(pageCount * 0.1))
        }

        const chunks = _.chunk(pages, 3)

        const items = [];
        const addedItems = [];

        for (let chunk of chunks) {
            await Promise.all(chunk.map(async page => {
                const data = await this.parseItems(parsedUrl.href.split("?")[0], {
                    params: {
                        ...params,
                        p: page
                    }
                })
                items.push(...data)
                const newItems = await this.addOffers(data, link)
                addedItems.push(...newItems)
            }))
        }

        this.logger.info(`Parsing ended for link id: ${link.id}. Items parsed total: ${items.length}, added items: ${addedItems.length}`)
    }

    async axiosRetry(url, options = {}, retries = 3) {
        if (retries === 0) throw new Error("retries count extended")
        try {
            const data = await this.axios.get(
                url,
                options
            )
            return data
        } catch (e) {
            const data = await this.axiosRetry(url, options, (retries - 1))
            return data
        }
    }


}

module.exports = Parser