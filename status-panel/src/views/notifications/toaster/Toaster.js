import React, { useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CToast,
  CToastBody,
  CToastHeader,
  CToaster,
  CForm,
  CInput,
  CInputCheckbox,
  CButton,
  CContainer,
  CRow,
  CCol,
  CLabel
} from '@coreui/react'
import { DocsLink } from 'src/reusable'

const Toaster = () => {

  const positions = [
    'static',
    'top-left',
    'top-center',
    'top-right',
    'top-full',
    'bottom-left',
    'bottom-center',
    'bottom-right',
    'bottom-full'
  ]

  const [toasts, setToasts] = useState([
    { position: 'static'},
    { position: 'static'},
    { position: 'top-right', autohide: 3000 }
  ])

  const [position, setPosition] = useState('top-right')
  const [autohide, setAutohide] = useState(true)
  const [autohideValue, setAutohideValue] = useState(5000)
  const [closeButton, setCloseButton] = useState(true)
  const [fade, setFade] = useState(true)

  const addToast = () => {
    setToasts([
      ...toasts, 
      { position, autohide: autohide && autohideValue, closeButton, fade }
    ])
  }


  const toasters = (()=>{
    return toasts.reduce((toasters, toast) => {
      toasters[toast.position] = toasters[toast.position] || []
      toasters[toast.position].push(toast)
      return toasters
    }, {})
  })()


  return (
    <CCard>
      <CCardHeader>
        Toasts.
        <DocsLink name="-Toast"/>
      </CCardHeader>
      <CCardBody>
        <CContainer>
          <CRow>
            <CCol sm="12" lg="6">
              <CForm>
                <h5>Add toast with following props:</h5>

                <CButton
                  className="mr-1 w-25"
                  color="success"
                  onClick={addToast}
                >
                  Add toast
                </CButton>

              </CForm>
            </CCol>
            <CCol sm="12" lg="6">
              {Object.keys(toasters).map((toasterKey) => (
                <CToaster
                  position={toasterKey}
                  key={'toaster' + toasterKey}
                >
                  {
                    toasters[toasterKey].map((toast, key)=>{
                    return(
                      <CToast
                        key={'toast' + key}
                        show={true}
                        autohide={toast.autohide}
                        fade={toast.fade}
                      >
                        <CToastHeader closeButton={toast.closeButton}>
                          Toast title
                        </CToastHeader>
                        <CToastBody>
                          {`This is a toast in ${toasterKey} positioned toaster number ${key + 1}.`}
                        </CToastBody>
                      </CToast>
                    )
                  })
                  }
                </CToaster>
              ))}
            </CCol>
          </CRow>
        </CContainer>
      </CCardBody>
    </CCard>
  )
}

export default Toaster
