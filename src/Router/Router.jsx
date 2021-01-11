import React, { useState, useEffect, createContext, useContext } from 'react';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Tab from 'react-bootstrap/Tab'
import Badge from 'react-bootstrap/Badge'
import Dropdown from '../Components/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import AuthController from '../Controllers/AuthController'
import Audience from '../Audience/Audience';
import LiveChat from '../LiveChat/LiveChat';
import Automation from '../Automation/Automation';
import ResetWindow from '../Settings/ResetWindow'
import TeamDetailsWindow from '../Settings/TeamDetailsWindow';
import { ReactComponent as Ham } from '../Images/ham.svg'
import {
	BrowserRouter,
	Link,
} from "react-router-dom"
import './Router.css';
import Logo from '../Images/logo.png'
import HistoryContext from '../Controllers/HistoryContext';
import { AlertCentralContext } from '../Components/AlertCentral';
import LoadingModal from '../Components/LoadingModal';
import Invite from '../Invite/Invite';
import TeamManagementController from '../Controllers/TeamManagementController';
import UtilitiesController from '../Controllers/UtilitiesController';
import PersonalDetailsWindow from '../Settings/PersonalDetailsWindow';

const PAGES = {
	livechat: {
		image: require('../Images/Message.png'),
		title: "Inbox",
		component: LiveChat
	},
	automation: {
		image: require('../Images/Automation.png'),
		title: "Automation",
		component: Automation
	},
	audience: {
		image: require('../Images/Audience.png'),
		title: "Audience",
		component: Audience
	},
	/* data: {
		 image: require ('../Images/Data.png'), 
		 title: "Data", 
		 //component: Audience
	 }*/
}

/**
 * The main router that switches between pages
 * On the audience page we'll be at https://url.com/audience, 
 * for live chat at https://url.com/livechat, etc.
 * @param {*} props 
 * @param {function} props.onLogout
 */
export default function Router(props) {
	const history = useContext(HistoryContext)
	const auth = new AuthController()

	const user = auth.isLoggedIn() && auth.user() // only get user if logged in
	const links = Object.keys(PAGES) // all the pages

	//for invite team
	const [code, setCode] = useState();
	const [teamDetails, setTeamDetails] = useState();
	const [hasDetails, setHasDetails] = useState(false);

	/** parses the hash of the url & sets the active link */
	const getActiveKey = () => {
		var link = window.location.pathname
		
		//for team invite
		if (link === "/invite") {
			return "invite"
		}

		if (link && link.length > 1) {
			link = link.substring(1).split("/")
			if (links.indexOf(link[0]) >= 0) {
				return link[0]
			}
		}
		return links[0]
	}
	/** Opens the page & sets the url hash */
	const openTab = key => {
		if (key) setActiveKey(key)
	}
	const openPage = path => {
		const [, start] = path.split('/')
		openTab(start)
	}

	const [activeKey, setActiveKey] = useState(getActiveKey())
	const [showModalReset, setShowModalReset] = useState(false)
	const [showModalTeamDetails, setShowModalTeamDetails] = useState(false)
	const [showModalPersonalDetails, setShowModalPersonalDetails] = useState(false)
	const logout = () => { auth.logout().then(() => props.onLogout()) }

	useEffect(() => {
		if (activeKey === "invite") {
			const queryParams = new URLSearchParams(window.location.search);
			if (queryParams.get('code')) {
				setCode(queryParams.get('code'))
			}
			setActiveKey("livechat")
		}

		const unlisten = history.listen(({ location }) => {
			openPage(window.location.pathname)
		})
		return unlisten
	}, [activeKey, setActiveKey])

	const utils = new UtilitiesController();

	//for team management
	const teamManagementController = new TeamManagementController();

	const [isLoading, setIsLoading] = useState(false);
	const [loaderText, setLoaderText] = useState();
	const alertCentral = useContext(AlertCentralContext);

	//for switch teams
	const [teams, setTeams] = useState([]);
	const [defaultTeam, setDefaultTeam] = useState();
	const [isClickedSwitch, setIsClickedSwitch] = useState(false);

	const getTeams = async () => {
		setTeams(await teamManagementController.fetchTeamList() || [])
	}

	const getDefaultTeam = async () => {
		setDefaultTeam(await teamManagementController.fetchDefaultTeam() || {});
	}

	useEffect(
		() => {
			getDefaultTeam();
		}, []
	);

	useEffect(
		() => {
			if (isClickedSwitch) {
				getTeams();
				setIsClickedSwitch(false);
			}
		}, [isClickedSwitch]
	);

	const handleSwitch = async (id) => {
		setLoaderText("Please wait while we are switching your default team . . .");
		setIsLoading(true);
		const response = await teamManagementController.handleTeamSwitch(id);
		if (response) {
			if (response.code === 200) {
				//notify success
				alertCentral.show("Successfully switched the default team.", 3000);
				await utils.sleep(1000);
	
				//reload the page after switching 
				window.location.reload();
			} else {
				alertCentral.error(response.message, 3000);
			}
		} else {
			alertCentral.show("There was an error encountered while switching the team. Please contact the administrator. Thank you.", 3000);
		}

		setIsLoading(false);
	}

	//for team invite
	const getTeamDetails = async (inviteCode) => {
		setLoaderText("Please wait while we are fetching the team details of this code . . .");
		setIsLoading(true);

		const response = await teamManagementController.fetchTeamDetailsViaInviteCode(inviteCode);
		if (response) {
			setTeamDetails(response);
			setHasDetails(true);
		} else {
			setTeamDetails();
			setHasDetails(false);
			alertCentral.error("The invite code may not be enabled or available for sharing. You may contact the administrator for more info. Thank you.", 3000);

			window.history.pushState("", "", window.location.protocol + "//" + window.location.host + "/");
		}	
		setIsLoading(false);
	}

	useEffect(
		() => {
			if (code) {
				getTeamDetails(code);
				setCode();
			}
		}, [code]
	)

	return (
		/** we use a container for the routing of pages */
		/** the top row contains the header, all the links to the pages */
		/** the bottom row contains the content */
		<BrowserRouter>
			<Tab.Container activeKey={activeKey} onSelect={key => key && openTab(key)} mountOnEnter={true} className='main-menu'>
				<Row className='main-menu-header'>
					<Col className='logo'>
						<img src={Logo} />
					</Col>
					<Col className='flex-def'>

						<Nav variant="main-menu">
							{
								links.map(key => (
									<Nav.Item key={key + "_tab"}>
										<Nav.Link as={Link} to={"/" + key} eventKey={key}>
											<img src={PAGES[key].image} />
											{PAGES[key].title}
										</Nav.Link>
									</Nav.Item>
								))
							}
						</Nav>

						<Dropdown drop="left">
							<Dropdown.Toggle variant="ham" style={{ width: '50px', marginRight: '0.5rem' }}>
								<Ham />
							</Dropdown.Toggle>

							<Dropdown.Menu>
								<Dropdown.Item> Logged in as: {user?.username}<br></br>({defaultTeam?.team?.name}) </Dropdown.Item>
								<Dropdown.Divider />
								<Dropdown.Item onClick={() => setShowModalPersonalDetails(true)} > Personal Details </Dropdown.Item>
								<PersonalDetailsWindow setDefaultTeam={setDefaultTeam} showModal={showModalPersonalDetails} noModal={() => setShowModalPersonalDetails(false)} />
								<Dropdown.Item onClick={() => setShowModalTeamDetails(true)} > Team Details </Dropdown.Item>
								<TeamDetailsWindow setDefaultTeam={setDefaultTeam} showModal={showModalTeamDetails} noModal={() => setShowModalTeamDetails(false)} />
								<DropdownButton
									key="switch-team-key"
									id="dropdown-button-drop-left"
									drop="left"
									variant="a"
									title='Switch Team'
									className="custom-dropdown-button-item"
									onClick={
										() => {
											setIsClickedSwitch(true);
										}
									}
								>
									{
										teams?.map(
											team => {

												return <Dropdown.Item
													onClick={
														() => {
															handleSwitch(team.team.id);
														}
													}
												>
													{team.team.name} {team.is_default ? <Badge variant="secondary">Default</Badge> : ''}
												</Dropdown.Item>
											}
										)
									}
								</DropdownButton>
								<Dropdown.Item onClick={() => setShowModalReset(true)} > Reset Password </Dropdown.Item>
								<ResetWindow showModal={showModalReset} noModal={() => setShowModalReset(false)} />
								<Dropdown.Item onClick={logout}> Logout </Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					</Col>
				</Row>
				<Row className='main-menu-content'>
					<Col>
						<Tab.Content>
							{
								links.map(key =>
									<Tab.Pane eventKey={key} key={"pane_" + key}>
										{React.createElement(PAGES[key].component || 'div')}
									</Tab.Pane>
								)
							}
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>


			<Invite
				show={hasDetails}
				onHide={setHasDetails}
				teamDetails={teamDetails}
				setTeamDetails={setTeamDetails}
				setLoaderText={setLoaderText}
				setIsLoading={setIsLoading}
			/>

			<LoadingModal
				show={isLoading}
				onHide={setIsLoading}
				centered
				size='md'
				loaderText={loaderText}
			/>
		</BrowserRouter>
	)
}