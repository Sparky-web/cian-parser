import React, { useState, useEffect } from "react"
import { Table, Thead, Tbody, Tr, Td, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography'
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Loader } from '@strapi/design-system/Loader';
import { Checkbox } from '@strapi/design-system/Checkbox';
import { Stack } from '@strapi/design-system/Stack';
import { fetchData } from "../../utils/dashboard";

export default function TableWrapper({ collection, columns, actions, Row }) {
    const [items, setItems] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(false)

    const select = (id) => {
        if (selected.includes(id)) setSelected(selected.filter(e => e !== id))
        else setSelected([...selected, id])
    }

    const selectAll = () => {
        if (selected.length) setSelected([])
        else setSelected(items.map(e => e.id))
    }

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const { data } = await fetchData(collection, {populate: "*"})
            setItems(data)
        } catch (e) { alert(e) }

        setLoading(false)
    }

    useEffect(() => {
        fetchInitialData()
    }, [])

    return (
        <>
            <Table colCount={collection.length + 1} style={{"white-space": "break-spaces"}}>
                <Thead>
                    <Tr>
                        <Th>
                            <Checkbox checked={selected.length === items.length} onChange={() => { selectAll() }} />
                        </Th>
                        {columns.map(e => (<Th key={e}>
                            <Typography variant="sigma">{e}</Typography>
                        </Th>))}
                    </Tr>
                </Thead>

                <Tbody>
                    {items.map(e => <Row refresh={fetchInitialData} selected={selected} select={select} key={e.id} item={e} />)}
                </Tbody>
            </Table>
            {selected.length ? <Stack marginTop={3} horizontal={true} spacing={3}>
                <Box margitBottom={3}>
                    <Typography variant="delta">Выбрано: {selected.length}</Typography>
                </Box>

                {actions.map(action => loading ? <Loader />
                    : <Button onClick={async () => {
                        await action.handler(selected)
                        await fetchInitialData()
                        setSelected([])
                    }}>{action.name}</Button>
                )}

            </Stack> : <div />}
        </>
    )

}