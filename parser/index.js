const axios = require("axios")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { URL } = require("url")
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
        console.log("started")
        this.axios = axios.create()
        this.axios.defaults.headers = {
            "referrer": "https://www.google.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        this.bx24 = new Bx24()

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
            if(!error.config.httpsAgent) throw error

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

            this.proxies = await this.strapi.get("proxies")

            throw new Error("proxy error")
        }

        this.axios.interceptors.request.use(reqMiddleware.bind(this));
        this.axios.interceptors.response.use(c=>c, errorHandler.bind(this));

        this.jobs = []
        const links = await this.strapi.get("links")
        for(let link of links) {
            this.jobs.push(
                cron.schedule(link.frequency, async () => {
                    this.logger.info("Parsing started. Id: " + link.id)
                    await this.parseUrl(link).catch(err => this.logger.error(`Parsing error. Url: ${url}. Error: ${err.message}`))
                    this.logger.info("Parsing ended. Id: " + link.id)
                })
            )
        }

    }

    async stop() {
        this.jobs.forEach(job => job.stop())
    }

    getDocument(html) {
        let { document } = (new JSDOM(html)).window;
        return document
    }

    async getPageCount(url) {
        let { data: html } = await this.axiosRetry(url)
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
        const items = [...document.querySelectorAll(`*[data-name="Offers"] *[data-name="CardComponent"]`)]
            .map(el => {
                return {
                    title: el.querySelector(`*[data-name="TitleComponent"]`)?.textContent.trim(),
                    description: el.querySelector(`*[class*="description"] p`)?.textContent.trim(),
                    price: el.querySelector(`*[data-mark="MainPrice"]`)?.textContent.trim(),
                    priceInfo: el.querySelector(`*[data-mark="PriceInfo"]`)?.textContent.trim(),
                    address: [...el.querySelectorAll(`*[data-name="GeoLabel"]`)]?.map(e => e.textContent).join(", "),
                    link: el.querySelector("a").href,
                    uId: el.querySelector("a").href.slice(0, -1).split("/").slice(-1)[0],
                    imageUrl: el.querySelector(`*[data-name="Carousel"] img`)?.src,
                    jk: el.querySelector(`*[class*="--jk"]`)?.textContent.trim(),
                    jkLink: el.querySelector(`*[class*="--jk"]`)?.href
                }
            })


        return items

    }

    async addOffers(offers, link) {
        const oldOffers = await this.strapi.getOffers()

        const oldUIds = _.map(oldOffers, "uId")
        const uIds = _.map(offers, "uId")

        const newUIds = _.difference(uIds, oldUIds)
        const newOffers = newUIds.map(uId => _.find(offers, { uId }))

        for (let offer of newOffers) {
            await this.strapi.createOffer(offer)
            if (
                (link.firstAction === "dont_add_first_parse" && !link.isFirstParse)
                || (link.firstAction === "add_first_parse")
            ) {
                await this.bx24.remind(offer)
            }
        }
    }

    async parseUrl(link) {
        const pageCount = await this.getPageCount(link.url)

        const parsedUrl = new URL(link.url)
        let rawParams = parsedUrl.searchParams
        rawParams = [...rawParams]
        let params = {}
        rawParams.forEach(e => params[e[0]] = e[1])

        let pages = Array.apply(null, Array(Number(pageCount))).map((x, i) => i + 1)

        if (link.mode === "parse_first_pages") {
            params.sort = "creation_date_desc"
            pages = pages.slice(0, Math.ceil(pageCount * 0.1))
        }

        const chunks = _.chunk(pages, 3)

        for (let chunk of chunks) {
            await Promise.all(chunk.map(async page => {
                const data = await this.parseItems(parsedUrl.href.split("?")[0], {
                    params: {
                        ...params,
                        p: page
                    }
                })
                await this.addOffers(data, link)
            }))
        }

    }

    async axiosRetry(url, options = {}, retries = 3) {
        if(retries === 0) throw new Error("retries count extended")
        try {
            const data = await this.axios.get(
                url, 
                options
            )
            return data
        } catch(e) {
            const data = await this.axiosRetry(url, options, (retries - 1))                 
            return data
        }
    }

}

module.exports = Parser