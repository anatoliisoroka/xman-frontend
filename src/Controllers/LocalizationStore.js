import React, { createContext, useEffect, useState } from "react"
import * as CSV from 'csv-string'

const useLocalizationStore = () => {
    const [locales, setLocales] = useState({})
    const [currentLanguage, setCurrentLanguage] = useState('english')

    const parseCSV = text => {
        const content = CSV.parse(text)
        const header = content[0]
        const locales = content.slice(1).reduce((value, row) => (
            row.slice(1).reduce((value, item, idx) => {
                const lang = header[idx+1]
                value[lang] = value[lang] || {}
                value[lang][row[0]] = item || ''
                return value
            }, value)
        ), {})
        setLocales(locales)
        console.log('loaded languages')
    }
    
    useEffect(() => {
        fetch('/locales.csv')
        .then(r => r.text())
        .then(parseCSV)
    }, [])

    return {
        locale: locales[currentLanguage] || {}
    }
}

export const LocalizationContext = createContext({ locale: {} })

export const LocalizationContextMaker = ({ children }) => {
    const store = useLocalizationStore ()
    return (
        <LocalizationContext.Provider value={store}>
            { children }
        </LocalizationContext.Provider>
    )
}