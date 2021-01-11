import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import KeywordReplyController from "./KeywordReplyController";
import {FirebaseContext} from "../Firebase"

export const useKeywordStore = () => { 
    const controller = new KeywordReplyController ()

    const {analytics} = useContext(FirebaseContext)
    const keywordMap = useRef ({})
    const cursor = useRef (null)
    const [keywords, setKeywords] = useState ([])
    const [loadedKeywords, setLoadedKeywords] = useState(false)
    
    const loadKeywords = async () => {
        const options = {"page-size":15}
		if(cursor.current){
			options.before = cursor.current
		}
        const keywords = await controller.fetchKeywords(options)

        const last = keywords[keywords.length-1]
		if (last) {
			cursor.current = keywords[keywords.length-1].cursorValue
        }
            
        keywords && keywords.forEach(keyword => keywordMap.current[keyword.id] = keyword)
        setKeywords (keywords || [])
        setLoadedKeywords (true)
        return keywords
    }
   
    const createKeyword = async (keyword) => {
        const createdKeyword = await controller.createKeyword(keyword)
        keywordMap.current[createKeyword.id] = createKeyword
        setKeywords ([ createKeyword, ...keywords ])
        analytics.logEvent('keyword_reply_rule_created')
        return createdKeyword
    }

    const editKeyword = async (id ,keyword) =>{
        const editedKeyword = await controller.editKeyword(id, keyword)
        keywordMap.current[id] = editedKeyword
        return editedKeyword
    }

    const deleteKeyword = async (id) => {
        await controller.deleteKeyword (id)
        delete keywordMap.current[id]
        setKeywords ( keywords.filter (k => k.id !== id) )
    }

    const getKeyword = (id) => keywordMap.current[id]

    const fetchKeywordExectuionRecord = async (id) => {
        return await controller.fetchKeywordExcecutionRecord(id)
    }
    

    useEffect (() => {
        loadKeywords ()
    }, [])

    return {
        keywords,
        getKeyword,
        loadKeywords,
        createKeyword,
        editKeyword,
        deleteKeyword,
        loadedKeywords,
        fetchKeywordExectuionRecord,
    }
}

// export const KeywordStoreContext = createContext (
//     {
//          keywords: [], 
//          getKeyword: id => {}, 
//          deleteKeyword: async id => {},  
//          loadKeywords: async () => {}, 
//          createKeyword: async keyword => {}, 
//          editKeyword :async (id, keyword) => {},
//          loadedKeywords: false, 
//          fetchKeywordExectuionRecord: id => {} }
// )

// export const KeywordStoreContextMaker = ({ children }) => {
//     const store = useTagStore ()
//     return (
//         <KeywordStoreContext.Provider value={store}>
//             { children }
//         </KeywordStoreContext.Provider>
//     )
// }
