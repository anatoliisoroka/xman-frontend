import React, { useContext, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Collapse, Spinner } from 'react-bootstrap'
import { ReactComponent as Compose } from '../Images/Compose.svg'
import RadioButtons from '../Components/RadioButtons'
import LiveChatRow from './LiveChatRow'
import { WAContext } from '../Controllers/WAStore'
import { useState } from 'react'
import TagPicker from '../Audience/TagPicker'
import Button from '../Components/Button'
import { ReactComponent as FilterRight } from '../Images/filterRight.svg'
import { ReactComponent as RightCaret } from '../Images/caretRightFill.svg'
import { ReactComponent as LeftCaret } from '../Images/caretLeftFill.svg'
import { ReactComponent as X } from '../Images/x.svg'
import './LiveChatInbox.css'
import Tooltip from '../Components/Tooltip'
import { useIsScrollable } from '../Utils/useIsScrollable'
import { WAStateContext } from '../Controllers/WAStateStore'
import ProgressButton from '../Components/ProgressButton'
import NewConversationWindow from './NewConversationWindow'
import debounce from '../Utils/debounce'
import { bind, unbind } from 'mousetrap'
import Checkbox from '../Components/Checkbox'

const ArchiveDivider = () => <div className="archive-divider">Archived</div>

const LiveChatStateModifier = () => {
  const { state, controller } = useContext(WAStateContext)

  const noAlertRequired = state.connections.waWeb === 'open' && state.connections.phone && state.chats.hasLatest
  if (noAlertRequired) return <div />

  return (
    <div className="chat-row live-chat-state">
      {state.connections.waWeb === 'open' && (
        <>
          {!state.chats.hasLatest ? (
            <div className="flex-def" style={{ maxWidth: '20rem' }}>
              <span>
                We're waiting for WhatsApp to send your latest chats. This can take some time.
                <br />
                <br />
                Presently, all your automation tools are functional and you can message new people right away <br />
                <br />
                <Spinner animation="border" />
              </span>
            </div>
          ) : (
            state.connections.phone === false && (
              <div className="flex-def" style={{ maxWidth: '20rem' }}>
                <span style={{ color: 'var(--color-error)' }}>Your phone is disconnected from the internet!</span>
              </div>
            )
          )}
        </>
      )}
      {state.connections.waWeb === 'connecting' && (
        <div className="flex-def">
          <span>Connecting...</span>
          <Spinner animation="border" />
        </div>
      )}
      {state.connections.waWeb === 'close' && (
        <div className="flex-def">
          <span style={{ color: 'var(--color-error)' }}>Disconnected from WA</span>
          <ProgressButton data-color="tertiary" data-small onClick={() => controller.open()}>
            Connect
          </ProgressButton>
        </div>
      )}
    </div>
  )
}

export default () => {
  const {
    chats,
    filters,
    alterFilters,
    alterFiltersDebounced,
    fetchMoreChats,
    hasMoreChats,
    openChatByJid,
    loadingChats,
    selectedChat,
    chatLoadingError
  } = useContext(WAContext)
  const [openNewChat, setOpenNewChat] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterByAssignedToMe, setFilterByAssignedToMe] = useState(false)
  const searchRef = useRef(null)
  const [showSearchTooltip, setShowSearchTooltip] = useState(false)
  const [isScrollable, ref, node] = useIsScrollable([chats])

  const selectNextOrPreviousChat = async (direction) => {
    const dropdownIsOpen = !!document.getElementsByClassName('flow-menu-content')[0]
    const newMessageIsOpen = !!document.getElementsByClassName('new-message-content')[0]
    if (!dropdownIsOpen && !newMessageIsOpen) {
      const newIndex = selectedChat
        ? chats.all().findIndex((chat) => chat.jid === selectedChat.jid) + (direction === 'previous' ? -1 : 1)
        : 0

      if (newIndex !== -1 && newIndex < chats.all().length) {
        openChatByJid(chats.all()[newIndex].jid)
        const startScrollingIndex = Math.floor(node.offsetHeight / 66) - 1
        if (newIndex > startScrollingIndex && direction === 'next') {
          node.scrollTo({ top: node.scrollTop + 66, behavior: 'smooth' })
        } else if (direction === 'previous') {
          node.scrollTo({ top: node.scrollTop + -66, behavior: 'smooth' })
        }
      }
    }
  }

  useEffect(() => {
    bind('up', (event) => {
      event.preventDefault()
      debounce(selectNextOrPreviousChat('previous'), 200)
    })
    bind('down', (event) => {
      event.preventDefault()
      debounce(selectNextOrPreviousChat('next'), 200)
    })
    bind(['ctrl+s', 'meta+s'], (event) => {
      event.preventDefault()
      setTimeout(() => searchRef.current.focus(), 100)
    })
    bind(['ctrl+g', 'meta+g'], (event) => {
      event.preventDefault()
      setOpenNewChat(true)
    })
    bind(['ctrl+f', 'meta+f'], (event) => {
      event.preventDefault()
      setShowFilters(!showFilters)
    })

    return () => {
      unbind(['ctrl+f', 'meta+f', 'ctrl+g', 'meta+g', 'ctrl+s', 'meta+s', 'up', 'down'])
    }
  }, [selectedChat, chats])

  useEffect(() => {
    if (!node || loadingChats) return

    if (!isScrollable && !chatLoadingError && hasMoreChats && window.location.href.includes('/livechat')) {
      fetchMoreChats()
    }
  }, [loadingChats, isScrollable, hasMoreChats, node])

  useEffect(() => {
    alterFilters({ assignedToMe: filterByAssignedToMe ? true : undefined })
  }, [filterByAssignedToMe])

  return (
    <div style={{ flexGrow: collapsed ? 0 : 1, flexDirection: 'column', maxWidth: '24rem' }}>
      <NewConversationWindow visible={openNewChat} hide={setOpenNewChat} onSelectedJid={openChatByJid} />

      <div className="live-chat-inbox-title" data-collapsed={collapsed}>
        <div
          onClick={() => setCollapsed(!collapsed)}
          clasName="collapse-icon"
          style={{ zIndex: 1, position: 'relative', margin: 0 }}
        >
          {React.createElement(collapsed ? RightCaret : LeftCaret, {
            style: { position: 'absolute', top: -6, left: -6 },
          })}
        </div>

        <div>
          <div className="flex-def" style={{ justifyContent: 'space-around' }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-around ',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <Button
                tooltip="Open Filters (Ctrl/Cmd+f)"
                placement="bottom"
                variant="transparent"
                style={{ width: '3rem', height: '3rem' }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterRight style={{ height: 'inherit', width: 'inherit', top: 0, left: 5 }} />
              </Button>
              <Tooltip tooltip="Search Chats (Ctrl/Cmd+s)" show={showSearchTooltip}>
                <input
                  onMouseEnter={() => setShowSearchTooltip(true)}
                  onMouseLeave={() => setShowSearchTooltip(false)}
                  ref={searchRef}
                  className="search-box"
                  placeholder="Search WA Chats..."
                  onChange={(ev) => alterFiltersDebounced({ searchString: ev.target.value })}
                />
              </Tooltip>
              {searchRef.current?.value && (
                <Button
                  tooltip="Clear search"
                  placement="bottom"
                  variant="transparent"
                  style={{ width: '2.1rem', height: '2.1rem', position: 'absolute', right: '3rem' }}
                  onClick={() => {
                    searchRef.current.value = ''
                    alterFilters({ searchString: '' })
                  }}
                >
                  <X style={{ height: 'inherit', width: 'inherit', top: 0, left: 0 }} />
                </Button>
              )}
              <Button
                tooltip="Start a new conversation or create a group (Ctrl/Cmd+g)"
                placement="bottom"
                variant="transparent"
                style={{ width: '2.1rem', height: '2.1rem' }}
                onClick={() => setOpenNewChat(true)}
              >
                <Compose style={{ height: 'inherit', width: 'inherit', top: 0, left: 0 }} />
              </Button>
            </div>
          </div>
        </div>

        <Collapse in={showFilters}>
          <div className="live-chat-inbox-inner filters">
            <TagPicker
              drop='down'
              tagType='static'
              maxSelectableTags={5}
              selectedTags={filters.tags}
              setSelectedTags={tags => alterFilters({ tags })}
            />
            <div className="assign-filter">
              <div>Assigned to me</div>
              <Checkbox checked={filterByAssignedToMe} setChecked={setFilterByAssignedToMe} />
            </div>
            <RadioButtons
              values={['All', 'Group', 'Individual']}
              onChange={(_, i) => alterFilters({ group: i === 0 ? undefined : i === 1 ? true : false })}
            />
            <RadioButtons
              values={['All', 'Unread', 'Read']}
              onChange={(_, i) => alterFilters({ unread: i === 0 ? undefined : i === 1 ? true : false })}
            />
            <RadioButtons
              values={['All', 'Inbox', 'Archived']}
              onChange={(_, i) => alterFilters({ archived: i === 0 ? undefined : i == 2 })}
            />
          </div>
        </Collapse>
      </div>
      <div onClick={() => setCollapsed(!collapsed)} style={{ display: collapsed ? 'block' : 'none' }}>
        <RightCaret />
      </div>
      <div
        className="live-chat-inbox-inner"
        id="live-chat-inbox"
        data-collapsed={collapsed}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'stretch',
          alignItems: 'stretch',
          overflow: 'scroll',
        }}
        ref={ref}
      >
        <InfiniteScroll
          scrollableTarget="live-chat-inbox"
          dataLength={chats.all().length}
          next={fetchMoreChats}
          hasMore={hasMoreChats}
        >
          <LiveChatStateModifier />
          {chats.all().map((chat, idx) => (
            <>
              {idx - 1 >= 0 && chats.all()[idx - 1]?.archive !== chat.archive && (
                <ArchiveDivider key={`${chat.jid}-div`} />
              )}
              <LiveChatRow chat={chat} key={chat.jid} />
            </>
          ))}
          {loadingChats && <Spinner animation="border" />}
          {chatLoadingError && (
            <div className='chat-row live-chat-state'>
              <span>
              Oh no, there was an error!
              </span>
              <Button 
                variant='primary' 
                data-color='secondary' 
                data-small 
                onClick={fetchMoreChats}
                style={{maxWidth: '5rem'}}>
                Retry
              </Button>
            </div>
          )}
        </InfiniteScroll>
      </div>
    </div>
  )
}
