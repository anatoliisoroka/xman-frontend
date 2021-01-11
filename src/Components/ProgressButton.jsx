import React, { useContext, useState } from 'react'
import Button from './Button'
import { BeatLoader, MoonLoader } from 'react-spinners'
import { AlertCentralContext } from './AlertCentral'
/**
 * 
 * @param {import('react-bootstrap/esm/Button').ButtonProps} props 
 * @param {string} props.loaderColor
 * @param {} props.bref
 * @param {'spinner' | 'beat'} props.loaderType
 */
export default function ProgressButton (props) {
    const alertCentral = useContext (AlertCentralContext)
    const [working, setWorking] = useState (false)
    const work = async () => {
        setWorking (true)
        try {
            await props.onClick ()
        } catch (error) {
            alertCentral.error (error.message, 3000)
        }
        setWorking (false)
    }
    return (
        <Button {...props} disabled={working} onClick={work} style={{position: 'relative'}}> 
            <div style={{ opacity: working ? '0' : '1', transition: '0.2s opacity' }}>
                { props.children }
            </div>
            {
                working && (
                    <div style={{ position: 'absolute', left: props.loaderType === 'spinner' ? '10%' : '0', right: '0', top: '10%', bottom: '0' }}>
                        {
                            props.loaderType === 'spinner' ?
                            <MoonLoader color={props.loaderColor} size='20px' /> :
                            <BeatLoader color={props.loaderColor} size='10px'/>
                        }
                    </div>
                )
            }
        </Button>
    )
}