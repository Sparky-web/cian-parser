import React, { useEffect, useState } from "react"
import { fetchData } from "../../utils/dashboard"
import axios from "../../utils/axiosInstance"
import { formatRelative } from "date-fns";
import { ru } from "date-fns/locale";
import { Tr, Td } from '@strapi/design-system/Table';
import { Checkbox } from '@strapi/design-system/Checkbox';
import { Link, Button, Typography } from "@strapi/design-system"
import { Badge } from '@strapi/design-system/Badge';
import LogsRow from "./LogsRow";
import TableWrapper from "./TableWrapper";
import { Stack } from '@strapi/design-system/Stack';
import { Textarea } from '@strapi/design-system/Textarea';
import { Loader } from '@strapi/design-system/Loader';


export default function Proxies() {
    const [proxyString, setProxyString] = useState("")
    const [proxyLoading, setProxyLoading] = useState(false)

    const addProxies = async () => {
        setProxyLoading(true)
        try {
            let arr = proxyString.split("\n")
            arr = arr.filter(e => e)

            for (let proxy of arr) {
                await axios.post("/api/proxies", { data: {proxy} })
            }

            window.location.reload()
        } catch (e) {
            console.error(e)
            alert(e)
        }
        setProxyLoading(false)
    }

    const resetAttempts = async (items) => {
        await Promise.all(items.map(async proxy => {
            await axios.put(`/api/proxies/${proxy}`, {
                data: {
                    unsuccesfulAttempts: 0,
                    isEnabled: true
                }
            })
        }))
    }

    return (<>
        <TableWrapper
            collection={"proxies"}
            columns={["Прокси", "Статус", "Неуд. попытки", "Действия"]}
            actions={[{
                handler: resetAttempts,
                name: "Сбросить неудачные попытки"
            }]}
            Row={ProxyRow}
        />

        <br />

        <Stack spacing={2}>
            <Typography variant="delta">Пакетное добавление прокси</Typography>
            <Textarea
                label="Http прокси (каждая с новой строки) в формате http://username:password@ip:port"
                name="content"
                onChange={e => setProxyString(e.target.value)}
            >
                {proxyString}
            </Textarea>

            <div>
                {proxyLoading ?
                    <Loader /> :
                    <Button color={"primary"} onClick={addProxies}>Добавить</Button>
                }
            </div>
        </Stack>
    </>
    )
}

function ProxyRow({ select, item, selected }) {
    const [open, setOpen] = useState(false)
    const [logs, setLogs] = useState([])

    useEffect(() => {
        if (open) {
            fetchData("logs", {
                filters: {
                    proxy: item.id
                },
                sort: ["createdAt:desc"],
                pagination: {
                    page: 1,
                    pageSize: 100
                }
            }).then(r => setLogs(r.data))
        }
    }, [open])

    return (<>
        <Tr>
            <Td><Checkbox checked={selected.includes(item.id)} onChange={() => {
                select(item.id);
            }} /></Td>
            <Td>
                <div><Link to={`/content-manager/collectionType/api::proxy.proxy/${item.id}`}>
                    {item.attributes.proxy}
                </Link></div>
                <Typography variant="pi">
                    Добавлено {formatRelative(new Date(item.attributes.createdAt), new Date(), {
                        locale: ru
                    })}
                </Typography>
            </Td>
            <Td className="text-center">{item.attributes.isEnabled ? <Badge textColor="neutral0" backgroundColor="success600">вкл</Badge> : <Badge backgroundColor="danger600" textColor="neutral0">выкл</Badge>}</Td>
            <Td className="text-center">{item.attributes.unsuccesfulAttempts}</Td>
            <Td className="text-right">
                <Button color="primary" onClick={() => setOpen(!open)}>Логи</Button>
            </Td>
        </Tr>
        {open && <LogsRow logs={logs} />}
    </>);
}
