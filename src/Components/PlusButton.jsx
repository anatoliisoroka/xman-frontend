import React from 'react'
import Button from 'react-bootstrap/Button'
import { ReactComponent as Plus } from '../Images/add.svg'

const PlusButton = props => (
    <Button {...props} variant='plus'>
        <Plus style={{fill: 'var(--color-quat)'}}/>
    </Button>
)
export default PlusButton