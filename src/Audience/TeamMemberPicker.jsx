import React, { useContext, useEffect, useRef, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { TeamInfoStoreContext } from '../Controllers/TeamInfoStore'
import './TeamMemberPicker.css'

const TeamMemberPicker = ({ assignee, setAssignee, drop ,disabled}) => {
  const { teamMembers } = useContext(TeamInfoStoreContext)
  const [showDropdown, setShowDropdown] = useState(false)

  const ref = useRef(null)

  const getAssigneeUsername = () => {
    const teamMember =  teamMembers.find((member) => member.userId === assignee)
    return teamMember?.user.username
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

  return (
    <Dropdown drop={drop} show={showDropdown} disabled={disabled}>
      <Dropdown.Toggle variant="tag-picker" onClick={() => setShowDropdown(true)}>
        <span className='team-member-toggle'>{!assignee ? 'Not Assigned' : getAssigneeUsername()}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu renderOnMount className="tag-picker" ref={ref} rootCloseEvent={() => {}}>
        {showDropdown && (
          <div className="tag-picker-scroll">
            {!!assignee && (
              <Dropdown.Item
                target="_self"
                onClick={() => {
                  setAssignee('')
                  setShowDropdown(false)
                }}
              >
                <span>Not Assigned</span>
              </Dropdown.Item>
            )}
            {teamMembers?.filter(member => member.userId !== assignee).map((member) => (
              <Dropdown.Item
                target="_self"
                onClick={() => {
                  setAssignee(member.userId)
                  setShowDropdown(false)
                }}
              >
                <span>{member.user.username}</span>
              </Dropdown.Item>
            ))}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default TeamMemberPicker
