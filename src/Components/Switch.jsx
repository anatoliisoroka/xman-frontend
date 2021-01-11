import React from 'react';
import './Switch.css';

/**
 * 
 * @param {React.InputHTMLAttributes} props 
 */
const Switch = (props) => {
  return (
    <div className='switch-parent'>
        { React.createElement ('input', { ...props, className: 'react-switch-checkbox', type: 'checkbox' }) }
        <label htmlFor={props.id}> <span/> </label>
    </div>
  )
}
export default Switch