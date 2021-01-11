import React, {createContext, useEffect, useRef, useState} from 'react'
import WAController from './WAController'
import {EventEmitter} from 'events'

const BAILEYS_EVENTS = [
    'open', 'connecting', 
    'close', 'ws-close', 
    'qr', 'connection-phone-change', 
    'user-status-update', 'chats-received', 
    'contacts-received', 'chat-new', 
    'chat-update', 'chats-update', 
    'message-status-update', 'group-participants-update', 
    'group-update', 'state-sync'
]

const useWAStateStore = () => {
    const controller = new WAController ()
    /**
     * @type {[ { connections: { phone: boolean, waWeb: WAConnectionState }, chats: { hasSome: boolean, hasLatest: boolean }, canLogin: boolean, user: WAUser, pendingQR?: string }, function ]}
     */
    const [state, setState] = useState (undefined)

    const gotFirstUpdate = useRef(false)
    const ev = useRef( new EventEmitter() )
    /** @type { React.MutableRefObject<EventSource> } */
    const es = useRef(null)
    /**
     * @param {string} event 
     * @param {function(Object)} listener 
     */
    const addEventListener = (event, listener) => {
        const func = ({data}) => {
            const parsed = data && JSON.parse(data)
            listener (parsed)
        }
        ev.current.addListener (event, func)
        return () => ev.current.removeListener (event, func)
    }
    /** @param {string} [lastEventId] the last event ID */
    const openLive = async lastEventId => {
        if (es.current) return

        const token = await controller.auth.getToken ()
        const newEs = new EventSource ( new URL(`/live?access_token=${encodeURIComponent(token)}`, controller.endpoint) )
        
        newEs.lastEventId = lastEventId
        newEs.onerror = async err => {
            console.error (`error in live`, err)
            if (token !== await controller.auth.getToken()) {
                console.log ('token refreshed, restarting connection')
                lastEventId = newEs.lastEventId
                closeEventSource()
                openLive (lastEventId)
            }
        }
        es.current = newEs
        
        BAILEYS_EVENTS.forEach (event => {
            es.current.addEventListener (event, data => {
                console.log (`received event: ${event}, data: `, data)
                ev.current.emit (event, data)
            })
        })
    }
    const closeEventSource = () => {
        if (es.current) {
            es.current.onerror = undefined
            es.current.close ()
        }
        es.current = null
    }
    /** @param {function (Object)} update */
    const updateState = update => {
        if (!state) return
        
        const sCopy = { ...state }
        update (sCopy)
        setState (sCopy)
    }
    const onFirstState = state => {
        if (state.connections.waWeb === 'close' && !state.canLogin) {
            console.log ('opening WA connection')
            controller.open ()
            .catch (err => console.warn(`open request failed: ${err}`))
        }
    }

    useEffect(() => {
        openLive()
        return closeEventSource
    }, [])

    // add all event listeners
    useEffect (() => (
        addEventListener ('state-sync', state => {
            if (!gotFirstUpdate.current) {
                onFirstState(state)
                gotFirstUpdate.current = true
            }
            setState(state)
        })
    ), [state])
    useEffect (() => (
        addEventListener ('open', data => {
            if (!data) return 

            updateState (state => {
                state.connections.waWeb = 'open'
                state.connections.phone = true
                state.user = data.user
                state.pendingQR = null
                state.canLogin = true
            })
        })
    ), [state])
    useEffect (() => (
        addEventListener ('chats-received', () => (
            updateState (state => {
                state.chats.hasSome = true
                state.chats.hasLatest = true
            })
        ))
    ), [state])
    useEffect (() => (
        addEventListener ('connection-validated', user => {
            updateState (state => {
                state.connections.waWeb = 'connecting'
                state.pendingQR = null
                state.user = user
                state.canLogin = true
            })
        })
    ), [state])
    useEffect (() => (
        addEventListener ('close', data => {
            updateState (state => {
                state.connections.waWeb = 'close'
                // if logged out, then update state
                if (data.reason === 'invalid_session') {
                    state.canLogin = false
                    state.chats.hasSome = false
                    state.chats.hasLatest = false
                } 
            })  
        })
    ), [state])
    useEffect (() => (
        addEventListener ('connecting', () => {
            updateState (state => {
                state.connections.waWeb = 'connecting'
            })
        })
    ), [state])
    useEffect (() => (
        addEventListener ('qr', data => {
            updateState (state => {
                state.connections.waWeb = 'connecting'
                state.pendingQR = data
                state.canLogin = false
            })
        })
    ), [state])
    useEffect (() => (
        addEventListener ('connection-phone-change', data => {
            updateState (state => {
                state.connections.phone = data.connected
            })
        })
    ), [state])
    
    return {
        controller,
        state,
        addEventListener
    }
}
export const WAStateContext = createContext({ controller: new WAController(), initialize: () => {}, state: undefined, connState: 'connecting', addEventListener: (ev, listener) => { return () => {} } })

export const WAStateContextMaker = ({ children }) => {
    const store = useWAStateStore ()
    return (
        <WAStateContext.Provider value={store}>
            { children }
        </WAStateContext.Provider>
    )
}