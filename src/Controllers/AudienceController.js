import AuthController from "./AuthController";
import querystring from 'querystring'

export const formatFilterOptions = options => {
    options = { ...options }
    Object.keys (options).forEach (key => ( !options[key] || (typeof options[key].length !== 'undefined' && !options[key].length) ) && (delete options[key]))
    return options
}

/**
 * @typedef Tag
 * @property {string} name
 * @property {boolean} isDynamic
 * 
 * @typedef Contact
 * @property {string} name
 * @property {string} phone
 * @property {number} messagesSent
 * @property {number} messagesReceived
 */
export default class AudienceController {
    endpoint = "https://api-audience.xman.tech"
    //endpoint = "http://localhost:8000"
    auth = new AuthController ()
    /**
     * Fetches all the tags in the user's list
     * @returns {Tag[]}
     */
    async fetchTags () {
        const tags = await this.fetchJSON ('/tags', 'GET')
        return tags
    }
    /**
     * @param {string} name 
     * @param {string} [dynamic]
     * @param {Object} [filters]
     * @returns {Tag}
     */
    async createTag (name, isDynamic, filters) {
        filters = filters || {}
        isDynamic = isDynamic || false
        const obj = { name, 'is-dynamic': isDynamic, ...filters }
        const created = await this.fetchJSON ('/tags/?' + querystring.encode(obj), 'PUT')
        return created
    }
    async patchTag (tag, options, body) {
        options = formatFilterOptions (options)
        await this.fetchJSON (`/tags/${ encodeURIComponent(tag) }?${querystring.encode(options)}`, 'PATCH', body)
    }
    async deleteTag (tag) {
        await this.fetchJSON (`/tags/${ encodeURIComponent(tag) }`, 'DELETE')
    }
    /**
     * @param {{ before: number, 'page-size': number, 'search-string': string }} options 
     * @returns {{ total: number, contacts: Contact[], cursor: string }}
     */
    async fetchContacts (options) {
        options = formatFilterOptions(options)
        const contacts = await this.fetchJSON ('/contacts/?' + querystring.encode(options), 'GET')
        return contacts
    }
    async fetchContactsCSV (options) {
        options = formatFilterOptions(options)
        const path = '/contacts/?' + querystring.encode(options)
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(path, this.endpoint), {
            method: 'GET', 
            headers: { 
                'accept': 'text/csv',
                'authorization': `Bearer ${token}`
            } 
        })
        return response
    }
    /**
     * @param {string} phone 
     * @returns {Contact}
     */
    async fetchContact (phone) {
        const { contacts } = await this.fetchContacts({ contacts: phone, "page-size": 1 })
        return contacts[0]
    }
    async addContacts (data) {
        const contact = await this.fetchJSON ('/contacts', 'PUT', data)
        return contact
    }
    /**
     * @returns { Contact[] }
     */
    async addContactsCSV (file, {nameColumn, phoneColumn, tagsColumn}) {
        const path = `/contacts/?name-column=${nameColumn}&phone-column=${phoneColumn}&tags-column=${tagsColumn}`
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(path, this.endpoint), {
            method: 'PUT', 
            body: file,
            headers: { 'authorization': `Bearer ${token}`, 'content-type': 'text/csv' } 
        })
        const text = await response.text()
        if (response.status >= 400) {
            throw new Error (text)
        }
        return JSON.parse(text)
    }
    async patchContacts (filters, edit) {
        const contact = await this.fetchJSON ('/contacts/?' + querystring.encode(filters), 'PATCH', edit)
        return contact
    }
    async deleteContacts (filters) {
        await this.fetchJSON ('/contacts?' + querystring.encode (filters), 'DELETE')
    }
    /** utility function to fetch JSON from service */
    async fetchJSON (path, method, body) {
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(path, this.endpoint), {
            method, 
            body: body && JSON.stringify(body), 
            headers: { 
                'content-type': 'application/json',
                'accept': 'application/json',
                'authorization': `Bearer ${token}`
            } 
        })
        const text = await response.text()
        if (response.status >= 400) throw new Error (text)
        const json = text && JSON.parse (text)
        return json
    }
}