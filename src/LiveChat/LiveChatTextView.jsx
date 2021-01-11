import React, { useEffect, useRef } from 'react'
import { useContext } from 'react'
import { TeamInfoStoreContext } from '../Controllers/TeamInfoStore'
import { getMessageContent, isGroupID, MEDIA_DEFAULT_TEXT_MAP, messageText, parsingLinks } from '../Controllers/Utils'
import { WAStateContext } from '../Controllers/WAStateStore'

const PARA_MATCH = /\{[a-zA-Z0-9\-]{1,64}\}/gi
const BOLD_MATCH = /\*(([^\*])+)\*/gi
const ITAL_MATCH = /\_(([^\_])+)\_/gi

/**
 * A message text view
 */
export default ({
    message, 
    chat, 
    parseTemplate=true, 
    asSnippet=false, 
    editing=false,
    onEdit=text => {}
}) => {
    const { state } = useContext (WAStateContext)
    const { currentUser, teamMembers } = useContext(TeamInfoStoreContext)
    const textRef = useRef(undefined)

    const metadata = chat?.metadata || {}

    const messageContent = getMessageContent(message)
    const messageType = messageContent && Object.keys(message.message)[0]

    const participants = message.note ? teamMembers : (chat && isGroupID(chat.jid) || '' ? metadata?.participants : [ chat || {} ])
    const meID = message.note ? currentUser.id : state?.user?.jid

    let text
    if (asSnippet) {
        const typing = Object.values(chat && chat.presences || {}).find(p => p.lastKnownPresence === 'composing')
        if (typing) {
            text = isGroupID(chat.jid) ? `${typing.name} is typing...` : 'typing...'
        } else {
            text = messageText(message, meID, participants)
        }
    } else {
        text = messageText(message, meID, participants)
    }
    if (asSnippet) {
        if (!text) text = MEDIA_DEFAULT_TEXT_MAP[messageType] || ''
        if (text.length > 40) text = text.slice (0, 40) + '...' 
    }

    if (parseTemplate) text = text.replace(PARA_MATCH, str => `<font style='color: var(--color-secondary); font-weight: bold'>${str}</font>`)
    text = text.replace(BOLD_MATCH, str => `<b>${str.slice(1,-1)}</b>`)
    text = text.replace(ITAL_MATCH, str => `<i>${str.slice(1,-1)}</i>`)
    text = parsingLinks(text)

    useEffect (() => {
        if (editing) {
            textRef.current.focus ()
            textRef.current.addEventListener ('blur', onEdit)

            return () => textRef.current.removeEventListener ('blur', onEdit)
        }
    }, [editing])
    
    return (
        <font 
            contentEditable={editing} 
            ref={textRef} 
            dangerouslySetInnerHTML={{ __html: text }}  />
    )
}