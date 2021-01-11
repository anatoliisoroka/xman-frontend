import React, { useState, useContext } from 'react';
import { Col, Spinner, Badge, Dropdown, DropdownButton, Form, Row } from 'react-bootstrap';
import TeamManagementController from '../Controllers/TeamManagementController';
import { AlertCentralContext } from '../Components/AlertCentral';
import { ReactComponent as ThreeDots } from '../Images/ThreeDots.svg';
import Tooltip from '../Components/Tooltip';
import Switch from '../Components/Switch';
import ProgressButton from '../Components/ProgressButton';

export default props => {
    const alertCentral = useContext(AlertCentralContext);
    const teamManagementController = new TeamManagementController();
    const [isUpdating, setIsUpdating] = useState(false);

    const [access, setAccess] = useState([...props.data.access]);

    const [isButtonHidden, setIsButtonHidden] = useState(true);

    const handleUpdate = async () => {
        setIsUpdating(true);
        const updateStatusResponse = await teamManagementController.updateTeamMember({ team_id: props.teamId, access: access, user_id: props.data.userId  })
        if (updateStatusResponse){
            props.data.access = access;
            alertCentral.show ("Member access successfully updated.", 3000)
        } else {
            alertCentral.error(`An error occured while updating the member access. Please contact the administrator. Thank you.`, 3000);
        }
        setIsUpdating(false);
    }

    const handleDelete = async () => {
        setIsUpdating(true);
        const deleteStatusResponse = await teamManagementController.deleteTeamMember({ team_id: props.teamId, user_id: props.data.userId  });
        if (deleteStatusResponse){
            props.deleteMember(props.data.id);
            alertCentral.show ("Member successfully deleted.", 3000)
        } else {
            alertCentral.error(`An error occured while deleting the team member. Please contact the administrator. Thank you.`, 3000);
        }

        setIsUpdating(false);
    }

    return (
        <div
            className="team-member-row custom-row"
        >
            <Col
                md={10}
                sm={8}
                xs={8}
                lg={10}
                xl={10}
            >
                <p
                    className="row-name"
                >
                    {props.data.user.username} {props.isMe && <Badge variant="secondary">You</Badge>}
                </p>
            </Col>
            <Col
                md={1}
                sm={2}
                xs={2}
                lg={1}
                xl={1}
                className="team-member-spinner-container"
            >
                <Spinner animation='border' hidden={!isUpdating} />
            </Col>

            <Col
                md={1}
                sm={2}
                xs={2}
                lg={1}
                xl={1}
                className="team-member-dropdown-container"
            >
                {
                    props.isEditableStatus || props.isDeletableStatus
                        ?
                        <Dropdown
                            drop="left"
                        >
                            <Dropdown.Toggle variant="ham" style={{ width: '40px' }}>
                                <ThreeDots style={{ fill: 'var(--color-primary)' }} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {
                                    props.isEditableStatus
                                    &&
                                    <DropdownButton
                                        key={`change-team-access-${props.data.id}`}
                                        id="dropdown-button-drop-left"
                                        drop="left"
                                        variant="a"
                                        title='Change Access'
                                        className="custom-dropdown-button-item"
                                    >
                                        <div
                                            className="access-scrollable-container"
                                        >
                                            {
                                                teamManagementController.scopeListOptions()?.map(
                                                    option => (
                                                        <Tooltip
                                                            tooltip={option.tooltip}
                                                            placement="bottom"
                                                        >
                                                            <span
                                                                className="access-item-span"
                                                            >
                                                                <div
                                                                    className="switch-container"
                                                                >
                                                                    <Switch
                                                                        id={option.value}
                                                                        className="custom-team-switch"
                                                                        defaultChecked={props?.data?.access.indexOf(option.value) >= 0}
                                                                        onChange={ 
                                                                            evt => {
                                                                                if (evt.target.checked) {
                                                                                    access.push(option.value)
                                                                                } else {
                                                                                    access.splice(access.indexOf(option.value), 1)
                                                                                }
                                                                                setAccess(access);
                                                                                setIsButtonHidden(props?.data?.access.every( val => access.indexOf(val) >= 0) && access.every( val => props?.data?.access.indexOf(val) >= 0))
                                                                            }
                                                                        }
                                                                    />
                                                                </div>
                                                                {option.label}
                                                                
                                                            </span>
                                                        </Tooltip>
                                                    )
                                                )
                                            }

                                            <Dropdown.Item
                                                className="dropdown-item-button-right"
                                                hidden={isButtonHidden}
                                            >

                                                <div
                                                    className="button-item"
                                                >

                                                    <ProgressButton
                                                        onClick={handleUpdate}
                                                        className="save-btn-access"
                                                    >
                                                        Save Access
                                                    </ProgressButton>

                                                </div>

                                            </Dropdown.Item>

                                        </div>
                                        
                                    </DropdownButton>
                                }
                                {
                                    props.isDeletableStatus
                                    &&
                                    <Dropdown.Item
                                        onClick={handleDelete}
                                        className="text-error"
                                    >
                                        Delete
                                    </Dropdown.Item>
                                }
                            </Dropdown.Menu>
                        </Dropdown>
                        :
                        ''
                }
            </Col>
        </div>
    )
}