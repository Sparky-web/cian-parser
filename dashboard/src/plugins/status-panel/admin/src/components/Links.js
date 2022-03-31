import React, { useEffect, useState, useContext } from "react"
import axios from "../utils/axiosInstance"
import { fetchData, startManualParsing } from '../utils/dashboard';
import TableWrapper from "./TableWrapper";
import { Tr, Td } from '@strapi/design-system/Table';
import { Checkbox } from '@strapi/design-system/Checkbox';
import { Link, Button, Typography } from "@strapi/design-system"
import { formatRelative } from "date-fns";
import { Badge } from '@strapi/design-system/Badge';
import { Loader } from '@strapi/design-system/Loader';
import { Stack } from '@strapi/design-system/Stack';
import { ru } from "date-fns/locale";
import LogsRow from "./LogsRow";
import { AppContext } from "../context/AppContext";

export default function Links() {
    const turnLinks = async (direction, selected) => {
        await Promise.all(selected.map(async (selectedId) => {
            await axios.put(`/api/links/${selectedId}`, {
                data: {
                    isEnabled: direction === "on"
                }
            })
        }))
    }

    return (<>
        <TableWrapper
            collection={"links"}
            columns={["Ссылка", "Статус", "Обновлено", "Офферов всего / в битриксе", ""]}
            actions={[{
                name: "Включить",
                handler: (selected) => turnLinks("on", selected)
            }, {
                name: "Выключить",
                handler: (selected) => turnLinks("off", selected)
            }]}
            Row={LinkRow}
        />
    </>
    );
}

function LinkRow({ select, item, selected }) {
    const [open, setOpen] = useState(false)
    const [logs, setLogs] = useState([])
    const [offersTotal, setOffersTotal] = useState(null)
    const [offersInBitrix, setOffersInBitrix] = useState(null)
    const [isRunning, setIsRunning] = useState(false)

    const {fetchAll} = useContext(AppContext)

    const fetchCount = async () => {
        const inBitrix = await fetchData("offers", {
            filters: {
                inBitrix: true, parsedFromLink: item.id
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })
        const all = await fetchData("offers", {
            filters: {
                parsedFromLink: item.id
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        setOffersTotal(all.meta.pagination.total)
        setOffersInBitrix(inBitrix.meta.pagination.total)
    }

    const startParsing = async () => {
        setIsRunning(true)
        try {
            await startManualParsing(item.id)
            await fetchAll()
        } catch (e) {
            console.error(e)
            alert(e)
        }
        setIsRunning(false)
    }

    useEffect(() => {
        fetchCount()
    }, [])

    useEffect(() => {
        if (open) {
            fetchData("logs", {
                filters: {
                    link: item.id
                },
                sort: ["createdAt:desc"],
                pagination: {
                    page: 1,
                    pageSize: 100
                },
                populate: "*"
            }).then(r => setLogs(r.data))
        }
    }, [open])


    return (<>
        <Tr background={item.attributes.lastParse.isError && "danger100"}>
            <Td><Checkbox checked={selected.includes(item.id)} onChange={() => {
                select(item.id);
            }} /></Td>
            <Td>
                <div><Link to={`/content-manager/collectionType/api::link.link/${item.id}`}>
                    {item.attributes.name}
                </Link></div>
                <Typography variant="pi">
                    Добавлено {formatRelative(new Date(item.attributes.createdAt), new Date(), {
                        locale: ru
                    })}
                </Typography>
            </Td>
            <Td className="text-center">
                <Badge
                    backgroundColor={item.attributes.isEnabled ? "success600" : "danger600"}>
                    <Typography textColor="neutral0" variant="pi" fontWeight={"bold"}>
                        {item.attributes.isEnabled ? "вкл" : "выкл"}
                    </Typography>
                </Badge>
            </Td>
            <Td className="text-center">
                <Typography variant="pi">
                    {item.attributes.lastParse && <>
                        Завершен {formatRelative(new Date(item.attributes.lastParse.time), new Date(), {
                            locale: ru
                        })}
                        &nbsp;за {item.attributes.lastParse.timeElapsed} секунд, получено
                        офферов: {item.attributes.lastParse.items} из них новых: {item.attributes.lastParse.addedItems}
                    </>}
                </Typography>
            </Td>
            <Td>
                <Typography variant="pi">{offersTotal} / </Typography><Link href="https://persona24.bitrix24.ru/crm/deal/category/9/" isExternal>{offersInBitrix}</Link>
            </Td>
            <Td>
                <Stack horizontal spacing={2}>
                    <Button color="primary" onClick={() => setOpen(!open)}>Логи</Button>
                    {isRunning ? <Loader /> : <Button color="primary" onClick={startParsing}>Парсинг</Button>}
                </Stack>
            </Td>
        </Tr>
        {open && <LogsRow logs={logs} />}
    </>);
}