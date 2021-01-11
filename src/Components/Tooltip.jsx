import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

/**
 * @param { { tooltip: string } }
 */
export default props => ((
    <OverlayTrigger 
        placement={props.placement || 'top'} 
        show={props.show}
        overlay={
            <Tooltip {...props}>{props.tooltip}</Tooltip>
        }>
        {props.children}
    </OverlayTrigger>
  )
)