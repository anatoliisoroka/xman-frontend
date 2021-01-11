import React, { useState, useEffect, useContext } from 'react';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import InfiniteScroll from 'react-infinite-scroll-component';

import './Broadcasts.css';
import BroadcastController from '../../Controllers/BroadcastController';
import BroadcastItem from './BroadcastItem';
import { AlertCentralContext } from '../../Components/AlertCentral';
import Tooltip from '../../Components/Tooltip';
import AuthController from '../../Controllers/AuthController';

/**
 * @param {function(boolean)} setModalEditShow
 * @param {function(Object)} setSelectedCampaign
 * @param {function(string)} setView
 * @param {function(Object)} setCampaigns
 * @param {Object} campaigns
 */
const BroadcastList = ({ setSelectedCampaign, setView, campaigns, setCampaigns, setModalEditShow }) => {
    const broadcastController = new BroadcastController();
    const authController = new AuthController();
    const [hasMore, setHasMore] = useState(true);
    const [countPerFetch, setCountPerFetch] = useState(15);
    const [before, setBefore] = useState(campaigns[campaigns.length - 1]?.cursor);
    const [tableMessage, setTableMessage] = useState("Fetching campaigns ...");

    const alertCentral = useContext(AlertCentralContext);

    const deleteBroadcastItem = (id) => {
        const updateCampaignList = campaigns.filter(item => item.id !== id)
        setCampaigns(updateCampaignList);
    }

    const getCampaigns = async () => {
        var query = { count: countPerFetch };
        if (before) {
            query.before = before;
        }

        const {campaigns: campaignList, cursor} = await broadcastController.getCampaigns(query);
        if (Array.isArray(campaignList)) {
            setCampaigns(campaigns.concat(campaignList));
            console.log(campaignList.length < countPerFetch);
            if (campaignList.length < countPerFetch) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
            setBefore(cursor);

            if(campaigns.length > 0) {
                setTableMessage('');

            } else {
                setTableMessage('No campaign found');
            }
            
        } else {
            setHasMore(false);
            alertCentral.error(campaignList.message, 3000);
            setTableMessage('Error encountered');
        }
    }

    useEffect(
        () => {
            window.scrollTo(0, 0);
            if (authController.scopes().indexOf('CAMPAIGNS_READ') >= 0) {
                getCampaigns();
            } else {
                // don't allow to fetch campaigns list
                setHasMore(false)
                setTableMessage('Feature not available on your account. Please contact the administrator. Thank you.')
            }
        },
        []
    );

    return (
        <div id="scrollable-container">
            <InfiniteScroll
                scrollableTarget="scrollable-container"
                dataLength={campaigns.length}
                scrollThreshhold='3rem'
                next={getCampaigns}
                hasMore={hasMore}
                style={{ width: '100%', overflow: 'visible' }}
                loader={<Spinner animation='border' />}
                initialScrollY={0}
            >
                <Table variant="xman">
                    <thead>
                        <tr>
                            <th>
                                Campaign
                                </th>
                            <th>
                                Scheduled At
                                </th>
                            <th>
                                Broadcast Speed
                                </th>
                            <th>
                                Pending
                                </th>
                            <th>
                                Sent
                                </th>
                            <th>
                                <Tooltip tooltip='sent: single tick, delivered: double tick'>
                                    <div>
                                    Delivered
                                    </div>
                                </Tooltip>
                                </th>
                            <th>
                                Failed
                                </th>
                            <th>
                                Status
                                </th>
                            <th colSpan='2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            (
                                () => {
                                    if (campaigns.length > 0) {
                                        return campaigns?.map(
                                            broadcast =>
                                                <BroadcastItem
                                                    data={broadcast}
                                                    deleteBroadcastItem={deleteBroadcastItem}
                                                    setView={setView}
                                                    setSelectedCampaign={setSelectedCampaign}
                                                    setModalEditShow={setModalEditShow}
                                                    setCampaigns={setCampaigns}
                                                    campaigns={campaigns}
                                                />
                                        )
                                    } else {
                                        return (
                                            <tr>
                                                <td>
                                                    {tableMessage}
                                                </td>
                                            </tr>
                                        )
                                    }
                                }
                            )()
                        }
                    </tbody>
                </Table>
            </InfiniteScroll>

        </div>
    )
}

export default BroadcastList;