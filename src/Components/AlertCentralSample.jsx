import React, { useContext } from 'react'
import {AlertCentralContext, AlertCentral} from './AlertCentral'
import { Button } from 'react-bootstrap'
// Sample code

function SampleComponent (props) {
    const alertCentral = useContext (AlertCentralContext)
    return (
        <>
            <Button onClick={ () => alertCentral.show ('Hello this is alert') }>
                Click to show alert
            </Button>
            <span> </span>
            <Button onClick={ () => alertCentral.error ('Hello this is an error') }>
                Click to show error
            </Button>
            <span> </span>
            <Button onClick={ () => alertCentral.show ('Hello this will disappear on its own', 3000) }>
                Click to show alert for 3 seconds
            </Button>
        </>
    )
}
function Sample (props) {
    const central = AlertCentral ()
    // provide context
    return (
        <div>
            <AlertCentralContext.Provider value={central}>
                { central.alert }
                <div>
                    <SampleComponent />
                </div>
            </AlertCentralContext.Provider>
        </div>
    )
}
export const samples = [
    <Sample/>
]