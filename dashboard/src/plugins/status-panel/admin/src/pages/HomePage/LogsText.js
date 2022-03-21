import React from "react"
import { formatRelative } from "date-fns"
import { Typography } from '@strapi/design-system/Typography'
import ru from "date-fns/locale/ru";

export function LogsText({logs}) {
    return <>
        {logs.map(log => <div style={{
            color: log.attributes.level === "error" ? "#e55353" : ""
        }}>
            <Typography variant="omega" textColor={log.attributes.level === "error" && "danger600"}>
                {formatRelative(new Date(log.attributes.createdAt), new Date(), {
                    locale: ru
                })}&nbsp;
            </Typography>
            <Typography textColor={log.attributes.level === "error" && "danger600"} variant="omega" dangerouslySetInnerHTML={{
                __html: log.attributes.log
            }}></Typography>
        </div>)}
    </>
}