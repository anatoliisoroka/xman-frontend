import React, { useRef, useState } from 'react';
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import NLP from './NLP/NLP';
import MessageTemplates from './MessageTemplates/MessageTemplates';
import { ReactComponent as Plus } from '../Images/add.svg'
import './Automation.css'
import { Button } from 'react-bootstrap';
import EventSource from 'events'
import Broadcasts from './Broadcasts/Broadcasts';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = {
	flows: {
        title: 'Message Templates',
        component: MessageTemplates
    },
    nlp: {
        title: 'Keyword Reply',
        component: NLP,
	},
	campaigns: {
        title: 'Broadcasts',
        component: Broadcasts,
    },   
}
/**
 * The automation page
 * This component switches between different components
 */
const Automation = () => {
    /** parses the hash of the url & sets the active link */
	const getActiveKey = () => {
		let link = window.location.pathname
		if (link && link.length > 1) {
			link = link.substring (1).split("/")
			if (link[0] === 'automation' && link[1]) {
				return link[1]
			}
		}
		return Object.keys(SECTIONS)[0]
	}
	const [activeKey, setActiveKey] = useState (getActiveKey())
	const events = useRef (new EventSource())

    /** Opens the page & sets the url hash */
	const openTab = key => {
		if (!key) return
		setActiveKey(key)
	}
    return (
		<Tab.Container activeKey={activeKey} mountOnEnter={true} onSelect={ openTab }>
			<Row className='automation-row'>
				<Col>
					<Nav variant="automation">
						{
							Object.keys(SECTIONS).map ((key, index) => (
								<Nav.Item key={key}> 
									<Nav.Link as={Link} to={'/automation/' + key} eventKey={key}>
										{SECTIONS[key].title}
									</Nav.Link>
								</Nav.Item>
							))
						}
					</Nav>
					<Button variant='transparent' className='add-button' onClick={ () => events.current.emit ('add-clicked') }>
						<Plus/>
					</Button>
				</Col>
			</Row>
			<Row className='automation-content'>
				<Col>
					<Tab.Content>
						{
							Object.keys(SECTIONS).map ((key, index) => 
								<Tab.Pane eventKey={key} key={key}>
									{ React.createElement (SECTIONS[key].component || 'div', { events: key === activeKey ? events.current : null }) }
								</Tab.Pane>
							)
						}
					</Tab.Content>
				</Col>
			</Row>
		</Tab.Container>
    )
}
export default Automation