import React, { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import Alert from 'react-bootstrap/Alert'
import ProgressButton from '../Components/ProgressButton'
import ContactFinder from './ContactFinder'
import { Form } from 'react-bootstrap'

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {function()} props.hide
 * @param {function(string)} props.onSelectedJid
 */
export default ({ visible, hide, submitFunction, pickButtonText, isNewConversation, maxContacts }) => {
  const [contacts, setContacts] = useState({})
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectingContact,setSelectingContact] = useState(false)
  const buttonRef = useRef(undefined)

  const addContact = (contact) => {
    if (!maxContacts) {
      setContacts({ ...contacts, [contact.phone]: contact })
    } else {
        if (Object.values(contacts).length < maxContacts) {
            setContacts({ ...contacts, [contact.phone]: contact })
        }
    }
  }
  const removeContact = (phone) => {
    const newContacts = { ...contacts }
    delete newContacts[phone]
    setContacts(newContacts)
  }

  const submit = async () => {
    await submitFunction(contacts,groupName)
    setContacts({})
  }

  useEffect(() => {
    if (!visible) return
    const onEnter = (event) => event.key === 'Enter' && !selectingContact &&  buttonRef.current.click()
    document.addEventListener('keyup', onEnter)
    return () => document.removeEventListener('keyup', onEnter)
  }, [contacts, visible])

  useEffect(() => {
    isNewConversation && setCreatingGroup(Object.values(contacts).length > 1 ? true : false)
  }, [contacts,isNewConversation])


  return (
    <Modal moun={true} show={visible} onHide={hide} centered>
      {visible && (
        <div className="new-message-content" data-is-group ={Object.values(contacts).length > 1}>
          {creatingGroup && (
            <div className="group-name-container">
              <Form.Control
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                type="text"
                placeholder="Group name..."
              />
            </div>
          )}
          <ContactFinder
            inputPrefix={
              <>
                {Object.values(contacts).map(({ phone, name }) => (
                  <Alert key={phone} variant="selected-contact" onClose={() => removeContact(phone)} dismissible>
                    {name}
                  </Alert>
                ))}
              </>
            }
            allowCreate={true}
            isGroup={Object.values(contacts).length > 1}
            onSelectedContact={addContact}
            setSelectingContact={setSelectingContact}
          />
          <div className="flex-def">
            <ProgressButton
              bref={(ref) => (buttonRef.current = ref)}
              variant="primary"
              data-color="secondary"
              onClick={submit}
              disable={!contacts}
            >
              {pickButtonText(contacts)}
            </ProgressButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
