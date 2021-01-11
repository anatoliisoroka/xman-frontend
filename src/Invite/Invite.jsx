import React, { useContext } from "react";
import { Row, Col, Modal } from 'react-bootstrap';
import './Invite.css';
import ProgressButton from '../Components/ProgressButton';
import { AlertCentralContext } from '../Components/AlertCentral';
import TeamManagementController from '../Controllers/TeamManagementController';
import UtilitiesController from '../Controllers/UtilitiesController';

export default props => {
    const utils = new UtilitiesController();
    const alertCentral = useContext(AlertCentralContext);
    const teamManagementController = new TeamManagementController();
    
	const handleAccept = async (isAccept) => {

		var newURL = window.location.protocol + "//" + window.location.host + "/"
		if (isAccept) {
			props.onHide(false);
			props.setLoaderText("Please wait while we are joining you to the team . . .");
            props.setIsLoading(true);
            const response = await teamManagementController.handleJoinTeam(props.teamDetails.invite_code);
            if(response) {
                if (response.code === 200) {
                    //switch team
                    const switchResponse = await teamManagementController.handleTeamSwitch(props.teamDetails.id);
    
                    alertCentral.show("Successfully joined the team.", 3000);
                    window.history.pushState("", "", newURL);
    
                    if (switchResponse) {
                        if (switchResponse.code === 200) {
                            await utils.sleep(1000);
                            
                            //reload the page after switching 
                            window.location.reload();
                        }
                    }
                } else {
                    window.history.pushState("", "", newURL);
                    alertCentral.error(response.message, 3000);
                }
            } else {
                window.history.pushState("", "", newURL);
                alertCentral.error("You encountered an error while joining the team. Please contact the administrator. Thank you.", 3000);
            }

            props.setIsLoading(false);
			props.setTeamDetails({});
		} else {
			window.history.pushState("", "", newURL);
			props.onHide(false);
			props.setTeamDetails({});
		}
	}

    return (
        <Modal
            show={props.show}
            size="md"
        >
            <div className="modal-body">
                <div className="modal-close" onClick = {() => props.onHide(false)}>x</div>
                <div className="custom-modal-title">Team Invitation</div>
                <div
                    className="invite-container"
                >
                    <div
                        className="invite-data-container"
                    >
                        
                        <p
                            className="invite-p-question"
                        >
                            Do you want to accept the invitation to join {props.teamDetails?.name}?
                        </p>    
                        
                        <div
                            className="invite-content-container"
                        >
                            <Row>
                                <Col
                                    sm={{span:3, offset:6}}
                                    md={{span:3, offset:6}}
                                >
                                    <ProgressButton
                                        className="invite-confirm-button"
                                        onClick={
                                            () => {
                                                handleAccept(true)
                                            }
                                        }
                                    >
                                        Yes
                                    </ProgressButton>
                                </Col>
                                <Col
                                    sm={{span:3}}
                                    md={{span:3}}
                                >
                                    <ProgressButton
                                        className="invite-cancel-button"
                                        onClick={
                                            () => {
                                                handleAccept(false)
                                            }}
                                    >
                                        No
                                    </ProgressButton>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}