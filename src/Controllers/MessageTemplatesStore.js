import { useContext, useEffect, useRef, useState } from "react";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import useConstant from "use-constant";
import { MessageTemplatesControllerContext } from "./MessageTemplatesController"
import {FirebaseContext} from "./../Firebase"

const DEFAULT_PAGE_SIZE = 20

export const useMessageTemplatesStore = () => {
    const controller = useContext (MessageTemplatesControllerContext)
    const [flows, setFlows] = useState (controller.flowContainer.flows)
    const [searchString, setSearchString] = useState ('')
    const [searching, setSearching] = useState(false)
    const { analytics } = useContext(FirebaseContext)
    
    const cursor = useRef (controller.flowContainer.cursor)
    const hasMoreResults = useRef (true)

    const loadMoreFlows = async flows => {
        if (!hasMoreResults.current) {
            setFlows ([...flows])
            return
        }
        if (searchString) {
            setFlows ([]) // clear flows
            setSearching (true)
        }
        const result = await controller.loadFlows (DEFAULT_PAGE_SIZE, cursor.current, searchString)
        
        if (result.flows.length < DEFAULT_PAGE_SIZE) hasMoreResults.current = false
        cursor.current = result.cursor

        updateFlows([ ...(flows || []), ...result.flows ])
    }
    const updateFlows = flows => {
        setFlows (flows)
        if (!searchString) {
            if (!controller.flowContainer.flows || controller.flowContainer.flows.length < flows.length) {
                controller.flowContainer.flows = flows
                controller.flowContainer.cursor = cursor.current

                controller.flowsEvents.emit ('flows-updated')
            }
        } else setSearching (false)
    }
    const addFlow = flow => { 
        updateFlows ([ ...(flows || []), flow ]) 
        analytics.logEvent('message_flow_created')
    }
    const deleteFlow = async flow => {
        await controller.deleteFlow (flow.id)
        setFlows (flows.filter (f => f.id !== flow.id))
    }
    const updateFlow = flow => {
        controller.flowCache[flow.id] = flow
        
        let idx = flows.findIndex (f => flow.id === f.id)
        if (idx >= 0) flows[idx] = flow

        idx = controller.flowContainer.flows.findIndex (f => flow.id === f.id)
        if (idx >= 0) controller.flowContainer.flows[idx] = flow

        setFlows ([...flows])
    }
    const searchFlows = useConstant (() => AwesomeDebouncePromise(str => setSearchString(str), 350))

    useEffect (() => {
        hasMoreResults.current = true 
        cursor.current = undefined
        loadMoreFlows ([])
    }, [searchString])

    useEffect (() => {
        const update = () => {
            if (searchString) return
            
            setFlows (controller.flowContainer.flows)
            cursor.current = controller.flowContainer.cursor
        }
        controller.flowsEvents.on('flows-updated', update)
        return () => controller.flowsEvents.off ('flows-updated', update)
    }, [ searchString, setFlows ])

    return {
        flows,
        hasMoreResults: hasMoreResults.current,
        loadMoreFlows: () => loadMoreFlows (flows),
        searchFlows: searchFlows,
        searching,
        addFlow,
        deleteFlow,
        updateFlow
    }
}