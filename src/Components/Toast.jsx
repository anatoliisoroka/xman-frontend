import React, { useEffect, useState } from 'react'
import { Image } from 'react-bootstrap'
import { messageUrl } from '../Controllers/Utils'
import { MESSAGE_TYPE_IMG_MAP } from '../LiveChat/NewMessageBox'
import { Transition } from 'react-transition-group'
import './Toast.css'

const transitionDuration = 200

const defaultStyle = {
  transition: `right ${transitionDuration}ms ease-in-out`,
  position: 'absolute',
  top: 25,
  right: -500,
  zIndex: 10,
  overflow: 'hidden',
  width: '24rem',
}

const transitionStyles = {
  entered: { right: 25 },
  exited: { right: -500 },
}

const NotificationToast = ({ notification, handleClose }) => {
  const [show, setShow] = useState(false)
  const duration = 6000

  const time = () => {
    return new Date(notification?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12:false })
  }

  const handleClick = () => {
    if (notification?.senderId) {
      notification.openChatByJid(notification.senderId)
      handleClose(notification)
    }
  }

  const text = notification?.message?.extendedTextMessage?.text
    ? notification?.message?.extendedTextMessage?.text
    : notification?.message?.conversation

  const FilePreview = ({ file, type }) => {
    const previewUrl = type === 'imageMessage' ? messageUrl({ file }) : MESSAGE_TYPE_IMG_MAP[type]
    return <div className="file-preview">{previewUrl && <img src={previewUrl} alt="file preview" />}</div>
  }

  useEffect(() => {
    if (notification) {
      setShow(true)
    }
  }, [notification])

  useEffect(() => {
    if (notification) {
      setTimeout(() => {
        setShow(false)
        setTimeout(() => handleClose(notification), transitionDuration)
      }, duration)
    }
  }, [notification])

  return (
    <Transition in={show} timeout={transitionDuration}>
      {(state) => (
        <div
          style={{
            ...defaultStyle,
            ...transitionStyles[state],
          }}
          className='hide-without-data'
          data-notification = {!!notification}
        >
          <div className="toast-header">
            <div className="mr-auto">{notification?.title}</div>
            <div style={{marginLeft:'1rem'}}>{time()}</div>
          </div>
          <div className="toast-body" onClick={handleClick}>
            {text?.length > 100 ? `${text.slice(0, 100)}...` : text}
            {notification?.message?.imageMessage && (
              <Image
                alt="preview "
                src={`data:image/jpeg;base64,${notification.message.imageMessage.jpegThumbnail}`}
                className="image-message"
              />
            )}
            {notification?.message?.documentMessage && (
              <FilePreview file={notification?.message?.documentMessage} type="documentMessage" />
            )}
            {notification?.message?.videoMessage && (
              <FilePreview file={notification?.message?.videoMessage} type="videoMessage" />
            )}
            {notification?.message?.stickerMessage && (
              <FilePreview file={notification?.message?.stickerMessage} type="stickerMessage" />
            )}
            {notification?.message?.audioMessage && (
              <FilePreview file={notification?.message?.audioMessage} type="audioMessage" />
            )}
          </div>
        </div>
      )}
    </Transition>
  )
}

export default NotificationToast
