import React, { useState, useContext, useEffect, useRef } from 'react'
import Switch from '../../Components/Switch'
import {Spinner, Dropdown, Form, InputGroup, DropdownButton } from 'react-bootstrap'
import { AlertCentralContext } from '../../Components/AlertCentral'
import { ReactComponent as ThreeDots } from '../../Images/ThreeDots.svg'
import MessageTemplatePicker from '../MessageTemplates/MessageTemplatePicker'
import TagPicker from '../../Audience/TagPicker'
import ShowRecord from './ShowRecord'
import { useKeywordStore } from '../../Controllers/KeywordReplyStore'
import ReactDatePicker from 'react-datepicker'
import setHours from 'date-fns/setHours'
import setMinutes from 'date-fns/setMinutes'
import { formatDateToUTCwithTimezone, parseTimeFromServer } from '../../Utils/formatDateToUTCwithTimezone'
import TeamMemberPicker from "./../../Audience/TeamMemberPicker"
import AuthController from '../../Controllers/AuthController'

const DETECTION_MECHANISMS = [
  { type: 'keywordIs', title: 'Message Is' },
  { type: 'startsWith', title: 'Message Starts With' },
  { type: 'contains', title: 'Mesage Contains' },
]

/**
 * @typedef {Object} KeywordAction
 * @property {string} id
 * @property {string} flowID
 * @property {number} createdAt
 * @property {'startsWith' | 'contains' | 'keywordIs'} detectionMechanism
 * @property {0 | 1} enabled
 * @property {0 | 1} notifyUser
 * @property {string} keyword
 * @property {string} tags
 */
/**
 *
 * @param {Object} props - props from NLP
 * @param {KeywordAction} props.data - user's Keyword Actions' data
 */

function KeywordReplyItem({ data, deleteKeywordRule, handleAddRule, newRuleList, setNewRuleList }) {
  const { editKeyword, createKeyword, deleteKeyword, fetchKeywordExectuionRecord } = useKeywordStore()
  const alertCentral = useContext(AlertCentralContext)
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(data.enabled)
  const [detectionMechanism, setDetectionMechanism] = useState(data.detectionMechanism)
  const [newDetectionMechanism, setNewDetectionMechanism] = useState('keywordIs')
  const [tags, setTags] = useState(new Set(data.tags?.split(',').filter(Boolean) || []))
  const [newTags, setNewTags] = useState(new Set(data.tags?.split(',').filter(Boolean) || []))
  const [newTag, setNewTag] = useState([])
  const [keyword, setKeyword] = useState(data.keyword)
  const [selectedReplySpanTimeFrame, setSelectedReplySpanTimeFrame] = useState('hours')
  const [selectedOnceOrInfiniteReplyFrame, setSelectedOnceOrInfiniteReplyFrame] = useState('infinite')
  const [replySpan, setReplySpan] = useState(data.replySpan)
  const [newReplySpan, setNewReplySpan] = useState(0)
  const [newKeyword, setNewKeyword] = useState(null)
  const [newNotifyUser, setNewNotifyUser] = useState('')
  const [notifyUser, setNotifyUser] = useState(data.notifyUser)
  const [messageTemplates, setMessageTemplates] = useState(data.flowIds?.split(',').filter(Boolean) || [])
  const [newMessageTemplates, setNewMessageTemplate] = useState([])
  const [rangeFrom, setRangeFrom] = useState(data.startTime ? parseTimeFromServer(data.startTime) : null)
  const [rangeTill, setRangeTill] = useState(data.endTime ? parseTimeFromServer(data.endTime) : null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dropDownRef = useRef(null)

  const onDatesChange = (date) => {
    !rangeFrom && setRangeFrom(date)
    if (rangeFrom && !rangeTill) {
      setRangeTill(date)
      data.id && setStartEndValue(rangeFrom, date)
      setShowDatePicker(false)
    }
  }

  const formatDateForDisplay = (date) => {
    const formatted = date.toLocaleString('en-GB', { hour12: false }).split(', ')[1]
    return formatted.slice(0, 5)
  }

  const setStartEndValue = async (start, end) => {
    await edit({ startTime: start ?  formatDateToUTCwithTimezone(start) : null, endTime: end ? formatDateToUTCwithTimezone(end):null })
    setRangeFrom(start)
    setRangeTill(end)
  }
  const setReplySpanValue = async (value) => {
    await edit({ replySpan: value })
    setReplySpan(value)
  }
  const setEnabledValue = async (value) => {
    await edit({ enabled: value === 1 })
    setEnabled(value)
  }
  const setKeywordValue = async (value) => {
    await edit({ keyword: value })
    setKeyword(value)
  }
  const setMessageTemplatesValue = async (value) => {
    await edit({ flowIds: value })
    setMessageTemplates(value)
  }
  const setDetectionMechanismValue = async (value) => {
    await edit({ detectionMechanism: value })
    setDetectionMechanism(value)
  }
  const setNotifyUserValue = async (value) => {
    await edit({ notifyUser: value  })
    setNotifyUser(value)
  }
  const addTag = async (tag) => {
    await edit({ addTags: [tag] })
  }
  const removeTag = async (tag) => {
    await edit({ removeTags: [tag] })
  }

  const edit = async (body) => {
    setLoading(true)

    try {
      await editKeyword(data.id, body)
    } catch (error) {
      alertCentral.error(error.message, 3000) // alert will disappear after 3 seconds
    }

    setLoading(false)
  }

  const setNewMessageTemplateValue = (value) => {
    setNewMessageTemplate(value)
  }

  const addNewTag = (tag) => {
    setNewTag(newTag.concat(tag))
  }

  const removeNewTag = (tag) => {
    const index = newTag.indexOf(tag)
    newTag.splice(index, 1)
    setNewTag(newTag)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const createKeywordAction = {
        detectionMechanism: newDetectionMechanism,
        keyword: newKeyword,
        flowIds: newMessageTemplates,
        tags: newTag,
        replySpan: newReplySpan,
        detectionCount: 1,
        notifyUser: newNotifyUser,
        startTime: rangeFrom ? formatDateToUTCwithTimezone(rangeFrom) : null,
        endTime: rangeTill ? formatDateToUTCwithTimezone(rangeTill) : null,
      }

      const keywordAction = await createKeyword(createKeywordAction)
      newRuleList.splice(0, 1)
      setNewRuleList([keywordAction].concat(newRuleList))
      console.log(keywordAction)
    } catch (error) {
      alertCentral.error(error.message, 3000) // alert will disappear after 3 seconds
    }

    setLoading(false)
    handleAddRule()
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteKeyword(data.id)
      deleteKeywordRule(data.id)
    } catch (error) {
      alertCentral.error(error.message, 3000) // alert will disappear after 3 seconds
    }
    setLoading(false)
  }

  const [show, setShow] = useState(false)
  const [recordList, setRecordList] = useState([])

  const handleShowRecord = async () => {
    setLoading(true)
    try {
      const result = await fetchKeywordExectuionRecord(data.id)

      setRecordList([...result])
    } catch (error) {
      alertCentral.error(error.message, 3000) // alert will disappear after 3 seconds
    }
    setShow(true)
    setLoading(false)
  }

  const getReplySpanMultiplier = (optionalValue) => {
    const timeFrame = optionalValue ? optionalValue : selectedReplySpanTimeFrame
    return timeFrame === 'minutes' ? 60 : timeFrame === 'hours' ? 3600 : 86400
  }

  const createReplySpanOptions = () => {
    const amount = selectedReplySpanTimeFrame === 'minutes' ? 59 : selectedReplySpanTimeFrame === 'hours' ? 23 : 7
    let options = []
    for (let index = 1; index < amount; index++) {
      options.push(<option value={index}>{index}</option>)
    }
    return options
  }

  useEffect(() => {
    if (data.replySpan || data.replySpan === 0) {
      if (data.replySpan === 0) {
        setSelectedOnceOrInfiniteReplyFrame('infinite')
      } else {
        setSelectedOnceOrInfiniteReplyFrame('once')
        if (data.replySpan >= 24 * 3600) {
          setSelectedReplySpanTimeFrame('days')
        } else if (data.replySpan >= 3600) {
          setSelectedReplySpanTimeFrame('hours')
        } else {
          setSelectedReplySpanTimeFrame('minutes')
        }
      }
    }
  }, [data.replySpan])

  useEffect(() => {
    if (rangeTill && showDatePicker) {
      setShowDatePicker(false)
    }
  }, [rangeTill])

  useEffect(() => {
    if (showDatePicker) {
      if (rangeFrom && rangeTill) {
        setRangeFrom(undefined)
        setRangeTill(undefined)
      }
    }
  }, [showDatePicker])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        setShowDatePicker(false)
        if(rangeFrom && !rangeTill){
          setRangeFrom(null)
          setRangeTill(null)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropDownRef])

  return (
    <tr
      style={{ backgroundColor: data.id ? 'inherent' : 'var(--color-secondary3)' }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !data.id) {
          handleSave()
        }
      }}
    >
      <td>
        <div>
          <Switch
            id={data.id + '-enabled'}
            checked={enabled === undefined ? true : enabled === 1}
            onChange={
              data.id
                ? () => {
                    setEnabledValue(enabled === 1 ? 0 : 1)
                  }
                : null
            }
          />
        </div>
      </td>
      <td>
        <Form.Control
          as="select"
          className="nlp-select"
          defaultValue={detectionMechanism}
          onChange={(e) => {
            detectionMechanism ? setDetectionMechanismValue(e.target.value) : setNewDetectionMechanism(e.target.value)
          }}
          custom
        >
          {DETECTION_MECHANISMS.map((value) => (
            <option key={value.type} value={value.type}>
              {value.title}
            </option>
          ))}
        </Form.Control>
      </td>
      <td>
        <Form.Control
          onKeyDown={
            keyword
              ? (event) => {
                  if (event.key === 'Enter') {
                    setKeywordValue(event.currentTarget.value)
                  }
                }
              : null
          }
          onChange={
            !keyword
              ? (event) => {
                  setNewKeyword(event.currentTarget.value)
                }
              : null
          }
          defaultValue={keyword ?? null}
          className="nlp-input"
          placeholder="Type here and press Enter to save"
        ></Form.Control>
      </td>

      <td>
        <div className="flex-def">
          <MessageTemplatePicker
            drop="down"
            style={{ width: '20vw' }}
            maxSelectableFlows={10}
            selected={data.id ? messageTemplates : newMessageTemplates}
            setSelected={data.id ? setMessageTemplatesValue : setNewMessageTemplateValue}
          />
        </div>
      </td>
      <td>
        {selectedOnceOrInfiniteReplyFrame === 'infinite' ? (
          <Form.Control
            as="select"
            className="input-group-select"
            data-infinite
            value={selectedOnceOrInfiniteReplyFrame}
            onChange={(e) => {
              data.id ? setReplySpanValue(3600) : setNewReplySpan(3600)
              setSelectedReplySpanTimeFrame('hours')
              setSelectedOnceOrInfiniteReplyFrame(e.target.value)
            }}
            custom
          >
            <option value="once">Once Per</option>
            <option value="infinite">Infinite</option>
          </Form.Control>
        ) : (
          <InputGroup className="flex-def">
            <InputGroup.Prepend>
              <Form.Control
                as="select"
                className="input-group-select"
                value={selectedOnceOrInfiniteReplyFrame}
                onChange={(e) => {
                  data.id ? setReplySpanValue(0) : setNewReplySpan(0)

                  setSelectedOnceOrInfiniteReplyFrame(e.target.value)
                }}
                custom
              >
                <option value="once">Once Per</option>
                <option value="infinite">Infinite</option>
              </Form.Control>
            </InputGroup.Prepend>
            <Form.Control
              as="select"
              onChange={(event) =>
                data.id
                  ? setReplySpanValue(event.currentTarget.value * getReplySpanMultiplier())
                  : setNewReplySpan(event.currentTarget.value * getReplySpanMultiplier())
              }
              value={replySpan / getReplySpanMultiplier() || newReplySpan / getReplySpanMultiplier()}
              className="nlp-input"
              type="number"
              placeholder="Hours between consecutive replies"
            >
              {createReplySpanOptions()}
            </Form.Control>
            <InputGroup.Append>
              <Form.Control
                as="select"
                className="input-group-select"
                value={selectedReplySpanTimeFrame}
                onChange={(e) => {
                  setSelectedReplySpanTimeFrame(e.target.value)
                  setReplySpanValue(1 * getReplySpanMultiplier(e.target.value))
                }}
                custom
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </Form.Control>
            </InputGroup.Append>
          </InputGroup>
        )}
      </td>
      <td>
          <DropdownButton
            variant="transparent"
            drop="right"
            show={showDatePicker}
            onClick={() => setShowDatePicker(true)}
            title={
              rangeFrom && rangeTill
                ? `${formatDateForDisplay(rangeFrom)} - ${formatDateForDisplay(rangeTill)}`
                : 'Not Specified'
            }
            data-medium
            ref={dropDownRef}
            className="time-picker"
          >
            <ReactDatePicker
              selected={rangeFrom}
              startDate={rangeFrom}
              endDate={rangeTill}
              onChange={onDatesChange}
              minTime={rangeFrom || setHours(setMinutes(new Date(), 0), 0)}
              maxTime={setHours(setMinutes(new Date(), 59), 23)}
              showTimeSelect
              showTimeSelectOnly
              selectsRange
              inline
            />
          </DropdownButton>
      </td>
      <td>
          <TeamMemberPicker
            assignee={data.id ? notifyUser :newNotifyUser}
            setAssignee={(assignee) => data.id ? setNotifyUserValue(assignee) : setNewNotifyUser(assignee)}
            disabled={loading}
          />
        </td>
      <td>
        <TagPicker
          maxSelectableTags={5}
          selectedTags={data.id ? tags : newTags}
          setSelectedTags={data.id ? setTags : setNewTags}
          addedTag={data.id ? addTag : addNewTag}
          removedTag={data.id ? removeTag : removeNewTag}
        />
      </td>

      <td style={{ textAlign: 'end' }}>
        <Dropdown
          drop="left"
          onSelect={(eventKey, event) => {
            if (eventKey === 'delete') {
              handleDelete()
            }
            if (eventKey === 'showRecord') {
              handleShowRecord()
            }
          }}
        >
          <Dropdown.Toggle
            variant="ham"
            style={{
              display: data.id ? 'block' : 'none',
              width: '2rem',
            }}
          >
            <ThreeDots style={{ fill: 'var(--color-primary)' }} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item eventKey="delete">Delete</Dropdown.Item>
            <Dropdown.Item eventKey="showRecord">Show Record</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <ShowRecord show={show} setShow={setShow} record={recordList} tagList={data.tags} />
        <Spinner animation="border" style={{ display: 'inlineFlex' }} hidden={!loading} /> {/** loading animation */}
      </td>
    </tr>
  )
}
export default KeywordReplyItem
