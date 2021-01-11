import React, {useContext, useEffect, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import { Card, Form, FormCheck } from "react-bootstrap";
import { AlertCentralContext } from '../../Components/AlertCentral';
import ProgressButton from '../../Components/ProgressButton';
import { AudienceStoreContext } from '../../Controllers/AudienceStore';
import { WAStateContext } from '../../Controllers/WAStateStore';
import NewMessageBox from '../../LiveChat/NewMessageBox';
import TagPicker from '../TagPicker';
import {FirebaseContext} from "./../../Firebase"
import './ContactWindow.css'

export default ({ showModal, noModal }) => {
    const alerts = useContext (AlertCentralContext)
    const { controller, state } = useContext (WAStateContext)
    const { addContact } = useContext (AudienceStoreContext)
    const { analytics } = useContext(FirebaseContext)

    const [name, setName] = useState ('')
    const [phone, setPhone] = useState ('')
    const [message, setMessage] = useState (undefined)
    const [tags, setTags] = useState (new Set())
    
    const save = async () => {
        if (!name) alerts.error ('Please specify a name')
        if (!phone) alerts.error ('Please specify the contact\'s phone number')
        if (state.connections.waWeb !== 'open' && message) alerts.error ('Your phone is not connected via Xman. Please connect your phone before sending a message')

        let formattedPhone = phone.replace (/[^0-9]/g, '')
        await addContact ({ name, phone: formattedPhone }, tags)

        console.log (message)

        if (message) {
            if (message.type === 'message') {
                await controller.sendMessage (`${formattedPhone}@s.whatsapp.net`, message.message)
            }   
        }
        analytics.logEvent('contact_created')
        noModal ()
    }

    return(
        <Modal show={showModal} onHide={noModal} centered>
            <div className="contact-body">
                <div className="modal-title">Add Contact</div>
                    <Form validated>
                        <Form.Group controlId='new-contact-name-g'>
                            <Form.Text className="settings-prompt">Name*</Form.Text>
                            <Form.Control 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                type="text" 
                                isValid={ !!name }
                                className="settings-form" />
                        </Form.Group>
                        
                        
                        <Form.Text className="settings-prompt">Number*</Form.Text>
                        <Form.Control value={phone} onChange={e => setPhone(e.target.value)} type="text" className="settings-form" />
                        
                        <Form.Text className="settings-prompt">Add Tags</Form.Text>
                        <div className='contact-tag'>
                        <TagPicker tagType='static' drop='down' maxSelectableTags={5} selectedTags={tags} setSelectedTags={setTags} />
                        </div>
                        <Form.Text className="settings-prompt">Quick Message</Form.Text>
                        <NewMessageBox 
                            fileLimit={1} 
                            allowedTypes={ new Set([ 'message', 'message-flow' ]) }
                            showButtons={false}
                            updatedMessage={ setMessage } />
                        <div className='contact-button'>
                        <ProgressButton onClick={save} data-color="secondary" className="account-save" >Save</ProgressButton>
                        </div>
                    </Form>
            </div>
        </Modal>
    )
}