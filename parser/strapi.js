import _axios from "axios"
import qs from "qs"

const axios = _axios.create({
    baseURL: `http://${process.env.STRAPI_HOST}:${process.env.STRAPI_PORT}/api`
})
axios.interceptors.request.use(config => {
    config.headers.Authtorization = "Bearer " + "21fcd2bfd400277438128188dc8ab5c12238a9a29548d56261e2be2adbf729df5de9fca1e7dcf5b37b8855ab6c56c60c76a441c657a13baa2fe2205cacb29b058a0191f1e0e1e7f333b7e012c9d5fc60d4801534a3ef17727340bcb54b7c1dc04d36378e1681ac5eced1537ea2a6472a4253e80c42a8f5898c76f34cf92d4982"
    return config
})


export async function get(type, filters, options = {}) {
    const { data: {data} } = await axios.get(`/${type}?${qs.stringify(filters)}`, { ...options })
    return Array.isArray(data) ? data.map(e => ({id: e.id, ...e.attributes})) : {id: data.id, ...data.attributes}
}

export async function create(type, data, options = {}) {
    const { data: {data: res} } = await axios.post(`/${type}`, {data}, options)
    return res
}

export async function update(type, data, options = {}) {
    const { data: res } = await axios.put(`/${type}/${data.id}`, {data}, options)
    return res
}

export default { create, get, update }

