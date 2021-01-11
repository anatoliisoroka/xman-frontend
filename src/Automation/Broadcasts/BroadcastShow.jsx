import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';

import Button from '../../Components/Button';
import BroadcastController from '../../Controllers/BroadcastController';
import { ReactComponent as LeftChevron } from '../../Images/LeftChevron.svg';
import LiveChatMessageView from "../../LiveChat/LiveChatMessageView";
import { constructPendingMessage } from '../../Controllers/Utils';
import { MessageTemplatesControllerContext } from "../../Controllers/MessageTemplatesController";
import BroadcastShowModal from './BroadcastShowModal';
import PhonePreview from '../../Components/PhonePreview'

/**
 * @param {function(string)} setView
 * @param {Object} campaign
 */
const BroadcastShow = ({ campaign, setView, campaigns, setCampaigns }) => {
    const broadcastController = new BroadcastController();
    const messageFlowController = useContext(MessageTemplatesControllerContext);
    const [data, setData] = useState();
    const [phoneMessage, setPhoneMessage] = useState(constructPendingMessage('', { text: '' }, '', false));
    const [messageFlow, setMessageTemplate] = useState();
    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState();
    const [modalData, setModalData] = useState();

    const getCampaignDetails = async () => {
        const campaignDetailsResponse = await broadcastController.getCampaignById(campaign.id);
        console.log(campaignDetailsResponse);
        if ('error' in campaignDetailsResponse) {
            setData(null);
        } else {
            setData(campaignDetailsResponse);
        }
    }

    useEffect(
        () => {
            getCampaignDetails();
        }, []
    )

    const handleBack = () => {
        setView('list');
    }

    useEffect(
        () => {
            getMessageTemplateToTheAPI(campaign.flow);
        }, []
    )

    const getMessageTemplateToTheAPI = async (flowId) => {
        const messageFlowResponse = await messageFlowController.getFlow(flowId);
        if (!messageFlowResponse || 'error' in messageFlowResponse) {
            setPhoneMessage(constructPendingMessage('', { text: '' }, '', false))
            setMessageTemplate({text: '', name: '', id: ''});
        } else {
            setPhoneMessage(constructPendingMessage('', messageFlowResponse, '', false));
            setMessageTemplate(messageFlowResponse);
        }
    }

    const handlePendingDetails = () => {
        setModalTitle('Campaign Details (Pending Status)')
        setModalData(data.pending);
        setModalShow(true);
    }

    const handleSentDetails = () => {
        setModalTitle('Campaign Details (Sent Status)')
        setModalData(data.sent);
        setModalShow(true);
    }

    const handleDeliveredDetails = () => {
        setModalTitle('Campaign Details (Delivered Status)')
        setModalData(data.delivered);
        setModalShow(true);
    }

    const handleFailedDetails = () => {
        setModalTitle('Campaign Details (Failed Status)')
        setModalData(data.failed);
        setModalShow(true);
    }

    const handleRevokedDetails = () => {
        setModalTitle('Campaign Details (Revoked Status)')
        setModalData(data.revoked);
        setModalShow(true);
    }

    return (
        <>
            <BroadcastShowModal
                modalTitle={modalTitle}
                modalData={modalData}
                modalShow={modalShow}
                setModalShow={setModalShow}

            />
            <Container
                className="broadcast-show-container"
                fluid
            >
                <Row>
                    <Col>
                        <div onClick={handleBack} className="broadcast-action-container">
                            <LeftChevron />
                            <Button
                                data-medium
                                variant={null}
                                onClick={handleBack}
                            >
                                Broadcast Dashboard
                            </Button>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} sm={12} md className="broadcast-show-content-container">
                        <Row
                            className="broadcast-show-content-title"
                        >
                            <Col>
                                <h4>
                                    {data ? data.name : 'N/A'}
                                </h4>
                            </Col>
                        </Row>
                        <hr></hr>
                        <Row
                            className="broadcast-show-content-row"
                        >
                            <Col>
                                <h6>
                                    Last Update
                                </h6>
                            </Col>
                            <Col>
                                {data ?  broadcastController.transformMillisecondsToDateString(data.updatedAt): 'N/A'}
                            </Col>
                        </Row>
                        <Row
                            className="broadcast-show-content-row"
                        >
                            <Col>
                                <h6>
                                    Scheduled At
                                </h6>
                            </Col>
                            <Col>
                                {data ?  broadcastController.transformMillisecondsToDateString(data.scheduledAt * 1000): 'N/A'}
                            </Col>
                        </Row>
                        <Row
                            className="broadcast-show-content-row"
                        >
                            <Col>
                                <h6>
                                    Message Template
                                </h6>
                            </Col>
                            <Col>
                                {messageFlow ? messageFlow.name : 'N/A'}
                            </Col>
                        </Row>
                        <Row
                            className="broadcast-show-content-row"
                        >
                            <Col>
                                <h6>
                                    Status
                                </h6>
                            </Col>
                            <Col>
                                {data ? data.state : 'N/A'}
                            </Col>
                        </Row>
                        <Row
                            className="broadcast-show-content-row"
                        >
                            <Col>
                                <h6>
                                    Campaign Count: 
                                </h6>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Table
                                    bordered
                                >
                                    <thead>
                                        <tr>
                                            <th>
                                                Status
                                            </th>
                                            <th>
                                                Count
                                            </th>
                                            <th>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <th>
                                                Pending
                                            </th>
                                            <td>
                                                {data ? data.pending?.length : 'N/A'}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-secondary"
                                                    hidden={!data || data.pending?.length <= 0 ? true : false}
                                                    onClick={handlePendingDetails}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>
                                                Sent
                                            </th>
                                            <td>
                                                {data ? data.sent?.length : 'N/A'}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-secondary"
                                                    hidden={!data || data.sent?.length <= 0 ? true : false}
                                                    onClick={handleSentDetails}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>
                                                Delivered
                                            </th>
                                            <td>
                                                {data ? data.delivered?.length : 'N/A'}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-secondary"
                                                    hidden={!data || data.delivered?.length <= 0 ? true : false}
                                                    onClick={handleDeliveredDetails}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>
                                                Failed
                                            </th>
                                            <td>
                                                {data ? data.failed?.length : 'N/A'}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-secondary"
                                                    hidden={!data || data.failed?.length <= 0 ? true : false}
                                                    onClick={handleFailedDetails}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Col>
                    <Col
                        className="d-none d-md-block"
                    >
                        <Row
                            className="justify-content-md-center"
                        >
                            Message Preview
                        </Row>
                        <PhonePreview
                            phoneMessage={phoneMessage}
                        />
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default BroadcastShow;