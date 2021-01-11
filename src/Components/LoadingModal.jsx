import React from 'react';
import { Modal, Spinner, Row, Col } from 'react-bootstrap';
import './LoadingModal.css';

/**
 * 
 * @param {React.InputHTMLAttributes} props 
 */
export default props => {

    return (
        <Modal
            onHide={props.onHide}
            show={props.show}
            size={props.size || 'sm'}
            backdrop={props.backdrop || 'static'}
            keyboard={props.keyboard || false}
            {...props}
        >
            <div
                className="loading-modal-container"
            >
                <Row>
                    <Col
                        md={2}
                    >
                        <div
                            className="loading-spinner-container"
                        >
                            <Spinner
                                animation='border'
                                className="loading-spinner-border"
                            />
                        </div>
                    </Col>
                    <Col
                        md={10}
                    >
                        <div
                            className="loading-content-container"
                        >
                            {props.loaderText || 'Please wait, we are currently processing your request . . .'}
                        </div>
                    </Col>
                </Row>

            </div>
        </Modal>
    )
}