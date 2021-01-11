import React, {useState} from 'react'
import Alert from 'react-bootstrap/Alert'
import { useContext } from 'react'
import { Button } from 'react-bootstrap'
import './AlertCentral.css'

export function AlertCentral () {
    const [content, setContent] = useState ('')
    const [type, setType] = useState ('')
    const [visible, setVisible] = useState ('hide')
    const [timeoutValue, setTimeoutValue] = useState (null)
    
    const show = (content, type, timeout) => { 
        setContent(content)
        setVisible ('showing')
        setType (type) 
        
        if (timeoutValue) clearTimeout (timeoutValue)
        setTimeoutValue ( timeout ? setTimeout (hide, timeout) : null ) 
    }
    const hide = () => { setVisible ('hide') }
    return {
        /**
         * Show an alert
         * @param {string} content the text to show
         * @param {number} timeout how many ms to show the alert for (set to null for infinite)
         */
        show: (content, timeout) => show(content, '', timeout),
        /**
         * Show an error alert
         * @param {string} content the text to show
         * @param {number} timeout how many ms to show the alert for (set to null for infinite)
         */
        error: (content, timeout) => show(content, 'error', timeout),
        /** Hide the alert */
        hide: hide,
        alert: React.createElement(Alert, {variant: 'central', className: `${visible} ${type}`, onClose: hide, dismissible: true, children: content})
    }
}
/**
 * @type {React.createContext<{show: function(any), hide: function(any), alert: JSX.Element}>}
 */
export const AlertCentralContext = React.createContext (null)