import React, { useContext, useEffect, useRef, useState } from "react";
import { MessageTemplatesControllerContext } from "../../Controllers/MessageTemplatesController";
import { Form, Modal } from "react-bootstrap";
import { constructPendingMessage } from '../../Controllers/Utils'
import './CreateMessageTemplate.css'
import NewMessageBox from "../../LiveChat/NewMessageBox";
import LiveChatMessageView from "../../LiveChat/LiveChatMessageView";
import useConstant from "use-constant";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import ProgressButton from "../../Components/ProgressButton";

/**
 * @param {Object} props 
 * @param {boolean} props.visible
 * @param {function(boolean)} props.setVisible
 * @param {import("../../Controllers/MessageTemplatesController").MessageTemplate} props.editingFlow
 * @param {function(MessageTemplate)} props.onCreateFlow
 * @param {function(MessageTemplate)} props.onEditFlow
 */
export default function CreateMessageTemplate (props) {
    const controller = useContext (MessageTemplatesControllerContext)
    const flowContent = useRef ({ text: '' })

    const [preview, setPreview] = useState (constructPendingMessage('', { text: '' }, '', false))

    const setNewMessage = useConstant (() => AwesomeDebouncePromise(message => {
        flowContent.current = message
        setPreview(constructPendingMessage('', message, '', false))
    }, 250))
    const assertingName = () => {
        const name = document.getElementById('message-flow-name').value
        if (!name) throw new Error ('Please enter a name for the message flow')
        return name
    }
    const assertText = () => {
        if (typeof flowContent.current.text !== 'undefined' && !flowContent.current.text) {
            throw new Error ('Please enter some text for the message flow')
        }
    }
    const createFlow = async () => {
        const name = assertingName()
        assertText ()

        const flow = await controller.createFlow ({ ...flowContent.current, name })
        props.setVisible (false)
        props.onCreateFlow (flow)
    }
    const editFlow = async () => {
        const name = assertingName ()
        assertText ()

        const flow = await controller.editFlow (props.editingFlow.id, { ...flowContent.current, name })
        props.setVisible (false)
        props.onEditFlow (flow)
    }
    const done = () => props.editingFlow ? editFlow() : createFlow()

    useEffect (() => {
        if (props.visible) {
            setPreview (constructPendingMessage('', { text: '' }, '', false))
            flowContent.current = null
        }
    }, [ props.visible ])
    useEffect (() => {
        setNewMessage (props.editingFlow || { text: '' })
        if (props.editingFlow) {
            document.getElementById('message-flow-name').value = props.editingFlow.name
        }
    }, [ props.editingFlow ])
    
    return (
        <Modal show={props.visible} onHide={props.setVisible} centered>
            <div className='message-flow-create-container'>
                <h4>{ props.editingFlow ? 'Edit Message Template' : 'New Message Template' }</h4>
                <div className='secondary-panel'>
                    <Form.Control id='message-flow-name' className='message-flow-name-input' placeholder='name of flow...'/>
                </div>
                <div className='message-flow-preview secondary-panel'>
                    <LiveChatMessageView editable={false} parseTemplate={true} message={preview}/>
                </div>

                <NewMessageBox 
                    fileLimit={1} 
                    showButtons={false} 
                    allowedTypes={new Set(['message'])} 
                    initialMessage={props.editingFlow}
                    updatedMessage={ ({ type, message }) => (
                        setNewMessage (message)
                ) }/>

                <div className='message-flow-buttons'>
                    <ProgressButton data-medium data-color='secondary' onClick={ done }>
                        { props.editingFlow ? 'Edit' : 'Create' }
                    </ProgressButton>
                </div>
            </div>
        </Modal>
    )
}