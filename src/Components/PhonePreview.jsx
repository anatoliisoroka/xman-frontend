import React from 'react';
import { Row, Col} from 'react-bootstrap';

import LiveChatMessageView from "../LiveChat/LiveChatMessageView";
import './PhonePreview.css'
import { constructPendingMessage } from '../Controllers/Utils';

/**
 * @param {string} title
 * @param {NodeRequire} icon
 * @param {constructPendingMessage} phoneMessage
 */
export default props => {

    return (
        <Row
            className="justify-content-md-center"
        >
            <div
                xs
                lg="2" 
                className="phone-container"
            >
                <div
                    className="image-container"
                >
                    <div 
                        className="image-container-content"
                    >
                        <Row
                            className="image-container-content-header"
                        >
                            <Col
                                xs={2}
                                md={2}
                            >
                                <img
                                    className="image-header"
                                    src={props?.icon || require('../Images/xman-icon-colored.png')}
                                />
                            </Col>
                            <Col>
                                <p
                                    className="text-header"
                                >
                                    {props?.title || 'Xman'}
                                </p>
                            </Col>
                        </Row>
                        <hr/>
                        <Row
                            className="scrollable-phone-content"
                        >
                            <Col
                                xs={10}
                                md={10}
                            >
                                <LiveChatMessageView 
                                    editable={false} 
                                    parseTemplate={true} 
                                    message={props?.phoneMessage || constructPendingMessage('', { text: '' }, '', false)}
                                />
                            </Col>
                            <Col
                                xs={2}
                                md={2}
                            >
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </Row>
    )
}