import React, {useEffect, useState, useContext} from 'react';
import { Col, Modal, Form } from 'react-bootstrap';
import AuthController from '../Controllers/AuthController';
import './PersonalDetailsWindow.css';
import { AlertCentralContext } from '../Components/AlertCentral';
import ProgressButton from '../Components/ProgressButton';
import UserManagementController from '../Controllers/UserManagementController';

export default props => {
	const userManagementController = new UserManagementController();
    const alertCentral = useContext(AlertCentralContext);
    const authController = new AuthController();
    const [username, setUsername] = useState();
    const [email, setEmail] = useState();
    const [number, setNumber] = useState();
    const [userDetails, setUserDetails] = useState({});

    //scopes list
    const [scopeList, setScopeList] = useState(authController.scopes());

    const fetchPersonalDetails = async() => {
        const details = await userManagementController.fetchUserDetails();
        if (details) {
            setUsername(details.username)
            setEmail(details.emailAddress)
            setNumber(details.contactNumber)
        } else {
            setUsername("")
            setEmail("")
            setNumber("")
        }
    }

    const fetchUserDetails = async() => {
        const user = await authController.user();
        setUserDetails(user)
    }

    useEffect (() => {
        if (props.showModal) {
            fetchUserDetails();
            fetchPersonalDetails();
        } else {
            setUsername("")
            setEmail("")
            setNumber("")
        }
    }, [props.showModal]);

    const save = async() => {
        const contactNumber = number?.replace (/[^0-9]/g, '') && `+${number?.replace (/[^0-9]/g, '')}`
        const resp = await userManagementController.updateUserDetails({ username, emailAddress: email, contactNumber});
        if (resp){

            if (resp.code === 200) {
                alertCentral.show ("Account information updated", 3000)
            } else {
                alertCentral.error(resp.message, 3000)
            }
        } else {
            alertCentral.error(`An error occured while updating the team details. Please contact the administrator. Thank you.`, 3000);
        }
    }

    return(
        <div>
            <Modal  show = {props.showModal} onHide = {props.noModal} centered dialogClassName="custom-modal-dialog">
                <div className="modal-body">
                    <div className="modal-close" onClick = {props.noModal}>x</div>
                    <div className="custom-modal-title">Personal Details</div>

                    <div className="custom-container">
                        <Form.Group>
                            <Form.Label>
                                Account Details
                            </Form.Label>
                            <Form.Text>
                                Manage account details
                            </Form.Text>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>
                                Username
                            </Form.Label>
                            <Form.Text>
                                The username is used for login
                            </Form.Text>
                            <Form.Control 
                                type="text" 
                                className="common-field"  
                                // onChange={evt => setUsername(evt.target.value)} 
                                value={username}
                                disabled
                            >    
                            </Form.Control>
                        </Form.Group>
                        <Form.Row>
                            <Col
                                md={6}
                            >
                                <Form.Group>
                                    <Form.Label>
                                        Email Address 
                                    </Form.Label>
                                    <Form.Text>
                                        The email address of the user
                                    </Form.Text>
                                    <Form.Control 
                                        type="text" 
                                        className="common-field"  
                                        onChange={evt => setEmail(evt.target.value)} 
                                        value={email}
                                    >    
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col
                                md={6}
                            >
                                <Form.Group>
                                    <Form.Label>
                                        Whatsapp Number
                                    </Form.Label>
                                    <Form.Text>
                                        The whatsapp number of the user
                                    </Form.Text>
                                    <Form.Control 
                                        type="text" 
                                        className="common-field"  
                                        onChange={evt => setNumber(evt.target.value)} 
                                        value={number}
                                    >    
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Form.Row>
                        
                        <div
                            className="user-footer-container"
                        >
                            <Col
                                md={{offset: 10, span: 2}}
                            >
                                <ProgressButton
                                    variant="primary"
                                    onClick={save}
                                    className="user-account-save"
                                >
                                    Save
                                </ProgressButton>
                            </Col>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}