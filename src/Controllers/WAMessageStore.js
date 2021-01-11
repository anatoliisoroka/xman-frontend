import { useContext, useEffect, useRef, useState } from "react"
import { AlertCentralContext } from "../Components/AlertCentral"
import { MessageTemplatesControllerContext } from "./MessageTemplatesController"
import {  constructPendingMessage, constructPendingNote, isGroupID, phoneNumber, whatsappID } from "./Utils"
import { WAStateContext } from "./WAStateStore"
import { WAContext } from "./WAStore"
import {FirebaseContext} from "./../Firebase"

const MESSAGES_PAGE_SIZE = 20

export const useWAMessagesStore = () => {
    const {controller, state, addEventListener} = useContext (WAStateContext)
    const flowController = useContext (MessageTemplatesControllerContext)
    const { selectedChat, chats, chatRead } = useContext (WAContext)
    const alerts = useContext (AlertCentralContext)
    const { analytics } = useContext(FirebaseContext)

    const [messages, setMessages] = useState ([])
    const [hasMore, setHasMore] = useState (true)
    const [loading, setLoading] = useState (false)
    const [reloading, setReloading] = useState (false)
    const [clearingPending, setClearingPending] = useState(false)

    const messageStore = useRef ({})
    const selectedJidRef = useRef('')
    const typingTimeout = useRef(null)

    const hasE2EMessage = messages => messages.find(m => m.messageStubType === 'E2E_ENCRYPTED')

    const insertAtRightIndex = (messages, message) => {
        const idx = messages.findIndex (m => (
            (m.key.id === message.key.id) ||
            +(m.messageTimestamp.low || m.messageTimestamp) >= +(message.messageTimestamp.low || message.messageTimestamp)
        ))
        if (idx < 0) messages.push (message)
        else if(messages[idx].key.id !== message.key.id) messages.splice (idx, 0, message)
    }
    const selectedJid = () => selectedJidRef.current
    const makeMessageStoreIfRequired = jid => {
        if (!messageStore.current[jid]) messageStore.current[jid] = { messages: [], cursor: undefined, hasMore: true }
    }
    const updateSelectedChatMessages = jid => {
        if (selectedJid () !== jid) return
        
        const obj = messageStore.current[jid]
        setMessages ([...obj.messages])
        setHasMore (obj.hasMore)
    }
    const fetchMessages = async (jid) => {
        const currentJid = selectedJid ()
        
        makeMessageStoreIfRequired (jid)
        const obj = messageStore.current[jid]
        if (currentJid === jid) {
            setLoading (true)
            updateSelectedChatMessages (jid)
        }
        try {
            const result = await controller.loadMessages (jid, MESSAGES_PAGE_SIZE, obj.cursor)
            const previousMessages = obj.messages
            const totalMessages = [ ...(obj.cursor ? previousMessages : []) ]
            result.messages.forEach (m => (
                !totalMessages.find(m2 => m.key.id === m2.key.id) && insertAtRightIndex(totalMessages, m)
            ))
            obj.hasMore = (totalMessages.length-previousMessages.length >= MESSAGES_PAGE_SIZE) &&
                            !hasE2EMessage(result.messages)
            obj.messages = totalMessages
            obj.cursor = result.cursor
        } catch (error) {
            alerts.error ('Failed to load more messages!', 3000)
        } finally {
            updateSelectedChatMessages (jid)
            setLoading (false)
        }
    }
    const sendMessage = ({ type, message }) => {
        // tag the message, so we know when it finishes correctly
        message = { ...message, tag: new Date().toISOString() + Math.floor(Math.random()*10000).toString() } 
        
        const jid = selectedJid()
        if (message.audio?.ptt) {
            delete message.audio.ptt
            message.pttAudio = true
        }

        makeMessageStoreIfRequired (jid)

        const newMessages = messageStore.current[jid].messages
        let pending
        switch (type) {
            case 'message':
                if (!message.scheduleAt) {
                    message.scheduleAt = Math.floor(new Date().getTime()/1000)
                }
                
                pending = constructPendingMessage (jid, message, state.user?.jid)
                analytics.logEvent('message_sent')
                if (message.quoted) { // prep for sending
                    message.quotedID = message.quoted.key.id
                    delete message.quoted
                }
                break
            case 'note':
                pending = constructPendingNote (jid, message)
                analytics.logEvent('note_created')
                break
            case 'message-flow':
                const flow = flowController.flowCache[message.flow]
                pending = constructPendingMessage (jid, { ...message, ...flow }, state.user?.jid)
                pending.pending = message
                break
        }

        controller.relayPendingMessage(pending)

        insertAtRightIndex (newMessages, pending)
        updateSelectedChatMessages (jid)

        selectedChat?.jid && chatRead(selectedChat)
    }
    const fetchMoreMessages = () => fetchMessages (selectedChat?.jid)

    const reloadMessages = async jid => {
        if (state.connections?.waWeb !== 'open') {
            return alerts.error ('Please make sure you\'re connected to WA Web before reloading the connection')
        }
        setReloading(true)
        
        try {
            await controller.clearMessageCache(jid)
            const mObj = messageStore.current[jid]
            if (mObj) delete messageStore.current[jid]
            await fetchMessages(jid)
        } finally {
            setReloading(false)
        }
    }
    const clearPendingMessages = async jid => {
        if (!window.confirm('Are you sure you want to clear all pending messages of this chat?')) return

        setClearingPending(true)

        try {
            await controller.clearPendingMessages(jid)
            const mObj = messageStore.current[jid]
            if (mObj) {
                mObj.messages = mObj.messages.filter(m => !m.scheduled && !m.pending)
            }
            updateSelectedChatMessages(jid)
            alerts.show('Pending messages cleared!')
        } finally {
            setClearingPending(false)
        }
    }

    const clearTypingTimeout = () => {
        if(!!typingTimeout) {
            clearTimeout (typingTimeout.current)
            typingTimeout.current = null
        }
    }

    const sendTyping = ({message}) => {
        if (!message || !message.text) return 
        if (!selectedChat?.jid) return
        if (typingTimeout.current) return
        if (state.connections.phone === false || state.connections.waWeb !== 'open') return
        // wait 10 seconds before sending next typing
        typingTimeout.current = setTimeout (clearTypingTimeout, 10000)

        controller.sendTyping (selectedChat.jid)
        .catch(err => {})
    }
    const updateMessages = updates => (
        updates.forEach(update => {
            if (!update.messages) return
            
            const jid = update.messages[0].key.remoteJid
            if (jid === 'status@broadcast') return
            
            if (update.count) { // new message
                makeMessageStoreIfRequired (jid)
            }
            const mObj = messageStore.current[jid]   
            if (!mObj) return  
            
            const newMessages = mObj.messages
            update.messages.forEach (message => {
                if (message.tag) {
                    const idx = newMessages.findIndex (m => m.tag === message.tag)
                    if (idx >= 0) newMessages[idx] = message
                    else insertAtRightIndex(newMessages, message)
                } else {
                    const idx = newMessages.findIndex (m => {
                        if (message.messageStubType === 'REVOKE') {
                            return m.key.id === (message.message?.protocolMessage?.key?.id || message.key.id)
                        }
                        return m.key.id === message.key.id
                    })
                    if (idx >= 0) newMessages[idx] = message
                    else insertAtRightIndex (newMessages, message)
                }
            })    
            updateSelectedChatMessages (jid)
        })
    )

    useEffect (() => addEventListener('chat-update', u => updateMessages([u])), [ addEventListener, selectedChat?.jid, messages ])
    useEffect (() => addEventListener('chats-update', updateMessages), [ addEventListener, selectedChat?.jid, messages ])

    useEffect (() => addEventListener('message-status-update', update => {
        const jid = whatsappID (update.to)
        const mObj = messageStore.current[jid]
        if (!mObj) return

        const groupOffset = isGroupID (jid) ? 1 : 0

        const newMessages = mObj.messages
        if (update.type >= 3) {
            update.ids.forEach (id => {
                const msg = newMessages.find (m => m.key.id === id)
                if (msg) msg.status = (update.type >= 4+groupOffset) ? 'READ' : 'DELIVERY_ACK'
            })
        }
        updateSelectedChatMessages (jid)
    }), [ addEventListener, selectedChat?.jid, messages ])

    useEffect(() => {
        chats.all().forEach(chat => {
            const messages = chat.messages
            if (messageStore.current[chat.jid] || messages.length === 0) return
            
            messageStore.current[chat.jid] = {
                hasMore: !hasE2EMessage(messages),
                cursor: JSON.stringify({ id: messages[0].key.id, fromMe: messages[0].key.fromMe }),
                messages: [ ...messages ]
            }
            if (selectedChat?.jid === chat.jid) {
                updateSelectedChatMessages(chat.jid)
            }
        })
    }, [ chats, messageStore, selectedChat ])
    useEffect (() => {
        clearTypingTimeout ()
        
        const jid = selectedChat?.jid
        selectedJidRef.current = jid
        const mObj = jid && messageStore.current[jid]
        if (!jid) {
            setMessages([])
            setHasMore(false)
        } else if (mObj && (mObj.messages.length >= MESSAGES_PAGE_SIZE || !mObj.hasMore)) {
            updateSelectedChatMessages (jid)
        } else {
            fetchMessages (jid)
        }
    }, [selectedChat?.jid])

    return {
        messages,
        clearingPending,
        reloading,
        reloadMessages,
        clearPendingMessages,
        fetchMoreMessages,
        sendMessage,
        loading,
        hasMore,
        sendTyping
    }
}