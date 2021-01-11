import React, { useContext, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Alert, Button, Dropdown, Form } from "react-bootstrap";
import { ReactComponent as Add } from '../Images/add.svg'
import { TagStoreContext } from "../Controllers/AudienceStore";
import ProgressButton from '../Components/ProgressButton'
import './TagPicker.css'
import { AlertCentralContext } from "../Components/AlertCentral";

/**
 * @param {Object} props 
 * @param {'up' | 'down' | 'right' | 'left'} props.drop
 * @param {number} props.maxSelectableTags max number of tags that can be selected
 * @param {'dynamic' | 'static'} props.tagType
 * @param {boolean} props.deletable
 * @param {Set<string>} props.selectedTags set of selected tags
 * @param {function(Set<string>)} props.setSelectedTags updates the entire set
 * @param {function(string)} [props.addedTag] called when a tag is added
 * @param {function(string)} [props.removedTag] called when a tag is removed
 */
export default function TagPicker ({ drop, title, deletable, maxSelectableTags, selectedTags, tagType, setSelectedTags, addedTag, removedTag }) {
    const { getTag, filteredTags, createTag, deleteTag } = useContext (TagStoreContext)
    const alerts = useContext(AlertCentralContext)
    const [openedCreate, setOpenedCreate] = useState (false)
    const [showDropdown, setShowDropdown] = useState (false)
    const [searchString, setSearchString] = useState ('')
    
    const ref = useRef(null)

    title = title || ( tagType === 'static' ? 'Select tags...' : tagType === 'dynamic' ? 'Select segments...' : 'Select tags or segments...')

    const addTag = id => {
        if (selectedTags.size >= maxSelectableTags) return
        const newTags = new Set(selectedTags)
        newTags.add (id)
        setSelectedTags (newTags)

        addedTag && addedTag (id)
    }
    const removeTag = id => {
        const newTags = new Set(selectedTags)
        newTags.delete (id)
        setSelectedTags (newTags)

        removedTag && removedTag (id)
    }
    const createAndAddTag = async name => {
        const tag = await createTag (name, false)
        setSearchString ('')
        addTag (tag.name)
        setShowDropdown (false)
    }
    const toggleTag = id => {
        if (selectedTags.has(id)) removeTag (id)
        else addTag (id)
    }
    const deleteTagWithConfirm = async id => {
        if (!window.confirm('Are you sure you want to delete this tag?')) return
        await deleteTag(id)
        alerts.show ('Deleted tag successfully!', 3000)
    }

    useEffect(() => {
        const handleClickOutside = event => {
            if (ref.current && !ref.current.contains(event.target) && showDropdown && !openedCreate) {
                setShowDropdown (false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [ openedCreate, setShowDropdown, showDropdown, ref, openedCreate ])

    return (
        <Dropdown drop={drop} show={showDropdown}>
            <Dropdown.Toggle variant='tag-picker' onClick={ () => setShowDropdown(true) }>
                {
                    selectedTags.size > 0 ? 
                    (
                        [...selectedTags]
                        .map (id => (
                            <Alert key={id} variant='tag' onClose={ (_, e) => {
                                e.stopPropagation()
                                removeTag(id) 
                            } } dismissible>
                                { getTag(id)?.name || id }
                            </Alert>
                        ))
                    ) : title
                }
            </Dropdown.Toggle>

            <Dropdown.Menu 
                renderOnMount 
                className='tag-picker' 
                ref={ref}
                rootCloseEvent={ () => {} }>
                
                <Form.Control value={searchString} placeholder='search or create tags...' onChange={ ev => setSearchString(ev.target.value) }/>

                {
                    showDropdown &&
                    <div className='tag-picker-scroll'>
                        {
                            searchString && !getTag(searchString) &&
                            <ProgressButton
                                onClick={ () => createAndAddTag(searchString) }
                                variant='create-tag'>
                                Create tag '{searchString}'
                            </ProgressButton>
                        }
                        {
                            filteredTags(searchString, tagType && (tagType === 'dynamic')).map (tag => (
                                <Dropdown.Item
                                    target='_self'
                                    onClick={ () => toggleTag(tag.name) } 
                                    className={ `${tag.isDynamic ? 'dynamic-tag' : 'static-tag'} ${selectedTags.has(tag.name) ? 'selected-tag' : ''}` }>
                                    <span >{ tag.name }</span>
                                    {
                                        deletable !== false && (
                                            <Button variant='primary' data-color='danger' className='file-preview-close' onClick={e => { e.stopPropagation(); deleteTagWithConfirm(tag.name) }} />
                                        )
                                    }
                                    
                                </Dropdown.Item>
                            ))
                        }
                    </div>
                }
                
            </Dropdown.Menu>
        </Dropdown>
    )
}