import React, { useState, useContext } from 'react';
import { Dropdown} from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';

import { ReactComponent as ThreeDots } from '../../Images/ThreeDots.svg';
import BroadcastController from '../../Controllers/BroadcastController';
import { AlertCentralContext } from '../../Components/AlertCentral';
import AuthController from '../../Controllers/AuthController';

/**
 * @param {function(boolean)} setModalEditShow
 * @param {function(Object)} setSelectedCampaign
 * @param {function(string)} setView
 * @param {function(string)} deleteBroadcastItem
 * @param {Object} data
 */
const BroadcastItem = ({setSelectedCampaign, data, deleteBroadcastItem, setView, setModalEditShow}) => {
    const authController = new AuthController();
    const broadcastController = new BroadcastController();
    const [isLoading, setIsLoading] = useState(false);

    const alertCentral = useContext (AlertCentralContext);

    const handleShow = async () => {
        setIsLoading(true);
        setSelectedCampaign(data);
        setIsLoading(false);
        setView('show');
    }

    const handleEdit = () => {
        setSelectedCampaign(data);
        setModalEditShow(true);
    }

    const handleDelete = async () => {
        setIsLoading(true);
        const response = await broadcastController.deleteCampaignById(data.id);
        if (response.status < 200 || response.status > 299) {
            //prompt an alert
            alertCentral.error(response.statusText, 3000);
        } else {
            alertCentral.show('Successfully deleted a campaign', 3000);
        }
        deleteBroadcastItem(data.id);
        setIsLoading(false);
    }

    const handleRevoke = async () => {
        setIsLoading(true);
        const response = await broadcastController.actionCampaign('revoke', data.id);
        if (response.status < 200 || response.status > 299) {
            //prompt an alert
            alertCentral.error(response.message, 3000);
        } else {
            alertCentral.show('Successfully revoked a campaign', 3000);
            data.state = "revoked";
        }
        setIsLoading(false);
    }

    const handleStart = async () => {
        setIsLoading(true);
        const response = await broadcastController.actionCampaign('start', data.id);
        if (response.status < 200 || response.status > 299) {
            //prompt an alert
            alertCentral.error(response.message, 3000);
        } else {
            alertCentral.show('Successfully started a campaign', 3000);
            data.state = 'progress';
        }
        setIsLoading(false);
    }

    const handleStop = async () => {
        setIsLoading(true);
        const response = await broadcastController.actionCampaign('stop', data.id);
        if (response.status < 200 || response.status > 299) {
            //prompt an alert
            alertCentral.error(response.message, 3000);
        } else {
            alertCentral.show('Successfully stopped a campaign', 3000);
            data.state = 'inactive';
        }
        setIsLoading(false);
    }

    return (
        <tr>
            <td>{data.name}</td>
            <td>{broadcastController.transformMillisecondsToDateString(data.scheduledAt * 1000)}</td>
            <td>{broadcastController.getBroadcastSpeedList().find(item => item.value === data.sendInterval) ? broadcastController.getBroadcastSpeedList().find(item => item.value === data.sendInterval).label : `Custom (${data.sendInterval} second(s) interval/message)`}</td>
            <td>{data.counts.pending}</td>
            <td>{data.counts.sent}</td>
            <td>{data.counts.delivered}</td>
            <td>{data.counts.failed}</td>
            <td>{data.state}</td>
            <td>
                <Spinner animation='border' hidden={!isLoading} />
            </td>
            <td style={{textAlign:"end"}}>
                <Dropdown
                    drop="left"
                    onSelect={(eventKey, event) => 
                            {
                            if (eventKey === "show") {
                                handleShow()
                            }
                            if (eventKey === "edit") {
                                handleEdit()
                            }
                            if (eventKey === "delete") {
                                handleDelete()
                            }
                            if (eventKey === "revoke") {
                                handleRevoke()
                            }
                            if (eventKey === "start") {
                                handleStart()
                            }
                            if (eventKey === "stop") {
                                handleStop()
                            }
                        }
                    }
                >

                    <Dropdown.Toggle variant="ham" style={{width: '40px'}}>
                        <ThreeDots style={{fill: 'var(--color-primary)'}} />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {
                            (data.state === 'inactive' || data.state === 'scheduled') && authController.scopes().indexOf('CAMPAIGNS_UPDATE') >= 0  &&
                            <Dropdown.Item
                                eventKey = "start"
                            >
                                Start
                            </Dropdown.Item>
                        }
                        {
                            (data.state === 'scheduled' || data.state === 'progress' || data.state === 'revoking') && authController.scopes().indexOf('CAMPAIGNS_UPDATE') >= 0 &&
                            <Dropdown.Item
                                eventKey = "stop"
                            >
                                Stop
                            </Dropdown.Item>
                        }
                        {
                            authController.scopes().indexOf('CAMPAIGNS_READ') >= 0 &&
                            <Dropdown.Item
                                eventKey = "show"
                            >
                                Show
                            </Dropdown.Item>
                        }
                        {

                            (data.state !== 'completed' && data.state !== 'revoked' && data.state !== 'revoking' && authController.scopes().indexOf('CAMPAIGNS_UPDATE') >= 0) &&
                            <Dropdown.Item
                                eventKey = "edit"
                            >
                                Edit
                            </Dropdown.Item>
                        }
                        {
                            authController.scopes().indexOf('CAMPAIGNS_DELETE') >= 0 && 
                            <Dropdown.Item
                                eventKey = "delete"
                            >
                                Delete
                            </Dropdown.Item>
                        
                        }
                        {
                            (data.state !== 'revoked' && data.state !== 'scheduled' && data.state !== 'revoking') && authController.scopes().indexOf('CAMPAIGNS_UPDATE') >= 0  &&
                            <Dropdown.Item
                                eventKey = "revoke"
                            >
                                Revoke
                            </Dropdown.Item>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </td>
        </tr>
    )
};

export default BroadcastItem;