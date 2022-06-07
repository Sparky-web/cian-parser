import React, { createContext, useState, useEffect } from "react"
import { fetchData } from "../utils/dashboard"
import { subDays } from 'date-fns'

export const AppContext = createContext({})

export const AppProvider = props => {
    const [stats, setStats] = useState(null)
    const [links, setLinks] = useState(null)
    const [proxies, setProxies] = useState(null)

    const fetchAll = async () => {
        const { meta: { pagination: { total: errors } } } = await fetchData("logs", {
            filters: {
                level: "error",
                createdAt: {
                    $gt: subDays(new Date(), 1).toISOString()
                }
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        const { meta: { pagination: { total: offersToday } } } = await fetchData("offers", {
            filters: {
                createdAt: {
                    $gt: subDays(new Date(), 1).toISOString()
                }
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        const { meta: { pagination: { total: offersTotal } } } = await fetchData("offers", {
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        const { meta: { pagination: { total: offersInBitrix } } } = await fetchData("offers", {
            pagination: {
                page: 1,
                pageSize: 1,
            },
            filters: {
                inBitrix: true
            }
        })

        const { meta: { pagination: { total: activeProxies } } } = await fetchData("proxies", {
            filters: {
                isEnabled: true
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        const { data: links } = await fetchData("links", { populate: ["lastParse"] })
        const { data: proxies } = await fetchData("proxies")

        setLinks(links)
        setProxies(proxies)

        let data = links.sort((a, b) => new Date(b?.attributes?.lastParse?.time) - new Date(a?.attributes?.lastParse?.time))
        data = data.filter(e => !e?.attributes?.lastParse?.isError)

        setStats({
            errors, offersToday,
            offersTotal, activeProxies,
            lastSucceededParse: data?.[0] ? new Date(data[0].attributes.lastParse?.time) : null,
            offersInBitrix
        })
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const value = { stats, links, proxies, fetchAll }

    return (<AppContext.Provider value={value}>
        {stats && links && proxies && props.children}
    </AppContext.Provider>)
}