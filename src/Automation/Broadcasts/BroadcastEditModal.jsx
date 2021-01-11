import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Form, Modal } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { MessageTemplatesControllerContext } from "../../Controllers/MessageTemplatesController";
import ProgressButton from "../../Components/ProgressButton";
import { AlertCentralContext } from '../../Components/AlertCentral';
import MessageTemplatePicker from '../MessageTemplates/MessageTemplatePicker';
import BroadcastController from '../../Controllers/BroadcastController';
import LiveChatMessageView from "../../LiveChat/LiveChatMessageView";
import { constructPendingMessage } from '../../Controllers/Utils';
import BroadcastScheduleModal from './BroadcastScheduleModal';
import BroadcastAddRecipientsModal from './BroadcastAddRecipientsModal';
import './Broadcasts.css';
import TagPicker from '../../Audience/TagPicker';
import PhonePreview from '../../Components/PhonePreview'
import CheckBox from "../../Components/Checkbox";
import BroadcastTermsModal from './BroadcastTermsModal';

/**
 * @param {Object} campaign
 * @param {boolean} modalShow 
 * @param {function(boolean)} setModalShow
 * @param {string} modalTitle
 * @param {function(string)} setView
 * @param {function(Object)} setCampaigns
 * @param {Object} campaigns
 */
const BroadcastEditModal = ({ campaign, modalShow, setModalShow, modalTitle, setCampaigns, campaigns }) => {
    const jidExtension = '@s.whatsapp.net';
    const broadcastController = new BroadcastController();
    const alertCentral = useContext(AlertCentralContext);
    const animatedComponents = makeAnimated();

    const [scheduleModalShow, setScheduleModalShow] = useState(false);
    const [contactModalShow, setContactModalShow] = useState(false);
    const [termsModalShow, setTermsModalShow] = useState(false);
    const [selectedJidOptions, setSelectedJidOptions] = useState([]);
    const [messageFlow, setMessageTemplate] = useState();
    const [tag, setTag] = useState([]);
    const [tags, setTags] = useState (new Set([]));
    const [campaignTags, setCampaignTags] = useState ([]);
    const [campaignJids, setCampaignJids] = useState ([]);

    const [campaignName, setCampaignName] = useState();
    const [campaignSchedule, setCampaignSchedule] = useState(new Date());

    const [phoneMessage, setPhoneMessage] = useState(constructPendingMessage('', { text: '' }, '', false));

    const messageFlowController = useContext(MessageTemplatesControllerContext);
    const [broadcastSpeedOptions, setBroadcastSpeedOptions] = useState(broadcastController.getBroadcastSpeedList())
    const [selectedBroadcastSpeed, setSelectedBroadcastSpeed] = useState(broadcastSpeedOptions[2])
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [isCustom, setIsCustom] = useState(false)
    const [broadcastSpeed, setBroadcastSpeed] = useState(60)
    const [isChecked, setIsChecked] = useState(false)

    const getCampaignFullDetails = async () => {
        const campaignDetailsResponse = await broadcastController.getCampaignById(campaign.id);
        if ('error' in campaignDetailsResponse) {
            console.log('error');
        } else {
            setCampaignName(campaignDetailsResponse?.name);
            setMessageTemplate(campaignDetailsResponse?.flow);
            setCampaignSchedule(campaignDetailsResponse?.scheduledAt && campaignDetailsResponse?.scheduledAt !== 0 ? new Date(campaignDetailsResponse?.scheduledAt * 1000) : new Date());
            getMessageTemplateToTheAPI(campaignDetailsResponse?.flow);
            setCampaignTags(campaignDetailsResponse.recipientTags)
            setTags(new Set(campaignDetailsResponse.recipientTags))
            const jids = []
            broadcastController.getBroadcastStates().forEach(
                (state, idx) => {
                    campaignDetailsResponse[state].forEach(
                        (data, idx2) => {
                            if (data.tag === null) {
                                jids.push(data.recipient?.replace(jidExtension, ''))
                            }

                        }
                    )
                }
            )
            setCampaignJids(Array.from(new Set(jids)))
            setSelectedJidOptions(Array.from(new Set(jids.map(jid => ({value: jid, label: jid})))))
            const d = broadcastSpeedOptions.filter( item => item.value === campaignDetailsResponse?.sendInterval)
            setSelectedBroadcastSpeed(d.length > 0 ? d[0] : broadcastSpeedOptions.find(item => item.value === -1))
            setBroadcastSpeed(campaignDetailsResponse?.sendInterval)
            setIsCustom(d.length === 0)
        }
    }

    useEffect(
        () => {
            if (campaign && modalShow) {
                getCampaignFullDetails();
            }
        }, [modalShow]
    );

    const changeMessageTemplate = (value) => {
        setMessageTemplate(value);
        getMessageTemplateToTheAPI(value);
    }

    const addTag = newTag => {
        setTag(tag.concat(newTag))
    }

    const removeTag = targetTag => {
        const index = tag.indexOf(targetTag);
        tag.splice(index, 1);
        setTag(tag)
    }

    const resetValues = () => {
        setCampaignName();
        setCampaignSchedule(new Date());
        setPhoneMessage(constructPendingMessage('', { text: '' }, '', false))
        setMessageTemplate();
        setSelectedBroadcastSpeed(broadcastSpeedOptions.filter(s => s.value === 60))
        setCampaignTags([])
        setTags([])
        setTag([])
        setSelectedJidOptions([])
        setBroadcastSpeed(60)
        setIsCustom(false)
        setIsChecked(false)
    }

    const validateFields = () => {
        if (!campaignName) {
            alertCentral.error("Campaign Name is required.", 3000);
            return false;
        }
        if (!messageFlow) {
            alertCentral.error("The message you want to deliver is required.", 3000);
            return false;
        }

        if (isNaN(selectedBroadcastSpeed.value)) {
            alertCentral.error("Broadcast Speed must be a number", 3000);
            return false;
        }

        if (selectedBroadcastSpeed.value === -1) {
            if (broadcastSpeed < 5 || broadcastSpeed > 300) {
                alertCentral.error("Custom Broadcast Speed must have the value from [5-300] seconds", 3000);
                return false;
            }
        }

        if (broadcastSpeed < 0 || broadcastSpeed > 300) {
            alertCentral.error("Broadcast Speed must have the value from [0-300] seconds", 3000);
            return false;
        }

        if (!isChecked) {
            alertCentral.error("Campaign's Terms and Conditions must be read and understand", 3000);
            return false;
        }

        return true;
    }

    const handleSubmitScheduled = async () => {
        var schedule = null;
        
        if (!validateFields()) {
            return;
        }
        
        const tagList = Array.from(tags)
        const addTags = Array.from(new Set(tagList.filter(tag => campaignTags.indexOf(tag) < 0)))
        const removeTags = Array.from(new Set(campaignTags.filter( tag => tagList.indexOf(tag) < 0)))
        const jidList = Array.from(
            new Set(
                selectedJidOptions?.map(
                    jidOption => {
                        return jidOption.value
                    }
                )
            )
        )

        const addJids = Array.from(new Set(jidList.filter(jid => campaignJids.indexOf(jid)).map(jid => `${jid}${jidExtension}`)))
        const removeJids = Array.from(new Set(campaignJids.filter( jid => jidList.indexOf(jid) < 0).map(jid => `${jid}${jidExtension}`)))

        schedule = new Date(campaignSchedule).getTime() / 1000;

        const response = await broadcastController.updateCampaignById(
            campaign.id,
            {
                "name": campaignName,
                "scheduledAt": schedule,
                "sendInterval": parseInt(broadcastSpeed),
                "flow": messageFlow,
                "addTags": addTags,
                "removeTags": removeTags,
                "addJids": addJids,
                "removeJids": removeJids
            }
        );

        if (response.status == 204) {
            alertCentral.show("Campaign is successfully updated.", 3000);
            const campaignIndex = campaigns.findIndex(item => item.id == campaign.id);
            campaigns[campaignIndex].name = campaignName;
            campaigns[campaignIndex].scheduledAt = schedule;
            campaigns[campaignIndex].flow = messageFlow;
            campaigns[campaignIndex].sendInterval = parseInt(broadcastSpeed);
            campaigns[campaignIndex].state = "scheduled";

            setCampaigns(campaigns);
            resetValues();
            setScheduleModalShow(false);
            setModalShow(false);
        } else {
            alertCentral.error(response.statusText, 3000);
        }
    }

    const handleSubmitSendNow = async () => {
        var schedule = null;
        
        if (!validateFields()) {
            return;
        }
        
        const tagList = Array.from(tags)
        const addTags = Array.from(new Set(tagList.filter(tag => campaignTags.indexOf(tag) < 0)))
        const removeTags = Array.from(new Set(campaignTags.filter( tag => tagList.indexOf(tag) < 0)))
        const jidList = Array.from(
            new Set(
                selectedJidOptions?.map(
                    jidOption => {
                        return jidOption.value
                    }
                )
            )
        )

        const addJids = Array.from(new Set(jidList.filter(jid => campaignJids.indexOf(jid)).map(jid => `${jid}${jidExtension}`)))
        const removeJids = Array.from(new Set(campaignJids.filter( jid => jidList.indexOf(jid) < 0).map(jid => `${jid}${jidExtension}`)))

        const response = await broadcastController.updateCampaignById(
            campaign.id,
            {
                "name": campaignName,
                "scheduledAt": schedule,
                "sendInterval": parseInt(selectedBroadcastSpeed.value),
                "flow": messageFlow,
                "addTags": addTags,
                "removeTags": removeTags,
                "addJids": addJids,
                "removeJids": removeJids
            }
        );

        if (response.status == 204) {
            alertCentral.show("Campaign is successfully updated.", 3000);
            const campaignIndex = campaigns.findIndex(item => item.id == campaign.id);
            campaigns[campaignIndex].name = campaignName;
            campaigns[campaignIndex].scheduledAt = schedule;
            campaigns[campaignIndex].flow = messageFlow;
            campaigns[campaignIndex].sendInterval = parseInt(selectedBroadcastSpeed.value);
            const responseStart = await broadcastController.actionCampaign('start', campaign.id);
            if (responseStart.status == 202) {
                campaigns[campaignIndex].state = "progress";
            } else {
                alertCentral.error(response.message, 3000);
                campaigns[campaignIndex].state = "inactive";
            }

            setCampaigns(campaigns);
            resetValues();
            setScheduleModalShow(false);
            setModalShow(false);
        } else {
            alertCentral.error(response.statusText, 3000);
        }
    }

    const getMessageTemplateToTheAPI = async (flowId) => {
        const messageFlowResponse = await messageFlowController.getFlow(flowId);
        if (!messageFlowResponse || 'error' in messageFlowResponse) {
            setPhoneMessage(constructPendingMessage('', { text: '' }, '', false))
        } else {
            setPhoneMessage(constructPendingMessage('', messageFlowResponse, '', false));
        }
    }

    const handleReadTerms = () => {
        if (!isChecked) {
            // call the read terms modal
            setTermsModalShow(true)
        } else {
            setIsChecked(false)
        }
    }

    const handleUnderstandTerms = () => {
        setIsChecked(true)
        setTermsModalShow(false)
    }

    return (
        <>
            <BroadcastScheduleModal
                modalShow={scheduleModalShow}
                setModalShow={setScheduleModalShow}
                modalTitle="Campaign Schedule"
                handleSubmit={handleSubmitScheduled}
                campaignSchedule={campaignSchedule}
                setCampaignSchedule={setCampaignSchedule}
                centered
            />
            <BroadcastAddRecipientsModal
                modalShow={contactModalShow}
                setModalShow={() => {
                        setContactModalShow(false);
                    }
                }
                modalTitle="Add Recipients"
                setSelectedJidOptions={setSelectedJidOptions}
                selectedJidOptions={selectedJidOptions}
                centered
            />
            <BroadcastTermsModal
                modalShow={termsModalShow}
                setModalShow={() => {
                    setTermsModalShow(false);
                }
                }
                modalTitle="Campaign's Terms and Conditions"
                handleSubmit={handleUnderstandTerms}
                centered
            />
            <Modal
                show={modalShow}
                onHide={
                    () => {
                        resetValues();
                        setScheduleModalShow(false);
                        setModalShow(false);
                    }
                }
                dialogClassName="custom-modal-dialog-v2"
                centered
            >
                <Modal.Header
                    closeButton
                >
                    <Form.Control
                        required
                        placeholder="Enter your campaign name"
                        value={campaignName}
                        onChange={
                            event => {
                                setCampaignName(event.target.value);
                            }
                        }
                        className="common-field"
                    >
                </Form.Control>
                </Modal.Header>
                <Modal.Body>
                    <Container
                        className="broadcast-add-container"
                        fluid
                    >
                        <Row>
                            <Col xs={12} sm={12} md className="broadcast-add-form-container">
                                <Form>
                                    <Form.Row>
                                        <Col>
                                            <Form.Group>
                                                <Form.Label>
                                                    The message you want to deliver*
                                                </Form.Label>
                                                <MessageTemplatePicker
                                                    drop='down'
                                                    selected={messageFlow}
                                                    setSelected={changeMessageTemplate}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Form.Row>
                                    <Form.Group
                                        className="d-block d-md-none"
                                    >
                                        <Form.Label>
                                            Message Preview
                                        </Form.Label>
                                        <Form.Row
                                            className="common-field message-container-secondary"
                                        >
                                            <Col>
                                                <LiveChatMessageView 
                                                    editable={false} 
                                                    parseTemplate={true} 
                                                    message={phoneMessage}
                                                />
                                            </Col>
                                        </Form.Row>
                                    </Form.Group>
                                    <Form.Row>
                                        <Col>
                                            
                                            <Form.Group>
                                                <Form.Label>
                                                    Target Audience
                                                </Form.Label>
                                                <TagPicker 
                                                    maxSelectableTag={5}
                                                    selectedTags={tags} 
                                                    setSelectedTags={setTags} 
                                                    addedTag={addTag} 
                                                    removedTag={removeTag}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Form.Row>
                                    <Form.Group>
                                        <Form.Label>
                                            Additional Target Audience
                                        </Form.Label>
                                        <Form.Row>
                                            <Select
                                                isMulti
                                                className="common-field"
                                                components={animatedComponents}
                                                onMenuOpen={
                                                    () => {
                                                        setContactModalShow(true);
                                                    }
                                                }
                                                value={selectedJidOptions}
                                                onChange={
                                                    (values, actionMeta) => {
                                                        //create-option
                                                        //select-option
                                                        //remove-value
                                                        switch(actionMeta.action) {
                                                            case 'remove-value':
                                                                setSelectedJidOptions(
                                                                    selectedJidOptions.filter(
                                                                        jid => jid.value != actionMeta.removedValue.value
                                                                    )
                                                                )
                                                                break;
                                                        }
                                                    }
                                                }
                                            />
                                        </Form.Row>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>
                                            Broadcast Speed*
                                        </Form.Label>
                                        <Form.Row>
                                            <Select
                                                className="common-field"
                                                components={animatedComponents}
                                                value={selectedBroadcastSpeed}
                                                options={broadcastSpeedOptions}
                                                onChange={
                                                    (values, actionMeta) => {
                                                        setSelectedBroadcastSpeed(values);
                                                        if (values.value === -1) {
                                                            setBroadcastSpeed(60)
                                                            setIsCustom(true)
                                                        } else {
                                                            setIsCustom(false)
                                                            setBroadcastSpeed(values.value)
                                                        }
                                                    }
                                                }
                                                onMenuOpen={
                                                    () => {
                                                        setIsSelectOpen(true)
                                                    }
                                                }
                                                onMenuClose={
                                                    () => {
                                                        setIsSelectOpen(false)
                                                    }
                                                }
                                            />
                                        </Form.Row>
                                    </Form.Group>
                                    {
                                        isCustom &&
                                        <Form.Group>
                                            <Form.Label>
                                                Custom Broadcast Speed (5 - 300)*
                                            </Form.Label>
                                            <Form.Control
                                                required
                                                placeholder="Enter the custom broadcast speed"
                                                onChange={
                                                    event => {
                                                        setBroadcastSpeed(event.target.value);
                                                    }
                                                }
                                                value={broadcastSpeed}
                                                className="common-field"
                                            >
                                            </Form.Control>
                                            <Form.Control.Feedback type="invalid">
                                                The campaign name is required.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    }
                                    <Form.Row
                                        className="broadcast-terms-check-row"
                                    >
                                        <CheckBox
                                            checked={isChecked}
                                            setChecked={handleReadTerms}
                                        />&emsp;I understand the campaign's terms and conditions
                                    </Form.Row>
                                    <Form.Row hidden={isSelectOpen}>
                                        <Col
                                            xs={6}
                                            sm={{ span: 3, offset: 6 }}
                                            md={{ span: 3, offset: 4 }}
                                            lg={{ span: 3, offset: 6 }}
                                            xl={{ span: 3, offset: 6 }}
                                        > 
                                            <ProgressButton
                                                data-small 
                                                onClick={
                                                    () => {
                                                        setScheduleModalShow(true);
                                                    }
                                                }
                                                data-color='tertiary'
                                                className="custom-button"
                                            >
                                                Schedule
                                            </ProgressButton>
                                        </Col>
                                        <Col
                                            xs={6}
                                            sm={3}
                                            md={4}
                                            lg={3}
                                            xl={3}
                                        >
                                            <ProgressButton
                                                data-small 
                                                onClick={handleSubmitSendNow}
                                                data-color='tertiary'
                                                className="custom-button"
                                            >
                                                Send Now
                                            </ProgressButton>
                                        </Col>
                                    </Form.Row>
                                </Form>
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
                </Modal.Body>
            </Modal>
        </>
    )
}

export default BroadcastEditModal;