import React, {useContext, useEffect, useState} from 'react'
import { Button, Dropdown, Form, Image } from 'react-bootstrap'
import ReactTimeAgo from 'react-time-ago'
import { WAContext } from '../Controllers/WAStore'
import TagPicker from '../Audience/TagPicker'
import { AudienceStoreContext, TagStoreContext } from '../Controllers/AudienceStore'
import { chatTitle, isGroupID, phoneNumber } from '../Controllers/Utils'
import ProgressButton from '../Components/ProgressButton';
import { WAStateContext } from '../Controllers/WAStateStore'
import { ReactComponent as Pin } from '../Images/Pin.svg'
import { ReactComponent as Archive } from '../Images/Archive.svg'
import { ReactComponent as Trash } from '../Images/Trash.svg'
import { ReactComponent as Unread } from '../Images/Unread.svg'
import { ReactComponent as Plus } from '../Images/add.svg'
import { ReactComponent as ThreeDots } from '../Images/ThreeDots.svg';
import ProfilePictureImage from './ProfilePictureImage'
import { ContactFinderWindow } from './ContactFinder'

import './LiveChatProfile.css'
import { bind, unbind } from 'mousetrap'
import TeamMemberPicker from '../Audience/TeamMemberPicker'
import { TeamInfoStoreContext } from '../Controllers/TeamInfoStore'

const PRESENCE_MAP = {
    'available': { text: 'online', color: 'var(--color-tertiary)' },
    'unavailable': { text: 'offline', color: 'var(--color-error)' },
    'composing': { text: 'typing...', color: 'var(--color-secondary)' },
    'recording': { text: 'recording...', color: 'var(--color-primary)' }
}

const PhoneNumber = ({ phone }) => (
    <a href={`tel:${phone}`}>{phone}</a>
)

const ParticipantItem = ({ participant }) => {
    const { openChatByJid } = useContext (WAContext)
    const { isAdmin, removeParticipants, promoteParticipants, demoteParticipants } = useContext(WAContext)
    const { state } = useContext (WAStateContext)
    
    const title = chatTitle(participant)
    const isSelfAdmin = isAdmin()
    const isParticipantAdmin = participant.isAdmin || participant.isSuperAdmin

    const removeOnConfirm = () => {
        if (window.confirm(`Are you sure you want to remove '${title}'?`)) {
            removeParticipants([ participant.jid ])
        }
    }

    return (
        <div className='participant-item'>
            <div className='details'>
                <ProfilePictureImage user={participant} />
                <div>
                    <a onClick={ () => openChatByJid(participant.jid.replace('@c.us', '@s.whatsapp.net')) } style={{ cursor: 'pointer' }}>
                        <h5 style={{display: 'inline-block'}}>{ title.slice(0,20) } </h5> 
                    </a>
                    { isParticipantAdmin && <font style={{color: 'var(--color-error)'}}> (admin)</font> }
                    <br/>
                    { <PhoneNumber phone={phoneNumber(participant.jid)}/> }
                </div>
            </div>
            {   isSelfAdmin && participant.jid !== state?.user?.jid &&
                <div>
                    <Dropdown drop="left">
                        <Dropdown.Toggle variant="ham" style={{ height: '2.5rem', width: '2.5rem' }}>
                            <ThreeDots style={{fill: 'var(--color-secondary)'}} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item style={{ color: 'var(--color-error)' }} onClick={ removeOnConfirm }>
                                Remove
                            </Dropdown.Item>
                            <Dropdown.Item onClick={ () => isParticipantAdmin ? demoteParticipants([ participant.jid ]) : promoteParticipants([ participant.jid ]) }>
                                { isParticipantAdmin ? 'Demote' : 'Make admin' }
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            }
        </div>
    )
}

const LiveChatProfile = () => {
    
    const { selectedChat, addParticipants } = useContext (WAContext)
    const { controller, addEventListener } = useContext (WAStateContext)
    const { patchContacts } = useContext (AudienceStoreContext)
    const { assignTeamMember } = useContext (TeamInfoStoreContext)
    const [operating, setOperating] = useState(false)
    const [assignee, setAssignee] = useState(selectedChat?.profile?.assignee)


    const [openNewChat, setOpenNewChat] = useState(false)
    const contactInfo = selectedChat?.profile
    
    useEffect(() => {
          bind(['ctrl+p', 'meta+p'], (event) => {
            event.preventDefault()
            toggleStar()
          })
          bind(['ctrl+a', 'meta+a'], (event) => {
            event.preventDefault()
            toggleArchive()
          })
          bind(['ctrl+u', 'meta+u'], (event) => {
            event.preventDefault()
          setAsUnread()
          })
      
          return () => {
            unbind(['ctrl+u', 'meta+u', 'ctrl+a', 'meta+a', 'ctrl+p', 'meta+p'])
          }
    }, [selectedChat])

    const toggleArchive = async () => {
        await controller.updateChat (selectedChat?.jid, selectedChat.archive === 'true' ? 'unarchive' : 'archive')   
    }

    const toggleStar = async () => {
        await controller.updateChat (selectedChat?.jid, selectedChat.pin ? 'unpin' : 'pin') 
    }

    const deleteChat = async () => {
        if (!window.confirm(
            'You cannot recover this chat\'s conversations after deleting it. Are you sure?'
        )) return

        await controller.deleteChat (selectedChat?.jid)
    }
    const setAsUnread = async () => {
        await controller.chatRead (selectedChat.jid, false)
    }
    
    /*const reloadContactInfo = async () => {
        setContactInfo(undefined)
        if (!selectedChat?.jid || !selectedChat.jid.endsWith('@s.whatsapp.net')) {
            setContactInfo (undefined)
            return
        }
        const contact = await fetchContact (selectedChat.jid.replace('@s.whatsapp.net', ''))
        setContactInfo(contact)
    }

    useEffect (() => {
        reloadContactInfo()
    }, [ selectedChat?.jid ])
   

    useEffect(() => addEventListener('chat-update', update => {
        if (!update.count || !update.messages) return
        
        const m = update.messages[0]
        if (m.key.remoteJid === selectedChat?.jid && !contactInfo) {
            setTimeout(reloadContactInfo, 2_500)
        }
    }), [ contactInfo, selectedChat?.jid ])*/
  
    const doAsync = async (op) => {
      setOperating(true)
      try {
        await op()
      } finally {
        setOperating(false)
      }
    }

    if (!selectedChat?.jid) {
        return <div></div>
    }
    const item = Object.values(selectedChat?.presences || {})[0]
    const presence = !isGroupID(selectedChat?.jid) && PRESENCE_MAP[item?.lastKnownPresence || 'unavailable']
    const names = new Set([ chatTitle (selectedChat) ])
    contactInfo?.name && names.add ( contactInfo.name )

    const metadata = selectedChat?.metadata

    return (
      <div className="live-chat-inbox-inner" style={{ maxWidth: '20rem' }}>
        <h3 className="flex-def" style={{ minHeight: '3rem' }}>
          Profile
          <div className="chat-profile-buttons">
            {selectedChat?.count === 0 && (
              <ProgressButton
                variant="secondary"
                data-color="quat"
                loaderType="spinner"
                loaderColor="var(--color-primary)"
                tooltip="Mark chat unread (Ctrl/Cmd+u)"
                onClick={setAsUnread}
              >
                <Unread />
              </ProgressButton>
            )}

            <ProgressButton
              variant="secondary"
              data-color="quat"
              loaderType="spinner"
              loaderColor="var(--color-note)"
              className={selectedChat?.pin && 'strike-through'}
              tooltip={selectedChat?.pin ? 'Unpin chat (Ctrl/Cmd+p)' : 'Pin chat (Ctrl/Cmd+p)'}
              onClick={toggleStar}
            >
              <Pin />
            </ProgressButton>
            <ProgressButton
              variant="secondary"
              data-color="quat"
              loaderType="spinner"
              loaderColor="var(--color-error)"
              className={selectedChat?.archive === 'true' && 'strike-through'}
              tooltip={selectedChat?.archive === 'true' ? 'Unarchive chat (Ctrl/Cmd+h)' : 'Archive chat (Ctrl/Cmd+h)'}
              onClick={toggleArchive}
            >
              <Archive />
            </ProgressButton>
            <ProgressButton
              tooltip={'Delete chat'}
              variant="secondary"
              data-color="quat"
              loaderType="spinner"
              loaderColor="var(--color-error)"
              onClick={deleteChat}
            >
              <Trash />
            </ProgressButton>
          </div>
        </h3>
        <hr />
        <div style={{ color: 'var(--color-hex)' }}>
          <div className="name-list">Name(s): {[...names].join(', ')}</div>
          <br />
          {selectedChat.jid.endsWith('@s.whatsapp.net') && (
            <>
              Phone Number: <PhoneNumber phone={phoneNumber(selectedChat.jid)} /> <br />
            </>
          )}
          {!isGroupID(selectedChat?.jid || '') && (
            <>
              Presence: <font style={{ color: presence.color }}> {presence.text} </font> <br />
            </>
          )}
          {selectedChat.presence === 'unavailable' && (
            <>
              Last Seen:{' '}
              {selectedChat.lastSeen ? <ReactTimeAgo date={new Date(selectedChat.lastSeen * 1000)} /> : 'N/A'} <br />
            </>
          )}
          {contactInfo && (
            <>
              Messages Sent: {contactInfo.messagesSent?.toString()} <br />
              Messages Received: {contactInfo.messagesReceived?.toString()} <br />
            </>
          )}
        </div>
        {contactInfo && (
          <div className="assignee-container">
            <h4>Assigned</h4>
            <TeamMemberPicker
              assignee={assignee}
              setAssignee={(newAssignee) => {
                setAssignee(newAssignee)
                doAsync(() => assignTeamMember(contactInfo.phone, newAssignee))
              }}
              disabled={operating}
            />
          </div>
        )}
        {contactInfo && (
          <>
            <h4>Tags</h4>
            <TagPicker
              maxSelectableTags={20}
              tagType="static"
              selectedTags={new Set(contactInfo.tags.map((t) => t.name))}
              setSelectedTags={() => {}}
              removedTag={(id) => {
                contactInfo.tags = contactInfo.tags.filter((tag) => tag.name !== id)
                //setContactInfo ({...contactInfo})

                patchContacts(new Set([contactInfo.phone]), { removeTags: [id] })
              }}
              addedTag={(name) => {
                contactInfo.tags.push({ name })
                //setContactInfo ({...contactInfo})

                patchContacts(new Set([contactInfo.phone]), { addTags: [name] })
              }}
            />
          </>
        )}
        {metadata?.participants && isGroupID(selectedChat.jid) && (
          <>
            <ContactFinderWindow
              visible={openNewChat}
              hide={setOpenNewChat}
              onSelectedJid={(jid) => addParticipants([jid])}
            />
            <h5 className="flex-def">
              Participants
              <Button variant="ham" style={{}} onClick={() => setOpenNewChat(true)}>
                <Plus style={{ fill: 'var(--color-secondary)', width: '1.25rem', height: '1.25rem' }} />
              </Button>
            </h5>
            <div className="participant-array">
              {metadata.participants.map((participant) => (
                <ParticipantItem participant={participant} />
              ))}
            </div>
          </>
        )}
      </div>
    )

}
export default LiveChatProfile