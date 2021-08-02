import React from 'react'
import {
  CWidgetDropdown,
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import ChartLineSimple from '../charts/ChartLineSimple'
import ChartBarSimple from '../charts/ChartBarSimple'

const WidgetsDropdown = () => {


  // render
  return (
    <CRow>
      <CCol sm="6" lg="3">
        <CWidgetDropdown
          color="gradient-primary"
          header="9"
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
          header="200"
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
          header="190"
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
          header="4"
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
