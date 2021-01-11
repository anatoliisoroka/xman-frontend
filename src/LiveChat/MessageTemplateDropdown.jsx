import React, { useEffect, useRef, useState } from 'react'
import { Dropdown, Spinner } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import CreateMessageTemplate from '../Automation/MessageTemplates/CreateMessageTemplate'
import Button from '../Components/Button'
import { ReactComponent as Add } from '../Images/add.svg'

import './MessageTemplateDropdown.css'

const MessageTemplateDropdown = ({ handleTemplateChoice, flows, loadMoreFlows, hasMoreResults }) => {
  const ref = useRef(null)
  const [showDropdown, setShowDropdown] = useState(true)
  const [openedCreate, setOpenedCreate] = useState(false)

  const generateFlowOptions = () => {
    if (!flows?.length) {
      return (
        <Dropdown.Item eventKey={1} className="menu-item">
          No Items
        </Dropdown.Item>
      )
    }

    return flows?.map((flow, index) => (
      <Dropdown.Item eventKey={index} onSelect={() => handleTemplateChoice(flow)} className="menu-item" key={flow.id}>
        <div>
          <div className="option-name">{`${flow.name}`} </div>
          <div className="option-preview">
            {flow.text?.length > 15 ? `${flow.text.substring(0, 15)}...` : flow.text}
          </div>
        </div>
      </Dropdown.Item>
    ))
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target) && showDropdown) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [setShowDropdown, showDropdown, ref])

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => <div ref={ref}></div>)

  return (
    flows && (
      <Dropdown drop="up" show={showDropdown} id="flow-select-dropdown">
        <CreateMessageTemplate
          visible={openedCreate}
          setVisible={setOpenedCreate}
          onCreateFlow={handleTemplateChoice}
        />
        <Dropdown.Toggle as={CustomToggle} />
        <Dropdown.Menu renderOnMount ref={ref} rootCloseEvent={() => {}}>
          <div className="flow-menu-content" id="picker-scroll">
            <InfiniteScroll
              scrollableTarget="picker-scroll"
              dataLength={flows?.length || 0}
              scrollThreshhold="3rem"
              next={loadMoreFlows}
              hasMore={hasMoreResults}
              loader={<Spinner animation="border" />}
            >
              {generateFlowOptions()}
              <div className="button-container" onClick={() => setOpenedCreate(true)}>
                <Button variant="ham" style={{ height: '1.25rem', width: '1.25rem' }}>
                  <Add style={{ fill: 'var(--color-secondary)', top: 0, left: 0, padding: 0 }} />
                </Button>
              </div>
            </InfiniteScroll>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    )
  )
}

export default MessageTemplateDropdown
