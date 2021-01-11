import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import { Button, Form, Dropdown, Spinner, Modal } from 'react-bootstrap'
import { getMessageType, messageUrl } from '../Controllers/Utils'
import { ReactComponent as Emoji } from '../Images/happy.svg'
import { ReactComponent as Paperclip } from '../Images/Paperclip.svg'
import { ReactComponent as Clock } from '../Images/Clock.svg'
import { ReactComponent as Microphone } from '../Images/microphone.svg'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import EventEmiiter from 'events'
import 'emoji-mart/css/emoji-mart.css'
import { Picker as EmojiPicker } from 'emoji-mart'
import { MessagePreviewView } from './LiveChatMessageView'
import LiveChatMessageTemplate from './LiveChatMessageTemplate'
import {useDropzone} from "react-dropzone"
import './NewMessageBox.css'
import ReactDatePicker from 'react-datepicker'
import Tooltip from "./../Components/Tooltip"
import { WAContext } from '../Controllers/WAStore'
/**
 * @param {Object} props 
 * @param {function(File[])} props.onSelected
 * @param {boolean} props.multiple
 */
export const FileUploadButton = props => {
    const input = useRef (null)
    const bProps = { ...props, onSelected: null, multiple: null }

    useEffect (() => {
        // window.addEventListener('paste', ... or
        document.onpaste = event => {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items
            const files = []
            for (let index in items) {
                const item = items[index]
                item.kind === 'file' && files.push (item.getAsFile())
            }
            files.length > 0 && props.onSelected (files)
        }
        return () => document.onpaste = () => {}
    }, [ props.onSelected ])

    return (
        <Button {...bProps} onClick={ () => input.current.click() }>
            <input type="file" hidden ref={input} onChange={e => props.onSelected(e.target.files)} multiple={props.multiple}/>
            { props.children }
        </Button>
    )
}
/**
 * @param {Object} props 
 * @param {function(number)} props.scheduleAt
 */
const SchedulingButton = ({scheduleAt})=> {
    const [show, setShow] = useState(false)
    const ref = useRef(null)
    const pickerIsOpen =() => !!document.getElementsByClassName('react-datepicker-popper')[0]
    const scheduleIn = seconds => {

        const date = new Date( new Date().getTime() + seconds*1000 )
        const stamp = Math.floor(date.getTime()/1000)
        scheduleAt (stamp)
        setShow(false)
    }

    useEffect(() => {
        const handleClickOutside = event => {
            if (ref.current && !ref.current.contains(event.target) && show  && !pickerIsOpen()) {
                setShow (false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [ show, setShow, ref])

    return (
      <Dropdown drop="right" show={show} ref={ref}>
        <Dropdown.Toggle
          variant="secondary"
          data-color="secondary"
          className="schedule-button"
          onClick={() => setShow(!show)}
        >
          <Clock style={{ fill: 'var(--color-secondary)' }} />
        </Dropdown.Toggle>
        <Dropdown.Menu as={SchedulingMenu} scheduleAt={scheduleAt} setShow={setShow}>
          <div className="menu-item-container">
            <Dropdown.Item onClick={() => scheduleIn(5 * 60)}> Send in 5m </Dropdown.Item>
            <Dropdown.Item onClick={() => scheduleIn(15 * 60)}> Send in 15m </Dropdown.Item>
            <Dropdown.Item onClick={() => scheduleIn(30 * 60)}> Send in 30m </Dropdown.Item>
            <Dropdown.Item onClick={() => scheduleIn(60 * 60)}> Send in 60m </Dropdown.Item>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    )
}

const SchedulingMenu = React.forwardRef(
  ({ scheduleAt, children, style, className, 'aria-labelledby': labeledBy ,setShow}, ref) => {
    const [startDate, setStartDate] = useState(null)

    const schedule = () => {
      const stamp = Math.floor(startDate.getTime() / 1000)
      scheduleAt(stamp)
      setShow(false)
    }
    
    

    return (
      <div ref={ref} style={{ ...style,backgroundColor: 'var(--color-quat2)'}} className={className} aria-labelledby={labeledBy}>
        <div className="scheduling-menu">
          <div>Choose when to send</div>
          {children}
          <div className="picker-container">
          <ReactDatePicker
            id="date-picker"
            className="date-picker"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            showTimeInput
            dateFormat="MMMM d, h:mm aa"
            shouldCloseOnSelect={false}
            />
          <Button className="scheduling-button" variant="primary" data-color="secondary" onClick={schedule} disabled={!startDate}> Schedule</Button>
            </div>
        </div>
      </div>
    )
  },
)

export const MESSAGE_TYPE_IMG_MAP = {
    documentMessage: require ('../Images/documentMessage.png'),
    audioMessage: require ('../Images/audioMessage.png'),
    videoMessage: require ('../Images/videoMessage.png'),
    stickerMessage: require ('../Images/stickerMessage.png'),
}
const FilePreview = ({file, onClose}) => {
    const type = getMessageType (file.type || file.mimetype)
    const previewUrl = type === 'imageMessage' ? messageUrl({file}) : MESSAGE_TYPE_IMG_MAP[type]
    return (
        <div className='file-preview'>
            { previewUrl && <img src={previewUrl}/> }
            <div>{file.name}</div>

            <Button data-color='danger' className='file-preview-close' onClick={onClose} />
        </div>
    )
}
/**
 * @param {Object} props 
 * @param {number} props.fileLimit
 * @param {boolean} props.shiftPressed
 * @param {Object} props.initialMessage
 * @param {EventEmitter} props.events
 * @param {Object} props.quotedMessage
 */
const templateRegex = /(^\/[\s\S]*)/
const SendMessagePanel = props => {
    const [sendContent, setSendContent] = useState (
        {
            text: '',
            files: [],
            scheduleAt: null,
            sending: false
        }
    )
    const {
      selectedChat,
    } = useContext(WAContext)
    const [recorder, setRecorder] = useState (null)
    const [recordState, setRecordState] = useState ('idle')
    const [showAddMessageTemplate, setShowAddMessageTemplate] = useState(false)
    const [textAreaDefaultHeight, setTextAreaDefaultHeight] = useState('')
    const textAreaRef = useRef(null)


    const focusMenu = async () => {
      const dropdown = document.getElementsByClassName('menu-item dropdown-item')[0]
      showAddMessageTemplate && document.activeElement === textAreaRef.current && dropdown && dropdown.focus()
    }

    const generateContent = (content) => {
        const message = {}
        const file = content.files[0]
        if (file) {
            const key = getMessageType (file.type || file.mimetype).replace ('Message', '')
            message[key] = file
            content.files = content.files.slice (1)
        }
        if (content.files.length === 0 && content.text?.length > 0) {
            message.text = content.text
            message.quoted = props.quotedMessage
            content.text = ''
        }
        return message
    }
    const setText = text => {
        setSendContent ({ ...sendContent, text })
        props.events && props.events.emit ('updated-content', generateContent({ text, files: sendContent.files }))
    }
    const setFiles = (files, textParam) => {
        const text = textParam || textParam === '' ? textParam : sendContent.text
        setSendContent ({ ...sendContent, text, files })
        props.events && props.events.emit ('updated-content', generateContent({ text, files }))
    }
    const setSending = sending => setSendContent ({ ...sendContent, scheduleAt: null, sending })
    
    const flush = () => {
        const content = { files: sendContent.files || [], text: sendContent.text || '' }
        content.text = content.text.endsWith ('\n') ? content.text.slice (0, -1) : content.text
        
        if (!content.text && content.files.length === 0) {
            setSendContent ({ sending: false, files: [], text: '', scheduleAt: null })
            return
        }

        const message = generateContent (content)
        if (sendContent.scheduleAt) {
            message.scheduleAt = sendContent.scheduleAt
        }
        props.events.emit ('send-message', message)

        setTimeout (() => {
            setSendContent (
                {
                    files: content.files,
                    text: content.text,
                    sending: sendContent.sending,
                    scheduleAt: sendContent.scheduleAt
                }
            )
        }, content.files.length > 0 ? 1000 : 0)
    }

    const beginSending = () => {
        if(!showAddMessageTemplate && !sendContent.sending){
            setSending(true)
            resetTextAreaHeight()
            const messagesScrollParent = document.getElementById("messages-scroll-parent");
            setTimeout(() => messagesScrollParent.scrollTop = messagesScrollParent.scrollHeight ,50) 
            
        } 
    }

    const appendToText = (e) => {
      const newText =
        sendContent.text.slice(0, textAreaRef.current.selectionStart) +
        e +
        sendContent.text.slice(textAreaRef.current.selectionStart)
      textAreaRef.current.focus()
      setText(newText)
    }
         

    const startRecording = () => {
        if (recorder) {
            recorder.start ()
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                let recorder = new MediaRecorder(stream)
                setRecorder (recorder)
                setTimeout(() => recorder.start(), 500)
            })
        }
    }

    const addFiles = (files) => {
        const allFiles = [...(sendContent.files || [])]
        for (let i = 0; i < files.length;i++) {
            if (allFiles.length >= props.fileLimit) {
                break
            }
            allFiles.push(files[i])   
        }
        console.log (allFiles)
        setFiles (allFiles)
    }
    
    const onDrop = useCallback(acceptedFiles => {
        addFiles(acceptedFiles)
      }, [])
      const {getRootProps, getInputProps, isDragActive} = useDropzone({noClick:true,onDrop})

    const handleTemplateChoice = (flow) => {
        const propNames = ['image','video','audio','sticker','document']
        const files = []
        propNames.forEach((prop) => {
            if(flow[prop]){
                files.push(flow[prop]) 
            }
        })
        setFiles(files, flow.text ? flow.text : '')
        setTimeout(() => setShowAddMessageTemplate(false), 200)
        textAreaRef.current.focus()
        setTimeout(() =>textAreaRef.current.dispatchEvent(new Event('input', { bubbles: true })),200)
    }

    const resetTextAreaHeight = () => {
        textAreaRef.current.style.height = textAreaDefaultHeight + 'px'
    }
    
    useEffect (() => {
        let text = '' 
        let files = []
        if (props.initialMessage) {
            text = props.initialMessage.text
            let m = props.initialMessage
            const file = m.audio || m.video || m.image || m.sticker || m.document
            if (file) files = [ file ]
        }
        setSendContent (
            {
                ...sendContent,
                text,
                files
            }
        )
        setTimeout(() =>textAreaRef.current?.dispatchEvent(new Event('input', { bubbles: true })),200)
    }, [ props.initialMessage ])
    
    useEffect (() => {
        if (sendContent.sending) flush()
    }, [sendContent])

    useEffect (() => {
        if (!recorder) return
        const dataAvailable = e => {
            const file = new File ([ e.data ], `${new Date().toISOString()}-voice.mp3`, { type: 'audio/mp4' })
            file.ptt = true
            addFiles ([file])
        }
        const setRecording = () => setRecordState('recording')
        const setIdle = () => setRecordState('idle')
        recorder.addEventListener('dataavailable', dataAvailable)
        recorder.addEventListener ('start', setRecording)
        recorder.addEventListener ('stop', setIdle)
        
        return () => {
            recorder.removeEventListener ('dataavailable', dataAvailable)
            recorder.removeEventListener ('start', setRecording)
            recorder.removeEventListener ('stop', setIdle)
        }
    }, [recorder, sendContent, setRecordState])

    useEffect (() => {
        // if not the active panel, the events are not sent
        if (!props.events) return   

        props.events.on ('enter-pressed', beginSending)
        props.events.on ('emoji-added', appendToText)
        return () => {
            props.events.off ('enter-pressed', beginSending)
            props.events.off ('emoji-added', appendToText)
        }
    }, [ sendContent, props.events, showAddMessageTemplate ])

    useEffect(() => {
      const textArea = textAreaRef.current
      const resizeTextAreaOnInput = () => {
        textArea.style.height = 'auto'
        textArea.style.height = textArea.scrollHeight + 'px'
      }
      setTextAreaDefaultHeight(textArea.scrollHeight)
      textArea.setAttribute('style', 'height:' + textAreaRef.current.scrollHeight + 'px;overflow-y:hidden;')
      textArea.addEventListener('input', resizeTextAreaOnInput, false)
      return () => {
        textArea.removeEventListener('input', resizeTextAreaOnInput, false)
      }
    }, [textAreaRef])

    useEffect(() => {
        if (templateRegex.test(sendContent.text)) {
            setShowAddMessageTemplate(true);
        } else {
            setTimeout(() => setShowAddMessageTemplate(false),200)
            }
    },[sendContent.text,showAddMessageTemplate])

    useEffect(() => {
        // not using mouse trap here as it needs to function inside textarea 
        const handleKeyDown = (event) => {
          event.key === 'ArrowDown' && focusMenu()
        }
        document.addEventListener('keydown', handleKeyDown, false)
    
        return () => {
          document.removeEventListener('keydown', handleKeyDown, false)
        }
      }, [showAddMessageTemplate])

      useEffect (() => {
        setText('')
    }, [window.location.href ])

    return (
        <div className="new-message-box-messaging"  {...getRootProps()}>
   
           {showAddMessageTemplate && (
               <LiveChatMessageTemplate handleTemplateChoice={handleTemplateChoice} searchTerm={sendContent.text?.slice(1)}/>
           )}
            {props.quotedMessage && (
                <MessagePreviewView contextInfo={props.quotedMessage} onClose={() => props?.events.emit('dismiss-quoted')} />
        )}
        <div className="new-message-box-files">
          {sendContent.files?.map((file, idx) => (
              <FilePreview
              file={file}
              onClose={() => setFiles([...sendContent.files].filter((_, i) => i !== idx))}
              key={idx}
            />
          ))}
        </div>
        <div className="new-message-box-inner">
          <div className="send-buttons">
            <FileUploadButton variant="transparent" className="file-upload" onSelected={addFiles} multiple>
              <Paperclip style={{ fill: 'var(--color-secondary)' }} />
            </FileUploadButton>
            <>
              {recordState === 'recording' ? (
                <Button variant="transparent" style={{ height: '2.5rem' }} onClick={() => recorder.stop()}>
                  <Microphone style={{ fill: 'var(--color-error)' }} />
                  <Spinner animation="border" className="spinner-mic" />
                </Button>
              ) : (
                recordState !== 'permission_denied' && (
                  <Button variant="transparent" style={{ height: '2.5rem' }} onClick={startRecording}>
                    <Microphone style={{ fill: 'var(--color-secondary)' }} />
                  </Button>
                )
              )}
            </>
          </div>
            <input {...getInputProps()} style={{height:'100%' ,width:'90%', visibility:'hidden',position:'absolute'}}/>
            <Form.Control
                ref={textAreaRef}
                as="textarea"
                rows="2"
                className="text-area"
                id="new-message-text-area"
                placeholder= {`Send a message...${"\n"}Use templates by typing ' / ' followed by the template name...`}
                value={sendContent.text}
                onChange={(e) => {
                if (!sendContent.sending) {
                    let text = e.target.value;
                    if (
                    !props.shiftPressed &&
                    e.target.value.slice(-1) === '\n' &&
                    sendContent.text?.length < text.length
                    ) {
                    text = text.slice(0, -1);
                    }
                    if (templateRegex.test(text)) {
                    setShowAddMessageTemplate(true);
                    } 
                    setText(text);
                }
                }}
            />
          {props.showButtons !== false && (
            <div className="send-buttons">
              <Button variant='secondary' data-color='secondary' onClick={beginSending}>
                Send
              </Button>

              <SchedulingButton
                scheduleAt={(stamp) => setSendContent({ ...sendContent, scheduleAt: stamp, sending: true })}
              />
            </div>
          )}
        </div>
      </div>
    );
}

/**
 * @param {Object} props 
 * @param {EventEmitter} props.events
 */
const SendNotePanel = props => {
    const [text, setText] = useState ('')
   
    const sendNote = () => {
        if (!text) {
            return
        }
        let txt = text.endsWith ('\n') ? text.slice (0, -1) : text
        props.events.emit ('send-message', { text: txt })
        setText ('')
    }
    const appendToText = e => setText (text + e)

    useEffect (() => {
        // if not the active panel, the events are not sent
        if (!props.events) return

        props.events.on ('enter-pressed', sendNote)
        props.events.on ('emoji-added', appendToText)
        return () => {
            props.events.off ('enter-pressed', sendNote)
            props.events.off ('emoji-added', appendToText)
        }
    }, [ text, props.events ])
    return (
        <div className='new-message-box-inner'>
            <Form.Control 
                as="textarea" 
                rows="3" 
                placeholder='Create a note...' 
                value={text} 
                onChange={ e => setText(e.target.value)}/>
            <div>
                <Button variant='secondary' data-color='note' onClick={ sendNote } >
                    Add
                </Button>
            </div>
        </div>
    )
}

const SECTIONS = [
    {
        title: 'Message',
        type: 'message',
        component: SendMessagePanel,
	},
	{
        title: 'Note',
        type: 'note',
        component: SendNotePanel,
    }, 
]
/**
 * 
 * @param {Object} props 
 * @param {number} props.fileLimit
 * @param {Object} [props.initialMessage]
 * @param {Object} [props.quotedMessage]
 * @param {function(Object)} [props.setQuotedMessage]
 * @param {boolean} props.showButtons
 * @param {Set<string>} [props.allowedTypes]
 * @param {function({ type: string, message: Object })} [props.sendMessage]
 * @param {function({ type: string, message: Object })} [props.updatedMessage]
 */
const NewMessageBox = (props) => {
    const [showingEmojis, setShowingEmojis] = useState (false)
    const [activeKey, setActiveKey] = useState ('0')
    const [shiftPressed, setShiftPressed] = useState(false)

    const events = useRef (new EventEmiiter())
    const emojiRef = useRef(null)
    
    const currentSections = SECTIONS.filter (section => !props.allowedTypes || props.allowedTypes.has(section.type))

    const handleKeyDown = event => {
        event.key === 'Shift' && setShiftPressed(true)

        const dropdownItemIsFocused = document.activeElement.className.includes('menu-item')
        // prevents new line being input if message sent while cursor in middle of word
        !event.shiftKey && event.key ==='Enter' && !dropdownItemIsFocused && event.preventDefault()
    }
    const handleKeyUp = event => { 
        if (event.key === 'Shift') {
            setShiftPressed(false)
        } else if (event.key === 'Enter' && !shiftPressed) {
            props.sendMessage && events.current.emit ('enter-pressed')
        }
    }
    /** add event listeners */
    useEffect (() => {
        document.addEventListener ('keyup', handleKeyUp)
        document.addEventListener ('keydown', handleKeyDown)
        props.setQuotedMessage && events.current.on ('dismiss-quoted', props.setQuotedMessage)
        return () => {
            document.removeEventListener ('keydown', handleKeyDown)
            document.removeEventListener ('keyup', handleKeyUp)
            props.setQuotedMessage && events.current.off ('dismiss-quoted', props.setQuotedMessage)
        }
    }, [ shiftPressed, setShiftPressed ])
    useEffect (() => {
        const send = message => {
            const type = currentSections[+activeKey].type
            props.sendMessage ({ type, message })
            props.setQuotedMessage && props.setQuotedMessage ()
            setShowingEmojis (false)
        }
        events.current.on ('send-message', send)
        return () => events.current.off ('send-message', send)
    }, [ activeKey, setShowingEmojis, props.sendMessage, props.setQuotedMessage ])

    useEffect (() => {
        if (props.quotedMessage && activeKey !== '0') {
            setActiveKey (0)
        }
        events.current.on ('updated-content', message => props.updatedMessage && props.updatedMessage ({ type: 'message', message }))
    }, [ props.quotedMessage ])
    // close emoji box on clicking outside
    useEffect(() => {
        const handleClickOutside = event => {
            if (emojiRef.current && !emojiRef.current.contains(event.target) && showingEmojis) {
                setShowingEmojis (false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [ showingEmojis, setShowingEmojis, emojiRef ])

    return (
      <div className="new-message-box">
        <Tab.Container activeKey={activeKey} onSelect={setActiveKey}>
          <Row style={{ padding: '0', margin: '0' }}>
            <Col className="flex-def" style={{ padding: '0', margin: '0' }}>
              <Nav variant="new-message">
                {currentSections.map((item, index) => (
                  <Nav.Item key={index + '_msg_tab'}>
                    <Nav.Link eventKey={index.toString()}>
                      <Tooltip
                        tooltip={
                          item.title === 'Message'
                            ? 'Sends a message to the current chat'
                            : item.title === 'Note'
                            ? 'Adds a note to the current chat that only you can see'
                            : null
                        }
                      >
                        <span>{item.title}</span>
                      </Tooltip>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              <div
                ref={emojiRef}
                className="emoji-picker"
                style={{ opacity: showingEmojis ? '1' : '0', pointerEvents: showingEmojis ? undefined : 'none' }}
              >
                {showingEmojis && (
                  <EmojiPicker title="" set="apple" onSelect={(e) => events.current.emit('emoji-added', e.native)} />
                )}
              </div>

              <Button
                variant="transparent"
                className="emoji-picker-button"
                onClick={() => setShowingEmojis(!showingEmojis)}
              >
                <Emoji style={{ fill: 'var(--color-secondary)' }} />
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <Tab.Content className="new-message-box-content">
                {currentSections.map((item, index) => (
                  <Tab.Pane eventKey={index.toString()} key={'pane_' + index}>
                    {React.createElement(item.component || 'div', {
                      fileLimit: props.fileLimit,
                      quotedMessage: props.quotedMessage,
                      showButtons: props.showButtons,
                      initialMessage: props.initialMessage,
                      events: index.toString() === activeKey ? events.current : null,
                      shiftPressed,
                    })}
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>
    )
}
export default NewMessageBox