import { createContext } from "react";
import AuthController from "./AuthController";
import EventEmitter from 'events'

/**
 * @typedef FileContent
 * @property {string} url
 * @property {string} name
 * @property {string} mimetype
 * 
 * @typedef MessageTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} [text]
 * @property {FileContent} [image]
 * @property {FileContent} [video]
 * @property {FileContent} [audio]
 * @property {FileContent} [sticker]
 * @property {FileContent} [document]
 */

export default class MessageTemplatesController {
    //endpoint = "http://localhost:5000"
    endpoint = "https://api-wa.xman.tech"
    auth = new AuthController()

    flowContainer = { flows: null, cursor: null }
    flowCache = {}
    flowsEvents = new EventEmitter ()

    /**
     * Fetches a single flow
     * @param {string} flowId 
     * @returns {MessageTemplate}
     */
    async getFlow (flowId) {
        if (!this.flowCache[flowId]) {
            try {
                const flow = await this.fetchJSON (`/${flowId}`, 'GET')
                this.flowCache[flow.id] = flow
            } catch {
                
            }
        }
        return this.flowCache[flowId]
    }
    /**
     * Deletes a single flow
     * @param {string} flowId 
     * @returns {MessageTemplate}
     */
    async deleteFlow (flowId) {
        await this.fetchJSON (`/${flowId}`, 'DELETE')
        delete this.flowCache[flowId]

        this.flowContainer.flows = this.flowContainer.flows.filter (f => f.id !== flowId)
        this.flowsEvents.emit ('flows-updated')
    }
    async loadFlows (count, cursorID, search) {
        if (!search && !cursorID && this.flowContainer.flows) {
            return { flows: this.flowContainer.flows, cursor: this.flowContainer.cursor }
        }
        const result = await this.fetchJSON (
            `/?count=${ count }${ cursorID ? `&cursor=${encodeURIComponent(cursorID)}` : '' }${ search ? `&search=${encodeURIComponent(search)}` : '' }`, 
            'GET'
        )
        result.flows.forEach (flow => this.flowCache[flow.id] = flow)
        return result
    }
    /**
     * Sends a create request 
     * @param {*} options 
     * @returns {MessageTemplate}
     */
    async createFlow (options) {
        const result = await this.upload (`/`, 'POST', options)
        return result
    }
    /**
     * Sends an edit request 
     * @param {*} options 
     * @returns {MessageTemplate}
     */
    async editFlow (id, options) {
        const result = await this.upload (`/${id}`, 'PATCH', options)
        return result
    }
    async upload (path, method, options) {
        const fileCount = Object.values (options).filter (v => v instanceof File).length
        if (fileCount === 0) { // if no files, just do a regular POST
            return this.fetchJSON (path, method, options)
        }
        const form = new FormData ()
        Object.keys (options).forEach (key => {
            if (typeof options[key] !== 'undefined') {
                form.append (key, options[key])
            }
        })
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(`message-flows${path}`, this.endpoint), { 
            method, 
            body: form, 
            headers: { 'authorization': `Bearer ${token}` } 
        })
        const text = await response.text()
        if (response.status !== 200) {
            throw new Error ('Failed to upload!')
        }
        return text && JSON.parse (text)
    }
    /** utility function to fetch JSON from service */
    async fetchJSON (path, method, body) {
        const token = await this.auth.getToken ()
        const response = await fetch (new URL(`message-flows${path}`, this.endpoint), { 
            method, 
            body: body && JSON.stringify(body), 
            headers: { 
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            } 
        })
        const text = await response.text()
        if (!text) return

        const json = JSON.parse (text)
        if (json.error) {
            console.error (json)
            throw new Error (json.error || json.message)
        }
        return json
    }
}
export const MessageTemplatesControllerContext = createContext (new MessageTemplatesController())