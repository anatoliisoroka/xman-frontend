import React from 'react';
import AudienceHeader from './AudienceHeader/AudienceHeader';
import AudienceTable from './AudienceTable';
import './Audience.css';

function Audience(props) {
	return(
		<div className="audience">
			<AudienceHeader />
			<AudienceTable />
		</div>
	)
	
}
export default Audience;