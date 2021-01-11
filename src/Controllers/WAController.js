import AuthController from "./AuthController"
import querystring from 'querystring'

export default class WAController {
    //endpoint = "http://localhost:5000"
    endpoint = "https://api-wa.xman.tech"
    auth = new AuthController ()
    
    async getState () {
        const state = await this.fetchJSON ('/', 'GET')
        return state
    }
    async open () {
        const state = await this.fetchJSON ('/open', 'GET')
        return state
    }
    /**
     * 
     * @param {Object} filters 
     * @param {string} filters.before
     * @param {number} filters.count
     * @param {string} filters.searchString
     * @param {string[]} filters.tags
     * @returns {{ chats: any[], cursor: string }}
     */
    async loadChats (filters) {
        filters = { ...filters, tags: filters.tags && [...filters.tags] }
        Object.keys(filters).forEach (key => {
            if (filters[key] === undefined || filters[key] === null || (filters[key].length === 0 )) {
                delete filters[key]
            }
        })
        const query = querystring.encode (filters)
        const url = new URL(`/chats?${query}`, this.endpoint)
        const result = await this.fetchJSON (url, 'GET')
        return result
    }
    async loadChat (jid) {
        const url = new URL(`/chats/${encodeURIComponent(jid)}`, this.endpoint)
        const result = await this.fetchJSON (url, 'GET')
        return result
    }
    async chatRead (jid, read) {
        read = typeof read === 'undefined' ? true : read
        const url = new URL(`/chats/${encodeURIComponent(jid)}/read?read=${read}`, this.endpoint)
        await this.fetchJSON (url, 'POST')
    }
    async chatPresenceSubscribe (jid) {
        const url = new URL(`/user/subscribe/${encodeURIComponent(jid)}`, this.endpoint)
        await this.fetchJSON (url, 'POST')
    }
    async sendTyping (jid) {
        const url = new URL(`/chats/${jid}/typing?typing=true`, this.endpoint)
        await this.fetchJSON (url, 'POST')
    }
    /**
     * 
     * @param {string} jid the chat ID
     * @param {number} count number of messages to load
     * @param {string} cursor 
     */
    async loadMessages (jid, count, cursor) {
        const query = { count }
        if (cursor) query.before = cursor
        
        const encoded = querystring.encode (query)
        const url = new URL(`/messages/${encodeURIComponent(jid)}?${encoded}`, this.endpoint)
        const content = await this.fetchJSON (url, 'GET')

        return content
    }
    /**
     * @param {{searchString: string, count: number, page: number, jid?: string}} options 
     * @returns {{ last: boolean, messages: any[] }}
     */
    async searchMessages (options) {
        const url = new URL(`/messages/search?${querystring.encode (options)}`, this.endpoint)
        const content = await this.fetchJSON (url, 'GET')
        return content
    }
    async mediaMessageUrl (jid, messageID) {
        const {url} = await this.fetchJSON(`/messages/${encodeURIComponent(jid)}/${messageID}/media`, 'GET')
        return url
    }
    /**
     * Delete a message 
     * @param {string} jid chat ID
     * @param {string} id message ID
     */
    async deleteMessage (jid, id) {
        await this.fetchJSON (`/messages/${encodeURIComponent(jid)}/${id}?forMe=false`, 'DELETE')
    }
    /**
     * Delete a note 
     * @param {string} jid chat ID
     * @param {string} id note ID
     * @param {{ text: string }} edit
     */
    async editNote (jid, id, edit) {
        await this.fetchJSON (`/notes/${encodeURIComponent(jid)}/${id}`, 'PATCH', edit)
    }
    /**
     * Delete a note 
     * @param {string} jid chat ID
     * @param {string} id note ID
     */
    async deleteNote (jid, id) {
        await this.fetchJSON (`/notes/${encodeURIComponent(jid)}/${id}`, 'DELETE')
    }
    relayPendingMessage (message) {
        let promise
        if (message.note) {
            promise = this.sendNote (message.key.remoteJid, message.pending)
        } else {
            promise = this.sendMessage (message.key.remoteJid, message.pending)
        }
        message.pendingPromise = promise
    }
    /**
     * Send a message/message flow;
     * @param {string} jid 
     * @param {Object} options 
     * @param {string} [options.flow] set this to send a flow
     */
    async sendMessage (jid, options) {
        const hasFile = Object.values(options).filter (v => v instanceof File).length > 0
        
        let body
        if (hasFile) {
            const form = new FormData ()
            Object.keys (options).forEach (key => {
                if (typeof options[key] !== 'undefined') {
                    form.append (key, options[key])
                }
            })
            body = form
            console.log(`sending message to ${jid} as multipart-upload`)
        } else {
            body = JSON.stringify({ ...options, parameters: {} })
        }
        
        const token = await this.auth.getToken ()
        const path = `messages/${encodeURIComponent(jid)}${ options.flow ? `/${options.flow}` : '' }`
        const response = await fetch (new URL(path, this.endpoint), { 
            method: 'POST', 
            body, 
            headers: { 
                'authorization': `Bearer ${token}`,
                ...( hasFile ? { } : { 'content-type': 'application/json' } )
            } 
        })
        if (response.status !== 200) {
            throw new Error ('Message failed to send!')
        }
    }
    async forwardMessage(chatJid,messageId,jids){
        await this.fetchJSON (`/messages/${encodeURIComponent(chatJid)}/${messageId}/forward`, 'POST', {jids})
    }
    async updateChat (jid, modification, durationMs) {
        await this.fetchJSON (`/chats/${encodeURIComponent(jid)}?modification=${modification}`, 'PATCH')
    }
    async deleteChat (jid) {
        await this.fetchJSON (`/chats/${encodeURIComponent(jid)}`, 'DELETE')
    }
    async clearMessageCache (jid) {
        await this.fetchJSON (`/chats/${encodeURIComponent(jid)}/clear-message-cache`, 'POST')
    }
    async clearPendingMessages (jid) {
        await this.fetchJSON (`/messages/${encodeURIComponent(jid)}/all-pending`, 'DELETE')
    }
    /**
     * 
     * @param {string} jid 
     * @param { 'add' | 'remove' | 'promote' | 'delete' } action
     * @param {string[]} participants 
     */
    async updateGroupParticipants (jid, action, participants) {
        const method = action === 'add' ? 'PUT' : action === 'remove' ? 'DELETE' : 'PATCH'
        await this.fetchJSON(`/groups/${jid}/${action}`, method, { participants })
    }
    async createGroup (subject, participants) {
        const {id} = await this.fetchJSON(`/groups`, 'POST', { subject, participants })
        return id
    }
    /**
     * @param {string} jid 
     * @param {Object} options 
     * @param {string} options.text
     */
    async sendNote (jid, options) {
        await this.fetchJSON (`/notes/${encodeURIComponent(jid)}`, 'POST', options)
    }
    async getGroupMetadata (jid) {
        const result = await this.fetchJSON (`/groups/${encodeURIComponent(jid)}`, 'GET')
        return result
    }
    async closeConnection () {
        await this.fetchJSON ('/close', 'GET')
    }
    async logoutWithConfirm () {
        if (!window.confirm('This will close the connection to WhatsApp -- none of your broadcasts or keyword replies will go though till you connect again. Are you sure you want to proceed?')) {
            return
        }
        await this.logout ()
    }
    async logout () {
        await this.fetchJSON ('/logout', 'GET')
    }
    async profilePictureUrl (jid) {
        const token = await this.auth.getToken()
        const url = new URL(`/user/picture/${encodeURIComponent(jid)}`, this.endpoint)
        return `${url.toString()}?access_token=${token}`
    }
    /** utility function to fetch JSON from service */
    async fetchJSON (path, method, body) {
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(path, this.endpoint), {
            method, 
            body: body && JSON.stringify(body), 
            headers: { 
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            } 
        })
        const text = await response.text()

        if (text) {
            const json = JSON.parse (text)
            if (json.error) {
                console.error (json)
                throw new Error (json.error || json.message)
            }
            return json
        }
        if (response.status >= 400) {
            throw new Error(`unexpected status: ${response.status}, ${response.statusText}`)
        }
    }
}