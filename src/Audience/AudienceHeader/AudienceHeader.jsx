import  React , {useContext, useState} from 'react';
import './AudienceHeader.css';
import { ReactComponent as Plus } from '../../Images/add.svg'
import {Dropdown, DropdownButton} from 'react-bootstrap'
import ContactWindow from './ContactWindow'
import { Nav } from 'react-bootstrap'
import ProgressButton from '../../Components/ProgressButton';
import { AudienceStoreContext } from '../../Controllers/AudienceStore';
import ImportContactsWinow from './ImportContactsWinow';
import FilterDropdownButton from './FilterDropdown';
import MessageHistoryControls from './MessageHistoryControls';

export default () => {
	const [showModalAccount, setShowModalAccount] = useState (false)
	const [showImportCSV, setShowImportCSV] = useState (false)
	const { downloadCurrent, totalContacts, loading } = useContext (AudienceStoreContext)
	return(
		<>
			<ContactWindow  showModal={showModalAccount} noModal={setShowModalAccount} />
			<ImportContactsWinow showModal={showImportCSV} noModal={setShowImportCSV} />
			<div className="audience-header">
				<span className='flex-def'>
					{
						(!loading || totalContacts > 0) && <h5> { totalContacts } Contacts </h5>
					}
				</span>
				
				
				<Nav>
					<FilterDropdownButton />
					<MessageHistoryControls />
					<ProgressButton 
						onClick={ downloadCurrent }
						variant='transparent' 
						tooltip='Will export all the results from the current filter (if any)' 
						placement='bottom'>
						Export All
					</ProgressButton>

					<DropdownButton 
						variant="transparent" 
						title={<Plus style={{ fill: 'var(--color-secondary)' }}/>}>
						
						<Dropdown.Item onClick={ () => setShowModalAccount(true) }>Quick Add</Dropdown.Item>
						<Dropdown.Item onClick={ () => setShowImportCSV(true) }>Import CSV</Dropdown.Item>
					</DropdownButton>
				</Nav>
			</div>
		</>
)}