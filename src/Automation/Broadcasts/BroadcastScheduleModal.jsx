import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { setMinutes, setHours } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import './Broadcasts.css';
import ProgressButton from "../../Components/ProgressButton";

const BroadcastScheduleModal = ({modalShow, setModalShow, modalTitle, handleSubmit, campaignSchedule, setCampaignSchedule}) => {

    const [minTime, setMinTime] = useState(setHours(setMinutes(new Date(), new Date().getMinutes()), new Date().getHours()));
    const [maxtime, setMaxTime] = useState(setHours(setMinutes(new Date(), 59), 23));

    return (
        <>                      
            <Modal
                show={modalShow}
                onHide={() => {
                        setModalShow(false);
                    }
                }
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
                                        <div
                                            className="date-picker-container"
                                        >
                                            <DatePicker
                                                selected={campaignSchedule}
                                                onSelect={
                                                    values => {
                                                        const today = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
                                                        const selectedDate = `${values.getFullYear()}-${values.getMonth()}-${values.getDate()}`;
                                                        if (today == selectedDate) {
                                                            setMinTime(setHours(setMinutes(new Date(), new Date().getMinutes()), new Date().getHours()));
                                                            setMaxTime(setHours(setMinutes(new Date(), 59), 23));
                                                        } else {
                                                            setMinTime(setHours(setMinutes(new Date(), 0), 0));
                                                            setMaxTime(setHours(setMinutes(new Date(), 59), 23));
                                                        }
                                                    }
                                                }
                                                onChange={setCampaignSchedule}
                                                showTimeSelect
                                                timeFormat="HH:mm"
                                                timeIntervals={1}
                                                timeCaption="time"
                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                className="common-field"
                                                minDate={new Date()}
                                                minTime={minTime}
                                                maxTime={maxtime}
                                            />
                                        </div>
                                    </Form.Row>
                                    <br></br>
                                    <Form.Row>
                                        <Col
                                            xs={6}
                                            sm={{ span: 3, offset: 9 }}
                                            md={{ span: 3, offset: 9 }}
                                            lg={{ span: 3, offset: 9 }}
                                            xl={{ span: 3, offset: 9 }}
                                        >
                                            <ProgressButton
                                                data-small 
                                                onClick={handleSubmit}
                                                data-color='tertiary'
                                                className="custom-button"
                                            >
                                                Confirm
                                            </ProgressButton>
                                        </Col>
                                    </Form.Row>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default BroadcastScheduleModal;