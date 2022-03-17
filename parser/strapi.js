import _axios from "axios"

const axios = _axios.create({
    baseURL: `http://${process.env.STRAPI_HOST}:${process.env.STRAPI_PORT}`
})

export async function get(type, filters, options = {}) {
    const { data } = await axios.get(`/${type}`, {
        params: {
            ...filters
        },
        ...options
    })
    return data
}

export async function create(type, data, options = {}) {
    const { data: res } = await axios.post(`/${type}`, data, options)
    return res
}

export async function update(type, data, options = {}) {
    const { data: res } = await axios.put(`/${type}/${data.id}`, data, options)
    return res
}

export default {create, get, update}

