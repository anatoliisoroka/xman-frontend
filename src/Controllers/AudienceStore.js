import AwesomeDebouncePromise from "awesome-debounce-promise";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import useConstant from "use-constant";
import AudienceController, { formatFilterOptions } from "./AudienceController";
import {FirebaseContext} from "./../Firebase"
import TeamManagementController from "./TeamManagementController";

const DEFAULT_PAGE_SIZE = 50

export const useTagStore = () => { 
    const controller = new AudienceController ()
    const { analytics } = useContext(FirebaseContext)

    const tagMap = useRef ({})
    
    const [tags, setTags] = useState ([])
    const [loadedTags, setLoadedTags] = useState(false)
    
    const loadTags = async () => {
        const tags = await controller.fetchTags ()
        tags && tags.forEach(tag => tagMap.current[tag.name] = tag)

        setTags (tags || [])
        setLoadedTags (true)
    }
    const filteredTags = (searchStr, dynamic) => {
        if (!searchStr && typeof dynamic === 'undefined') return tags
        return tags.filter (tag => (
            (!searchStr || tag.name.includes(searchStr)) &&
            (typeof dynamic === 'undefined' || (!!tag.isDynamic === dynamic))
        ))
    }
    const createTag = async (tag, dynamic, filters) => {
        const createdTag = await controller.createTag (tag, dynamic, filters)
        analytics.logEvent('tag_created')
        tagMap.current[createdTag.name] = createdTag
        setTags ([ createdTag, ...tags ])
        return createdTag
    }
    const deleteTag = async (name) => {
        await controller.deleteTag (name)
        delete tagMap.current[name]
        setTags ( tags.filter (t => t.name !== name) )
    }
    const getTag = name => tagMap.current[name]

    const injectTags = newTags => {
        setTags ([...newTags, ...tags])
        newTags.forEach (t => tagMap.current[t.name] = t)
    }

    useEffect (() => {
        loadTags ()
    }, [])

    return {
        tags,
        injectTags,
        getTag,
        loadTags,
        createTag,
        deleteTag,
        filteredTags,
        loadedTags
    }
}
export const TagStoreContext = createContext (
    { tags: [], getTag: id => {}, deleteTag: async id => {}, filteredTags: str => [], loadTags: async () => {}, createTag: async tag => {}, loadedTags: false }
)
export const TagStoreContextMaker = ({ children }) => {
    const store = useTagStore ()
    return (
        <TagStoreContext.Provider value={store}>
            { children }
        </TagStoreContext.Provider>
    )
}

export const useAudienceStore = ({ requireFilter }) => {
    const controller = new AudienceController ()
    const { getTag } = useContext(TagStoreContext)

    const [contacts, setContacts] = useState ([])
    const [totalContacts, setTotalContacts] = useState(0)
    const [hasMore, setHasMore] = useState (true)
    const [loading, setLoading] = useState (false)
    const [filters, _setFilters] = useState (
        {
            'search-string': undefined,
            'tags': new Set ([]),
            'not-tags': new Set ([])
        }
    )
    /** inclusive when the all toggle is not set */
    const [selectMode, setSelectMode] = useState('inclusive')
    const [manualSelections, setManualSelections] = useState(new Set())
    const [selectedCount, setSelectedCount] = useState(0)

    const cursor = useRef (undefined)
    const contactMap = useRef ({})

    const setFilters = useConstant (() => AwesomeDebouncePromise((old, alt) => _setFilters({ ...old, ...alt }), 250))
    const formattedFilters = () => ({ ...filters, tags: [...filters.tags], 'not-tags': [...filters['not-tags']] })
    const selectedFilters = (() => {
        if (selectMode === 'inclusive') {
            return { contacts: [...manualSelections] }
        } else {
            return { ...formattedFilters(), 'not-contacts': [...manualSelections] }
        }
    })()

    const fetchContacts = async previousContacts => {
        setLoading (true)
        try {
            const {contacts, cursor: newCursor, total} = await controller.fetchContacts ({ ...formattedFilters(), cursor: cursor.current, 'page-size': DEFAULT_PAGE_SIZE })
    
            setContacts ([ ...(previousContacts || []), ...contacts ])
            typeof total !== 'undefined' && setTotalContacts(total)
            setHasMore (contacts.length >= DEFAULT_PAGE_SIZE)
    
            cursor.current = newCursor
            contacts.forEach (contact => {
                if (contactMap.current[contact.phone]) {
                    contactMap.current[contact.phone] = contact
                }
            })
        } finally {
            setLoading (false)
        }
    }
    const fetchContact = async (phone) => {
        if(!contactMap.current[phone]) {
            contactMap.current[phone] = controller.fetchContact (phone)
        }
        return await contactMap.current[phone]
    }
    const addContact = async (contact) => {
        if (contact.tags && Array.isArray(contact.tags)) {
            contact.tags = contact.tags.join(',')
        }
        const [newContact] = await controller.addContacts ([contact])
        setContacts ([ newContact, ...(contacts.filter(c => c.phone !== newContact.phone)) ])
    }
    const importContactsCSV = async (file, options) => {
        const newContacts = await controller.addContactsCSV (file, options)
        const dict = new Set ( newContacts.map (c => c.phone) )
        const tagsDict = {}
        
        newContacts.forEach (c => {
            c.tags = c.tags || []
            c.tags.forEach (t => { if(!getTag(t.id)) tagsDict[t.id] = t })
        })

        setContacts ([ ...newContacts, ...(contacts.filter(c => !dict.has(c.phone))) ].slice(0, DEFAULT_PAGE_SIZE*2))
    }
    const patchContacts = async (contactsToPatch, edit) => {
        await controller.patchContacts ({ contacts: [...contactsToPatch] }, edit)
        contacts.forEach(contact => {
            if (!contactsToPatch.has(contact.phone)) return

            if (edit.addTags) {
                edit.tags = [ ...contact.tags, ...edit.addTags.map(name => ({ name, isDynamic: false }))  ]
                delete edit.addTags
            }
            if (edit.removeTags) {
                edit.tags = contact.tags.filter(({ name }) => !edit.removeTags.includes(name) )
                delete edit.removeTags
            }
            if(edit.assignee){
                contact.assignee = edit.assignee
            }
            Object.assign (contact, edit)
        })
        setContacts ([ ...contacts ])
    }
    const deleteContacts = async phones => {
        await controller.deleteContacts ({ contacts: [...phones] })
        setContacts (contacts.filter(c => !phones.has(c.phone)))
    }

    const downloadCurrent = async () => {
        const response = await controller.fetchContactsCSV ({ ...formattedFilters(), 'page-size': totalContacts+10 })
        const blob = await response.blob()
        
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `contacts-${new Date().toLocaleString()}.csv`;
        document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
        
        a.click();    
        a.remove();  //afterwards we remove the element again  
    }
    const deleteSelectedContacts = async () => {
        if (!window.confirm(`Are you sure you want to delete all ${selectedCount} selected contacts?\nThis action cannot be undone`)) return
        await controller.deleteContacts(selectedFilters)
        setContacts([ ...contacts.filter(({ phone })=> !isSelected(phone)) ])
    }
    const patchSelectedContacts = async (edit) => {
        await controller.patchContacts(selectedFilters, edit)
        const sContacts = contacts.filter(({ phone })=> isSelected(phone))
        if (edit.addTags) {
            sContacts.forEach (c => c.tags.push(...edit.addTags.map(name => ({ name }))))
        }
        if (edit.removeTags) {
            sContacts.forEach (c => c.tags = c.tags.filter(({ name }) => !edit.removeTags.includes(name)))
        }
        setContacts ([ ...contacts ])
    }
    const isSelected = phone => {
        if (selectMode === 'inclusive') {
            return manualSelections.has(phone)
        }
        return !manualSelections.has(phone)
    }
    const toggleSelectAll = () => {
        setSelectMode( selectMode === 'inclusive' ? 'exclusive' : 'inclusive' )
        setManualSelections(new Set())
    }
    const toggleSelectContact = phone => {
        if (manualSelections.has(phone)) {
            setManualSelections(new Set(
                [...manualSelections].filter(item => item !== phone)
            ))
        } else {
            setManualSelections(new Set([...manualSelections, phone]))
        }
    }
    const updateSelectedCount = () => {
        if (selectMode === 'inclusive') {
            setSelectedCount(manualSelections.size)
        } else {
            setSelectedCount(totalContacts-manualSelections.size)
        }
    }

    useEffect (() => {
        setContacts ([])
        cursor.current = undefined

        const validKeyLength = Object.values(formatFilterOptions(formattedFilters())).length
        if (requireFilter && validKeyLength === 0) {
            return
        }

        fetchContacts ([])
    }, [ filters ])

    useEffect(() => {
        updateSelectedCount()
    }, [ selectMode, manualSelections ])

    return {
        contacts,
        totalContacts,
        fetchContact,
        addContact,
        importContactsCSV,
        patchContacts,
        deleteContacts,
        downloadCurrent,
        loading,
        hasMore,
        filters,
        formattedFilters,
        setFilters: more => setFilters (filters, more),
        deleteSelectedContacts,
        patchSelectedContacts,
        toggleSelectAll,
        toggleSelectContact,
        isSelected,
        selectedCount,
        fetchMore: () => fetchContacts (contacts)
    }
}

export const AudienceStoreContext = createContext (
    { 
        filters: {}, 
        contacts: [], 
        downloadCurrent: async () => {}, 
        importContactsCSV: (file, options) => {}, 
        addContact: (c, t) => {}, 
        patchContacts: contact => {},
        deleteContacts: contact => {},
        loading: false, 
        hasMore: true, 
        setFilters: filter => {}, 
        fetchMore: () => {},
        fetchContact: async phone => {},
        selectedAll: false,
        selectedCount: 0,
        toggleSelectAll: () => {},
        isSelected: phone => false,
        deleteSelectedContacts: async () => {},
        patchSelectedContacts: async () => {},
    }
)
export const AudienceStoreContextMaker = ({ children }) => {
    const store = useAudienceStore ({ requireFilter: false })
    return (
        <AudienceStoreContext.Provider value={store}>
            { children }
        </AudienceStoreContext.Provider>
    )
}