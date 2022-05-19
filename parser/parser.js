import _axios from "axios"
import strapi from "./strapi.js"
import config from "./config.js"
import logger from "./logger.js"
import cronConfig from "./cron-config.js"
import _ from "lodash"
import httpsProxyAgent from "https-proxy-agent"
import { JSDOM } from "jsdom"
import cron from "node-cron"
import filesystem from "./filesystem.js"
import bx24 from "./bx24.js"

let stack = []
let running = false
let proxies = []
let jobs = []
export const axios = await getAxios()

async function reqMiddleware(config) {
    const proxy = proxies[_.random(0, proxies.length - 1)]

    if (config.url.match(/cian/ig) && proxy) {
        const agent = new httpsProxyAgent(proxy.proxy)
        config.proxy = false
        config.httpsAgent = agent
        config.proxyId = proxy.id

        if (proxy.cookie) config.headers.cookie = proxy.cookie
    }

    return config;
}

async function addUnsuccessfulCountToProxy(proxyString) {
    let proxy = await strapi.get("proxies", {
        filters: {
            proxy: {
                $contains: proxyString
            }
        }
    })
    proxy = proxy[0]

    await strapi.update("proxies", {
        ...proxy,
        unsuccesfulAttempts: proxy.unsuccesfulAttempts ? proxy.unsuccesfulAttempts + 1 : 1,
        isEnabled: proxy.unsuccesfulAttempts < config.proxyAttemptsLimit
    })

    proxies = await strapi.get("proxies", { filters: { isEnabled: true } })
}

async function errorHandler(error) {
    if (!error.config?.httpsAgent) throw error

    const ip = error.config?.httpsAgent?.proxy?.host
    const port = error.config?.httpsAgent?.proxy?.port

    await addUnsuccessfulCountToProxy(`${ip}:${port}`)

    throw error
}

async function resMiddleware(c) {
    const document = getDocument(c.data)
    if (document.querySelector("#captcha")) {
        const ip = c.config.httpsAgent?.proxy?.host
        const port = c.config.httpsAgent?.proxy?.port

        if (ip && port) {
            await addUnsuccessfulCountToProxy(`${ip}:${port}`)
        }
        throw ({
            message: "Captcha, cannot proceed",
            config: {
                proxyId: c.config.proxyId,
                linkId: c.config.linkId,
            },
            response: c
        })
    }

    return c
}

async function getAxios() {
    const axios = _axios.create()
    axios.defaults.headers = {
        "referrer": "https://www.google.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    proxies = await strapi.get("proxies", { filters: { isEnabled: true } })

    axios.interceptors.request.use(reqMiddleware);
    axios.interceptors.response.use(resMiddleware, errorHandler);

    return axios
}

async function start(mode) {
    jobs = []
    const links = await strapi.get("links", { filters: { isEnabled: true }, populate: "*" })

    if (mode === "test") return;

    logger.info("Links loaded, names: " + links.map(e => e.name).join(", "))

    for (let link of links) {
        jobs.push(
            cron.schedule(cronConfig[link.frequency], async () => {
                stack.push(async () => {
                    await parseUrl(link).catch(async e => {
                        logger.error({
                            link: link.id,
                            proxy: e.proxyId,
                            message: `Parsing error. Error: ${e.stack}.`
                        })

                        await strapi.update("links", {
                            id: link.id,
                            lastParse: {
                                time: new Date(),
                                isError: true
                            }
                        })
                    })
                })
            }, {})
        )
    }

    running = true
    while (running) {
        await new Promise(r => setTimeout(r, 100))
        while (stack.length > 0) {
            await (stack.shift())()
        }
    }
}

async function stop() {
    running = false
    stack = []

    jobs.forEach(job => job.stop())
}

function getDocument(html) {
    let { document } = (new JSDOM(html)).window;
    return document
}

async function getPageCount(url, link) {
    let { data: html } = await axiosRetry(url, { linkId: link.id })
    const document = getDocument(html)
    const itemsCount = +document.querySelector('*[data-name="SummaryHeader"]')
        ?.textContent?.trim()?.match(/\d{1,5}/ig)?.[0]

    if (!itemsCount) return 1;

    const pageCount = Math.ceil(itemsCount / 28)
    return pageCount
}

function serializeOffer(offer, document) {
    return ({
        title: offer.title || document.querySelector(`a[href="${offer.fullUrl}"]`)?.parentNode?.querySelector(`*[data-mark="OfferTitle"]`)?.textContent?.trim()
            || document.querySelector("h1")?.textContent?.trim()
        ,
        description: offer.description,
        price: offer.bargainTerms?.priceRur || offer.bargainTerms?.price,
        priceInfo: null,
        address: offer.geo?.address.map(e => e.name).join(", "),
        link: offer.fullUrl,
        uId: offer.cianId,
        images: offer.photos?.map(photo => photo.fullUrl)?.join(","),
        jk: offer.geo?.jk?.displayName,
        jkLink: offer.geo?.jk?.fullUrl,
        contacts: offer.phones.map(e => ({
            number: e.countryCode + e.number,
            name: offer.user?.agencyName || offer.user?.companyName || `ID ${offer.user?.cianUserId}`
        })),
        floorNumber: offer.floorNumber,
        area: offer.totalArea,
        dealType: offer.dealType
    })
}

async function parseItems(url, options = {}) {
    let res = await axiosRetry(url, options)
    let html = res.data
    const document = getDocument(html)

    let js = [...document.querySelectorAll("script")].filter(e => e.innerHTML.match(/frontend-serp/g))[1].innerHTML
    let config = JSON.parse(js.substring(js.indexOf("["), js.lastIndexOf("]") + 1).match(/(?<== ).*/ig)[0])
    let initialState = _.find(config, { key: "initialState" })
    let { value: { results: { offers: offers } } } = initialState

    let items = offers.map(offer => serializeOffer(offer, document))

    return items
}

async function parseItem(url, responsible) {
    const { data: html } = await axiosRetry(url)
    const document = getDocument(html)

    let text = document.querySelector("body").innerHTML
        .match(/(?<=_cianConfig\['frontend-offer-card'\] = ).*/g)?.[0]

    text = text.substring(0, text.lastIndexOf("]") + 1)
    const config = JSON.parse(text)
    const state = _.find(config, { key: "defaultState" })?.value
    const offerData = state?.offerData?.offer

    let offer = serializeOffer(offerData, document)

    const link = {
        name: "в ручную",
        url,
        responsible,
        shouldAddToBitrix: true
    }
    offer = {
        ...offer,
        link: url,
        parsedFromLink: link
    }

    return offer
}

async function addOffers(offers, link) {
    const uIds = _.map(offers, "uId")
    const oldOffers = await strapi.get("offers", {
        pagination: { page: 1, pageSize: 500 }, 
        filters: {
            uId: {
                $in: uIds
            }
        }
    })

    const oldUIds = _.map(oldOffers, "uId")

    const newUIds = _.difference(uIds, oldUIds)
    const newOffers = newUIds.map(uId => ({
        ..._.find(offers, { uId }),
        parsedFromLink: link.id
    }))

    const createdOffers = []
    for (let offer of newOffers) {
        createdOffers.push(await strapi.create("offers", offer))
    }
    
    if (link.shouldAddToBitrix) {
        for (let offer of createdOffers) {
            try {
                await bx24.createEntry(offer)
                await new Promise(r => setTimeout(r, 500))
            } catch (e) {
                logger.error({
                    link: link.id,
                    message: `Couldn't create deal ${offer.id} Reason: ${e.stack}`
                })
            }
        }
    }

    return newOffers
}

async function parseUrl(link) {
    const startTime = +new Date()

    logger.info({ message: `Parsed started`, link: link.id })

    proxies = await strapi.get("proxies", { filters: {isEnabled: true} })
    const pageCount = await getPageCount(link.url, link)

    logger.info({ message: `Got pages: ${pageCount}`, link: link.id })

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

    const chunks = _.chunk(pages, 2)

    const items = [];
    const addedItems = [];

    for (let chunk of chunks) {
        await Promise.all(chunk.map(async page => {
            const data = await parseItems(parsedUrl.href.split("?")[0], {
                params: {
                    ...params,
                    p: page
                },
                linkId: link.id
            })

            logger.info({ message: `Got items page: ${page}: ${data.length}`, link: link.id })

            items.push(...data)
            const newItems = await addOffers(data, link)
            addedItems.push(...newItems)
        }))
    }

    if (link.isFirstParse) link = {
        ...link, isFirstParse: false
    }

    logger.info({ message: `Parsing ended. Items parsed total: ${items.length}, added items: ${addedItems.length}`, link: link.id })

    const endTime = +new Date()

    const parsingInfo = {
        items: items.length,
        addedItems: addedItems.length,
        timeElapsed: Math.round((endTime - startTime) / 1000),
        time: (new Date()).toISOString()
    }

    await strapi.update("links", {
        id: link.id,
        lastParse: parsingInfo
    })

    return parsingInfo
}

async function updateOneUrl(url, dealId) {
    let offer = await parseItem(url)
    const data = await bx24.updateEntry(offer, dealId)

    return data
}

async function parseOneUrl(url, responsible) {
    let offer = await parseItem(url, responsible)
    const data = await addOffers([offer], offer.parsedFromLink)

    return { items: 1, addedItems: data?.length }
}

async function axiosRetry(url, options = {}, retries = 3) {
    if (retries === 0) throw new Error("retries count extended")
    try {
        const data = await axios.get(
            url,
            options
        )
        return data
    } catch (e) {
        const time = Date.now()
        await filesystem.createFileIfNotExists(`.tmp/error-pages/${time}.html`, e.response?.data || "")
        await filesystem.writeToFile(`.tmp/error-pages/${time}.html`, e.response?.data || "")

        logger.error({
            message: `${e.message}. Response contents at <a href="/error-pages/${time}.html">/error-pages/${time}.html</a>. Retrying.`,
            link: e.config?.linkId,
            proxy: e.config?.proxyId
        })
        const data = await axiosRetry(url, options, (retries - 1))
        return data
    }
}

export default {
    axios,
    start,
    stop,
    parseUrl,
    updateOneUrl,
    parseOneUrl,
    parseItem
}
