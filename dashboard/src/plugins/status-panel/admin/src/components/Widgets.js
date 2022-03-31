import React, { useContext } from "react"
import { GridLayout } from '@strapi/design-system/Layout';
import { Box } from "@strapi/design-system"
import { Typography } from '@strapi/design-system/Typography';
import { formatRelative } from "date-fns"
import ru from "date-fns/locale/ru";
import { AppContext } from "../context/AppContext";

export default function Widgets() {
    const {stats} = useContext(AppContext)

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
            number={stats.offersInBitrix}
            text={`объявлений в битриксе`}
            background={stats.offersInBitrix === stats.offersTotal ? "success600" : "danger600"}
            textColor={"neutral0"}
        />
        <Card
            number={stats.errors}
            text={`ошибок за сегодня`}
            background={stats.errors === 0 ? "success600" : "danger600"}
            textColor={"neutral0"}
        />
        <Card
            number={stats.activeProxies}
            text={`прокси активно`}
            background={stats.activeProxies === 0 ? "danger600" : "success600"}
            textColor={"neutral0"}
        />
        <Card
            number={stats.lastSucceededParse ? formatRelative(stats.lastSucceededParse, new Date(), { locale: ru }) : "Не определено"}
            text={`последний удачный парсинг`}
            background={Date.now() - stats.lastSucceededParse?.getTime() < 1000 * 60 * 60 * 24 ? "success600" : "danger600"}
            textColor={"neutral0"}
        />
    </GridLayout>)
}

function Card({ background, text, textColor, number }) {
    return (<Box padding={4} hasRadius background={background} shadow="tableShadow">
        <Typography variant="beta" textColor={textColor}>{number}</Typography>
        <br />
        <Typography textColor={textColor}>{text}</Typography>
    </Box>)
}