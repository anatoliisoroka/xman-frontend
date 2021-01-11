import React, {useEffect, useState, Component} from 'react'
import './RadioButtons.css'

export function RadioButton (props) {
    return (<div 
                key={props.keyValue} 
                className='radio-item'
                data-selected={props.selected}
                onClick={props.onClick}>
                    {props.children}
            </div>)
}

/**
 * @param {Object} props
 * @param {string[]} props.values
 * @param {function(string, number)} props.onChange
 * @param {number} [props.selected]
 * @param {boolean} [props.vertical]
 * @param {Component} [props.button]
 */
export default function RadioButtons (props) {
    const Radio = props.button || RadioButton
    const [selected, setSelected] = useState (props.selected || 0)
    useEffect (() => setSelected(props.selected || 0), [props.selected])
    
    return (
        <div className={(props.className || '') + ' radio-def'} style={{flexDirection: props.vertical ? 'column' : 'row'}}>
            {
                props.values.map ((value, index) => React.createElement(
                    Radio, 
                    {
                        children: value,
                        selected: index===selected,
                        key: `${props.key}_radio_${index}`,
                        keyValue: `${props.key}_radio_${index}`,
                        onClick: () => {setSelected (index);props.onChange(value, index)}
                    }))
            }
        </div>
    )
}