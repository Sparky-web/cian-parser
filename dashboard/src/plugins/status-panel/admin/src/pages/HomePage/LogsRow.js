import React from "react"
import LogsCollapse from "./LogsCollapse";
import { Tr, Td} from '@strapi/design-system/Table';

export default function LogsRow({ logs }) {
    return (<Tr>
        <td colspan="100%" style={{
            padding: 0,
            border: "none"
        }}>
            <LogsCollapse logs={logs} />
        </td>
    </Tr>);
}
