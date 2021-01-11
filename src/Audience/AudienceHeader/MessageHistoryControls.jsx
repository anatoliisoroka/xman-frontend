import React, { useContext, useEffect, useRef, useState } from 'react'
import { Dropdown, DropdownButton, Form, Spinner } from 'react-bootstrap'
import ReactDatePicker from 'react-datepicker'
import { AlertCentralContext } from '../../Components/AlertCentral'
import Button from '../../Components/Button'
import Tooltip from '../../Components/Tooltip'
import { AudienceStoreContext, TagStoreContext } from '../../Controllers/AudienceStore'
import { messageTimestampToDate } from '../../Controllers/Utils'
import { WAStateContext } from '../../Controllers/WAStateStore'
import TagPicker from '../TagPicker'
import './FilterDropdown.css'

const DEF_PAGE_SIZE = 99

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
                    tooltip='Tag contacts by whether a message has been sent/received'
                    placement='bottom'>
                    <span>Message History</span>
                </Tooltip>
            }
            data-medium>
            <MessageHistoryContent onClickOutside={ () => show && setShow(false) }/>
        </DropdownButton>
    )
}
const MessageHistoryContent = ({ onClickOutside }) => {
    const { controller, state } = useContext (WAStateContext)
    const { getTag } = useContext (TagStoreContext)
    const { patchContacts } = useContext (AudienceStoreContext)
    const alerts = useContext (AlertCentralContext)

    const [selectedTags, setSelectedTags] = useState(new Set())
    const [messageText, setMessageText] = useState('')
    const [messageInclude, setMessageInclude] = useState ('all')
    const [messagesFrom, setMessagesFrom] = useState(undefined)
    const [messagesTill, setMessagesTill] = useState(undefined)

    const [resultsLength, setResultsLength] = useState (0)
    const [searching, setSearching] = useState (false)

    const ref = useRef(null)
    const cancelled = useRef(false)

    const onDatesChange = dates => {
        const [start, end] = dates
        start && start.setHours(0, 0, 0)
        end && end.setHours(23, 59, 59)
        setMessagesFrom(start)
        setMessagesTill(end)
    }

    const toggleSearching = () => {
        if (searching) cancelled.current = true
        else beginSearching ()
    }

    const beginSearching = async () => {
        if (messageText.length < 2) return alerts.error ('Please enter at least 2 characters to search', 3500)
        if (selectedTags.size === 0) return alerts.error ('Please select at least 1 tag', 3500)
        if (state.connections.waWeb !== 'open') return alerts.error ('Please connect your account to WA from Inbox!', 3500)

        setSearching (true)

        console.log('tagging from ', messagesFrom, ' to ', messagesTill)

        const startEpoch = messagesFrom && messagesFrom.getTime()
        const endEpoch = messagesTill && messagesTill.getTime()

        console.log('search params: ', { startEpoch, endEpoch, messageInclude })

        const contacts = new Set ([])
        let page = 1
        let reachedLast = false

        setResultsLength (0)

        try {
            while (!reachedLast) {
                const { last, messages } = await controller.searchMessages ({ searchString: messageText, count: DEF_PAGE_SIZE, page })
                messages
                    .map (m => 
                        (messageInclude === 'all' || messageInclude === m.key.fromMe.toString()) && 
                        (typeof endEpoch === 'undefined' || messageTimestampToDate(m.messageTimestamp).getTime() < endEpoch) &&
                        (typeof startEpoch === 'undefined' || messageTimestampToDate(m.messageTimestamp).getTime() > startEpoch) &&
                        !m.key.remoteJid.endsWith('@g.us') &&
                        m.key.remoteJid.split ('@')[0]
                    )
                    .filter (Boolean)
                    .forEach(value => contacts.add(value))

                page += 1
                const lastM = messages[messages.length-1]
                reachedLast = (startEpoch && messageTimestampToDate(lastM.messageTimestamp).getTime() < startEpoch) || last
    
                setResultsLength (contacts.size)
    
                if (cancelled.current) {
                    setSearching (false)
                    cancelled.current = false
                    return
                }
            }
        } catch (error) {
            console.error(error)
            alerts.error('Encountered an error while searching!', 3000)
            setSearching(false)
            return
        }

        console.log (`finished search, tagging...`, contacts)
        let contactsArray = [...contacts]
        try {
            // tag in chunks
            while (contactsArray.length > 0) {
                await patchContacts (new Set(contactsArray.slice(0, 100)), { addTags: [...selectedTags] })
                contactsArray = contactsArray.slice(100)
            } 

            alerts.show ('Successfully tagged ' + contacts.size + ' contacts!', 3000)
        } catch (error) {
            console.error (error)
            alerts.error ('Failed to tag results!')
        } finally {
            setSearching (false)
        }
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
        <div className='message-history-content' ref={ref}>
            <div className='message-title'>Tag by Message History </div>
            <Form.Control 
                placeholder='Enter message text...' 
                as="textarea" 
                className='message-search' 
                contentEditable={!searching} 
                rows={4} 
                value={messageText} 
                onChange={ e => setMessageText(e.target.value) }/>
            <div className='message-include'>
            <div className='message-prompt'>Include:</div>
                <Form.Control className='message-include-select' as="select" value={messageInclude} onChange={e => setMessageInclude(e.target.value)}>
                    <option value='all'>All</option>
                    <option value='true'>Only sent by me</option>
                    <option value='false'>Only recieved by me</option>
                </Form.Control>
            </div>
            <div className='message-select'>
                <div className='message-prompt'>Select tags:</div>
                
                <TagPicker 
                    maxSelectableTags={5} 
                    selectedTags={selectedTags} 
                    tagType='static' 
                    setSelectedTags={setSelectedTags}/>
            </div>

            <div className='message-select' style={{flexDirection: 'column'}}>
                <Tooltip tooltip='Contacts who sent messages from the start of the start day and the end of the end day in this range will be tagged. By default this is disabled.'>
                    <div className='message-prompt'>Date Range: </div>
                </Tooltip>
                
                <ReactDatePicker
                    className="date-picker"
                    selected={messagesFrom}
                    startDate={messagesFrom}
                    endDate={messagesTill}
                    onChange={onDatesChange}
                    dateFormat="MMMM d"
                    selectsRange
                    inline
                    shouldCloseOnSelect={false}
                />
            </div>

            <hr/>

            { searching &&
                <>
                <div className='flex-def'>
                    Found {resultsLength} chats...
                    <Spinner animation='border'/>
                </div>
                <div className='danger-text'>
                    (You can close the dropdown, but do not refresh the page!)
                </div>
                </>
            }

            <Button data-color={searching ? 'danger' : 'secondary'} onClick={toggleSearching}>
                { searching ? 'Cancel' : 'Tag' } 
            </Button>
        </div>
    )
}