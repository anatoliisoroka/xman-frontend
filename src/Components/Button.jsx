import React from 'react'
import Tooltip from './Tooltip'
import Button from 'react-bootstrap/Button'
import './Button.css'

/**
 * @param {import('react-bootstrap').ButtonProps & { bref: any, tooltip?: string, placement?: string }} props
 */
export default props => (
    props.tooltip ?
    <Tooltip tooltip={props.tooltip} placement={props.placement}>
        <Button {...props} ref={props.bref} />
    </Tooltip> :
    <Button {...props} ref={props.bref}/>
)
export const samples = [
    (<Button data-large>Hello I'm a large button</Button>),
    (<Button>Hello I'm a button</Button>),
    (<Button data-small>Hello I'm a small button</Button>),
]