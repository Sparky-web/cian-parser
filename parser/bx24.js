const axios = require("axios")
const _ = require("lodash")

class Bx24 {
    constructor(parent) {
        this.logger = parent.logger
        this.strapi = parent.strapi
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
            'TYPE_ID': offer.dealType?.toUpperCase(),
            'UF_CRM_1600027262783': await this.getImages(offer),
            'CONTACT_ID': await this.getContactId(offer)
        }
    }

    async getContactId(offer) {
        let contactId;
        for (let contact of offer.contacts) {
            contactId = await this.findContact(contact.number)
            if (contactId) break;
        }

        if (!contactId) contactId = await this.createContact(offer.contacts)

        return contactId
    }

    async getImages(offer) {
        const images = []
        const chunks = _.chunk(offer.images.split(","), 5)

        for(let chunk of chunks) {
            await Promise.all(chunk.map(async (url) => {
                try {
                    const {data: image} = await axios.get(url, {
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
                    this.logger.error("Failed to fetch image: " + url + " Reason: " + e.message)
                }
            }))
        }

        return images
    }

    async createEntry(offer) {
        const params = await this.getFields(offer)
        const {data} = await axios.post("https://persona24.bitrix24.ru/rest/31/zbwkjo3m3rw6d66a/crm.deal.add",
            this.objectToQuery({fields: params}))

        this.logger.info(`Created deal with id: ${data.result}. Cian offer: ${offer.link}`)
        await this.strapi.update("offers", {
            ...offer,
            inBitrix: true
        })
        return data
    }

    async updateEntry(offer, dealId) {
        const params = await this.getFields(offer)
        delete params.ASSIGNED_BY_ID

        const {data} = await axios.post("https://persona24.bitrix24.ru/rest/31/zbwkjo3m3rw6d66a/crm.deal.update",
            this.objectToQuery({fields: params, id: dealId}))

        this.logger.info(`Updated deal with id: ${dealId}. Cian offer: ${offer.link}`)
        return data
    }

    async checkEntry() {}

    async findContact(phone) {
        const {data} = await axios.get(`https://persona24.bitrix24.ru/rest/31/zbwkjo3m3rw6d66a/crm.duplicate.findbycomm?type=PHONE&values[0]=${phone}&entity_type=CONTACT`)
        return data.result?.CONTACT?.[0]
    }

    async createContact(phones) {
        const {data} = await axios.post("https://persona24.bitrix24.ru/rest/31/zbwkjo3m3rw6d66a/crm.contact.add?" + this.objectToQuery({
            fields: {
                NAME: phones[0].name,
                PHONE: phones.map(e => ({"VALUE": e.number, "VALUE_TYPE": "WORK"}))
            }
        }))

        return data.result
    }
}

module.exports = Bx24
