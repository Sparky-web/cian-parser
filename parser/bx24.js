const axios = require("axios")
const _ = require("lodash")

class Bx24 {
    constructor(parent) {
        this.config = parent.config
        this.logger = parent.logger
        this.strapi = parent.strapi
        this.parent = parent
    }

    objectToQuery(obj, prefix) {
        const str = [];
        let p;
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                const k = prefix ? prefix + "[" + p + "]" : p,
                    v = obj[p];
                str.push((v !== null && typeof v === "object") ?
                    this.objectToQuery(v, k) :
                    encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
        return str.join("&");
    }

    async remind(offer) {
        this.logger.info("NEW OFFER: " + offer.title)
    }

    async getFields(offer) {
        return {
            TITLE: `Парсер ${offer.parsedFromLink?.name || ""} ${offer.floorNumber}эт. за ${offer.price} ₽`,
            'CATEGORY_ID': 9,
            'STAGE_ID': 'C9:14',
            'SOURCE_ID': 79690882901,
            'UF_CRM_1580558162': [offer.link],
            'UF_CRM_1584562039332': offer.price,
            'ASSIGNED_BY_ID': offer.parsedFromLink?.responsible,
            'UF_CRM_1584528376285': offer.floorNumber,
            'UF_CRM_1584528390316': offer.area,
            'UF_CRM_1584957840330': offer.description,
            'UF_CRM_1580729853433': offer.address,
            'UF_CRM_1601210192': offer.uId,
            'TYPE_ID': offer.dealType === "sale" ? 'SALE' : offer.dealType === "rent" ? "1" : "",
            'UF_CRM_1600027262783': await this.getImages(offer),
            'CONTACT_ID': await this.getContactId(offer),
            'UF_CRM_1597229563828': offer.contacts.map(p => `${p.name || "Без имени"} ${p.number}`).join(", ")
        }
    }

    async getContactId(offer) {
        let contactId;
        for (let contact of offer.contacts) {
            contactId = await this.findContact(contact.number)
            if (contactId) break;
        }

        if (!contactId) contactId = await this.createContact(offer.contacts, offer)

        return contactId
    }

    async getImages(offer) {
        const images = []
        const chunks = _.chunk(offer.images?.split(","), 5)

        const parser = this.parent.getThis().parser

        for (let chunk of chunks) {
            await Promise.all(chunk.map(async (url) => {
                try {
                    const {data: image} = await parser.axios.get(url, {
                        responseType: 'arraybuffer'
                    })
                    const b64 = Buffer.from(image, 'binary').toString('base64')

                    images.push({
                        fileData: [
                            url.substring(url.lastIndexOf('/') + 1),
                            b64
                        ]
                    })
                } catch (e) {
                    this.logger.error("Failed to fetch image: " + url + " Reason: " + e.stack)
                }
            }))
        }

        return images
    }

    async createEntry(offer, retries = 3) {
        try {
            const params = await this.getFields(offer)
            const {data} = await axios.post(this.config.bitrixWebhookUrl + "/crm.deal.add",
                this.objectToQuery({fields: params}))

            this.logger.info(`Created deal with id: ${data.result}. Cian offer: ${offer.link}`)
            await this.strapi.update("offers", {
                ...offer,
                inBitrix: true
            })
            return data
        } catch (e) {
            if(retries < 1) throw new Error(`Couldn't create deal with id: ${offer.id}, retries count exeeded. ${e.stack}`)
            this.logger.error("Couldn't create deal, retrying. " + (e.stack || e.message))
            const bound = this.createEntry.bind(this)
            return bound(offer, retries - 1)
        }
    }

    async updateEntry(offer, dealId) {
        const params = await this.getFields(offer)
        delete params.ASSIGNED_BY_ID
        delete params.STAGE_ID

        const {data} = await axios.post(this.config.bitrixWebhookUrl + "/crm.deal.update",
            this.objectToQuery({fields: params, id: dealId}))

        this.logger.info(`Updated deal with id: ${dealId}. Cian offer: ${offer.link}`)
        return data
    }

    async findContact(phone) {
        const {data} = await axios.get(`${this.config.bitrixWebhookUrl}/crm.duplicate.findbycomm?type=PHONE&values[0]=${phone}&entity_type=CONTACT`)
        return data.result?.CONTACT?.[0]
    }

    async createContact(phones, offer) {
        const {data} = await axios.post(`${this.config.bitrixWebhookUrl}/crm.contact.add?${this.objectToQuery({
            fields: {
                NAME: phones[0].name || "Без имени",
                PHONE: phones.map(e => ({"VALUE": e.number, "VALUE_TYPE": "WORK"}))
            }
        })}`)

        return data.result
    }
}

module.exports = Bx24
