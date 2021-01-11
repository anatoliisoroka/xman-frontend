import React from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'
import { useState } from 'react'
import { Modal, Image, Form, Button, Spinner } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useAudienceStore } from '../Controllers/AudienceStore'
import { isValidPhoneNumber, phoneNumber } from '../Controllers/Utils'
import './ContactFinder.css'
import ProfilePictureImage from './ProfilePictureImage'
/**
 * @param {Object} props
 * @param {JSX.Element} props.inputPrefix
 * @param {boolean} props.allowCreate
 * @param {function(string)} props.onSelectedContact
 */
const ContactFinder = ({ allowCreate, onSelectedContact, inputPrefix, isGroup, setSelectingContact }) => {
  const [text, setText] = useState('')
  const { contacts, loading, hasMore, fetchMore, setFilters } = useAudienceStore({ requireFilter: true })

  const inputRef = useRef(undefined)
  const scrollRef = useRef(undefined)

  const [selectedContact, setSelectedContact] = useState(null)

  const textPhoneNumber = (contact) => {
    const phone = contact.phone.replace(/[^0-9]/g, '') // + '@s.whatsapp.net'
    onSelectedContact({ phone, name: contact.name || phoneNumber(phone) })
    setText('')
    setSelectingContact(false)

    inputRef.current.focus()
  }

  const selectNextOrPreviousContact = (direction) => {
    setSelectingContact(true)
    const newIndex = selectedContact
      ? contacts.findIndex((contact) => contact.phone === selectedContact.phone) + (direction === 'previous' ? -1 : 1)
      : 0

    if (newIndex !== -1 && newIndex <= contacts.length) {
      console.log(contacts[newIndex])
      setSelectedContact(contacts[newIndex])
      const startScrollingIndex = Math.floor(scrollRef.current.offsetHeight / 77) - 1
      if (newIndex > startScrollingIndex && direction === 'next') {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollTop + 77, behavior: 'smooth' })
      } else if ( direction === 'previous') {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollTop + -77, behavior: 'smooth' })
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.key === 'ArrowUp' && selectNextOrPreviousContact('previous')
      event.key === 'ArrowDown' && selectNextOrPreviousContact('next')
      event.key === 'Enter' && selectedContact && textPhoneNumber(selectedContact)
    }
    document.addEventListener('keydown', handleKeyDown, false)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [selectedContact, contacts])

  useEffect(() => {
    setTimeout(() => {
      inputRef.current.focus()
    }, 100)
  }, [])

  return (
    <div className="new-message-content">
      <div className="number-input">
        {inputPrefix}
        <Form.Control
          //chrome doesnt respect autoComplete="off"
          autoComplete="new-password"
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setFilters({ 'search-string': e.target.value || undefined })
          }}
          type="text"
          placeholder="search contacts or enter phone number with country code"
        />
      </div>

      <div className="new-chat-scroll" id="new-chat-scroll" ref={scrollRef} data-is-group={isGroup}>
        <InfiniteScroll
          scrollableTarget="new-chat-scroll"
          dataLength={contacts.length}
          next={fetchMore}
          hasMore={hasMore}
        >
          {isValidPhoneNumber(text) && allowCreate && (
            <Button
              data-color="contact-select"
              style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
              onClick={() => textPhoneNumber({ phone: text })}
            >
              <font>Message {text}</font>
            </Button>
          )}
          {contacts.map((contact) => (
            <Button
              data-color="contact-select"
              data-selected={contact.phone === selectedContact?.phone}
              onClick={() => textPhoneNumber(contact)}
            >
              <ProfilePictureImage user={{ jid: contact.phone + '@s.whatsapp.net' }} />
              <div>
                <h5>{contact.name || phoneNumber(contact.phone)} </h5> <br />
                <font>{phoneNumber(contact.phone)}</font>
              </div>
            </Button>
          ))}
          {loading && <Spinner animation="border" />}
        </InfiniteScroll>
      </div>
    </div>
  )
}
export default ContactFinder

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {function()} props.hide
 * @param {function(string)} props.onSelectedJid
 */
export const ContactFinderWindow = (props) => (
  <Modal show={props.visible} onHide={props.hide} centered>
    <ContactFinder
      {...props}
      allowCreate={true}
      onSelectedContact={({ phone }) => {
        props.onSelectedJid(`${phone}@s.whatsapp.net`)
        props.hide()
      }}
    />
  </Modal>
)
