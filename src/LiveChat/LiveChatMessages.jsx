import React, { useContext, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import { chatOnline, chatTitle } from '../Controllers/Utils'
import LiveChatMessageView from './LiveChatMessageView'
import NewMessageBox from './NewMessageBox'
import { WAContext } from '../Controllers/WAStore'
import ProfilePictureImage from './ProfilePictureImage'
import { useWAMessagesStore } from '../Controllers/WAMessageStore'
import { ReactComponent as Reload } from '../Images/Reload.svg'
import { ReactComponent as Clear } from '../Images/Clear.svg'
import Tooltip from '../Components/Tooltip'
import Button from '../Components/Button'
import ForwardMessageWindow from './ForwardMessageWindow'
import './LiveChatMessages.css'

const LiveChatMessages = () => {
  const { selectedChat, onSelectedJid } = useContext(WAContext)
  const {
    messages,
    fetchMoreMessages,
    hasMore,
    sendMessage,
    sendTyping,
    loading,
    reloading,
    reloadMessages,
    clearingPending,
    clearPendingMessages,
  } = useWAMessagesStore()

  const [quotedMessage, setQuotedMessage] = useState(null)
  const [showForwardWindow, setShowForwardWindow] = useState(false)
  const [forwardingMessageId, setForwardingMessageId] = useState('')
  const messagesRef = useRef(null)

  const openForwardWindowAndSetMessage = (message) => {
    setForwardingMessageId(message)
    setShowForwardWindow(true)
  }

  const typing = Object.values(selectedChat?.presences || {}).find((p) => p.lastKnownPresence === 'composing')

  useEffect(() => {
    setQuotedMessage(null)
    setTimeout(() => {
      if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current?.scrollHeight
    }, 250)
  }, [selectedChat?.jid])

  const content = (
    <div className="messages-view" style={{ flexGrow: '10' }}>
      <ForwardMessageWindow
        visible={showForwardWindow}
        hide={() => setShowForwardWindow(false)}
        onSelectedJid={onSelectedJid}
        messageId={forwardingMessageId}
        chatId={selectedChat?.jid}
      />
      {selectedChat?.jid && (
        <>
          <div className="chat-profile-header">
            <div className="chat-profile-display">
              <div className="profile-container">
                <ProfilePictureImage
                  height="95%"
                  style={{ cursor: 'pointer' }}
                  user={selectedChat}
                  className="profile-image"
                />
              </div>

              <div>
                <h4>
                  <Tooltip tooltip={chatTitle(selectedChat)} placement="bottom">
                    <span> {chatTitle(selectedChat).slice(0, 30)} </span>
                  </Tooltip>
                  {chatOnline(selectedChat) && <div className="chat-available" />}
                </h4>
                <font>{!!typing ? 'typing...' : ''}</font>
              </div>
            </div>
            {selectedChat?.jid && (
              <div>
                <Button
                  data-color="quat"
                  variant="transparent"
                  style={{ height: '2.5rem', width: '2.5rem' }}
                  tooltip="Clears all pending/scheduled messages for this chat"
                  placement="bottom"
                  onClick={() => clearPendingMessages(selectedChat.jid)}
                  disabled={clearingPending}
                >
                  <Clear />
                </Button>
                <Button
                  data-color="quat"
                  variant="transparent"
                  style={{ height: '2.5rem', width: '2.5rem' }}
                  tooltip="Refreshes the messages of this chat. Use if you find some messages missing"
                  placement="bottom"
                  onClick={() => reloadMessages(selectedChat.jid)}
                  disabled={reloading}
                >
                  <Reload className={reloading && 'refreshing-spinner'} />
                </Button>
              </div>
            )}
          </div>

          <div className="message-list">
            <div id="messages-scroll-parent" ref={messagesRef}>
              <InfiniteScroll
                scrollableTarget="messages-scroll-parent"
                dataLength={messages.length}
                scrollThreshhold="5rem"
                style={{ display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}
                inverse={true}
                next={fetchMoreMessages}
                hasMore={hasMore}
              >
                {[...messages].reverse().map((message,i) => (
                  <LiveChatMessageView
                    message={message}
                    openForwardWindowAndSetMessage={openForwardWindowAndSetMessage}
                    setQuotedMessage={setQuotedMessage}
                    key={i}
                  />
                ))}
                {loading && <Spinner animation="border" />}
              </InfiniteScroll>
            </div>
          </div>
          {selectedChat?.read_only !== 'true' && (
            <div>
              <NewMessageBox
                sendMessage={sendMessage}
                quotedMessage={quotedMessage}
                setQuotedMessage={setQuotedMessage}
                updatedMessage={sendTyping}
                fileLimit={5}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
  return content
}
export default LiveChatMessages
