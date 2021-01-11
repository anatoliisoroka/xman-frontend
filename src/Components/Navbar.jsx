import React from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import './Navbar.css'

export default Navbar
export const samples = [
    (
        <Navbar>
            <Nav>
                <Nav.Link active={true}> Scheduled </Nav.Link>
                <Nav.Link> Completed </Nav.Link>
            </Nav>
        </Navbar>
    ),
    (
        <Navbar>
            <Nav>
                <Nav.Link> Something </Nav.Link>
                <Nav.Link active={true}> Something2 </Nav.Link>
                <Nav.Link> Something3 </Nav.Link>
            </Nav>
        </Navbar>
    )
]