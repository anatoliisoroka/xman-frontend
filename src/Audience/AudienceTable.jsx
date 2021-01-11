import React, { useContext, useState } from 'react'
import { Dropdown, Form, Modal, Spinner, Table } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import { AudienceStoreContext, TagStoreContext } from '../Controllers/AudienceStore'
import TagPicker from './TagPicker'
import { ReactComponent as ThreeDots } from '../Images/ThreeDots.svg'
import Checkbox from '../Components/Checkbox'
import HistoryContext from '../Controllers/HistoryContext'
import NewMessageBox from '../LiveChat/NewMessageBox'
import { WAStateContext } from '../Controllers/WAStateStore'
import Tooltip from '../Components/Tooltip'
import { phoneNumber } from '../Controllers/Utils'
import './AudienceTable.css'
import TeamMemberPicker from './TeamMemberPicker'
import { TeamInfoStoreContext } from '../Controllers/TeamInfoStore'

const QuickMessageModal = ({ contact, hide }) => {
  const { controller } = useContext(WAStateContext)

  const sendMessage = async ({ type, message }) => {
    if (type === 'message') {
      await controller.sendMessage(`${contact.phone}@s.whatsapp.net`, message)
    }
    hide()
  }

  return (
    <div className="quick-container">
      <Modal show={true} onHide={hide} centered>
        <div className="quick-title"> Quick Message '{contact.name}' </div>
        <Modal.Body className="quick-body">
          <div>
            <NewMessageBox
              fileLimit={1}
              allowedTypes={new Set(['message', 'message-flow'])}
              showButtons={true}
              sendMessage={sendMessage}
            />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

/**
 * @param {{ contact: Contact }} param0
 */
const ContactRow = ({ contact }) => {
  const history = useContext(HistoryContext)
  const { isSelected, toggleSelectContact, patchContacts, deleteContacts } = useContext(AudienceStoreContext)
  const { assignTeamMember } = useContext(TeamInfoStoreContext)

  const [operating, setOperating] = useState(false)
  const [openQuickModal, setOpenQuickModal] = useState(false)

  const doAsync = async (op) => {
    setOperating(true)
    try {
      await op()
    } finally {
      setOperating(false)
    }
  }

  return (
    <>
      {openQuickModal && <QuickMessageModal contact={contact} hide={setOpenQuickModal} />}
      <tr>
        <td>
          <Checkbox checked={isSelected(contact.phone)} setChecked={() => toggleSelectContact(contact.phone)} />
        </td>
        <td>
          <span style={{ fontSize: '1.1rem' }}>{contact.name}</span>
          <br />
          <a className="number" href={`tel:${phoneNumber(contact.phone)}`}>
            {phoneNumber(contact.phone)}
          </a>
        </td>
        <td>
          {' '}
          {contact.lastContacted ? new Date(contact.lastContacted * 1000).toLocaleString().slice(0, -3) : 'N/A'}{' '}
        </td>
        <td>
          <TagPicker
            drop="down"
            tagType="static"
            maxSelectableTags={10}
            selectedTags={new Set(contact.tags.map(({ name }) => name))}
            setSelectedTags={(tags) => {}}
            addedTag={(id) => doAsync(() => patchContacts(new Set([contact.phone]), { addTags: [id] }))}
            removedTag={(id) => doAsync(() => patchContacts(new Set([contact.phone]), { removeTags: [id] }))}
          />
        </td>
        <td>{contact.messagesSent}</td>
        <td>{contact.messagesReceived}</td>
        <td>
          <TeamMemberPicker
            assignee={contact.assignee}
            setAssignee={(assignee) => doAsync(() => assignTeamMember(contact.phone, assignee))}
            disabled={operating}
          />
        </td>
        <td className="flex-def">
          {operating && <Spinner animation="border" />}
          <Dropdown drop="left">
            <Dropdown.Toggle variant="ham" style={{ height: '2.5rem', width: '2.5rem' }}>
              <ThreeDots style={{ fill: 'var(--color-secondary)' }} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item
                style={{ color: 'var(--color-error)' }}
                onClick={() => doAsync(() => deleteContacts(new Set([contact.phone])))}
              >
                Delete
              </Dropdown.Item>
              <Dropdown.Item onClick={() => history.push(`/livechat/${contact.phone}@s.whatsapp.net`)}>
                Chat
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setOpenQuickModal(true)}>Quick Message</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </td>
      </tr>
    </>
  )
}

export default () => {
  const {
    deleteSelectedContacts,
    toggleSelectAll,
    totalContacts,
    selectedCount,
    patchSelectedContacts,
    contacts,
    fetchMore,
    hasMore,
    loading,
  } = useContext(AudienceStoreContext)

  return (
    <div id="audience-table-parent">
      <InfiniteScroll
        scrollableTarget="audience-table-parent"
        dataLength={contacts.length}
        scrollThreshhold="3rem"
        next={fetchMore}
        hasMore={hasMore}
        style={{ width: '100%', overflow: 'visible' }}
      >
        <Table variant="xman">
          <thead>
            <tr>
              <th>
                <Checkbox checked={selectedCount === totalContacts && selectedCount > 0} setChecked={toggleSelectAll} />
                {selectedCount > 0 && <span className="selected-count">({selectedCount})</span>}
              </th>
              <th>
                <span>Name/WhatsApp</span>
              </th>
              <th>
                <span>Last Contact</span>
              </th>
              <th>
                <span>Tags</span>
              </th>

              <th style={{ maxWidth: '12rem' }}>
                <Tooltip tooltip="Number of messages sent to this contact by you">
                  <span>Messages Sent</span>
                </Tooltip>
              </th>
              <th style={{ maxWidth: '12rem' }}>
                <Tooltip tooltip="Number of messages sent by this contact to you">
                  <span>Messages Received</span>
                </Tooltip>
              </th>
              <th style={{ maxWidth: '12rem' }}>
                <Tooltip tooltip="Team member assigned to contact">
                  <span>Assignee</span>
                </Tooltip>
              </th>
              <th style={{ width: '1rem' }}>
                {selectedCount > 1 && (
                  <Dropdown drop="left">
                    <Dropdown.Toggle variant="ham" style={{ height: '2.5rem', width: '2.5rem' }}>
                      <ThreeDots style={{ fill: 'var(--color-primary)' }} />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item style={{ color: 'var(--color-error)' }} onClick={deleteSelectedContacts}>
                        Delete
                      </Dropdown.Item>
                      <div className="dropdown-item">
                        <TagPicker
                          drop="down"
                          title="Tag selected contacts"
                          tagType="static"
                          maxSelectableTags={10}
                          selectedTags={new Set()}
                          setSelectedTags={(tags) => {}}
                          addedTag={(tag) => patchSelectedContacts({ addTags: [tag] })}
                        />
                      </div>

                      <div className="dropdown-item">
                        <TagPicker
                          drop="down"
                          title="Remove tag from selected contacts"
                          tagType="static"
                          maxSelectableTags={10}
                          selectedTags={new Set()}
                          setSelectedTags={(tags) => {}}
                          addedTag={(tag) => patchSelectedContacts({ removeTags: [tag] })}
                        />
                      </div>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <ContactRow key={c.phone} contact={c} />
            ))}
          </tbody>
        </Table>
        {loading && <Spinner animation="border" />}
      </InfiniteScroll>
    </div>
  )
}
