import React, {useContext} from 'react'
import LiveChatStateView from './LiveChatStateView'
import { BeatLoader } from 'react-spinners'
import { WAStateContext } from '../Controllers/WAStateStore'
import { useWAStore, WAContext } from '../Controllers/WAStore'

import LiveChatHeader from './LiveChatHeader'
import LiveChatInbox from './LiveChatInbox'
import LiveChatMessages from './LiveChatMessages'
import LiveChatProfile from './LiveChatProfile'

import './LiveChat.css'

const LiveChatContent = () => {
    const { state } = useContext(WAStateContext)
    const user = state.user

    const store = useWAStore ()

    return (
        <WAContext.Provider value={store}>
            {
                user && (
                    <div className='live-chat-main-panel'>
                        <LiveChatInbox />
                        <LiveChatMessages />
                        <LiveChatProfile />
                    </div>
                ) 
            }
        </WAContext.Provider>
    )
}

export default function LiveChat (props) {
    const { state } = useContext (WAStateContext)

    const canShowContent = state?.canLogin && (state?.connections?.waWeb === 'open' || state?.chats?.hasSome)
    return (
        <div className='live-chat-container'>
            {
                !state &&
                (
                    <div className='live-chat-overlay' style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                        <BeatLoader loading={true} color='var(--color-secondary2)' size='32px'/>
                    </div>
                )
            }
            { state?.canLogin && state.user && <LiveChatHeader /> }
            { state?.connections && ( canShowContent ? <LiveChatContent /> : <LiveChatStateView />) }
        </div>
    )
}