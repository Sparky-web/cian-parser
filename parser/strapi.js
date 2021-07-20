const axios = require("axios")

class Strapi {
    constructor() {
        this.axios = axios.create({
            baseURL: `http://${process.env.STRAPI_HOST}:${process.env.STRAPI_PORT}`
        })
    }

    async getOffers(filters) {
        const {data} = await this.axios.get("/offers", {
            params: {
                ...filters,
                _limit: -1
            }
        })
        return data
    }

    async createOffer(data) {
        await this.axios.post("/offers", data)
    }

    async getLinks(filters) {
       const {data} = await this.axios.get("/links", {
           params: filters
       })
       return data
    }

    async updateLink(data) {
        await this.axios.put("/offers/" + data.id, data)
    }
    
    async getProxies() {
        const {data} = await this.axios.get("/proxies")
        return data
    }
    async updateProxy(data) {
        await this.axios.put("/proxies/" + data.id, data)
    }
    async getConfig() {
        const {data} = await this.axios.get("/links")
        return data
    }

    async get(type, filters, options = {}) {
        const {data} = await this.axios.get(`/${type}`, {
            params: {
                ...filters
            },
            ...options
        })
        return data
    }
    async create(type, data, options = {}) {
        const {data: res} = await this.axios.post(`/${type}`, data, options)
        return res
    }
    async update(type, data, options = {}) {
        const {data: res} = await this.axios.put(`/${type}/${data.id}`, data, options)
        return res
    }
}

module.exports = Strapi