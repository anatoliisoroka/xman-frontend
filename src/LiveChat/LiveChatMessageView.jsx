import React, { useContext, useEffect, useState } from 'react'
import { Button, Image, Spinner, Dropdown, Alert } from 'react-bootstrap'
import {
  classForMessageStatus,
  isGroupID,
  isMessageAction,
  messageTextFromContent,
  phoneNumber,
  senderTitle,
  messageUrl,
  getMessageContent,
  messageTimestampToDate,
} from '../Controllers/Utils'
import AspectRatio from 'react-aspect-ratio'
import { WAStateContext } from '../Controllers/WAStateStore'
import { ReactComponent as DownloadImg } from '../Images/Download.svg'
import { ReactComponent as ThreeDots } from '../Images/ThreeDots.svg'
import { ReactComponent as Clock } from '../Images/Clock.svg'
import { ReactComponent as Error } from '../Images/Error.svg'
import { WebpMachine } from 'webp-hero'
import { WAContext } from '../Controllers/WAStore'
import ImagePreview from './ImagePreview'
import { OggPolyfill } from '../Controllers/OggPolyfill'
import AudienceController from '../Controllers/AudienceController'
import VCARD from 'vcard-parser'

import './LiveChatMessageView.css'
import ProgressButton from '../Components/ProgressButton'
import { createLightColourFromString } from '../Utils/colourHelpers'
import { AlertCentralContext } from '../Components/AlertCentral'
import LiveChatTextView from './LiveChatTextView'
import Tooltip from '../Components/Tooltip'

const webpMachine = new WebpMachine({
  detectWebpImage: (el) => el.getAttribute('typeof') === 'image/webp' && !el.src.startsWith('data:image/png'),
})

const useMediaMessageUrl = ({ content, jid, id, autoDownload }) => {
  const {
    controller,
    state: { mediaUploadsUrl },
  } = useContext(WAStateContext)

  const actualUrl = content.actualUrl || content.file?.url
  const [url, setUrl] = useState(actualUrl)
  const [state, setState] = useState(actualUrl ? 'downloading' : 'empty')

  const download = async () => {
    if (actualUrl) return

    setState('downloading')
    let url = new URL(encodeURIComponent(content.fileSha256), mediaUploadsUrl).toString() + `?q=1`
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.status >= 400) {
        url = await controller.mediaMessageUrl(jid, id)
      }
    } catch (error) {
      console.error(`error in downloading ${jid}:${id}`, error)
      setState('empty')
      url = ''
    }
    content.actualUrl = url
    setUrl(url)
    return url
  }

  useEffect(() => {
    if (autoDownload && !actualUrl) download()
  }, [content, autoDownload])

  return {
    url,
    state,
    setState,
    download,
  }
}

const MessageDownloadable = ({ content, jid, id, children, canPreview, autoDownload = false }) => {
  const { url, state, setState, download } = useMediaMessageUrl({ content, jid, id, autoDownload })
  const [error, setError] = useState('')
  const [openPreview, setOpenPreview] = useState(false)

  return (
    <>
      {canPreview && (
        <ImagePreview
          filename={content.fileName || `image.${content.mimetype.split('/')[1]}`}
          imgUrl={url}
          downloadUrl={url + '&p=3'}
          visible={openPreview}
          hide={setOpenPreview}
        />
      )}
      <AspectRatio ratio="3/4" className="media-container">
        {state !== 'downloaded' && (
          <div className="downloadable-overlay">
            {state === 'empty' && (
              <Button onClick={download} variant="transparent" style={{ height: '3rem', width: '3rem' }}>
                {error ? (
                  <Tooltip
                    tooltip={`There was an error in downloading ${error}. Please check that you have the media on your phone`}
                    placement="top"
                  >
                    <Error style={{ fill: 'var(--color-error)' }} />
                  </Tooltip>
                ) : (
                  <DownloadImg style={{ fill: 'white' }} />
                )}
              </Button>
            )}
            {state === 'downloading' && <Spinner animation="border" />}
          </div>
        )}
        {state !== 'empty' && url && (
          <div
            style={{
              display: state === 'downloaded' ? undefined : 'none',
              cursor: state === 'downloaded' && canPreview ? 'pointer' : undefined,
            }}
          >
            {children(
              url,
              () => setState('downloaded'),
              (error) => {
                setState('empty')
                setError(error.message || ' ')
              },
              () => setOpenPreview(true),
              () => canPreview && setOpenPreview(true),
            )}
          </div>
        )}
        {state !== 'downloaded' &&
          (content.jpegThumbnail ? (
            <Image alt=" " src={`data:image/jpeg;base64,${content.jpegThumbnail}`} className="message-image" />
          ) : (
            <div className="message-sticker"></div>
          ))}
      </AspectRatio>
    </>
  )
}
const MessageVideoView = (props) => (
  <MessageDownloadable {...props} autoDownload={props.content.gifPlayback}>
    {(url, setLoaded, setError) => (
      <video
        className="message-video"
        onLoadedMetadata={setLoaded}
        autoPlay={props.content.gifPlayback}
        controls={!props.content.gifPlayback}
        loop={props.content.gifPlayback}
      >
        <source src={url} onError={setError} type={props.content.mimetype} />
      </video>
    )}
  </MessageDownloadable>
)
const MessageDocumentView = ({ content, jid, id }) => {
  const { download } = useMediaMessageUrl({ content, jid, id, autoDownload: false })

  const downloadDoc = async () => {
    const url = await download()

    const response = await fetch(url)
    const blob = await response.blob()

    const objUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = content.fileName
    document.body.appendChild(a) // we need to append the element to the dom -> otherwise it will not work in firefox

    a.click()
    a.remove() //afterwards we remove the element again
  }
  return (
    <div className="message-document">
      <div>{content.fileName}</div>
      <div>
        <ProgressButton
          loaderType="spinner"
          onClick={downloadDoc}
          variant="transparent"
          style={{ height: '2.25rem', width: '2.25rem' }}
        >
          <DownloadImg style={{ fill: 'var(--color-primary)' }} />
        </ProgressButton>
      </div>
    </div>
  )
}
const MessageImageView = (props) => (
  <MessageDownloadable {...props} canPreview={true} autoDownload={true}>
    {(url, setLoaded, setError, openPreview) => (
      <Image
        src={url}
        onLoad={setLoaded}
        onClick={openPreview}
        onError={setError}
        className={`${props.content.mimetype === 'image/webp' ? 'message-sticker' : 'message-image'}`}
      />
    )}
  </MessageDownloadable>
)
const MessageAudioView = ({ content, jid, id }) => {
  const { url } = useMediaMessageUrl({ content, jid, id, autoDownload: true })
  const [tUrl, didPolyfill] = OggPolyfill({ oggUrl: url, mimetype: content.mimetype })

  return (
    <>
      {didPolyfill ? (
        <audio controls src={tUrl} preload="true" />
      ) : (
        <audio controls preload="true">
          {url && <source src={url} type={content.mimetype?.split(';')[0]} />}
        </audio>
      )}
    </>
  )
}
const MessageContactsView = ({ content }) => {
  return (
    <>
      {content.contacts.map((c, i) => (
        <MessageContactView key={i} content={c} />
      ))}
    </>
  )
}
/**
 * @param {{ content: { displayName: string, vcard: string } }} param0
 */
const MessageContactView = ({ content }) => {
  const { openChatByJid } = useContext(WAContext)
  const alerts = useContext(AlertCentralContext)
  const [contact, setContact] = useState(VCARD.parse(content.vcard))

  const fullName = contact.fn[0].value
  const phoneNumber = contact.tel[0].value
  const waID = contact.tel[0] && contact.tel[0].meta.waid && contact.tel[0].meta.waid[0]

  const addContact = async () => {
    const controller = new AudienceController()
    await controller.addContacts([{ name: fullName, phone: phoneNumber }])
    alerts.show(`Added contact '${fullName}' successfully!`, 3000)
  }

  useEffect(() => {
    setContact(VCARD.parse(content.vcard))
  }, [content.vcard])

  return (
    <div className="contact">
      <div className="flex-def" style={{ marginBottom: '0.25rem' }}>
        <h5>{fullName}</h5>
        <span style={{ textAlign: 'right' }}>{phoneNumber}</span>
      </div>
      <div className="flex-def">
        <ProgressButton onClick={addContact} variant="primary" data-color="secondary" data-small>
          Add to Contacts
        </ProgressButton>
        {waID && (
          <Button
            style={{ marginLeft: '0.25rem' }}
            variant="primary"
            data-color="tertiary"
            data-small
            onClick={() => openChatByJid(`${waID}@s.whatsapp.net`)}
          >
            Message
          </Button>
        )}
      </div>
    </div>
  )
}
const MEDIA_MAP = {
  imageMessage: MessageImageView,
  stickerMessage: MessageImageView,
  audioMessage: MessageAudioView,
  videoMessage: MessageVideoView,
  documentMessage: MessageDocumentView,
  contactMessage: MessageContactView,
  contactsArrayMessage: MessageContactsView,
}
/**
 *
 * @param {{ contextInfo: Object, onClose: function() }} param0
 */
export const MessagePreviewView = ({ contextInfo, onClose }) => {
  const { state } = useContext(WAStateContext)
  const { selectedChat } = useContext(WAContext)
  const jid = contextInfo.participant || (contextInfo?.key.fromMe ? state?.user.jid : contextInfo?.key?.remoteJid)
  const sender = senderTitle(jid, selectedChat.metadata, selectedChat, state?.user.jid)

  const contentObj = contextInfo.quotedMessage || contextInfo.message
  const mText = messageTextFromContent(contentObj)
  const jpeg = contentObj && contentObj[Object.keys(contentObj)[0]]?.jpegThumbnail
  return (
    <Alert variant="message-preview" dismissible={!!onClose} onClose={onClose}>
      {sender && <font className="message-sender">{sender}</font>}
      <div className="text">
        <div>{mText.slice(0, 100) /** max preview 100 chars */} </div>
        {jpeg && <img src={`data:image/jpeg;base64,${jpeg}`} />}
      </div>
    </Alert>
  )
}
/**
 * A single message view
 * @param {Object} props
 * @param {Object} props.message
 * @param {boolean} [props.editable]
 * @param {boolean} [props.parseTemplate]
 * @param {function(Object)} props.setQuotedMessage
 */
const LiveChatMessageView = ({
  message,
  editable,
  parseTemplate,
  setQuotedMessage,
  openForwardWindowAndSetMessage,
}) => {
  const { controller } = useContext(WAStateContext)
  const { selectedChat } = useContext(WAContext)

  const [messageState, setMessageState] = useState(message.pendingPromise ? 'sending' : 'ok')
  const [editing, setEditing] = useState(false)

  const metadata = selectedChat?.metadata || {}

  const messageContent = getMessageContent(message)
  const messageClass = isMessageAction(message)
    ? 'message-action'
    : message.key.fromMe
    ? 'message-from-me'
    : 'message-from-other'
  const messageType = messageContent && Object.keys(message.message)[0]
  const MediaClass = MEDIA_MAP[messageType]

  const senderID =
    isGroupID(message.key.remoteJid) &&
    ((message.participant && metadata?.participantMap && metadata?.participantMap[message.participant]?.name) ||
      phoneNumber(message.participant || message.key.participant || ''))
  const displayName = isGroupID(message.key.remoteJid) &&
  ((message.participant && metadata?.participantMap && (metadata?.participantMap[message.participant]?.name || metadata?.participantMap[message.participant]?.notify))||
    phoneNumber(message.participant || message.key.participant || ''))
  const contextInfo = messageContent && messageContent[messageType]?.contextInfo

  const deleteMessage = async () => {
    if (!message.note) {
      const diff = Math.floor(new Date().getTime() / 1000) - messageTimestampToDate(message.messageTimestamp)
      if (diff >= 3 * 60 * 60) {
        // if it's been more than three hours
        window.alert('You can no longer delete this message!')
        return
      }
      if (!window.confirm('Are you sure you want to delete this message for everyone?')) {
        return
      }
    }
    setMessageState('sending')
    await controller[message.note ? 'deleteNote' : 'deleteMessage'](message.key.remoteJid, message.key.id).finally(() =>
      setMessageState('ok'),
    )
  }
  const retryMessage = () => {
    controller.relayPendingMessage(message)
    setMessageState('sending')
  }
  const onEditComplete = async (text) => {
    setMessageState('sending')
    await controller.editNote(message.key.remoteJid, message.key.id, { text })
    setMessageState('ok')

    setEditing(false)
  }

  useEffect(() => {
    if (messageState === 'sending' && message.pendingPromise) {
      message.pendingPromise.catch((error) => {
        console.error(`error in sending message`, error)
        setMessageState('error')
      })
    }
  }, [messageState])

  return (
    <div className={`message ${messageClass}`}>
      {messageClass !== 'message-action' && messageState === 'ok' && editable !== false && (
        <Dropdown drop={message.key.fromMe ? 'left' : 'right'}>
          <Dropdown.Toggle variant="message-dropdown">
            <ThreeDots style={{ fill: 'var(--color-secondary)' }} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {message.note && <Dropdown.Item onClick={() => setEditing(true)}> Edit </Dropdown.Item>}
            {!message.note && !message.messageStubType && (
              <Dropdown.Item
                onClick={() => {
                  setQuotedMessage(message)
                  document.getElementById('new-message-text-area').focus()
                }}
              >
                {' '}
                Reply{' '}
              </Dropdown.Item>
            )}
            {
              <Dropdown.Item
                onClick={() => {
                  openForwardWindowAndSetMessage(message.key.id)
                }}
              >
                {' '}
                Forward{' '}
              </Dropdown.Item>
            }
            {message.key.fromMe && !message.messageStubType && (
              <Dropdown.Item className="error-text" onClick={deleteMessage}>
                {' '}
                Delete{' '}
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      )}
      {message.key.fromMe && message.scheduled && <Clock className="message-scheduled" />}
      <div
        className={`message-content ${message.note ? 'message-note' : ''} ${
          messageState === 'error' ? 'message-error' : ''
        }`}
      >
        {contextInfo?.stanzaId && <MessagePreviewView contextInfo={contextInfo} />}
        {senderID && messageClass !== 'message-action' && !message.key.fromMe && (
          <Tooltip tooltip={phoneNumber(message.participant || message.key.participant || '')}>
            <font
              className="message-sender"
              style={
                messageClass !== 'message-action' && !message.key.fromMe
                  ? { color: createLightColourFromString(senderID), width: 'fit-content' }
                  : {}
              }
            >
              {displayName}
            </font>
          </Tooltip>
        )}
        {messageState === 'sending' && <Spinner animation="border" className="message-pending-indicator" />}
        {messageState === 'error' && (
          <Button variant="secondary" data-color="danger" className="message-retry" onClick={retryMessage}>
            Retry
          </Button>
        )}
        {MediaClass &&
          React.createElement(MediaClass, {
            content: messageContent[messageType],
            jid: message.key.remoteJid,
            id: message.key.id,
          })}
        <LiveChatTextView
          message={message}
          chat={selectedChat}
          editing={editing}
          parseTemplate={parseTemplate}
          onEdit={onEditComplete}
        />
      </div>
      {messageClass !== 'message-action' && (
        <div className="message-metadata">
          <span className={`message-status ${message.key.fromMe ? classForMessageStatus(message.status) : ''}`}></span>
          <span className="timestamp">{messageTimestampToDate(message.messageTimestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
export default LiveChatMessageView
