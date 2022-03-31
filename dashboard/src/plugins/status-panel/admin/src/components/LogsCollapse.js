import React from "react"
import { Box } from '@strapi/design-system/Box';
import { LogsText } from "./LogsText";

export default function LogsCollapse({ logs, noPadding }) {
    return (<Box padding={noPadding ? 0 : 3}>
        <LogsText logs={logs} />
    </Box>
    );
}