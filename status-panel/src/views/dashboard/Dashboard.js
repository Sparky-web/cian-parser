import React, {lazy, useEffect, useState} from 'react'
import {
    CBadge,
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CLabel,
    CSpinner,
    CTextarea,
    CToast,
    CToastBody,
} from '@coreui/react'

import {formatRelative} from "date-fns"
import ru from "date-fns/locale/ru"

import axios from "axios";

const WidgetsDropdown = lazy(() => import('../widgets/WidgetsDropdown.js'))

let url = "http://localhost:1000"
let apiUrl = "http://localhost:1001"

if (!(!process.env.NODE_ENV || process.env.NODE_ENV === 'development')) {
    url = "http://194.67.86.134:1000"
    apiUrl = "http://194.67.86.134:1001"
}

const fetchData = async (type, filters = {}) => {
    const {data} = await axios.get(url + "/" + type, {
        params: {...filters}
    })
    return data
}
const startManualParsing = async (id) => {
    await axios.get(apiUrl + "/start-manual", {params: {id}})
}
const count = async (type, filters) => {
    const {data} = await axios.get(`${url}/${type}/count`, {
        params: {...filters}
    })

    return data
}

const Dashboard = () => {
    const [links, setLinks] = useState([])
    const [proxies, setProxies] = useState([])
    const [runningIds, setRunningIds] = useState([])

    const [proxyString, setProxyString] = useState("")
    const [proxyLoading, setProxyLoading] = useState(false)

    const [offers, setOffers] = useState({})

    const [selectedIds, setSelectedIds] = useState([])

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        fetchData("links").then(async links => {
            setLinks(links)
            const newLinks =await Promise.all(links.map(async link => {
                const inBitrix = await count("offers", {inBitrix: true, parsedFromLink: link.id})
                const all = await count("offers", {parsedFromLink: link.id})
                return {
                    ...link,
                    count: {all, inBitrix}
                }
            }))
            setLinks(newLinks)
        })
        fetchData("proxies").then(setProxies)
        count("offers", {inBitrix: true}).then(r => setOffers(o => ({...o, count: {...o.count, inBitrix: r}})))
        count("offers").then(r => setOffers(o => ({...o, count: {...o.count, all: r}})))
    }
    const startParsing = async id => {
        setRunningIds([...runningIds, id])
        try {
            await startManualParsing(id)
            fetchInitialData()
        } catch (e) {
            console.error(e)
        }
        setRunningIds(runningIds.filter(e => e.id !== id))
    }
    const addProxies = async () => {
        setProxyLoading(true)
        try {
            let arr = proxyString.split("\n")
            arr = arr.filter(e => e)
            arr = arr.map(el => {
                const segments = el.split(":")
                return `http://${segments[2]}:${segments[3]}@${segments[0]}:${segments[1]}`
            })

            for (let proxy of arr) {
                await axios.post(url + "/proxies", {proxy})
            }

            const newProxy = await fetchData("proxies")
            setProxies(newProxy)
        } catch (e) {
            console.error(e)
        }
        setProxyLoading(false)
    }
    const select = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(e => e !== id))
        else setSelectedIds([...selectedIds, id])
    }

    const turnLinks = async (direction) => {
        await Promise.all(selectedIds.map(async (selectedId) => {
            await axios.put(`${url}/links/${selectedId}`, {
                isEnabled: direction === "on"
            })
        }))
        await fetchInitialData()
    }

    return (
        <>
            <h1>Статус-панель</h1>
            <br/>
            <WidgetsDropdown links={links} proxies={proxies} offers={offers}/>

            <CCard>
                <CCardHeader>
                    Ссылки {' & '} Прокси
                </CCardHeader>
                <CCardBody>
                    <table className="table table-hover table-outline mb-0 d-sm-table">
                        <thead className="thead-light">
                        <tr>
                            <th>#</th>
                            <th>Ссылка</th>
                            <th className="text-center">Статус</th>
                            <th>Последний парсинг</th>
                            <th className="text-center">Объявлений всего / добавлено в битрикс</th>
                            <th className="text-right">Ручной парсинг</th>
                        </tr>
                        </thead>
                        <tbody>

                        {links.map(e => <tr key={e.id}
                                            className={selectedIds.includes(e.id) ? "bg-light text-dark" : ""}>
                            <td>
                                <input type="checkbox" onChange={() => {
                                    select(e.id)
                                }}/>
                            </td>
                            <td>
                                <div><a href={`${url}/admin/plugins/content-manager/collectionType/application::links.links/${e.id}`}>{e.name}</a></div>
                                <div className="small text-muted">
                                    Добавлено {formatRelative(new Date(e.created_at), new Date(), {locale: ru})}
                                </div>
                            </td>
                            <td className="text-center">{
                                e.isEnabled ? <CBadge color="success">вкл</CBadge> :
                                    <CBadge color="danger">выкл</CBadge>
                            }</td>
                            <td>
                                {e.lastParse && <>
                                    Завершен {formatRelative(new Date(e.lastParse.time), new Date(), {locale: ru})}
                                    &nbsp;за {e.lastParse.timeElapsed} секунд, получено
                                    офферов: {e.lastParse.items} из них новых: {e.lastParse.addedItems}
                                </>}
                            </td>
                            <td className="text-center">
                                {e.count?.all} / {e.count?.inBitrix}
                            </td>
                            <td className="text-right">
                                {runningIds.includes(e.id) ?
                                    <CButton color="warning" disabled><CSpinner color="light"/></CButton> :
                                    <CButton color="success" onClick={() => startParsing(e.id)}>
                                        Начать
                                    </CButton>}
                            </td>
                        </tr>)}
                        </tbody>
                    </table>

                    {selectedIds.length ? <div className="mt-1">
                        <div>Выбрано ссылок: {selectedIds.length}</div>
                        <CButton color="success" onClick={() => {
                            turnLinks("on")
                        }}>Включить</CButton>
                        <CButton color="danger" className="ml-1" onClick={() => {
                            turnLinks("off")
                        }}>Отключить</CButton>
                    </div> : <div/>}

                    <br/>

                    <table className="table table-hover table-outline mb-0 d-sm-table">
                        <thead className="thead-light">
                        <tr>
                            <th>Прокси</th>
                            <th className="text-center">Статус</th>
                            <th className="text-right">Неуд. попытки</th>
                        </tr>
                        </thead>
                        <tbody>

                        {proxies.map(e => <tr key={e.id}>
                            <td>
                                <div>{e.proxy}</div>
                                <div className="small text-muted">
                                    Добавлено {formatRelative(new Date(e.created_at), new Date(), {locale: ru})}
                                </div>
                            </td>
                            <td className="text-center">{
                                e.enabled ? <CBadge color="success">вкл</CBadge> :
                                    <CBadge color="danger">выкл</CBadge>
                            }</td>
                            <td className="text-right">{e.unsuccesfulAttempts}</td>
                        </tr>)}
                        </tbody>
                    </table>
                    <br/>
                    <div>
                        <h3>Пакетное добавление прокси</h3>
                        <CLabel>Http прокси (каждая с новой строки) в формате ip:port:username:password</CLabel>
                        <CTextarea
                            onChange={e => setProxyString(e.target.value)}
                            value={proxyString}
                            rows="5"
                            style={{marginBottom: "0.5rem"}}
                        />
                        {proxyLoading ?
                            <CButton disabled color="warning"><CSpinner color={"light"}/></CButton> :
                            <CButton color={"primary"} onClick={addProxies}>Добавить</CButton>
                        }
                    </div>

                    <CToast autohide={false} className="align-items-center">
                        <div className="d-flex">
                            <CToastBody>Hello, world! This is a toast message.</CToastBody>
                        </div>
                    </CToast>
                </CCardBody>
            </CCard>
        </>
    )
};

export default Dashboard
