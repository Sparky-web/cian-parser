/*
 *
 * HomePage
 *
 */

import React, { useContext, useState, memo } from 'react'

import { Box, Button, Stack } from "@strapi/design-system"
import { BaseHeaderLayout, ContentLayout } from "@strapi/design-system/Layout"
import { Typography } from '@strapi/design-system/Typography';
import { Loader } from '@strapi/design-system/Loader';

import axios from '../../utils/axiosInstance';
import Links from '../../components/Links';
import Proxies from '../../components/Proxies';
import Logs from '../../components/Logs';
import Widgets from '../../components/Widgets';
import { apiUrl } from '../../utils/dashboard';
import { AppContext } from '../../context/AppContext';

const Dashboard = () => {
    const [isCreating, setIsCreating] = useState(false)
    const {fetchAll} = useContext(AppContext)

    const createFailed = async () => {
        setIsCreating(true)
        try {
            const {data} = await axios.get(apiUrl + "/create-failed/all")
            await fetchAll()
            alert("Создано " + data.addedItems + " офферов")
        } catch (e) {
            alert(e.message)
        }

        setIsCreating(false)
    }


    return (
        <div>
            <Box background="neutral100">
                <BaseHeaderLayout title="Статус-панель" subtitle="" as="h2" />
            </Box>

            <ContentLayout>
                <Widgets />

                <br />

                <Links />

                <br />

                <Stack horizontal spacing={2}>
                    <Typography variant="delta">Создать недостающие лиды в б24</Typography>
                    {isCreating ?
                        <Loader /> :
                        <Button onClick={createFailed}>Coздать</Button>
                    }
                </Stack>

                <br />

                <Proxies />

                <br />

                <Logs />

                <br />
            </ContentLayout>

        </div>
    )
};

export default memo(Dashboard);
