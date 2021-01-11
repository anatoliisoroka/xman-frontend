import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Button from 'react-bootstrap/Button'
import FormControl from 'react-bootstrap/FormControl'
import InputGroup from 'react-bootstrap/InputGroup'
import './KeywordReply.css'

export default InputGroup
export const samples = [
    (
    <>
        <InputGroup>
        <DropdownButton
          as={InputGroup.Prepend}
          variant="green"
          title="If Message Contains"
          id="input-group-dropdown-1"
        >
          <Dropdown.Item href="#">Yes</Dropdown.Item>
          <Dropdown.Item href="#">Interested</Dropdown.Item>
          <Dropdown.Item href="#">Information</Dropdown.Item>
        </DropdownButton>

        <FormControl
        placeholder="Write your message here"
        aria-label="Message"
        aria-describedby="basic-addon2"
        />
        </InputGroup>

        <InputGroup className="mb-3">
        <DropdownButton
          as={InputGroup.Prepend}
          variant="white"
          title="Reply Message"
          id="input-group-dropdown-2"
        >
          <Dropdown.Item href="#">Thank you</Dropdown.Item>
          <Dropdown.Item href="#">Information</Dropdown.Item>
          <Dropdown.Item href="#">Your discount</Dropdown.Item>
        </DropdownButton>

        <FormControl
        placeholder="Write your message here"
        aria-label="Message"
        aria-describedby="basic-addon2"
        className="white-msg"
        />
        </InputGroup>
    
        <Button data-small variant="primary" data-color='secondary' type="submit">
            Submit
        </Button>
    </>
    ),
    <>
    <InputGroup>
    <DropdownButton
      as={InputGroup.Prepend}
      variant="green"
      title="If Message Contains"
      id="input-group-dropdown-3"
    >
      <Dropdown.Item href="#">Yes</Dropdown.Item>
      <Dropdown.Item href="#">Interested</Dropdown.Item>
      <Dropdown.Item href="#">Information</Dropdown.Item>
    </DropdownButton>

    <FormControl
    placeholder="Write your message here"
    aria-label="Message"
    aria-describedby="basic-addon2"
    />
    </InputGroup>

    <InputGroup className="mb-3">
    <DropdownButton
      as={InputGroup.Prepend}
      variant="white"
      title="Add these Tags"
      id="input-group-dropdown-4"
    >
      <Dropdown.Item href="#">Interested</Dropdown.Item>
      <Dropdown.Item href="#">VIP</Dropdown.Item>
      <Dropdown.Item href="#">Silver</Dropdown.Item>
      <Dropdown.Item href="#">Gold</Dropdown.Item>
    </DropdownButton>

    <FormControl
        placeholder="Interested"
        aria-label="Message"
        aria-describedby="basic-addon2"
        className="tag"
        />

    </InputGroup>

    <Button data-small data-color='secondary' type="submit">
        Submit
    </Button>
</>
]