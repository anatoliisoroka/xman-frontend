import React from 'react';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import ProgressButton from "../../Components/ProgressButton";

export default ({modalShow, setModalShow, modalTitle, handleSubmit}) => {

    return (
        <>                      
            <Modal
                show={modalShow}
                onHide={() => {
                        setModalShow(false);
                    }
                }
                centered
                dialogClassName="custom-modal-dialog-v3"
            >
                <Modal.Header
                    closeButton
                >
                    <h5>
                        {modalTitle}
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    <Container
                        className="broadcast-terms-container" 
                        fluid
                    >
                        <Row>
                            <h6>
                                To not getting blocked by WhatsApp, please careful when you use Xman’s Broadcast feature: 
                            </h6>
                        </Row>
                        <Row>
                            <h6>
                                1. not to send to contacts which doesn’t message with you before, where you can refer to Audience for the full analysis
                            </h6>
                        </Row>
                        <Row>
                            <h6>
                                2. keep a slow-normal speed to reduce risk of getting banned by WhatsApp (suggested 30-60 seconds between message)
                            </h6>
                        </Row>
                        <Row>
                            <h6>
                                3. Using Xman will not reduce your risk of getting banned by WhatsApp if your message is reported by your recipient(s) frequently. 
                            </h6>
                        </Row>
                        <br/>
                        <Row>
                            <Col
                                xs={6}
                                sm={{ span: 3, offset: 9 }}
                                md={{ span: 4, offset: 8 }}
                                lg={{ span: 3, offset: 9 }}
                                xl={{ span: 3, offset: 9 }}
                            >
                                <ProgressButton
                                    data-small
                                    onClick={handleSubmit}
                                    data-color='tertiary'
                                    className="custom-button"
                                >
                                    I Understand
                                </ProgressButton>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
            </Modal>
        </>
    )
}