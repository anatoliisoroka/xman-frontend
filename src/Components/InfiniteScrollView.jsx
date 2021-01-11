import Alert from 'react-bootstrap/Alert'
import throttle from 'lodash.throttle'
import React, { useRef, useState, useEffect } from 'react'
import Collapse from 'react-bootstrap/Collapse'
import Spinner from 'react-bootstrap/Spinner'

const ROW_LOADING_MARGIN = 3

/**
 * An infinite scroll view implementation, dynamically loads data and appends it.
 * Releases & creates rows dynamically to save memory & reduce overhead
 * @param {Object} props 
 * @param {number} props.itemCount total number of items in list
 * @param {() => boolean} props.loadMore load more results if possible
 * @param {number} props.rowHeight height of each row in px
 * @param {function (number) => {id: string, item: JSX.Element}} props.children
 */
export default function InfiniteScrollView (props) {
    const divRef = useRef (null)
    const prevOffsetY = useRef (0)
    
    const [loading, setLoading] = useState (false)
    const [rows, setRows] = useState ([])

    const itemCount = props.itemCount
    const rowHeight = props.rowHeight

    const setRowsContent = rowOffset => {
        const rows = []
        for (var i = rowOffset[0]; i < rowOffset[1];i++) {
            rows.push (i)
        }
        setRows (rows)
    }
    const updateUI = (force) => {
        if (itemCount === 0) return
        
        const bounds = currentVisibleBounds()
        const rowOffset = [ rows[0] || 0, rows[rows.length-1] || 0 ]
        if ((bounds.visibleRowBottom > rowOffset[1]-ROW_LOADING_MARGIN && divRef.current.scrollTop-prevOffsetY.current > 0)
            || (bounds.visibleRowTop < rowOffset[0]+ROW_LOADING_MARGIN && divRef.current.scrollTop-prevOffsetY.current < 0)
            || force) {
            
            const firstRow = Math.max(bounds.visibleRowTop - ROW_LOADING_MARGIN-1, 0)
            const lastRow = Math.min(bounds.visibleRowBottom + ROW_LOADING_MARGIN+1, itemCount)
            
            rowOffset[0] = firstRow
            rowOffset[1] = lastRow

            setRowsContent (rowOffset)
        }
        prevOffsetY.current = divRef.current.scrollTop
        if (bounds.visibleRowBottom >= itemCount-ROW_LOADING_MARGIN && props.loadMore()) {
            setLoading (true)
        }
    }
    const updateUIDebounced = throttle(() => updateUI(false), 200)
    
    const currentVisibleBounds = () => {
        const top = Math.floor(Math.max(divRef.current.scrollTop, 0)/rowHeight)
        return {
            visibleRowTop: top,
            visibleRowBottom: top + Math.ceil(divRef.current.clientHeight/rowHeight)
        }
    }

    useEffect (() => {
        if (itemCount === 0 && props.loadMore()) setLoading (true)
        else updateUI (true)
    }, [])
    useEffect (() => {
        if (loading) {
            setLoading (false)
            updateUI (true)
        }
    }, [itemCount])

    return (
        <div style={{overflowY: "scroll", overflowX: "hidden", ...props.style}} onScroll={updateUIDebounced} ref={ ref => divRef.current = ref }>
            <div style={{height: `${itemCount*rowHeight}px`}}> 
                <div style={{height: `${rowHeight*rows[0]}px`}}> </div>
                {
                    rows.map (i => {
                        const child = props.children (i)
                        return (
                            <Collapse key={child.id + "," + i} 
                            in={true}
                            appear={false}
                            unmountOnExit={true}>
                                <div style={{height: `${rowHeight}px`}}>{child.item}</div>
                            </Collapse>
                        )
                    })
                }
                {loading && <Spinner animation='border' style={{margin: '0.5rem'}}/>}
            </div>
        </div>
    )
}
