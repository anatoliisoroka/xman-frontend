import React, { useState, useContext, useEffect } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import TeamManagementController from '../Controllers/TeamManagementController';
import ProgressButton from '../Components/ProgressButton';
import { AlertCentralContext } from '../Components/AlertCentral';
import Switch from '../Components/Switch';

export default props => {
    const teamManagementController = new TeamManagementController();
    const alertCentral = useContext(AlertCentralContext);
    const animatedComponents = makeAnimated();

    const [access, setAccess] = useState(teamManagementController.scopeDefaultListOptions());
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [email, setEmail] = useState();
    const [number, setNumber] = useState();
    const [sendCredentialsToEmail, setSendCredentialsToEmail] = useState(false);
    const [sendCredentialsToWA, setSendCredentialsToWA] = useState(false);

    const handleSubmit = async () => {
        var accessList = [];
        access && access.map(
            a => {
                accessList.push(a.value);
            }
        );
        const addMemberResponse = await teamManagementController.addTeamMember(
            {
                username,
                password,
                access: accessList,
                contactNumber: number?.replace (/[^0-9]/g, '') && `+${number?.replace (/[^0-9]/g, '')}`,
                emailAddress: email,
                isSendCredentialsToEmail: sendCredentialsToEmail,
                isSendCredentialsToWa: sendCredentialsToWA
            }
        )

        if (!addMemberResponse) {
            alertCentral.error("An error occured while saving the member details. Please contact the administrator. Thank you.", 3000);
            return;
        }

        if (addMemberResponse.code === 200) {

            props.addMember()
            setUsername('')
            setPassword('')
            setEmail('')
            setNumber('')
            setSendCredentialsToEmail(false)
            setSendCredentialsToWA(false)
            setAccess(teamManagementController.scopeDefaultListOptions())
            alertCentral.show(addMemberResponse.message || 'Successfully saved the member details', 3000);
        } else {
            alertCentral.error(addMemberResponse.message || 'An error occured while saving the member details. Please contact the administrator. Thank you.', 3000);
        }
    }

    useEffect(
        () => {
            if(!props.isHidden) {
                setAccess(teamManagementController.scopeDefaultListOptions())
                setUsername('');
                setPassword('');
                setEmail('');
                setNumber('');
            }
        }, [props.isHidden]
    )

    return (
        <div className="custom-add-member-container" hidden={props.isHidden}>
            <Form.Label>
                Member Form
            </Form.Label>
            <Form.Row>
                <Col
                    md={6}
                >
                    <Form.Group>
                        <Form.Label>
                            Username*
                        </Form.Label>
                        <Form.Text>
                            The username is required and must be unique
                        </Form.Text>
                        <Form.Control 
                            type="text" 
                            className="common-field"  
                            onChange={evt => setUsername(evt.target.value)} 
                            value={username}
                        >    
                        </Form.Control>
                    </Form.Group>
                </Col>
                <Col
                    md={6}
                >
                    <Form.Group>
                        <Form.Label>
                            Password*
                        </Form.Label>
                        <Form.Text>
                            Must have 8 - 64 characters with atleast 1 lowercase, 1 uppercase and 1 numeric character
                        </Form.Text>
                        <Form.Control
                            type="password"
                            className="common-field"   
                            min={8} 
                            max={64} 
                            onChange={evt => setPassword(evt.target.value)} 
                            value={password}
                        >
                        </Form.Control>
                    </Form.Group>
                </Col>
            </Form.Row>
            <Form.Row>
                <Col>
                    <Form.Group>
                        <Form.Label>
                            Member Access*
                        </Form.Label>
                        <Form.Text>
                            Access given to a member of the team
                        </Form.Text>
                        {
                            //needs this, something weird happening to react-select when hiding the div then not rerendering the select
                            //not showing values when div is hidden
                            !props.isHidden
                            &&

                            <Select
                                isMulti
                                className="common-field"
                                components={animatedComponents}
                                value={access}
                                options={teamManagementController.scopeListOptions()}
                                onChange={
                                    (values, actionMeta) => {
                                        setAccess(values);
                                    }
                                }
                            />
                        }
                    </Form.Group>
                </Col>
                
            </Form.Row>
            <Form.Row>
                <Col
                    md={6}
                >
                    <Form.Group>
                        <Form.Label>
                            Email Address 
                        </Form.Label>
                        <Form.Text>
                            The email address of the member
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
                            The whatsapp number of the member
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
                                    id="switch-send-credentials-to-email"
                                    className="custom-team-switch"
                                    checked={sendCredentialsToEmail}
                                    onChange={evt => setSendCredentialsToEmail(evt.target.checked)} 
                                />
                            </div>
                        </Col>
                        <Col
                            md={10}
                            sm={10}
                            xs={9}
                        >
                            <Form.Label>
                                Send Credentials to Email?
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
                                    id="switch-send-credentials-to-wa"
                                    className="custom-team-switch"
                                    checked={sendCredentialsToWA}
                                    onChange={evt => setSendCredentialsToWA(evt.target.checked)} 
                                    disabled
                                />
                            </div>
                        </Col>
                        <Col
                            md={10}
                            sm={10}
                            xs={9}
                        >
                            <Form.Label>
                                Send Credentials to Whatsapp Number? <b>(Coming Soon!)</b>
                            </Form.Label>
                        </Col>
                    </Row>
                </Col>
            </Form.Row>
            <Form.Row>
                <Col
                    md={{offset: 10, span: 2}}
                >
                    <ProgressButton
                        variant="primary"
                        className="add-member-btn-save"
                        onClick={handleSubmit}
                    >
                        Submit
                    </ProgressButton>
                </Col>
            </Form.Row>
        </div>
    )
}