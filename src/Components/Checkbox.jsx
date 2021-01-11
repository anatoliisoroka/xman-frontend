import React from 'react'
import './Checkbox.css'

export default ({ checked, setChecked }) => (
    <div className='custom-checkbox' onClick={ () => setChecked && setChecked (!checked) }>
        <div className='checked-checkbox' style={{ opacity: checked ? '1' : '0', pointerEvents: 'none' }}/>
    </div>
)