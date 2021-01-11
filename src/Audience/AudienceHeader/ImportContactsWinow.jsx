import React, {useContext, useEffect, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'
import { Card, Form, FormCheck } from "react-bootstrap";
import { AlertCentralContext } from '../../Components/AlertCentral';
import ProgressButton from '../../Components/ProgressButton';
import { AudienceStoreContext } from '../../Controllers/AudienceStore';
import * as CSV from 'csv-string'
import { FileUploadButton } from '../../LiveChat/NewMessageBox';

export default ({ showModal, noModal }) => {
    const alerts = useContext (AlertCentralContext)
    const { importContactsCSV } = useContext (AudienceStoreContext)

    const [options, setOptions] = useState ({ nameColumn: 'name', phoneColumn: 'phone', tagsColumn: 'tags' })
    const [file, setFile] = useState (undefined)
    const [columns, setColumns] = useState (['name', 'phone', 'No tags'])

    const setCSV = file => {
        //if (!file.type || !file.type.endsWith('csv')) return alerts.error (`The file must be a CSV, you pasted a ${file.type} file`, 3500)

        const fr = new FileReader()
        fr.onload = () => { 
            const arr = CSV.parse (fr.result)
            setColumns (arr[0])
            setOptions (
                {
                    // try to find name column
                    nameColumn: arr[0].find (v => v.toLowerCase().includes('name')) || arr[0][0],
                    // try to find phone column
                    phoneColumn: arr[0].find (v => v.toLowerCase().includes('phone')) || arr[0][1],
                    // try to find tag column
                    tagsColumn: arr[0].find (v => v.toLowerCase().includes('tag')) || arr[0][2]
                }
            )
        } 
        fr.readAsText(file)

        setFile (file)
    }
    
    const save = async () => {
        if (!file) return alerts.error ('Please specify a CSV!')
        await importContactsCSV (file, options)
        
        alerts.show ('Imported contacts successfully!', 3000)

        noModal ()
    }

    return(
        <Modal show={showModal} onHide={noModal} centered className='import-modal'>
            <Modal.Header>Import CSV</Modal.Header>
            <Modal.Body>
                <FileUploadButton data-color='secondary' onSelected={ ([file]) => setCSV(file) } multiple={false}>
                    Upload (or paste CSV)
                    {
                        file && (
                            <>
                            <br/>
                            <font className='selected-file'>
                                Selected: { file.name }
                            </font>
                            </>
                        )
                    }
                </FileUploadButton>

                <Form>
                    {
                        Object.keys (options).map (key => (
                            <>
                                <Form.Text className="settings-prompt">Column for contact {key.replace('Column', '')}</Form.Text>
                                <Form.Control 
                                    as="select" 
                                    value={options[key]} 
                                    onChange={e => setOptions({ options, [key]: e.target.value})}>
                                    { 
                                        (key === 'tagsColumn' ? ['No tags', ...columns] : columns).map (column => <option key={column}>{column}</option>) 
                                    }
                                </Form.Control>
                                <br/>
                            </>
                        ))
                    }
                </Form>
                
                <ProgressButton onClick={save} data-color="secondary" className="account-save" >Import</ProgressButton>
            </Modal.Body>
        </Modal>
    )
}