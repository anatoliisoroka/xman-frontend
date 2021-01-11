import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Form, Modal, Table } from 'react-bootstrap';
import * as CSV from 'csv-string'
import { AlertCentralContext } from '../../Components/AlertCentral';
import './Broadcasts.css';
import { FileUploadButton } from '../../LiveChat/NewMessageBox';
import ContactFinder from "../../LiveChat/ContactFinder";
import ProgressButton from "../../Components/ProgressButton";
import UtilitiesController from "../../Controllers/UtilitiesController";

const BroadcastAddRecipientsModal = ({modalShow, setModalShow, modalTitle, setSelectedJidOptions, selectedJidOptions}) => {
    const jidExtension = '@s.whatsapp.net';
    const alertCentral = useContext (AlertCentralContext);
    const [fileData, setFileData] = useState();
    const [column, setColumn] = useState();
    var rowCtr = -1;
    var colCtr = -1;
    const utils = new UtilitiesController();
    const [selectingContact, setSelectingContact] = useState(false)

    const importCSV = file => {        
        setFileData([]);

        const fr = new FileReader()
        fr.onload = () => { 
            const arr = CSV.parse (fr.result)
            if (arr.length <= 0) {
                
                alertCentral.error ('The file doesn\'t have any data inside.', 3500);
                return;
            }
            rowCtr = 0;

            setFileData(arr);
        } 
        fr.readAsText(file)
    }

    const onSelectedJid = (jid) => {
        const isIncluded = selectedJidOptions.filter(
            item => item.value == jid?.replace(jidExtension, '')
        );
        
        if (isIncluded.length <= 0) {
            setSelectedJidOptions(selectedJidOptions.concat({value: jid?.replace(jidExtension, ''), label: jid?.replace(jidExtension, '')}));
        }
        
        setModalShow(false);
    }

    const resetValues = () => {
        rowCtr = -1;
        colCtr = -1;
        setColumn();
        setFileData([]);
    }

    const addRecipient = async () => {
        const jidList = [];
        fileData.map(
            item => {
                if (item[column].replace (/[^0-9]/g, '') !== '' && item[column] !== '') {
                    jidList.push({value: item[column].replace (/[^0-9]/g, ''), label: item[column].replace (/[^0-9]/g, '')});
                }
            }
        );

        const iterations = Math.ceil(jidList.length / 30);

        for (var i = 0; i < iterations; i++) {
            selectedJidOptions = utils.getUniqueArrayItem(jidList.slice(i * 30, (i + 1) * 30).concat(selectedJidOptions), it => it.value);
            setSelectedJidOptions (
                selectedJidOptions
            );
            
            await utils.sleep(100);
        }

        setModalShow(false);
    }

    useEffect(
        () => {
            if (modalShow) {
                resetValues();
            }
        }, [modalShow]
    )

    return (
        <>                      
            <Modal
                show={modalShow}
                onHide={() => {
                        resetValues();
                        setModalShow(false);
                    }
                }
                dialogClassName="custom-modal-dialog-v3"
                centered
            >
                <Modal.Header
                    closeButton
                >
                    <h4>
                        {modalTitle}
                    </h4>
                </Modal.Header>
                <Modal.Body>
                    <Container
                        className="broadcast-add-container" 
                        fluid
                    >
                        <Row>
                            <Col>
                                <Form>
                                    <Form.Row>
                                        <ContactFinder
                                            allowCreate
                                            onSelectedContact={ ({ phone }) => onSelectedJid(`${phone}@s.whatsapp.net`)}
                                            setSelectingContact={setSelectingContact}
                                        />
                                    </Form.Row>
                                    <Form.Row>
                                        <p
                                            className="centered-component add-recipients-p"
                                        >
                                            - or add recipients via file upload -
                                        </p>
                                    </Form.Row>

                                    <Form.Row>
                                        <div
                                            className="center-content-container"
                                        >
                                            <FileUploadButton
                                                className="center-content button-csv-upload" 
                                                multiple={false} 
                                                onSelected={([file]) => importCSV(file)}
                                            >
                                                Upload CSV File
                                            </FileUploadButton>
                                        </div>
                                    </Form.Row>
                                    {
                                        fileData?.length > 0 && <>
                                            <br></br>
                                            <Form.Row>
                                                <h5>
                                                    File Preview
                                                </h5>
                                                <Form.Text>
                                                    Kindly select the column for phone number. All phone numbers should have a country code (e.g. 85xxxxxxxxxx) to successfully add to the recipients field and ensure to send them the campaign.
                                                </Form.Text>
                                            </Form.Row>
                                            <br></br>
                                        </>
                                    }
                                    <Form.Row>
                                        <Table
                                            bordered
                                            responsive
                                        >
                                            <tbody>
                                                {
                                                    fileData?.length > 0 && 
                                                    <tr>
                                                        {
                                                            fileData[0]?.map(
                                                                d => {
                                                                    colCtr++;
                                                                    return <td
                                                                    >


                                                                        <Form.Check
                                                                            type="radio"
                                                                            id="radio-id"
                                                                            name="radio-header"
                                                                            value={colCtr}
                                                                            size="lg"
                                                                            onChange={
                                                                                e => {
                                                                                    setColumn(e.target.value);
                                                                                }
                                                                            }
                                                                        />
                                                                    </td>
                                                                }
                                                            )
                                                        }
                                                    </tr>
                                                }
                                                {
                                                    fileData?.map(
                                                        data => {
                                                            if (rowCtr > 3) {
                                                                return;
                                                            } else {
                                                                rowCtr++;
                                                                return <tr>
                                                                    {
                                                                        data.map(
                                                                            d => <td>{d}</td>
                                                                        )
                                                                    }
                                                                </tr>
                                                            }
                                                        }
                                                    )
                                                }
                                            </tbody>
                                        </Table>
                                    </Form.Row>
                                    {
                                        column && <Form.Row>
                                            <Col
                                                sm={{offset:8, span: 4}}
                                                md={{offset:8, span: 4}}
                                            >
                                                <div
                                                    className="center-content-container"
                                                >
                                                    <ProgressButton
                                                        className="right-content"
                                                        onClick={addRecipient}
                                                    >
                                                        Add to Recipients
                                                    </ProgressButton>
                                                </div>
                                            </Col>
                                        </Form.Row>
                                    }
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default BroadcastAddRecipientsModal;