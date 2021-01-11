import React, { useContext, useEffect, useRef, useState } from 'react'
import { Dropdown, DropdownButton, Form, Spinner } from 'react-bootstrap'
import { AlertCentralContext } from '../../Components/AlertCentral'
import ProgressButton from '../../Components/ProgressButton'
import Tooltip from '../../Components/Tooltip'
import { AudienceStoreContext, TagStoreContext } from '../../Controllers/AudienceStore'
import TagPicker from '../TagPicker'
import {FirebaseContext} from "./../../Firebase"
import './FilterDropdown.css'

export default () => {
    const [show, setShow] = useState (false)

    return (
        <DropdownButton 
            variant='transparent' 
            drop='right'
            show={show}
            onClick={ () => setShow(true) }
            title={
                <Tooltip
                    tooltip='Search for contacts, create tags from filters'
                    placement='bottom'>
                    <span>Filter</span>
                </Tooltip>
            }
            data-medium>
            <FilterDropdown onClickOutside={ () => show && setShow(false) } />
        </DropdownButton>
    )
}

export const FilterDropdown = ({ onClickOutside }) => {
    const { createTag } = useContext (TagStoreContext)
    const { filters, setFilters, formattedFilters } = useContext (AudienceStoreContext)
    const alerts = useContext (AlertCentralContext)

    const { analytics } = useContext(FirebaseContext)


    const ref = useRef(null)

    const createSegment = async () => {
        const name = window.prompt ('What would you like to call this segment?', '')
        if (!name) return

        await createTag (name, true, formattedFilters())

        alerts.show (`Successfully created segment '${name}'`, 3500)
        analytics.logEvent('segment_created')
    }

    useEffect(() => {
        const handleClickOutside = event => {
            if (ref.current && !ref.current.contains(event.target)) {
                onClickOutside ()
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [  ref, onClickOutside ])

    return (
        <div className='filter-dropdown' ref={ref}>
            <div className="filter-container">
            <div className="filter-title">Filter</div>
                <span  className='flex-def'>
                    <Form.Control 
                        className="filter-search"
                        placeholder='Search names...' 
                        defaultValue={ filters['search-string'] || '' } 
                        onChange={ e => setFilters({ 'search-string': e.target.value }) }/>
                </span>
                <div className='filter-tags'>
                    <div className='filter-prompt'>Include: </div>
                    <TagPicker 
                        selectedTags={filters.tags} 
                        maxSelectableTags={5}
                        setSelectedTags={ tags => setFilters({ tags }) } />
                </div>
                <div className='filter-tags'>
                    <div className='filter-prompt'>Exclude Tags: </div>
                    <TagPicker 
                        selectedTags={filters['not-tags']} 
                        tagType='static' 
                        maxSelectableTags={5}
                        setSelectedTags={ tags => setFilters({ 'not-tags': tags }) } />
                </div>
                <div className='message-container'>
                <div className='filter-prompt'>Min messages sent: </div>
                    <Form.Control className="message-input" onChange={ e => setFilters({ 'min-messages-sent': e.target.value }) }/>
                    
                </div>
                <div className='message-container'>
                <div className='filter-prompt'>Max messages sent: </div>
                    <Form.Control className="message-input" onChange={ e => setFilters({ 'max-messages-sent': e.target.value }) }/>
                </div>
                <div className='message-container'>
                <div className='filter-prompt'>Min messages recieved: </div>
                    <Form.Control className="message-input" onChange={ e => setFilters({ 'min-messages-recv': e.target.value }) }/>
                    </div>
                 <div className='message-container'>
                <div className='filter-prompt'>Max messages recieved: </div>
                    <Form.Control className="message-input" onChange={ e => setFilters({ 'max-messages-recv': e.target.value }) }/>
                </div>
                <hr/>
                {/* </div> */}
                <ProgressButton onClick={createSegment} data-color='secondary' tooltip='Save these filters as a segment' placement='bottom' className='create-button'>
                    Create Segment
                </ProgressButton>
            </div>
        </div>
    )
}