const axios = require("axios")
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const {URL} = require("url")
const _ = require("lodash")
const cron = require('node-cron');
const httpsProxyAgent = require('https-proxy-agent');
const cronConfig = require("./cron-config")

class Parser {
    proxyList = []
    urls = []

    constructor(parent) {
        this.config = parent.config
        this.logger = parent.logger
        this.strapi = parent.strapi
        this.bx24 = parent.bx24
    }

    async start(mode) {
        const that = this;

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
                if (proxy.cookie) config.headers.cookie = proxy.cookie
            }

            return config;
        }

        async function errorHandler(error) {
            if (!error.config.httpsAgent) throw error

            const ip = error.config.httpsAgent.proxy.host
            const port = error.config.httpsAgent.proxy.port

            await this.addUnsuccessfulCountToProxy(`${ip}:${port}`)

            throw new Error("proxy error")
        }

        async function resMiddleware(c) {
            const document = that.getDocument(c.data)
            if (document.querySelector("#captcha")) {
                const ip = c.config.httpsAgent.proxy.host
                const port = c.config.httpsAgent.proxy.port
                await this.addUnsuccessfulCountToProxy(`${ip}:${port}`)
                throw new Error("Captcha, can not proceed")
            }

            return c
        }

        this.axios.interceptors.request.use(reqMiddleware.bind(this));
        this.axios.interceptors.response.use(resMiddleware.bind(this), errorHandler.bind(this));

        this.jobs = []
        const links = await this.strapi.get("links", {isEnabled: true})

        if(mode === "test") return;

        this.logger.info("Links loaded, names: " + links.map(e => e.name).join(", "))

        for (let link of links) {
            this.jobs.push(
                cron.schedule(cronConfig[link.frequency], async () => {
                    await this.parseUrl(link)
                        .catch(err => {
                            this.logger.error(`Parsing error. Link: ${link.name}. Error: ${err.message}`)
                        })
                })
            )
        }
    }

    async addUnsuccessfulCountToProxy(proxyString) {
        let proxy = await this.strapi.getProxies({
            proxy_contains: proxyString
        })
        proxy = proxy[0]

        await this.strapi.update("proxies", {
            ...proxy,
            unsuccesfulAttempts: proxy.unsuccesfulAttempts ? proxy.unsuccesfulAttempts + 1 : 1,
            enabled: proxy.unsuccesfulAttempts < this.config.proxyAttemptsLimit
        })

        this.proxies = await this.strapi.get("proxies", {enabled: true})
    }

    async stop() {
        this.jobs.forEach(job => job.stop())
    }

    getDocument(html) {
        let {document} = (new JSDOM(html)).window;
        return document
    }

    async getPageCount(url) {
        let {data: html} = await (this.axiosRetry.bind(this))(url)
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

        const createdOffers = []
        for (let offer of newOffers) {
            createdOffers.push(await this.strapi.createOffer(offer))
        }

        if(link.shouldAddToBitrix) {
            for (let offer of createdOffers) {
                try {
                    await this.bx24.createEntry(offer)
                } catch (e) {
                    this.logger.error("Couldn't create deal for offer id: " + offer.id)
                }
            }
        }

        return newOffers
    }

    async parseUrl(link) {
        const startTime = +new Date()

        this.logger.info(`Parsed started for link: ${link.name}`)

        this.proxies = await this.strapi.get("proxies", {enabled: true})
        const pageCount = await this.getPageCount(link.url)

        this.logger.info(`Got pages on link ${link.name}: ${pageCount}`)

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

        if (link.isFirstParse) await this.strapi.update("links", {
            ...link,
            isFirstParse: false
        })

        this.logger.info(`Parsing ended for link: ${link.name}. Items parsed total: ${items.length}, added items: ${addedItems.length}`)

        const endTime = +new Date()

        const parsingInfo = {
            items: items.length,
            addedItems: addedItems.length,
            timeElapsed: Math.round((endTime - startTime) / 1000),
            time: (new Date()).toISOString()
        }

        await this.strapi.update("links", {
            ...link,
            lastParse: parsingInfo
        })
        return parsingInfo
    }

    async parseOneUrl(url) {
        const {data: html} = await this.axiosRetry.get(url)
        const document = this.getDocument(html)


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
            this.logger.error(e.message + ". Retrying.")
            const data = await this.axiosRetry(url, options, (retries - 1))
            return data
        }
    }
}

module.exports = Parser