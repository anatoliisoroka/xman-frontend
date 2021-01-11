import React, {useEffect, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import './ResetWindow.css'
import { Card, Form, FormCheck } from "react-bootstrap";
import { AlertCentralContext } from '../Components/AlertCentral';
import WindowController from '../Controllers/WindowController';

export default props => {
    const alertCentral = React.useContext (AlertCentralContext)
    const getData = async () => {
        const json = await new WindowController().handleFetch('/users', 'GET')
        //setVal(json)
        return json
    }

    const save = async() => {
        const password = document.getElementById ('password-entry').value
        const repPwd = document.getElementById ('repeat-password-entry').value
        const json = await getData()
        const username = json.meta.username

        if (password === repPwd){
            const resp =  await new WindowController().handleFetch('/users', 'PATCH', {username, password})
            if (resp.code === 200){
                alertCentral.show ("Password Updated", 3000)
            } else {
                alertCentral.error (resp.message, 3000)
            }
        }
        else{
            alertCentral.error ("Passwords do not match")
        }  
    }
    
    return(
        <div>
            <Modal show = {props.showModal} onHide = {props.noModal} centered>
                <div className="modal-body">
                    <div className="modal-close" onClick = {props.noModal}>x</div>
                    <div className="modal-title">Reset Password</div>
                    <Form.Text>
                        Must have 8 - 64 characters with atleast 1 lowercase, 1 uppercase and 1 numeric character
                    </Form.Text>
                    <div className="modal-reset-box">    
                        <Form.Text className="settings-prompt">New Password</Form.Text>
                        <Form.Control type="password" className="settings-form" id="password-entry"></Form.Control>
                        <Form.Text className="settings-prompt">Repeat New Password</Form.Text>
                        <Form.Control type="password" className="settings-form" id="repeat-password-entry"></Form.Control>                                
                    </div> 
                    <Button className="save-button" variant="primary" onClick={save}>Confirm</Button>
                </div>
            </Modal>
        </div>
    )
}