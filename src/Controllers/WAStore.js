import AwesomeDebouncePromise from "awesome-debounce-promise";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import useConstant from "use-constant";
import { ChatDB, isGroupID, isValidJid, phoneNumber, whatsappID } from "./Utils";
import { WAStateContext } from "./WAStateStore";
import { AlertCentralContext } from "../Components/AlertCentral";
import HistoryContext from './HistoryContext'
import { NotificationCentralContext } from "../Components/NotificationCentral";
import { AudienceStoreContext, TagStoreContext } from "./AudienceStore";
import { TeamInfoStoreContext } from "./TeamInfoStore";

const CHAT_PAGE_SIZE = 20
const selectedJidFromLocation = () => {
    const link = window.location.pathname
    if (link && link.length > 1) {
        const [page, jid] = link.substring (1).split ('/')
        if (page === 'livechat') { // if a number is set
            return jid || ''
        }
    }
}
const updateMetadataParticipantMap = chat => {
    if (chat.metadata && !chat.metadata?.participantMap) {
        chat.metadata.participantMap = {}
        chat.metadata.participants && (
            chat.metadata.participants.forEach (item => chat.metadata.participantMap[item.jid] = item)
        )
    }
}
const useWAStore = () => { 
    const { state, controller, addEventListener } = useContext (WAStateContext)
    const { addMessageNotification } = useContext(NotificationCentralContext)
    const { fetchContact } = useContext (AudienceStoreContext)
    const alerts = useContext (AlertCentralContext)
    const history = useContext (HistoryContext)
    const { currentUser } = useContext(TeamInfoStoreContext)

    const [selectedChat, _setSelectedChat] = useState (undefined)
    const [chats, setChats] = useState(ChatDB())
    const [hasMoreChats, setHasMoreChats] = useState (true)
    const [loadingChats, setLoadingChats] = useState (false)
    const [chatLoadingError, setChatLoadingError] = useState(undefined)

    const [requiresRefresh, setRequiresRefresh] = useState (false)

    const totalChatStore = useRef({
        chats: ChatDB(),
        cursor: undefined,
        hasMoreChats: false,
        hasSomeChats: false
    })

    const cursor = useRef (null)
    const chatRetreivalPromise = useRef(Promise.resolve())
    const chatsRetreivals = useRef({})

    const [filters, setFilters] = useState (
        {
            group: undefined,
            unread: undefined,
            archived: undefined,
            searchString: undefined,
            assignedToMe: undefined,
            tags: new Set([]),
        }
    )
    const curFilters = useRef(filters)
    const alterFilters = alt => {
        const f = { ...filters, ...alt }
        setFilters(f)
        curFilters.current = f
    }
    const alterFiltersDebounced = useConstant (() => AwesomeDebouncePromise(alterFilters, 250))

    const updateSelectedJid = jid => {
        history.push ('/livechat/' + jid)
    }
    const hasFilter = () => Object.values(filters).findIndex(value => typeof value !== 'undefined' && (typeof value !== 'object' || value.size)) >= 0
    
    const fetchChats = async _chats => {
        if (loadingChats || !state.chats.hasSome) return

        setChats(_chats)
        setLoadingChats (true)
        setChatLoadingError(undefined)
        // load chats based on query
        chatRetreivalPromise.current = (async () => {
            const result = await controller.loadChats ({ ...filters, before: cursor.current, count: CHAT_PAGE_SIZE })
            let isSame = true
            Object.keys(filters).forEach(key => {
                if (filters[key]?.toString() !== curFilters.current[key]?.toString()) {
                    isSame = false
                }
            })
            if (!hasFilter()) {
                const totalChats = totalChatStore.current.chats
                totalChatStore.current.cursor = result.cursor
                totalChatStore.current.hasSomeChats = true
                totalChatStore.current.hasMoreChats = result.chats.length >= CHAT_PAGE_SIZE
                result.chats.forEach(chat => {
                    const oldChat = totalChats.get(chat.jid)
                    oldChat && totalChats.delete(oldChat)

                    totalChats.insert(chat)
                })
            }
            if (isSame) {
                return insertMoreChats(result, _chats)
            }
        })()

        try {
            await chatRetreivalPromise.current
        } catch (error) {
            console.error(`error in loading chats`, error)
            setChatLoadingError(error)
        } finally {
            setLoadingChats (false)
        }
    }
    const insertMoreChats = (result, chats) => {
        const totalChats = (chats || ChatDB()).filter (() => true)
        result.chats.forEach (chat => {
            if (chat.jid === 'status@broadcast') return
            const oldChat = totalChats.get(chat.jid)
            oldChat && totalChats.delete(oldChat)
            
            shouldInsert(chat, filters) && totalChats.insert(chat)
        })
        // set the chats
        cursor.current = result.cursor
        
        setChats (totalChats)
        setHasMoreChats (result.chats.length >= CHAT_PAGE_SIZE)

        return totalChats
    }
    const setSelectedChat = chat => {
        if (!chat) {
            console.warn('tried to set undefined chat')
            return
        }
        _setSelectedChat (chat)
        updateSelectedJid (chat.jid)
    }
    const shouldInsert = (chat, filters) => (
        (
            (typeof filters.searchString === 'undefined' || (chat.name?.toLowerCase().includes(filters.searchString.toLowerCase()) || chat.jid.includes(filters.searchString))) &&
            (typeof filters.archived === 'undefined' || (filters.archived ? chat.archive === 'true' : !chat.archive)) &&
            (typeof filters.unread === 'undefined' || (filters.unread ? chat.count !== 0 : chat.count === 0)) &&
            (typeof filters.group === 'undefined' || (isGroupID(chat.jid) === filters.group)) &&
            (filters.tags.size === 0 || (!!chat.profile?.tags.find(({ name }) => filters.tags.has(name)))) &&
            (typeof filters.assignedToMe === 'undefined' || (chat.profile?.assignee === currentUser?.id))
        )
    )
    
    /** utility function to update a chat */
    const updateChat = (update, chats) => {
        const jid = update.jid
        const shouldFindIfNotFound = update.hasNewMessage // if there is a new message
        let chat = chats.get (jid)
        if (jid === 'status@broadcast') return
        if (!chat && selectedChat?.jid !== jid && shouldFindIfNotFound) {
            chat = {
                jid,
                t: Math.floor(new Date().getTime()/1000),
                messages: [],
            }
            // assign to chat
            fetchChat (jid, false)
            .then (c => {
                c && Object.assign(chat, { ...c, t: chat.t })
                setRequiresRefresh (true)
            })
            .catch (error => console.error(`error in fetching chat ${jid}: `, error))
        }
        let shouldBeInserted = !!chat // should it be inserted into the DB
        if (!chat && selectedChat?.jid === jid) {
            chat = {...selectedChat}
        }
        if (chat) {
            const newChats = chats.filter (c => c.jid !== jid)   
            // execute update
            if (update.archive === 'false') {
                delete chat.archive
                return
            }
            if (update.pin === 'false') {
                delete chat.pin
                return
            }
            if (update.messages && update.hasNewMessage) {
                if (!update.messages[0].note) {
                    chat.messages = [ update.messages[0] ]
                }
            }
            if (update.messages && update.messages.length > 1) {
                delete update.messages
            }
            if (update.presences) {
                chat.presences = { ...(chat.presences || {}), ...update.presences }
                delete update.presences
            }
            Object.keys (update).forEach (key => chat[key] = update[key])

            if (shouldBeInserted && shouldInsert(chat, filters)) {
                newChats.insert (chat)
            }
            //setChats (newChats) // update state
            if (selectedChat?.jid === jid) {
                _setSelectedChat ({ ...chat })
            }
            return newChats
        }
    }
    const fetchChat = async (jid, createNewIfNotFound=true) => {
        if (!chatsRetreivals.current[jid]) {
            chatsRetreivals.current[jid] = _fetchChat(jid, createNewIfNotFound)
                .catch(err => {})
                .finally(() => { delete chatsRetreivals.current[jid] })
        }
        return chatsRetreivals.current[jid]
    }
    const _fetchChat = async (jid, createNewIfNotFound=true) => {
        const chatDB = await chatRetreivalPromise.current || chats

        let chat = chatDB.get (jid)
        if (!chat) {
            try {
                chat = await controller.loadChat(jid)
            } catch (error) {
                if (error.message === 'not found') {

                } else throw error
            }
        }
        if (!chat && createNewIfNotFound) {
            chat = {
                jid,
                t: Math.floor(new Date().getTime()/1000),
                messages: [],
            }
        }
        if(!isGroupID(jid) && !chat?.profile) {
            chat.profile = await fetchContact(jid.replace('@s.whatsapp.net', ''))
        }
        updateMetadataParticipantMap(chat)
        return chat
    }
    const locationChanged = () => {
        const jid = selectedJidFromLocation ()
        if (jid && jid.length >= 2 && jid !== selectedChat?.jid) { // if a number is set
            if (isValidJid(jid)) fetchChat (jid).then (setSelectedChat)
            else if (selectedChat?.jid) updateSelectedJid (jid)
        }
    }
    const chatsUpdateListener = updates => {
        let newChats = chats
        updates.forEach(update => {
            const jid = whatsappID (update.jid)
            if (update.delete) {
                newChats = chats.filter (chat => chat.jid !== jid)
                updateSelectedJid ('')
            } else {
                const chats = updateChat (update, newChats)
                if (chats) newChats = chats
            }
        })
        setChats(newChats)
    }
    const chatRead = chat => {
        if (!!chat.count) {
            console.log (`reading chat: ${chat.jid}`)
            
            controller.chatRead (chat.jid) // read the chat if opened
            .catch(err => {})
        }
    }

    const addParticipants = jids => (
        controller.updateGroupParticipants(selectedChat.jid, 'add', jids)
    )
    const removeParticipants = jids => (
        controller.updateGroupParticipants(selectedChat.jid, 'remove', jids)
    )
    const promoteParticipants = jids => (
        controller.updateGroupParticipants(selectedChat.jid, 'promote', jids)
    )
    const demoteParticipants = jids => (
        controller.updateGroupParticipants(selectedChat.jid, 'demote', jids)
    )
    const isAdmin = (jid) => {
        jid = jid || state?.user?.jid
        const metadata = selectedChat?.metadata
        if (!metadata) return false 
        const value = metadata.participantMap && metadata.participantMap[jid]
        return value?.isAdmin || value?.isSuperAdmin
    }
    const updateMetadata = (jid, update) => {
        const chat = chats.get(jid)
        if (!chat || !chat.metadata) return

        update(chat.metadata)
        if (selectedChat?.jid === chat.jid) {
            setSelectedChat({ ...chat })
        }
    }
    useEffect (() => addEventListener('chats-received', ({ hasNewChats }) => {
        if (hasNewChats) {
            //insertMoreChats(chatsPage, !hasNewChats && chats)
            setFilters({ ...filters })
            const chat = selectedChat?.jid && chats.get(selectedChat.jid)
            chat && setSelectedChat({ ...chat })
        }
    }), [ addEventListener, chats, selectedChat, filters ])
    useEffect (() => addEventListener('chat-new', chat => {
        if (shouldInsert(chat, filters)) {
            const newChats = chats
            newChats.insert (chat)
            setChats (newChats)
        }
    }), [ addEventListener, chats, filters, selectedChat ])
    useEffect (() => addEventListener('chats-update', chatsUpdateListener), [ chats, selectedChat, filters ])
    useEffect (() => addEventListener('chat-update', u => chatsUpdateListener([u])), [ chats, selectedChat, filters ])

    useEffect (() => addEventListener('chat-update', u => {
        if(u.hasNewMessage) {
            const actualMessage = u.messages[0]
            const senderId = actualMessage.key.remoteJid
            if(!actualMessage.key.fromMe && (selectedChat?.jid !== senderId  || !document.location.href.includes('livechat'))){
                const chat = chats.get(senderId)
                if (chat && !chat.mute) {
                    const participant = actualMessage.participant
                    addMessageNotification(senderId,chat?.name,actualMessage.message, updateSelectedJid, participant)
                }
            }
        }
    }), [ addEventListener,chats,selectedChat,addMessageNotification ])

    // refresh chats when the filters are changed
    useEffect (() => {
        const { chats, cursor: tCursor, hasSomeChats, hasMoreChats } = totalChatStore.current
        
        if (!hasFilter() && hasSomeChats) {
            setChats(chats)
            setHasMoreChats(hasMoreChats)
            cursor.current = tCursor
        } else {
            
            const chatDB = chats.filter(chat => shouldInsert(chat, filters))
            if (hasSomeChats && !hasMoreChats) {
                setChats(chatDB)
                setHasMoreChats(hasMoreChats)
                cursor.current = tCursor
            } else {
                fetchChats (chatDB)
            }
        }
    }, [filters])

    useEffect (() => addEventListener('close', ({ reason, isReconnecting }) => {
        if (reason === 'intentional' || reason === 'cancelled' || isReconnecting) return
        const txt = reason === 'replaced' ? 
                    'WhatsApp was opened somewhere else. Press \'Connect\' on Inbox to open WhatsApp on Xman' : 
                    'WhatsApp unexpectedly disconnected. Press \'Connect\' on Inbox to open WhatsApp on Xman'
        alerts.show (txt)
    }), [ alerts ])

    useEffect (() => (
        history.listen (({ location }) => {
            locationChanged ()
        })
    ), [ selectedChat, chats, loadingChats ])

    useEffect (() => {
        const jid = selectedJidFromLocation ()
        if (jid === '' && !selectedChat?.jid) {
            const chat = chats.all().find(c => c.count === 0)
            if (chat) updateSelectedJid (chat.jid)
        } else if (jid !== selectedChat?.jid) {
            fetchChat(jid)
            .then(_setSelectedChat)
        }

        const unread = chats.all().reduce ((t, c) => c.count > 0 ? t+1 : t, 0)

        if (unread > 0) document.title = `Xman Dashboard (${unread})`
        else document.title = `Xman Dashboard`
    }, [ chats, selectedChat?.jid ])

    useEffect(() => {
        if (!selectedChat?.jid) return

        controller.chatPresenceSubscribe (selectedChat.jid)
        .catch(err => console.error('failed to subscribe', err))
        
        Promise.all(
            [
                (isGroupID(selectedChat.jid) && !selectedChat.metadata) ?
                controller.getGroupMetadata(selectedChat?.jid) :
                Promise.resolve(),

                (!isGroupID(selectedChat.jid) && !selectedChat?.profile) ?
                fetchContact(selectedChat.jid.replace('@s.whatsapp.net', '')) :
                Promise.resolve()
            ]
        )
        .then(([metadata, profile]) => {
            if (metadata) {
                selectedChat.metadata = metadata
                updateMetadataParticipantMap(selectedChat)
            }
            if (profile) {
                selectedChat.profile = profile
            }
            if ((metadata || profile) && selectedJidFromLocation() === selectedChat.jid) {
                _setSelectedChat({ ...selectedChat })
            }
        })
        .catch(error => console.error(`error in obtaining extra data `, error))
    }, [ selectedChat?.jid ])

    useEffect (() => {
        if(requiresRefresh) {
            setChats ( chats.filter(() => true) )
            setRequiresRefresh (false)
        } 
    }, [ requiresRefresh, chats, selectedChat ])

    useEffect(() => (
        addEventListener('group-participants-update', update => {
            updateMetadata(update.jid, metadata => {
                update.participants.forEach(jid => {
                    switch (update.action) {
                        case 'add':
                            if (!metadata.participantMap[jid]) {
                                const item = { jid, isAdmin: false }
                                metadata.participantMap[jid] = item
                                metadata.participants.push(item)
                            }
                        break
                        case 'remove':
                            delete metadata.participantMap[jid]
                            metadata.participants = metadata.participants.filter(i => i.jid !== jid)
                        case 'promote':
                        case 'demote':
                            const item = metadata.participantMap[jid]
                            if (item) {
                                item.isAdmin = update.action === 'promote'
                                item.isSuperAdmin = update.action === 'promote'
                            }
                        break
                    }
                })
            })
        })
    ), [ addEventListener, chats ])

    useEffect(() => (
        addEventListener('group-update', update => {
            
        })
    ), [ addEventListener, chats ])

    return {
        chats,
        fetchMoreChats: async () => {
            if (!hasMoreChats) return
            await fetchChats (chats)
        },
        filters,
        chatLoadingError,
        alterFilters,
        alterFiltersDebounced,
        hasMoreChats,
        selectedChat,
        setSelectedChat,
        loadingChats,
        chatRead,
        isAdmin,
        addParticipants,
        removeParticipants,
        promoteParticipants,
        demoteParticipants,
        openChatByJid: jid => updateSelectedJid (jid)
    }
}
const WAContext = createContext ({ 
    chats: ChatDB(), 
    openChatByJid: jid => {}, 
    fetchMoreChats: () => {}, 
    alterFiltersDebounced: () => {}, 
    alterFilters: () => {}, 
    hasMoreChats: false, 
    selectedChat: null, 
    setSelectedChat: () => {},
    isAdmin: jid => false, 
    addParticipants: jids => {}, 
    removeParticipants: jids => {},
    promoteParticipants: jids => {},
    demoteParticipants: jids => {}
})
export { useWAStore, WAContext }