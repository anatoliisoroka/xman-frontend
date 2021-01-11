import React, { useContext, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useMessageTemplatesStore } from '../../Controllers/MessageTemplatesStore'
import { Alert, Button, Dropdown, Form, Modal, Spinner } from 'react-bootstrap'
import { ReactComponent as View } from '../../Images/view.svg'
import { ReactComponent as Add } from '../../Images/add.svg'
import CreateMessageTemplate from './CreateMessageTemplate'
import { MessageTemplatePreviewContext } from './MessageTemplatePreview'

import './MessageTemplatePicker.css'

/**
 * @param {Object} props
 * @param {string} props.drop
 * @param {string || string[]} props.selected
 * @param {function(string)} props.setSelected
 */
export default function MessageTemplatePicker({ drop, selected, setSelected, maxSelectableFlows = 1 }) {
  const { show, showing } = useContext(MessageTemplatePreviewContext)
  const { flows, searchFlows, hasMoreResults, loadMoreFlows } = useMessageTemplatesStore()

  const [openedCreate, setOpenedCreate] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const ref = useRef(null)

  const addFlow = (id) => {
    if (selected.length >= maxSelectableFlows) return
    setSelected(selected.concat([id]))
  }

  const removeFlow = (id) => {
    const newFlows = selected.filter((flow) => flow !== id)
    setSelected(newFlows)
  }

  const createAndAddTemplate = async (flow) => {
    addFlow(flow.id)
    setShowDropdown(false)
  }

  const toggleFlow = (id) => {
    if (selected.includes(id)) removeFlow(id)
    else addFlow(id)
  }

  const onSingleSelectedFlow = (id) => {
    setSelected(id)
    setShowDropdown(false)
  }

  const getFlowName = (id) => {
    return flows?.find((flow) => flow.id === id)?.name
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target) && showDropdown && !showing && !openedCreate) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openedCreate, setShowDropdown, showDropdown, ref, openedCreate, showing])

  return (
    <Dropdown drop={drop} show={showDropdown}>
      <CreateMessageTemplate visible={openedCreate} setVisible={setOpenedCreate} onCreateFlow={createAndAddTemplate} />
      <Dropdown.Toggle variant="flow-picker" onClick={() => setShowDropdown(true)}>
        {maxSelectableFlows === 1
          ? getFlowName(selected) || 'None'
          : selected.length > 0
          ? selected.map((id) => (
              <Alert
                key={id}
                variant="tag"
                onClose={(_, e) => {
                  e.stopPropagation()
                  removeFlow(id)
                }}
                dismissible
              >
                {getFlowName(id)}
              </Alert>
            ))
          : 'None'}
      </Dropdown.Toggle>
      <Dropdown.Menu renderOnMount className="flow-picker" ref={ref} rootCloseEvent={() => {}}>
        <div className="flex-def">
          <Form.Control placeholder="search flows..." onChange={(ev) => searchFlows(ev.target.value)} />
          <Button variant="ham" onClick={() => setOpenedCreate(true)} style={{ marginRight: '0.4rem' }}>
            <Add />
          </Button>
        </div>

        {showDropdown && (
          <div className="flow-picker-content" id="picker-scroll">
            <InfiniteScroll
              scrollableTarget="picker-scroll"
              dataLength={flows?.length || 0}
              scrollThreshhold="3rem"
              next={loadMoreFlows}
              hasMore={hasMoreResults}
              loader={<Spinner animation="border" />}
            >
              {flows?.map((flow) => (
                <Dropdown.Item
                  target="_self"
                  onClick={() => (maxSelectableFlows === 1 ? onSingleSelectedFlow(flow.id) : toggleFlow(flow.id))}
                  className={`${
                    maxSelectableFlows === 1
                      ? selected?.id === flow.id
                        ? 'selected'
                        : ''
                      : selected.includes(flow.id)
                      ? 'selected'
                      : ''
                  }`}
                >
                  <div className="item flex-def" key={flow.id}>
                    {flow.name}
                    <Button variant="ham" onClick={() => show(flow)}>
                      <View />
                    </Button>
                  </div>
                </Dropdown.Item>
              ))}
            </InfiniteScroll>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
