import React, {useState} from 'react'
import InfiniteScrollView from "./InfiniteScrollView"
import { Button } from 'react-bootstrap'


const TOTAL_ITEMS = 1200
function ScrollViewSample (props) {
    const [itemCount, setItemCount] = useState (0) // start with 0 items
    const loadMore = () => {
        if (itemCount < TOTAL_ITEMS) {
            setTimeout (() => setItemCount(itemCount + 25), 1500) // simulate loading delay
            return true
        }
        return false
    }
    return (
        <InfiniteScrollView 
                itemCount={itemCount} 
                loadMore={loadMore}
                rowHeight={50} 
                style={{height: '400px', padding: '5px'}}>
            {
                i => ({
                    id: `item-${i}`,
                    item: (
                        <div style={{margin: '5px', height: '100%'}}>
                            <Button style={{height: '100%', width: '100%'}}>
                                I am item {i}
                            </Button>
                        </div>
                    )
                })
            }
        </InfiniteScrollView>
    )
}
export const samples = [
    <ScrollViewSample />
]