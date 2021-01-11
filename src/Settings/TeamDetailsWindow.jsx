import React, {useEffect, useState, useContext} from 'react';
import { Button, Row, Col, Modal, Spinner, Form, InputGroup } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import AuthController from '../Controllers/AuthController';
import TeamMemberItem from './TeamMemberItem';
import './TeamDetailsWindow.css';
import { AlertCentralContext } from '../Components/AlertCentral';
import ProgressButton from '../Components/ProgressButton';
import copy from "copy-to-clipboard";
import Switch from '../Components/Switch';
import UtilitiesController from '../Controllers/UtilitiesController';
import TeamManagementController from '../Controllers/TeamManagementController';
import TeamAddMemberForm from './TeamAddMemberForm';

export default props => {
	const teamManagementController = new TeamManagementController();
    const utils = new UtilitiesController();
    const alertCentral = useContext(AlertCentralContext);
    const authController = new AuthController();
    const [defaultTeam, setDefaultTeam] = useState({});
    const [members, setMembers] = useState([]);
    const [inviteLink, setInviteLink] = useState();
    const [isFetching, setIsFetching] = useState(false);
    const [copyText, setCopyText] = useState('Copy');
    const [isShowInviteLink, setIsShowInviteLink] = useState(false);
    const [isShowResetInviteLink, setIsResetInviteLink] = useState(false);
    const [isLinkSharingEnabled, setIsLinkSharingEnabled] = useState(false);
    const [isShowLinkSharing, setIsShowLinkSharing] = useState(false);
    const [isShowAddMemberButton, setIsShowAddMemberButton] = useState(false);
    const [isShowAddMemberForm, setIsShowAddMemberForm] = useState(false);
    const [isEnabling, setIsEnabling] = useState(false);

    const [hasMore, setHasMore] = useState(true);
    const [limit, setLimit] = useState(30);
    const [offset, setOffset] = useState(0);
    const [userDetails, setUserDetails] = useState({});
    const [teamName, setTeamName] = useState("");
    const [mail, setMail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [notifyEmail, setNotifyEmail] = useState(false);
    const [notifyNumber, setNotifyNumber] = useState(false);

    //scopes list
    const [scopeList, setScopeList] = useState(authController.scopes());

    const load = async() => {
        const dt = await teamManagementController.fetchDefaultTeam();
        if(scopeList.indexOf('TEAM_LINK_READ_ASSIGNED') >= 0) {
            setIsShowInviteLink(true);
        }

        if(scopeList.indexOf('TEAM_LINK_UPDATE_ASSIGNED') >= 0) {
            setIsResetInviteLink(true);
            setIsShowLinkSharing(true);
        }

        if(scopeList.indexOf('MEMBER_CREATE_ASSIGNED') >= 0) {
            setIsShowAddMemberButton(true);
        }

        setTeamName(dt.team.name)
        setMail(dt.team.emailAddress)
        setWhatsapp(dt.team.contactNumber)
        setNotifyEmail(dt.team.isNotifyEmail)
        setNotifyNumber(dt.team.isNotifyWa)
        setDefaultTeam(dt || {});
    }

    const fetchUserDetails = async() => {
        const user = await authController.user();
        setUserDetails(user);
    }

    const fetchInviteLink = async() => {
        setIsFetching(true)
        const linkResponse = await teamManagementController.fetchInviteLink(defaultTeam.team.id);
        if (linkResponse) {
            setInviteLink(linkResponse.invite_link);
            setIsLinkSharingEnabled(linkResponse.is_link_sharing_enabled);
        } else {
            alertCentral.error("An error occured while fetching the team invite link. Please contact the administrator. Thank you.", 3000);
        }
        setIsFetching(false);
    }

    useEffect (() => {
        load()
        fetchUserDetails();
    }, []);

    const fetchMembers = async () => {
        //Don't allow fetching
        if (scopeList.indexOf('MEMBER_READ_ASSIGNED') === -1) {
            return;
        }

        var query = { team_id: defaultTeam.team.id, limit: limit, offset: offset };

        const teamMembers = await teamManagementController.fetchTeamMembers(query);
        if (teamMembers) {
            setMembers([...members, ...teamMembers]);
            if (teamMembers.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }


            setLimit(offset + limit);
            setOffset(offset + teamMembers.length);
        } else {
            alertCentral.error("An error occured while fetching the team members. Please contact the administrator. Thank you.", 3000);
            setHasMore(false);
        }
    }

    useEffect (() => {
        if (props.showModal && defaultTeam.team) {
            fetchMembers();
            fetchInviteLink();
        } else {
            setMembers([])
            setOffset(0);
            setLimit(30);
            setInviteLink();
            setIsShowAddMemberForm(false);
            setIsLinkSharingEnabled(false);
        }
    }, [props.showModal, defaultTeam]);

    const handleCopy = async () => {
        copy(inviteLink);
        setCopyText('Copied');
        await utils.sleep(1000);
        setCopyText('Copy');
    }

    const handleReset = async () => {
        setIsFetching(true)
        const linkResetResponse = await teamManagementController.resetInviteLink(defaultTeam.team.id);
        if (linkResetResponse) {
            setInviteLink(linkResetResponse.invite_link);
        } else {
            alertCentral.error("An error occured while resetting the team invite link. Please contact the administrator. Thank you.", 3000);
        }
        setIsFetching(false);
    }

    const handleDeleteMember = async (id) => {
        setMembers(
            members?.filter(
                member => member.id !== id
            )
        )
    }

    const handleEnabledLink = async (enabled) => {
        setIsEnabling(true)
        const linkEnabledResponse = await teamManagementController.enableInviteLink({ id: defaultTeam.team.id, is_link_sharing_enabled: enabled });
        if (linkEnabledResponse) {
            setIsLinkSharingEnabled(enabled);
        } else {
            alertCentral.error(`An error occured while ${enabled ? 'enabling' : 'disabling'} the team invite link. Please contact the administrator. Thank you.`, 3000);
        }
        setIsEnabling(false);
    }

    const save = async() => {
        const name = teamName
        const email = mail
        const number = whatsapp?.replace (/[^0-9]/g, '') && `+${whatsapp?.replace (/[^0-9]/g, '')}`
        const notify_email = notifyEmail
        const notify_wa = notifyNumber
        const resp = await teamManagementController.updateTeamDetails({id: defaultTeam.team.id, name: name, email: email, number: number, notify_email: notify_email, notify_wa: notify_wa});
        if (resp){

            if (resp.code === 200) {
                setTeamName(name)
                setMail(email)
                setWhatsapp(number)
                setNotifyEmail(notifyEmail)
                setNotifyNumber(notifyNumber)
    
                defaultTeam.team.name = name
                defaultTeam.team.emailAddress = email
                defaultTeam.team.contactNumber = number
                defaultTeam.team.isNotifyEmail = notifyEmail
                defaultTeam.team.isNotifyWa = notifyNumber
                props.setDefaultTeam(defaultTeam);
                alertCentral.show ("Account information updated", 3000)
            } else {
                alertCentral.error(resp.message, 3000)
            }
        } else {
            alertCentral.error(`An error occured while updating the team details. Please contact the administrator. Thank you.`, 3000);
        }
    }

    const handleChangeNotifEm = (evt) => {
        setNotifyEmail(evt.target.checked)
    }

    const handleChangeNotifWp = (evt) => {
        setNotifyNumber(evt.target.checked)
    }

    const handleChangeName = (evt) => {
        setTeamName(evt.target.value)
    }

    const handleChangeMail = (evt) => {
        setMail(evt.target.value)
    }

    const handleChangeNum = (evt) => {
        setWhatsapp(evt.target.value)
    }

    const handleAddMember = async () => {
        fetchMembers();
    }

    return(
        <div>
            <Modal  show = {props.showModal} onHide = {props.noModal} centered dialogClassName="custom-modal-dialog">
                <div className="modal-body">
                    <div className="modal-close" onClick = {props.noModal}>x</div>
                    <div className="custom-modal-title">Team Details</div>

                    <div className="custom-container">
                        <Form.Group>
                            <Form.Label>
                                Team Settings
                            </Form.Label>
                            <Form.Text>
                                Manage team settings
                            </Form.Text>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>
                                Team Name
                            </Form.Label>
                            <Form.Control type="text" className="common-field" onChange={handleChangeName} value={teamName}></Form.Control>
                        </Form.Group>
                        <Form.Row>
                            <Col
                                md={6}
                            >
                                <Row>
                                    <Col
                                        md={2}
                                        sm={2}
                                        xs={3}
                                    >
                                        <div
                                            className="switch-container"
                                        >
                                            <Switch
                                                id="switch-email-notif"
                                                className="custom-team-switch"
                                                checked={notifyEmail}
                                                onChange={handleChangeNotifEm}
                                            />
                                        </div>
                                    </Col>
                                    <Col
                                        md={10}
                                        sm={10}
                                        xs={9}
                                    >
                                        <Form.Label>
                                            Notify on Email?
                                        </Form.Label>
                                    </Col>
                                </Row>
                            </Col>
                            <Col
                                md={6}
                            >
                                <Row>
                                    <Col
                                        md={2}
                                        sm={2}
                                        xs={3}
                                    >
                                        <div
                                            className="switch-container"
                                        >
                                            <Switch
                                                id="switch-wa-notif"
                                                className="custom-team-switch"
                                                checked={notifyNumber}
                                                onChange={handleChangeNotifWp}
                                            />
                                        </div>
                                    </Col>
                                    <Col
                                        md={10}
                                        sm={10}
                                        xs={9}
                                    >
                                        <Form.Label>
                                            Notify on Whatsapp?
                                        </Form.Label>
                                    </Col>
                                </Row>
                            </Col>
                        </Form.Row>
                    </div>

                    {
                        isShowInviteLink
                        &&
                        <div className="custom-container">
                            <Form.Group>
                                <Row>
                                    <Col
                                        md={10}
                                    >
                                        <Form.Label>
                                            Invite Link
                                        </Form.Label>
                                    </Col>
                                    <Col
                                        md={1}
                                    >
                                        <Spinner animation='border' hidden={!isEnabling} />
                                    </Col>
                                    <Col
                                        md={1}
                                    >
                                        {
                                            isShowLinkSharing
                                            &&
                                            <Switch
                                                id="invite-link-switch"
                                                checked={isLinkSharingEnabled}
                                                onChange={
                                                    (e) => {
                                                        handleEnabledLink(e.target.checked)
                                                    }
                                                }
                                            />
                                        }
                                    </Col>
                                </Row>
                                <Form.Text>
                                    { isLinkSharingEnabled ? "Share this secret link to invite people to this platform. Only admins can see this. You can reset the link to generate a new invite link." : "Enable link sharing to invite new members to the team."}
                                </Form.Text>
                            </Form.Group>
                            {
                                isLinkSharingEnabled
                                &&
                                <Row
                                >
                                    <Col
                                        md={12}
                                    >
                                        <InputGroup>
                                            <Form.Control
                                                as="input"
                                                value={inviteLink}
                                                disabled
                                                className="form-link"
                                            />
                                            <InputGroup.Prepend>
                                                <Button
                                                    variant="a"
                                                >
                                                    <Spinner animation='border' hidden={!isFetching} />
                                                </Button>
                                            </InputGroup.Prepend>
                                            <InputGroup.Prepend>
                                                <Button
                                                    variant="a"
                                                    onClick={handleCopy}
                                                >
                                                    {copyText}
                                                </Button>
                                            </InputGroup.Prepend>
                                            {
                                                isShowResetInviteLink 
                                                &&
                                                <InputGroup.Prepend>
                                                    <ProgressButton
                                                        variant="a"
                                                        onClick={handleReset}
                                                    >
                                                        Reset
                                                    </ProgressButton>
                                                </InputGroup.Prepend>
                                            }
                                        </InputGroup>
                                    </Col>
                                </Row>
                            }
                            
                        </div>
                    }
                    
                    {
                        scopeList.indexOf('MEMBER_READ_ASSIGNED') >= 0
                        &&
                        <div
                            className="custom-container"
                        >
                            <Form.Group>
                                <Form.Label>
                                    Team Members
                                </Form.Label>
                                <Form.Text>
                                    Manage team members
                                </Form.Text>
                                {
                                    isShowAddMemberButton
                                    &&
                                    <ProgressButton
                                        variant="secondary"
                                        className="add-member-btn"
                                        onClick={() => setIsShowAddMemberForm(!isShowAddMemberForm)}
                                    >
                                        {!isShowAddMemberForm ? 'Add Member' : 'Close Member Form'}
                                    </ProgressButton>
                                }
                            </Form.Group>
                            <TeamAddMemberForm 
                                isHidden={!isShowAddMemberForm}
                                addMember={handleAddMember}
                            />

                            <Form.Label>
                                Members List
                            </Form.Label>
                            <div
                                className="team-details-window-scrollable-container"
                                id="team-details-window-scrollable-container"
                            >
                                <InfiniteScroll
                                    scrollableTarget="team-details-window-scrollable-container"
                                    dataLength={members.length}
                                    scrollThreshhold='3rem'
                                    next={fetchMembers}
                                    hasMore={hasMore}
                                    style={{ width: '100%', overflow: 'visible' }}
                                    loader={<Spinner animation='border' />}
                                    initialScrollY={0}
                                >
                                    {
                                        members?.map(
                                            member => {
                                                if (member) {
                                                    return <TeamMemberItem
                                                        data={member}
                                                        deleteMember={handleDeleteMember}
                                                        teamId={defaultTeam.team.id}
                                                        isEditableStatus={scopeList.indexOf('MEMBER_UPDATE_ASSIGNED') >= 0 && member.user.id !== userDetails.id}
                                                        isDeletableStatus={scopeList.indexOf('MEMBER_DELETE_ASSIGNED') >= 0 && member.user.id !== userDetails.id}
                                                        isMe={member.user.id === userDetails.id}
                                                    />
                                                }
                                            }
                                        )
                                    }
                                </InfiniteScroll>
                            </div>
                        </div>
                    }
                </div>
                {
                    (
                    defaultTeam?.team?.name !== teamName ||
                    defaultTeam?.team?.emailAddress !== mail ||
                    defaultTeam?.team?.contactNumber !== whatsapp ||
                    defaultTeam?.team?.isNotifyEmail !== notifyEmail ||
                    defaultTeam?.team?.isNotifyWa !== notifyNumber
                    ) && scopeList.indexOf('TEAM_UPDATE_ASSIGNED') >= 0
                    ?
                    <Modal.Footer>
                        <div
                            className="team-footer-container"
                        >
                            <Col
                                md={{offset: 10, span: 2}}
                            >
                                <ProgressButton
                                    variant="primary"
                                    onClick={save}
                                    className="team-account-save"
                                >
                                    Save
                                </ProgressButton>
                            </Col>
                        </div>
                    </Modal.Footer>
                    :
                    ''
                }
            </Modal>
        </div>
    )
}