import axios from "axios"
import _ from "lodash"
import parser from "./parser.js"
import logger from "./logger.js";
import strapi from "./strapi.js";
import config from "./config.js";

function objectToQuery(obj, prefix) {
    const str = [];
    let p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            const k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];
            str.push((v !== null && typeof v === "object") ?
                objectToQuery(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
}

export async function remind(offer) {
    logger.info("NEW OFFER: " + offer.title)
}

async function getFields(offer) {
    const parsedFromLink = offer.parsedFromLink?.data?.attributes

    return {
        TITLE: `Парсер ${parsedFromLink.name || ""} ${offer.floorNumber}эт. за ${offer.price} ₽`,
        'CATEGORY_ID': 9,
        'STAGE_ID': 'C9:14',
        'SOURCE_ID': 79690882901,
        'UF_CRM_1580558162': [offer.link],
        'UF_CRM_1584562039332': offer.price,
        'ASSIGNED_BY_ID': parsedFromLink?.responsible,
        'UF_CRM_1584528376285': offer.floorNumber,
        'UF_CRM_1584528390316': offer.area,
        'UF_CRM_1584957840330': offer.description,
        'UF_CRM_1580729853433': offer.address,
        'UF_CRM_1601210192': offer.uId,
        'TYPE_ID': offer.dealType === "sale" ? 'SALE' : offer.dealType === "rent" ? "1" : "",
        'UF_CRM_1600027262783': await getImages(offer),
        'CONTACT_ID': await getContactId(offer),
        'UF_CRM_1597229563828': (offer.contacts?.[0]?.name || "Без имени") + ": " + offer.contacts?.map(p => `${p.number}`)?.join(", ") || ""
    }
}

async function getContactId(offer) {
    let contactId;

    if (offer.contacts?.length) {
        for (let contact of offer.contacts) {
            contactId = await findContact(contact.number)
            if (contactId) break;
        }
    }

    if (!contactId) contactId = await createContact(offer.contacts, offer)

    return contactId
}

async function getImages(offer) {
    const images = []
    const chunks = _.chunk(offer.images?.split(","), 5)

    // TEST
    let imagesGot = 0
    let imagesFailed = 0
    // TEST

    for (let chunk of chunks) {
        await Promise.all(chunk.map(async (url) => {
            try {
                const { data: image } = await parser.axios.get(url, {
                    responseType: 'arraybuffer'
                })
                const b64 = Buffer.from(image, 'binary').toString('base64')

                images.push({
                    fileData: [
                        url.substring(url.lastIndexOf('/') + 1),
                        b64
                    ]
                })

                imagesGot++
            } catch (e) {
                logger.error({
                    message: "Failed to fetch image: " + url + " Reason: " + e.message,
                    link: offer.id
                })
                imagesFailed++
            }
        }))
    }

    logger.info(`Got images on https://www.cian.ru/sale/flat/${offer.id} offer ${imagesGot}, failed ${imagesFailed}`)

    return images
}

const safeJSONParse = (str) => {
    try {
        return JSON.parse(str)
    } catch(e) {
        return str
    }
}

export async function createEntry(offer, retries = 3) {
    try {
        const params = await getFields(offer)
        const { data } = await axios.post(config.bitrixWebhookUrl + "/crm.deal.add",
            objectToQuery({ fields: params }))

        logger.info(`Created deal with id: ${data.result}. Cian offer: ${offer.link}`)
        await strapi.update("offers", {
            ...offer,
            inBitrix: true
        })
        return data
    } catch (e) {
        const resData = e?.response?.data ? safeJSONParse(e?.response?.data) : (e.stack || e.message)
        if (retries < 1) throw new Error(`Couldn't create deal with id: ${offer.id}, retries count exeeded. ${resData}`)
        logger.error("Couldn't create deal, retrying. " + resData)
        await new Promise(r => setTimeout(r, 500))
        return createEntry(offer, retries - 1)
    }
}


export async function updateEntry(offer, dealId) {
    const params = await getFields(offer)
    delete params.ASSIGNED_BY_ID
    delete params.STAGE_ID

    const { data } = await axios.post(config.bitrixWebhookUrl + "/crm.deal.update",
        objectToQuery({ fields: params, id: dealId }))

    logger.info(`Updated deal with id: ${dealId}. Cian offer: ${offer.link}`)
    return data
}

async function findContact(phone) {
    const { data } = await axios.get(`${config.bitrixWebhookUrl}/crm.duplicate.findbycomm?type=PHONE&values[0]=${phone}&entity_type=CONTACT`)
    return data.result?.CONTACT?.[0]
}

async function createContact(phones, offer) {
    const { data } = await axios.post(`${config.bitrixWebhookUrl}/crm.contact.add?${objectToQuery({
        fields: {
            NAME: phones?.[0].name || "Без имени",
            PHONE: phones?.map(e => ({ "VALUE": e.number, "VALUE_TYPE": "WORK" }))
        }
    })}`)

    return data.result
}

export default {
    createContact,
    createEntry,
    updateEntry,
    remind
}