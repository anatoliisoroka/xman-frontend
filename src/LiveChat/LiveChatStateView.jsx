import React, {useContext, useEffect, useRef, useState} from 'react'
import QRCode from 'qrcode.react'
import { Spinner } from 'react-bootstrap'
import Button from '../Components/Button'
import { WAStateContext } from '../Controllers/WAStateStore'

const LONG_TIME_MEASURE = 20_000

/**
 * 
 * @param {Object} props 
 * @param {string} props.qr
 */
const QRDisplay = (props) => (
    <div className='live-chat-qr-page'>
        <QRCode value={props.qr} size={512} style={{width: '70vmin', height: '70vmin'}}/>
        <div className='live-chat-instructions'>
            <h2>Connect WhatsApp to Xman</h2> <br/>
            <span>1. Open WhatsApp on your phone</span> <br/>
            <span>2. Tap Menu or Settings and select <b>WhatsApp Web</b></span> <br/>
            <span>3. Log out of all other WhatsApp Web connections</span> <br/>
            <span>4. Point your phone to this screen to capture the code</span> <br/>

            <Spinner animation='border'/>
        </div>
    </div>
)
export default () => {
    const {controller, state} = useContext (WAStateContext)

    const open = () => controller.open().catch (err => {  })

    const [takingLongTime, setTakingLongTime] = useState (false)
    const timeout = useRef (undefined)

    useEffect (() => {
        if ((!state.canLogin || state.connections.waWeb !== 'connecting')) {
            if (timeout.current) clearTimeout (timeout.current)
            timeout.current = undefined
            return
        }
        if (!timeout.current) {
            timeout.current = setTimeout(() => setTakingLongTime(true), LONG_TIME_MEASURE)
        }
    }, [ state.connections.waWeb ])

    return (
        <div className='live-chat-overlay'>
            { 
                state.connections?.waWeb === 'connecting' && state.pendingQR && 
                <QRDisplay qr={state.pendingQR}/> 
            }
            {
                state.connections?.waWeb === 'connecting' && !state.pendingQR &&
                (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                        {
                            takingLongTime && (
                                <h4>
                                    It's taking a long time to connect... <br/>
                                    - Check the connection on your phone. <br/>
                                    - If the connection is alright, open and close WhatsApp on your phone <br/>
                                </h4>
                            )
                        }
                        
                        <Spinner animation='border' className='spinner-live-chat'/>
                        <Button data-color='danger' style={{marginTop: '1rem'}} onClick={ () => controller.closeConnection () }>
                            Cancel
                        </Button>
                    </div>
                )
            }
            {
                state.connections?.waWeb === 'close' &&
                (
                   <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <h3>Disconnected from WhatsApp</h3>
                    <br/>
                        <Button data-color='secondary' data-large onClick={ open }>
                            Connect
                        </Button>
                   </div>
                )
            }
        </div>
    )
}