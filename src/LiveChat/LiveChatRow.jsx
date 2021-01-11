import React, {useContext} from 'react'
import ReactTimeAgo from 'react-time-ago'
import { chatOnline, chatTitle } from '../Controllers/Utils'
import { WAContext } from '../Controllers/WAStore'
import './LiveChatRow.css'
import LiveChatTextView from './LiveChatTextView'
import ProfilePictureImage from './ProfilePictureImage'


const LiveChatRow = ({chat}) => {
    const { selectedChat, chatRead, setSelectedChat } = useContext (WAContext)
    const hasUnread = !!chat.count

    const lastMessage = chat?.messages[chat.messages.length-1]

    const clicked = () => {
        setSelectedChat (chat)
        chatRead(chat)
    }

    return (
        <div className={`chat-row ${chat.jid === selectedChat?.jid ? 'chat-row-selected' : ''}`} onClick={clicked}>
            <div className='chat-row-inner' >
                <div style={{height: '3rem'}}>
                    <ProfilePictureImage height='95%' user={chat} className='profile-image'/>
                </div>
                <div className='chat-row-info' >
                    <b>
                        { chatTitle(chat).slice(0, 30) }  
                        { chatOnline(chat) && <div className='chat-available'/> } 
                    </b>
                    { 
                        lastMessage && (
                            <LiveChatTextView 
                                message={lastMessage}
                                chat={chat}
                                parseTemplate={false}
                                asSnippet={true}/>
                        ) 
                    }
                </div>
            </div>
            <div className={`chat-row-time ${hasUnread ? 'chat-row-time-unread' : ''}`} >
                <ReactTimeAgo date={ new Date(chat.t*1000) } timeStyle='twitter'/>
                {
                    hasUnread && <span className='chat-unread'>&nbsp;</span> 
                }
            </div>
        </div>
    )

}
export default LiveChatRow