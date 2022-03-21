import React, { useState, useEffect } from "react"
import { GridLayout } from '@strapi/design-system/Layout';
import { Box, Link, Button, Flex, Stack } from "@strapi/design-system"
import { Typography } from '@strapi/design-system/Typography';
import { fetchData } from "../../utils/dashboard";
import { subDays } from 'date-fns'

export default function Widgets() {
    const [stats, setStats] = useState(null)

    const fetchStats = async () => {

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

        const { meta: { pagination: { total: activeProxies } } } = await fetchData("proxies", {
            filters: {
                isEnabled: true
            },
            pagination: {
                page: 1,
                pageSize: 1,
            }
        })

        setStats({
            errors, offersToday,
            offersTotal, activeProxies
        })
    }

    useEffect(() => {
        fetchStats()
    }, [])


    return (stats && <GridLayout>
        <Card 
            number={stats.offersToday}
            text={`добавлено объявлений за сегодня`}
            background={"primary600"}
            textColor={"neutral0"}
        />
        <Card 
            number={stats.offersTotal}
            text={`объявлений в базе`}
            background={"alternative600"}
            textColor={"neutral0"}
        />
        <Card 
            number={stats.errors}
            text={`ошибок за сегодня`}
            background={"danger600"}
            textColor={"neutral0"}
        />
        <Card 
            number={stats.activeProxies}
            text={`прокси активно`}
            background={"secondary600"}
            textColor={"neutral0"}
        />
    </GridLayout>)
}

function Card({background, text, textColor, number}) {
    return (<Box padding={4} hasRadius background={background} shadow="tableShadow">
        <Typography variant="beta" textColor={textColor}>{number}</Typography>
        <br />
        <Typography textColor={textColor}>{text}</Typography>
    </Box>)
}