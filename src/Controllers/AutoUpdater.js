import React, { useRef, useEffect, useContext } from "react"
import { AlertCentralContext } from '../Components/AlertCentral'
import Button from '../Components/Button'

const UPDATE_CHECK_INTERVAL = 10*60*1000 // 10 minutes

const indexHTMLChanged = async () => {
    const getVersion = doc => doc.getElementById ('version-tag').getAttribute ('version')
    const response = await fetch (window.location)
    const html = await response.text ()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const nVersion = getVersion (doc)
    const curVersion = getVersion (document)

    console.log (`version check, old: `, curVersion, ' new: ', nVersion)

    return nVersion !== curVersion
}

export default ({ children }) => {
    const alerts = useContext (AlertCentralContext)
    const timer = useRef (undefined)

    useEffect (() => {
        timer.current = setInterval (() => {
            indexHTMLChanged ()
            .then (changed => changed &&
                alerts.show (
                    <div className='flex-def'>
                        A new version of Xman is available, click 'Reload' to use the latest version!
                        <Button data-color='tertiary' onClick={ () => window.location.reload() } data-medium>
                            Reload
                        </Button>
                    </div>,
                    undefined
                )
            )
            .catch (err => console.error('error in update check', err))
        }, UPDATE_CHECK_INTERVAL)
        return () => clearInterval (timer.current)
    }, [timer, alerts])

    return children
}