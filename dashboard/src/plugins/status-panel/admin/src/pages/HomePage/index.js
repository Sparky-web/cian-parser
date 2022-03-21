/*
 *
 * HomePage
 *
 */

import pluginId from '../../pluginId';
import React, { useEffect, useState, memo } from 'react'
import { count } from '../../utils/dashboard';

import { Box, Link, Button, Flex, Stack } from "@strapi/design-system"
import { BaseHeaderLayout, ContentLayout } from "@strapi/design-system/Layout"
import { Typography } from '@strapi/design-system/Typography';
import { Loader } from '@strapi/design-system/Loader';

import axios from '../../utils/axiosInstance';
import Links from './Links';
import Proxies from './Proxies';
import Logs from './Logs';
import Widgets from './Widgets';

// let url = "http://localhost:1000"
// let apiUrl = "http://localhost:1001"

// if (!(!process.env.NODE_ENV || process.env.NODE_ENV === 'development')) {
//     url = "http://194.58.96.121:1000"
//     apiUrl = "http://194.58.96.121:1001"
// }


const Dashboard = () => {
    const [isCreating, setIsCreating] = useState(false)

    const createFailed = async () => {
        setIsCreating(true)
        try {
            await axios.get(apiUrl + "/create-failed/all")
            await fetchInitialData()
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
