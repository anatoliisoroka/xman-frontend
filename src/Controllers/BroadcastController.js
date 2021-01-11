import { stringify } from 'query-string';
import AuthController from "./AuthController";


const base_url = "https://api-campaigns.xman.tech";

export default class BroadcastController {
    contentType = 'application/json';
    auth = new AuthController();

    /**
     * Fetch Campaigns using an access token
     * @param {object} query 
     * @param {number} query.count
     * use query.count to limit the number of rows to be returned by the api
     * @param {number} query.before
     * use query.before to point where the cursor starts counting
     * @returns {Campaigns} the list of campaigns
     */
    async getCampaigns (query) {
        var query = query || {}

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/?${stringify(query)}`,
            {
                method: 'GET'
            }
        )
        .then(
            (response) => {
                if (response.status < 200 && response.status >= 300) {
                    return Promise.resolve(response);
                }
                return Promise.resolve(response.json());
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Create Campaign using an access token
     * @param {object} data
     * @returns {Campaign} the newly created campaign
     */
    async createCampaign (data) {
        var query = {};

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/?${stringify(query)}`,
            {
                method: 'POST',
                body: JSON.stringify(data)
            }
        )
        .then(
            (response) => {
                return Promise.resolve(response.json());
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Fetch Campaign using an access token
     * @param {string} id
     * @returns {Campaign} the details of the campaign
     */
    async getCampaignById (id) {
        var query = {}

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/${id}/?${stringify(query)}`,
            {
                method: 'GET'
            }
        )
        .then(
            (response) => {
                return Promise.resolve(response.json());
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Update Campaign using access token
     * @param {string} id
     * @param {object} data
     */
    async updateCampaignById (id, data) {
        var query = {}

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/${id}/?${stringify(query)}`,
            {
                method: 'PATCH',
                body: JSON.stringify(data)
            }
        )
        .then(
            (response) => {
                return Promise.resolve(response);
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Delete Campaign using access token
     * @param {string} id
     */
    async deleteCampaignById (id) {
        var query = {}

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/${id}/?${stringify(query)}`,
            {
                method: 'DELETE'
            }
        )
        .then(
            (response) => {
                return Promise.resolve(response);
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * start|stop|revoke a campaign using an access token
     * @param {string} action
     * action value must be in [start, stop, revoke]
     * @param {string} id
     */
    async actionCampaign (action, id) {
        var query = {}

        //get token from the auth controller
        const token = await this.auth.getToken();
        query.access_token = token;

        return await this.httpClient(
            `${base_url}/${id}/${action}/?${stringify(query)}`,
            {
                method: 'GET'
            }
        )
        .then(
            (response) => {
                return Promise.resolve(response);
            }
        )
        .catch(
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /** utility to call an endpoint */
    async httpClient (url, options) {
        if (!options.headers) {
            options.headers = new Headers({
                'Content-Type': this.contentType
            });
        } else {
            options.headers.append('Content-Type', this.contentType);
        }

        return fetch(url, options);
    }

    transformMillisecondsToDateString (timeInMillis) {
        if (timeInMillis <= 0) {
            return '';
        }
        const date = new Date(timeInMillis);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const seconds = date.getSeconds();

        return `${year}-${("0" + (month)).slice(-2)}-${("0" + (day)).slice(-2)} ${("0" + (hour)).slice(-2)}:${("0" + (minute)).slice(-2)}:${("0" + (seconds)).slice(-2)}`;
    }

    getBroadcastSpeedList() {
        return [
            {
                value: 5,
                label: 'Fastest (5 seconds interval/message)'
            },
            {
                value: 10,
                label: 'Fast (10 seconds interval/message)'
            },
            {
                value: 60,
                label: 'Normal (60 seconds interval/message)'
            },
            {
                value: -1,
                label: 'Custom'
            },
        ]
    }

    getBroadcastStates() {
        return ['pending', 'sent', 'revoked', 'failed', 'delivered']
    }

    getNumberFromJid(jid) {
        return jid.replace (/[^0-9]/g, '')
    }
}