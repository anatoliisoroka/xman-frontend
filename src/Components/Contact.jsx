import React from 'react'
import BootstrapTable from 'react-bootstrap-table-next';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import './Contact.css'


export default BootstrapTable
const products = [ {name:'Kenny Lim',phone:'+852 12345678', tag: <div>
    <span>abc</span><span>jhjl</span><span>登記試做免疫益生肌底打燈術</span><span>LeadFromWebsite</span>
    </div>},
                    {name:'Mary Leung',phone:'+852 23457890', tag:<div>
                    <span>abc</span><span>jhjl</span><span>gold</span><span>登記試做免疫益生肌底打燈術</span><span>LeadFromWebsite</span>
                    </div>},
                    {name:'Angel Ma',phone:'+852 56578970', tag:<div>
                    <span>abc</span><span>jhjl</span><span>登記試做免疫益生肌底打燈術</span><span>LeadFromWebsite</span><span>silver</span>
                    </div>}
                ];
const columns = [{
  dataField: 'name',
  text: 'Name',
}, {
  dataField: 'phone',
  text: 'Phone'
}, {
    dataField: 'tag',
    text: 'Tags'
}];

const selectRowProp = {
	mode: 'checkbox',
	clickToSelect: true,
    style: { background: 'rgba(220,220,220,0.3)'},
};


export const samples = [
	(
    <div class='shadow'>
    <BootstrapTable 
    classes="radius"
	keyField = "name"
	data = { products }
    columns = { columns }
    selectRow = { selectRowProp }
    />
    </div>
	)
]
