import React, { useState, useContext, useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import { AlertCentralContext } from '../../Components/AlertCentral'
import './NLP.css'
import KeywordReplyItem from './KeywordReplyItem'
import { Spinner } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useKeywordStore } from '../../Controllers/KeywordReplyStore'
import Tooltip from '../../Components/Tooltip'

function NLP({ events }) {
  const { loadKeywords } = useKeywordStore()

  const [hasMore, setHasMore] = useState(true)
  const [newRuleList, setNewRuleList] = useState([])

  const [addRule, setAddRule] = useState(true)

  const handleAddRule = () => {
    setAddRule(true)
  }

  const alertCentral = useContext(AlertCentralContext)

  const deleteKeywordRule = (deleteId) => {
    const updatedList = newRuleList.filter((item) => item.id !== deleteId)
    setNewRuleList(updatedList)
  }

  const loadKeywordReplies = async () => {
    try {
      const result = await loadKeywords()
      setNewRuleList([...newRuleList, ...result])

      if (result.length < 15) {
        setHasMore(false)
      }
    } catch (error) {
      alertCentral.error(error.message, 3000) // alert will disappear after 3 seconds
    }
  }
  useEffect(() => {
    loadKeywordReplies()
  }, [])

  /** use plus button in the main header */
  useEffect(() => {
    if (!events) {
      return
    }
    if (addRule) {
      const value = () => {
        setNewRuleList([<KeywordReplyItem />].concat(newRuleList))
        setAddRule(false)
      }
      events.on('add-clicked', value)
      return () => events.off('add-clicked', value)
    }
  }, [events, newRuleList, addRule])

  return (
    <div className="nlp-container" id="keyword-reply-parent">
      <InfiniteScroll
        scrollableTarget="keyword-reply-parent"
        dataLength={newRuleList.length}
        scrollThreshhold="3rem"
        next={loadKeywordReplies}
        hasMore={hasMore}
        style={{ width: '100%', overflow: 'visible' }}
        loader={<Spinner animation="border" />}
      >
        <Table variant="keyword-reply" borderless>
          <thead>
            <tr>
              <th style={{ width: '3rem' }}>
                <Tooltip tooltip="If the automated response is active">
                  <div>Active</div>
                </Tooltip>
              </th>
              <th style={{ width: '13.5rem' }}>
                <Tooltip tooltip="Rule of how the keyword triggers">
                  <div>Rule</div>
                </Tooltip>
              </th>
              <th style={{ width: '12vw' }}>
                <Tooltip tooltip="The response trigger">
                  <div>Keyword</div>
                </Tooltip>
              </th>
              <th style={{ width: '12vw' }}>
                <Tooltip tooltip="What to respond to trigger with">
                  <div>Template</div>
                </Tooltip>
              </th>
              <th style={{ width: '16vw' }}>
                <Tooltip tooltip="Time between consecutive replies">
                  <div>Max Replies</div>
                </Tooltip>
              </th>
              <th style={{ width: '16vw' }}>
                <Tooltip tooltip="When trigger will be active">
                  <div>Trigger Timeframe</div>
                </Tooltip>
              </th>
              <th style={{ minWidth: '8rem' }}>
                <Tooltip tooltip="Assign user to be notified when triggered">
                  <div>Notify User</div>
                </Tooltip>
              </th>
              <th>
                <Tooltip tooltip="These tags will be added to the person who sent the keyword">
                  <div>Tag</div>
                </Tooltip>
              </th>
              <th style={{ width: '2.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {newRuleList.map((rule) => (
              <KeywordReplyItem
                key={rule.id}
                data={rule}
                deleteKeywordRule={deleteKeywordRule}
                handleAddRule={handleAddRule}
                newRuleList={newRuleList}
                setNewRuleList={setNewRuleList}
              />
            ))}
          </tbody>
        </Table>
      </InfiniteScroll>
    </div>
  )
}

export default NLP
