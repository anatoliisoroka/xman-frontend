import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, Modal, Button } from 'react-bootstrap';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { MessageTemplatesControllerContext } from "../../Controllers/MessageTemplatesController";
import ProgressButton from "../../Components/ProgressButton";
import { AlertCentralContext } from '../../Components/AlertCentral';
import TagPicker from '../../Audience/TagPicker';
import MessageTemplatePicker from '../MessageTemplates/MessageTemplatePicker';
import BroadcastController from '../../Controllers/BroadcastController';
import { constructPendingMessage } from '../../Controllers/Utils';
import './Broadcasts.css';
import BroadcastAddRecipientsModal from './BroadcastAddRecipientsModal';
import BroadcastScheduleModal from './BroadcastScheduleModal';
import BroadcastTermsModal from './BroadcastTermsModal';
import { FirebaseContext } from "./../../Firebase"
import PhonePreview from '../../Components/PhonePreview'
import { ReactComponent as ArrowDown } from '../../Images/down-chevron.svg'
import { ReactComponent as ArrowUp } from '../../Images/up-chevron.svg'
import LiveChatMessageView from "../../LiveChat/LiveChatMessageView";
import CheckBox from "../../Components/Checkbox";

/**
 * @param {boolean} modalShow 
 * @param {function(boolean)} setModalShow
 * @param {string} modalTitle
 * @param {function(Object)} setCampaigns
 * @param {Object} campaigns
 */
const BroadcastAddModal = ({ modalShow, setModalShow, modalTitle, setCampaigns, campaigns }) => {
    const jidExtension = '@s.whatsapp.net';
    const broadcastController = new BroadcastController();
    const alertCentral = useContext(AlertCentralContext);
    const animatedComponents = makeAnimated();
    const [contactModalShow, setContactModalShow] = useState(false);
    const [scheduleModalShow, setScheduleModalShow] = useState(false);
    const [termsModalShow, setTermsModalShow] = useState(false);
    const [selectedJidOptions, setSelectedJidOptions] = useState([]);
    const { analytics } = useContext(FirebaseContext)
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [isChecked, setIsChecked] = useState(false)

    const [messageFlow, setMessageTemplate] = useState();
    const [tag, setTag] = useState([]);
    const [tags, setTags] = useState(new Set([]));

    const [campaignName, setCampaignName] = useState("Give me (this campaign) a name please ^^");
    const [campaignSchedule, setCampaignSchedule] = useState(new Date());

    const [phoneMessage, setPhoneMessage] = useState(constructPendingMessage('', { text: '' }, '', false));

    const [broadcastSpeedOptions, setBroadcastSpeedOptions] = useState(broadcastController.getBroadcastSpeedList())
    const d = broadcastSpeedOptions.filter(item => item.value === 60)
    const [selectedBroadcastSpeed, setSelectedBroadcastSpeed] = useState(d.length > 0 ? d[0] : broadcastSpeedOptions[0])
    const [isCustom, setIsCustom] = useState(false)
    const [broadcastSpeed, setBroadcastSpeed] = useState(60)
    const [isOpenAdditionalSettings, setIsOpenAdditionalSettings] = useState(false)

    const messageFlowController = useContext(MessageTemplatesControllerContext);

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
        setCampaignName("Give me (this campaign) a name please ^^");
        setCampaignSchedule(new Date());
        setMessageTemplate();
        setSelectedJidOptions([]);
        setTag([]);
        setTags(new Set([]));
        setSelectedBroadcastSpeed(broadcastSpeedOptions[2])
        setBroadcastSpeed(60)
        setIsCustom(false)
        setIsChecked(false)

        setPhoneMessage(constructPendingMessage('', { text: '' }, '', false));
    }

    const validateFields = () => {
        if (!campaignName) {
            alertCentral.error("Campaign Name is required.", 3000);
            return false;
        }
        if (!messageFlow) {
            alertCentral.error("Message template is required.", 3000);
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

    const handleSubmitSendNow = async () => {
        var schedule = null;

        if (!validateFields()) {
            return;
        }

        const recipientTags = Array.from(tags);

        var response = await broadcastController.createCampaign(
            {
                "name": campaignName,
                "scheduledAt": schedule,
                "sendInterval": parseInt(broadcastSpeed),
                "flow": messageFlow,
                "recipientTags": recipientTags,
                "recipientJids": Array.from(
                    new Set(
                        selectedJidOptions?.map(
                            jidOption => {
                                return `${jidOption.value}${jidExtension}`
                            }
                        )
                    )
                )
            }
        );

        if ('error' in response) {
            alertCentral.error(response.message, 3000);
        } else {
            alertCentral.show("Campaign is successfully created.", 3000);

            analytics.logEvent('broadcast_scheduled')
            resetValues();

            const responseStart = await broadcastController.actionCampaign('start', response.id);
            if (responseStart.status === 202) {
                response.state = 'progress';
                setModalShow(false);
            } else {
                response.state = 'inactive';
                alertCentral.error(response.message, 3000);
            }

            setCampaigns([response, ...campaigns]);
            setScheduleModalShow(false);
            setModalShow(false);
        }
    }

    const handleSubmitScheduled = async () => {
        var schedule = null;

        if (!validateFields()) {
            return;
        }

        const recipientTags = Array.from(tags);


        if (!campaignSchedule) {
            alertCentral.error("Campaign Schedule is required.", 3000);
            return;
        }

        schedule = new Date(campaignSchedule).getTime() / 1000;

        var response = await broadcastController.createCampaign(
            {
                "name": campaignName,
                "scheduledAt": schedule,
                "sendInterval": parseInt(broadcastSpeed),
                "flow": messageFlow,
                "recipientTags": recipientTags,
                "recipientJids": Array.from(
                    new Set(
                        selectedJidOptions?.map(
                            jidOption => {
                                return `${jidOption.value}${jidExtension}`
                            }
                        )
                    )
                )
            }
        );

        if ('error' in response) {
            alertCentral.error(response.message, 3000);
        } else {
            alertCentral.show("Campaign is successfully scheduled.", 3000);

            resetValues()

            setCampaigns([response, ...campaigns]);
            setScheduleModalShow(false);
            setModalShow(false);
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
                onHide={() => {
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
                        onChange={
                            event => {
                                setCampaignName(event.target.value);
                            }
                        }
                        value={campaignName}
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
                                    <Form.Row
                                        className="additional-settings"
                                    >
                                        <Col>
                                            <Form.Label>
                                                Additional Settings
                                            </Form.Label>
                                        </Col>
                                        <Col>
                                            <Button variant='transparent' className='show-button' onClick={
                                                () => 
                                                    {
                                                        setIsOpenAdditionalSettings(!isOpenAdditionalSettings)
                                                        setSelectedJidOptions([]);
                                                        setBroadcastSpeed(60)
                                                        setIsCustom(false)
                                                    }
                                                }
                                            >
                                                
                                                {
                                                    isOpenAdditionalSettings ? <ArrowUp/> : <ArrowDown />
                                                }
                                            </Button>
                                        </Col>
                                    </Form.Row>
                                    {
                                        isOpenAdditionalSettings &&
                                        <>
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
                                                                switch (actionMeta.action) {
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
                                        </>
                                    }
                                    <Form.Row
                                        className="broadcast-terms-check-row"
                                    >
                                        <CheckBox
                                            checked={isChecked}
                                            setChecked={handleReadTerms}
                                        />&emsp;I understand the campaign's terms and conditions
                                    </Form.Row>
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
                                    <Form.Row hidden={isSelectOpen}>
                                        <Col
                                            xs={6}
                                            sm={{ span: 3, offset: 6 }}
                                            md={{ span: 4, offset: 4 }}
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

export default BroadcastAddModal;