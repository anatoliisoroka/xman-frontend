import React, { useState, useEffect, useContext } from 'react';

import './Broadcasts.css';
import BroadcastList from './BroadcastList';
import BroadcastShow from './BroadcastShow';
import BroadcastAddModal from './BroadcastAddModal';
import BroadcastEditModal from './BroadcastEditModal';
import AuthController from '../../Controllers/AuthController';

const Broadcasts = ({events}) => {
    const authController = new AuthController();
    const [view, setView] = useState('list');
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState();
    const [modalAddShow, setModalAddShow] = useState(false);
    const [modalAddTitle, setModalAddTitle] = useState("Create New Campaign");
    const [modalEditShow, setModalEditShow] = useState(false);
    const [modalEditTitle, setModalEditTitle] = useState("Edit Campaign");
    

    /** use plus button in the main header */
	useEffect (() => {
        if (!events) {
            return
        }
        const value = () => {
            if (authController.scopes().indexOf('CAMPAIGNS_CREATE') >= 0) {
                setModalAddShow(true);
            } else {
                // don't allow to create campaign
                setModalAddShow(false);
            }
        };
        
        events.on ('add-clicked', value)
        return () => events.off ('add-clicked', value);

    }, [ events ]);

    return (
        <>
            <BroadcastAddModal
                modalTitle={modalAddTitle}
                modalShow={modalAddShow}
                setModalShow={setModalAddShow}
                setCampaigns={setCampaigns}
                campaigns={campaigns}
            />

            <BroadcastEditModal
                modalTitle={modalEditTitle}
                modalShow={modalEditShow}
                setModalShow={setModalEditShow}
                campaign={selectedCampaign}
                setCampaigns={setCampaigns}
                campaigns={campaigns}
            />

            <div className="broadcast-container" id="broadcast-container">
                {
                    (
                        () => {
                            if (view === 'list') {
                                return (
                                    <BroadcastList 
                                        setView={setView}
                                        setSelectedCampaign={setSelectedCampaign}
                                        setCampaigns={setCampaigns}
                                        campaigns={campaigns}
                                        setModalEditShow={setModalEditShow}
                                    />
                                )
                            }

                            if (view === 'show') {
                                return (
                                    <BroadcastShow 
                                        setView={setView}
                                        campaign={selectedCampaign}
                                    />
                                )
                            } 
                        }
                    )()
                }
            </div>
        </>
    )
}

export default Broadcasts;