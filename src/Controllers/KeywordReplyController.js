import AuthController from "./AuthController";
import querystring from 'querystring'



/**
 * @typedef Keyword
 * @property {string} id
 * @property {string} userId
 * @property {number} createdAt
 * @property {boolean} enabled
 * @property {string} detectionMechanism
 * @property {string} keyword
 * @property {string} flowID
 * @property {string[]} tags
 * @property {boolean} notifyUser
 */

export default class KeywordReplyController {
    endpoint = "https://api-nlp.xman.tech"
    //endpoint = "http://localhost:8000"
    auth = new AuthController ()

    /** 
    * @param {Object} data 
    * @param {string} data.detectionMechanism
    * @param {string} data.keyword
    * @param {integer} data.replySpan
    * @param {string[]} data.flowIDs
    * @param {string[]} data.tags
    * @param {boolean} data.notifyUser
    * @returns {Keyword} 
     */
    async createKeyword  (data) {
            const created = await this.fetchJSON ('/?' , 'PUT', data)
            return created
    }

    /** 
    * @param {Object} data 
    * @param {string} data.detectionMechanism
    * @param {string} data.keyword
    * @param {string[]} data.flowIDs
    * @param {integer} data.replySpan
    * @param {integer} data.detectionCount
    * @param {string[]} data.addTags
    * @param {string[]} data.removeTags
    * @param {boolean} data.notifyUser
    * @param {boolean} data.enabled
    * @returns {Keyword} 
     */
    async editKeyword (id,data) {
        const edited = await this.fetchJSON (`/${id}` , 'PATCH', data)
        return edited
    }

    /** 
    * @param {string} id
     */ 
    async deleteKeyword  (id) {
        await this.fetchJSON(`/${id}`, 'DELETE')
    }

     /** 
    * @param {string} id
     */ 
    async fetchKeywordExcecutionRecord (id) {
        const exceutionRecord = await this.fetchJSON (`${id}/execution-record`, 'GET')
        return exceutionRecord
    }

    /**
     * @param {{ before: number, 'page-size': number }} options 
     */
    async fetchKeywords (options) {
        const keywords = await this.fetchJSON ('/?' + querystring.encode(options), 'GET')
        return keywords
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
        if (response.status >= 400) throw new Error(text)
        const json = text && JSON.parse (text)
        return json
    }
}