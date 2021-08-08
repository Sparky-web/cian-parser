import React from 'react'
import {CCol, CRow, CWidgetDropdown} from '@coreui/react'

const WidgetsDropdown = ({links, proxies, offers}) => {


    return (
        <CRow>
            <CCol sm="6" lg="3">
                <CWidgetDropdown
                    color="gradient-primary"
                    header={links.filter(el => el.isEnabled).length + ""}
                    text="Ссылок активно"
                    footerSlot={
                        <div
                            className="c-chart-wrapper mt-3 mx-3"
                            style={{height: '70px'}}
                        />
                    }
                >
                </CWidgetDropdown>
            </CCol>

            <CCol sm="6" lg="3">
                <CWidgetDropdown
                    color="gradient-info"
                    header={offers.count?.all}
                    text="Объявлений в базе"
                    footerSlot={
                        <div
                            className="c-chart-wrapper mt-3 mx-3"
                            style={{height: '70px'}}
                        />
                    }
                >
                </CWidgetDropdown>
            </CCol>

            <CCol sm="6" lg="3">
                <CWidgetDropdown
                    color="gradient-warning"
                    header={offers.count?.inBitrix}
                    text="Объявлений добавленно в битрикс"
                    footerSlot={
                        <div
                            className="c-chart-wrapper mt-3 mx-3"
                            style={{height: '70px'}}
                        />
                    }
                >
                </CWidgetDropdown>
            </CCol>

            <CCol sm="6" lg="3">
                <CWidgetDropdown
                    color="gradient-danger"
                    header={proxies.filter(el => el.enabled).length + " "}
                    text="рабочих прокси"
                    footerSlot={
                        <div
                            className="c-chart-wrapper mt-3 mx-3"
                            style={{height: '70px'}}
                        />
                    }
                >
                </CWidgetDropdown>
            </CCol>
        </CRow>
    )
}

export default WidgetsDropdown
