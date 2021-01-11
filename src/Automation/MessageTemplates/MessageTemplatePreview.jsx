import React, { createContext, useState } from "react";
import { Modal } from "react-bootstrap";
import LiveChatMessageView from "../../LiveChat/LiveChatMessageView";
import { constructPendingMessage } from '../../Controllers/Utils'
/**
 * @param {Object} props 
 * @param {boolean} props.visible
 * @param {function(boolean)} props.setVisible
 * @param {import("../../Controllers/MessageTemplatesController").MessageTemplate} props.flow
 */
export default function MessageTemplatePreview (props) {
    return (
        <Modal show={props.visible} onHide={props.setVisible} centered>
            <div className='message-flow-create-container'>
                <h4>{props.flow?.name}</h4>
                
                <div className='message-flow-preview secondary-panel'>
                    { props.flow && <LiveChatMessageView editable={false} parseTemplate={true} message={constructPendingMessage ('', props.flow, '', false)}/> }
                </div>
            </div>
        </Modal>
    )
}
export const MessageTemplatePreviewContext = createContext ({ show: flow => {}, showing: false })
export const MessageTemplatePreviewContextMaker = props => {
    const [showing, setShowing] = useState (null)

    return (
        <>
            <MessageTemplatePreviewContext.Provider value={ { show: setShowing, showing } }>
                <MessageTemplatePreview visible={ !!showing } setVisible={ () => setShowing(null) } flow={showing}/>
                { props.children }
            </MessageTemplatePreviewContext.Provider>
        </>   
    )
}
