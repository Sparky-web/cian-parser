import React, {lazy, useEffect, useRef, useState} from 'react'
import {CBadge, CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner, CTextarea, CLabel, CToast, CToastBody, CToastHeader, CToaster} from '@coreui/react'
import axios from "axios";

const WidgetsDropdown = lazy(() => import('../widgets/WidgetsDropdown.js'))
const WidgetsBrand = lazy(() => import('../widgets/WidgetsBrand.js'))

const url = "http://0.0.0.0:1000"

const fetchData = async (type, filters = {}) => {
    const {data} = await axios.get(url + "/" + type, {
        params: {...filters}
    })
    return data
}
const startManualParsing = async (id) => {
    await new Promise(r => setTimeout(r, 1000))
}

const Dashboard = () => {
    const [links, setLinks] = useState([])
    const [proxies, setProxies] = useState([])
    const [runningIds, setRunningIds] = useState([])

    const [proxyString, setProxyString] = useState("")
    const [proxyLoading, setProxyLoading] = useState(false)

    const [toast, addToast] = useState(0)
    const toaster = useRef()
    const getToast = (title, text) => (
        <CToast title="CoreUI for React.js">
            <CToastHeader close>
                <svg
                    className="rounded me-2"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                    focusable="false"
                    role="img"
                >
                    <rect width="100%" height="100%" fill="#007aff"></rect>
                </svg>
                <strong className="me-auto">{title}</strong>
            </CToastHeader>
            <CToastBody>{text}</CToastBody>
        </CToast>
    )

    useEffect(() => {
        fetchData("links").then(setLinks)
        fetchData("proxies").then(setProxies)
    }, [])

    const startParsing = async id => {
        setRunningIds([...runningIds, id])
        try {
            await startManualParsing(id)
        } catch (e) {
            console.error(e)
        }
        setRunningIds(runningIds.filter(e => e.id !== id))
    }
    const addProxies = async () => {
        setProxyLoading(true)
        try {
            const text = proxyString
            let arr = text.split("\n")
            arr = arr.filter(e =>e)
            arr = arr.map(el => {
                const segments = el.split(":")
                return `http://${segments[2]}:${segments[3]}@${segments[0]}:${segments[1]}`
            })

            for(let proxy of arr) {
                await axios.post(url + "/proxies", {proxy})
            }

            const newProxy = await fetchData("proxies")
            setProxies(newProxy)
            addToast(getToast("Добавление прокси завершено"))
        } catch (e) {
           console.error(e)
        }
        setProxyLoading(false)
    }

    return (
        <>
            <WidgetsDropdown/>
            {/*
      <CCard>
        <CCardBody>
          <CRow>
            <CCol sm="5">
              <h4 id="traffic" className="card-title mb-0">Traffic</h4>
              <div className="small text-muted">November 2017</div>
            </CCol>
            <CCol sm="7" className="d-none d-md-block">
              <CButton color="primary" className="float-right">
                <CIcon name="cil-cloud-download"/>
              </CButton>
              <CButtonGroup className="float-right mr-3">
                {
                  ['Day', 'Month', 'Year'].map(value => (
                    <CButton
                      color="outline-secondary"
                      key={value}
                      className="mx-0"
                      active={value === 'Month'}
                    >
                      {value}
                    </CButton>
                  ))
                }
              </CButtonGroup>
            </CCol>
          </CRow>
          <MainChartExample style={{height: '300px', marginTop: '40px'}}/>
        </CCardBody>
        <CCardFooter>
          <CRow className="text-center">
            <CCol md sm="12" className="mb-sm-2 mb-0">
              <div className="text-muted">Visits</div>
              <strong>29.703 Users (40%)</strong>
              <CProgress
                className="progress-xs mt-2"
                precision={1}
                color="success"
                value={40}
              />
            </CCol>
            <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
              <div className="text-muted">Unique</div>
              <strong>24.093 Users (20%)</strong>
              <CProgress
                className="progress-xs mt-2"
                precision={1}
                color="info"
                value={40}
              />
            </CCol>
            <CCol md sm="12" className="mb-sm-2 mb-0">
              <div className="text-muted">Pageviews</div>
              <strong>78.706 Views (60%)</strong>
              <CProgress
                className="progress-xs mt-2"
                precision={1}
                color="warning"
                value={40}
              />
            </CCol>
            <CCol md sm="12" className="mb-sm-2 mb-0">
              <div className="text-muted">New Users</div>
              <strong>22.123 Users (80%)</strong>
              <CProgress
                className="progress-xs mt-2"
                precision={1}
                color="danger"
                value={40}
              />
            </CCol>
            <CCol md sm="12" className="mb-sm-2 mb-0 d-md-down-none">
              <div className="text-muted">Bounce Rate</div>
              <strong>Average Rate (40.15%)</strong>
              <CProgress
                className="progress-xs mt-2"
                precision={1}
                value={40}
              />
            </CCol>
          </CRow>
        </CCardFooter>
      </CCard>

      <WidgetsBrand withCharts/>
*/}

            <CRow>
                <CCol>
                    <CCard>
                        <CCardHeader>
                            Ссылки {' & '} Прокси
                        </CCardHeader>
                        <CCardBody>
                            <table className="table table-hover table-outline mb-0 d-none d-sm-table">
                                <thead className="thead-light">
                                <tr>
                                    <th>Ссылка</th>
                                    <th className="text-center">Статус</th>
                                    <th>Последний парсинг</th>
                                    <th className="text-right">Ручной парсинг</th>
                                </tr>
                                </thead>
                                <tbody>

                                {links.map(e => <tr key={e.id}>
                                    <td>
                                        <div><a href={e.url} target="_blank">{e.name}</a></div>
                                        <div className="small text-muted">
                                            Добавлено: {e.created_at}
                                        </div>
                                    </td>
                                    <td className="text-center">{
                                        e.isEnabled ? <CBadge color="success">вкл</CBadge> :
                                            <CBadge color="danger">выкл</CBadge>
                                    }</td>
                                    <td>{e.lastParse}</td>
                                    <td className="text-right">
                                        {runningIds.includes(e.id) ?
                                            <CButton color="warning" disabled><CSpinner color="light"/></CButton> :
                                            <CButton color="success" onClick={() => startParsing(e.id)}>
                                                Начать
                                            </CButton>}
                                    </td>
                                </tr>)}
                                </tbody>
                            </table>
                            <br/>
                            <table className="table table-hover table-outline mb-0 d-none d-sm-table">
                                <thead className="thead-light">
                                <tr>
                                    <th>Прокси</th>
                                    <th className="text-center">Статус</th>
                                    <th className="text-right">Неудачные попытки</th>
                                </tr>
                                </thead>
                                <tbody>

                                {proxies.map(e => <tr key={e.id}>
                                    <td>
                                        <div>{e.proxy}</div>
                                        <div className="small text-muted">
                                            Добавлено: {e.created_at}
                                        </div>
                                    </td>
                                    <td className="text-center">{
                                        e.isEnabled ? <CBadge color="success">вкл</CBadge> :
                                            <CBadge color="danger">выкл</CBadge>
                                    }</td>
                                    <td className="text-right">{e.unsuccesfulAttempts}</td>
                                </tr>)}
                                </tbody>
                            </table>
                            <br/>

                            <div>
                                <h3>Пакетное добавление прокси</h3>
                                <CLabel>Http прокси (каждая с новой строки) в формате ip:port:username:password</CLabel>
                                <CTextarea
                                    onChange={e => setProxyString(e.target.value)}
                                    value={proxyString}
                                    rows="5"
                                    style={{marginBottom: "0.5rem"}}
                                />
                                {proxyLoading ?
                                    <CButton disabled color="warning"><CSpinner color={"light"}/></CButton> :
                                    <CButton color={"primary"} onClick={addProxies}>Добавить</CButton>
                                }
                            </div>
                        </CCardBody>


                    </CCard>
                </CCol>
            </CRow>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </>
    )
}

export default Dashboard
