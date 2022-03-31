import React, { useState, useEffect, useContext } from "react"
import { Table, Thead, Tbody, Tr, Th } from '@strapi/design-system/Table';
import { Typography } from '@strapi/design-system/Typography'
import { Button } from '@strapi/design-system/Button';
import { Box } from '@strapi/design-system/Box';
import { Loader } from '@strapi/design-system/Loader';
import { Checkbox } from '@strapi/design-system/Checkbox';
import { Stack } from '@strapi/design-system/Stack';
import { If, Then } from "react-if"
import { AppContext } from "../context/AppContext";

export default function TableWrapper({ collection, columns, actions, Row }) {
    // const [items, setItems] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(false)

    const { [collection]: items, fetchAll } = useContext(AppContext)

    const select = (id) => {
        if (selected.includes(id)) setSelected(selected.filter(e => e !== id))
        else setSelected([...selected, id])
    }

    const selectAll = () => {
        if (selected.length) setSelected([])
        else setSelected(items.map(e => e.id))
    }

    return (
        <If condition={items}>
            <Then>
                <Table colCount={collection.length + 1} style={{ "white-space": "break-spaces" }}>
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
                        {items.map(e => <Row selected={selected} select={select} key={e.id} item={e} />)}
                    </Tbody>
                </Table>
                {selected.length ? <Stack marginTop={3} horizontal={true} spacing={3}>
                    <Box margitBottom={3}>
                        <Typography variant="delta">Выбрано: {selected.length}</Typography>
                    </Box>

                    {actions.map(action => loading ? <Loader />
                        : <Button onClick={async () => {
                            await action.handler(selected)
                            await fetchAll()
                            setSelected([])
                        }}>{action.name}</Button>
                    )}

                </Stack> : <div />}
            </Then>
        </If>
    )

}