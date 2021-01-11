import React, { useContext, useEffect, useRef, useState } from "react";
import { Modal, Table } from "react-bootstrap";

import BroadcastController from '../../Controllers/BroadcastController';
import './Broadcasts.css';
import { TagStoreContext } from "../../Controllers/AudienceStore";

/**
 * @param {boolean} modalShow 
 * @param {function(boolean)} setModalShow
 * @param {string} modalTitle
 * @param {Object} modalData
 */
const BroadcastShowModal = ({modalShow, setModalShow, modalTitle, modalData}) => {
    const broadcastController = new BroadcastController();
    const jidExtension = '@s.whatsapp.net';
    const { getTag } = useContext (TagStoreContext);

    return (
        <Modal
            show={modalShow}
            onHide={() => setModalShow(false)}
            dialogClassName="custom-modal-dialog"
        >
            <Modal.Header
                closeButton
            >
                <Modal.Title
                    bsPrefix='custom-modal-title'
                >
                    {modalTitle}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table
                    className="scrollable-container"
                    borderless
                >
                    <thead
                        className="sticky-table-header"
                    >
                        <tr>
                            <th>Message ID</th>
                            <th>Recipient</th>
                            <th>Timestamp</th>
                            <th>Tag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            modalData?.map(
                                details => (
                                    <tr>
                                        <td>{details.messageID}</td>
                                        <td>{details.recipient?.replace(jidExtension, '')}</td>
                                        <td>{broadcastController.transformMillisecondsToDateString(details.timestamp * 1000)}</td>
                                        <td>{getTag(details.tag)?.name}</td>
                                    </tr>
                                )
                            )
                        }
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
};

export default BroadcastShowModal;