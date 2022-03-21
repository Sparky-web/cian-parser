import React from "react"
import { useEffect, useState } from "react"
import LogsCollapse from "./LogsCollapse";
import { Stack } from '@strapi/design-system/Stack';
import { Button, Box } from "@strapi/design-system"
import { fetchData } from "../../utils/dashboard";
import { Accordion, AccordionToggle, AccordionContent } from '@strapi/design-system/Accordion';
import { LogsText } from "./LogsText";

export default function Logs() {
    const [open, setOpen] = useState(false)
    const [logs, setLogs] = useState([])

    useEffect(() => {
        if (open) {
            fetchData("logs", {
                sort: ["createdAt:desc"],
                pagination: {
                    page: 1,
                    pageSize: 500
                }
            }).then(res => setLogs(res.data))
        }
    }, [open])


    return (
        <Box background="neutral10">
            <Accordion expanded={open} onToggle={() => setOpen(s => !s)}>
                <AccordionToggle togglePosition="left" title="Все логи" />
                <AccordionContent>
                    <Box padding={3}>
                        <LogsText logs={logs} />
                    </Box>
                </AccordionContent>
            </Accordion>
        </Box>
    )
}
