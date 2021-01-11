import { createBrowserHistory } from 'history'
import { createContext } from 'react'
const history = createBrowserHistory()

export default createContext (history)