import React, {useState, useContext,useEffect} from 'react';
import {Modal, Table} from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import TagPicker from '../../Audience/TagPicker';
import AuthController from '../../Controllers/AuthController';
import { AlertCentralContext } from '../../Components/AlertCentral';
import { Spinner} from 'react-bootstrap';
import './NLP.css';

/**
 * @param {Object} props - props from KeywordReplyItem
 * @param {Object} record - Keyword execution data
 * @property {string} record.id
 * @property {string} record.chatId -receiver's phone number
 * @property {string} record.text - Keyword
 * @property {number} record.timestamp 
 */

function ShowRecord({show, setShow, record, tagList}) {
    const handleClose = () => setShow(false)

    const headers = [
        { label: "Contact Number", key: "contactNum" },
        { label: "Message", key: "message" },
        { label: "Time", key: "time" }
      ];
    
    const recordData = []

    record.map( item => (recordData.push(
        {
            contactNum: "+" + item.chatId.split('@', 1),
            message: item.text,
            time: new Date(item.timestamp * 1000).toLocaleTimeString() + " " + new Date(item.timestamp * 1000).toLocaleDateString(),
        }
        )               
    ))

    const csvReport = {
        data: recordData,
        headers: headers,
        filename: 'Record.csv'
    }

    const [tags, setTags] = useState(new Set(tagList?.split(',').filter (Boolean) || []))
    const [tagId, setTagId] = useState("")

    const addTag = async (tag) => {
        const contacts = []
        var i = 0
        for (i = 0; i<record.length; i++) 
            {
                contacts.push(String(record[i].chatId.split('@', 1)))
            }
        await edit ({ addContacts:contacts})
        setTagId(tag)
        console.log("contacts: " + contacts) 
        console.log("tag id: " + tagId)
        console.log("tag : " + tag)
    }

    const removeTag = tag => null

    const alertCentral = useContext (AlertCentralContext)
    const [loading, setLoading] = useState (false)

    const edit = async (body) => {
        setLoading(true)
        try {
            const token = await new AuthController().getToken ()
            const result = await fetch ('https://api-audience.xman.tech/tags/' + tagId, { 
                method: 'PATCH', 
                headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (result.status >= 400) {
                throw new Error (`An unknown error occurred`)
            }                
        } catch (error) {
            alertCentral.error (error.message, 3000) // alert will disappear after 3 seconds
        }
		setLoading(false)
    }

    return (
        <Modal show={show} onHide={handleClose} className="show-record-modal">
        <Modal.Header closeButton>
            <Modal.Title>Records</Modal.Title>
            {record.length !== 0 ?
                <CSVLink className="btn-blue" style={{margin:"0.5rem 0 0 1rem"}} {...csvReport}>Export</ CSVLink>
                :
                null
            }
            {record.length !== 0 ?
                <TagPicker
                    tagType='static'
                    maxSelectableTags={5} 
                    selectedTags={tags} 
                    setSelectedTags={setTags} 
                    addedTag={addTag} 
                    removedTag={removeTag} 
                />
                :
                null
            }
            <Spinner animation='border' style={{display: "inlineFlex"}} hidden={!loading}/> 
        </Modal.Header>
        <Modal.Body>
            <Table variant='show-record' borderless>
                <thead>
                    <tr>
                        <th>Contact Number</th>
                        <th>Message</th>
                        <th style={{width: '4.813rem'}}>Time</th>
                    </tr>
                </thead> 
                <tbody>
                    {
					    record.map (item => 
                            <tr>
                                <td>{"+" + item.chatId.split('@', 1)}</td>
                                <td>{item.text}</td>
                                <td>{new Date(item.timestamp * 1000).toLocaleTimeString()}
                                    <br/>{new Date(item.timestamp * 1000).toLocaleDateString()}
                                </td>
                            </tr>
                        )
                    }
                </tbody>  
            </Table>
        </Modal.Body>
        </Modal>
    );
}

export default ShowRecord;

/*   


    const removeTag = async tag => {
        const index = newTag.indexOf(tag);
        newTag.splice(index, 1);
        setNewTag(newTag)
    }

            const contacts = []
        var i = 0
        for (i = 0; i<record.length; i++) 
            {
                contacts.push(String(record[i].chatId.split('@', 1)))
            }
            await edit ({ addContacts:contacts})
            console.log("contacts: " + contacts)   
            console.log("tag id: " + tagId)
            console.log("tag : " + tag)
*/
