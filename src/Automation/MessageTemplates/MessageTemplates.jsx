import React, { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useMessageTemplatesStore } from "../../Controllers/MessageTemplatesStore";
import './MessageTemplates.css'
import { Button, Form, Spinner } from "react-bootstrap";
import CreateMessageTemplate from "./CreateMessageTemplate";

/**
 * @param {Object} props 
 * @param {import("./MessageTemplatesController").MessageTemplate} props.flow
 * @param {function()} props.editFlow
 * @param {function()} props.deleteFlow
 */
export function MessageTemplate ({flow, editFlow, deleteFlow}) {
    const deleteWithConfirm = () => {
        if (!window.confirm('Deleting this flow will prevent broadcasts using this flow from executing, are you sure?')) {
            return
        }
        deleteFlow ()
    }
    return (
        <div className='message-flow'>
            <h5 onClick={ editFlow } style={{cursor: 'pointer'}}>{flow.name}</h5>
            <Button data-color='danger' className='file-preview-close' onClick={deleteWithConfirm} />
        </div>
    )
}
/**
 * 
 * @param {{ events: EventSource }} props 
 */
export default function MessageTemplates ({ events }) {
    const { flows, hasMoreResults, loadMoreFlows, searchFlows, addFlow, deleteFlow, updateFlow } = useMessageTemplatesStore ()
    const [openedCreate, setOpenedCreate] = useState (false)
    const [editFlow, setEditFlow] = useState (null)

    useEffect (() => {
        if (!events) {
            setOpenedCreate (false)
            return
        }
        const value = () => {
            setOpenedCreate (true)
        }
        events.on ('add-clicked', value)
        return () => events.off ('add-clicked', value)
    }, [ events, openedCreate ])

    return (
        <div className='message-flow-container'>
            <CreateMessageTemplate 
                visible={openedCreate} 
                setVisible={() => {
                    setOpenedCreate(false)
                    setEditFlow (null)
                }} 
                editingFlow={editFlow}
                onCreateFlow={addFlow} 
                onEditFlow={updateFlow}
                />
            <div className='message-flow-search'>
                <Form.Control placeholder='Search flows...' onChange={ ev => searchFlows(ev.target.value) }/>
            </div>
            
            <hr/>
            <div className='message-flows' id='message-flow-scroll-parent'>
                <InfiniteScroll
                    scrollableTarget='message-flow-scroll-parent'
                    dataLength={flows?.length || 0}
                    scrollThreshhold='3rem'
                    style={{ marginTop: '0.5rem', overflow: 'hidden' }}
                    next={loadMoreFlows}
                    hasMore={hasMoreResults}
                    loader={<Spinner animation='border'/>}>
                    {
                        flows?.map (flow => (
                            <MessageTemplate 
                                flow={flow} 
                                editFlow={
                                    () => {
                                        setEditFlow (flow)
                                        setOpenedCreate (true)
                                    }
                                }
                                deleteFlow={() => deleteFlow(flow)}
                                key={flow.id}/>
                        ))
                    }
                </InfiniteScroll>  
            </div>            
        </div>
    )
}