/** Contains the logic for interacting with the auth service & obtaining fresh tokens for the user */
/**
 * @typedef User
 * @property {string} username
 * @property {string} id
 * @property {string} team_role authoriztion level of team
 * @property {string} teamId Id of the user's team
 */
export default class AuthController {
    endpoint = "https://api-auth.xman.tech"
    /**
     * Login using username & password
     * If authenticated successfully, will store token automatically
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        const json = await this.fetchJSON('/oauth/token', 'POST', { username, password })
        const accessToken = json?.accessToken
        const refreshToken = json?.refreshToken
        if (!accessToken || !refreshToken) {
            throw new Error('Invalid response received')
        }
        localStorage.setItem('access-token', accessToken)
        localStorage.setItem('access-token-expiry', json.accessTokenExpiration)
        localStorage.setItem('refresh-token', refreshToken)
    }
    async logout() {
        localStorage.removeItem('access-token')
        localStorage.removeItem('access-token-expiry')
        if (this.isLoggedIn()) {
            await (
                this.fetchJSON(
                    '/oauth/revoke',
                    'POST',
                    { refresh_token: localStorage.getItem('refresh-token') }
                ).catch(() => { })
            )
        }
        localStorage.removeItem('refresh-token')

        window.location.reload()
    }
    /** @returns {User} the current user*/
    user() {
        const accessToken = localStorage.getItem('access-token')
        if (!accessToken) {
            this.logout()
            throw new Error('access token not present')
        }

        const comps = accessToken.split('.')
        const str = Buffer.from(comps[1], 'base64').toString('utf-8')
        const user = JSON.parse(str).user
        //console.log (user)
        return user
    }
    /** @returns {boolean} -- whether you're logged in or not */
    isLoggedIn() {
        return !!localStorage.getItem('refresh-token')
    }
    /** @returns {string} a valid access token */
    async getToken(forceNewToken) {
        const refreshToken = localStorage.getItem('refresh-token')
        if (!refreshToken) throw new Error('refresh token not present')

        const expiryDate = new Date(+localStorage.getItem('access-token-expiry'))

        // if it's been more than an hour, or we forcefully want to get a new token, or the access token is not present
        if (
            expiryDate.toString() === 'Invalid Date' || // if expiry is invalid
            (new Date().getTime() - expiryDate.getTime() > 0) ||  // if expired
            forceNewToken || // if force
            !localStorage.getItem('access-token') // if access token is not present
        ) {
            try {
                const json = await this.fetchJSON(
                    '/oauth/token',
                    'POST',
                    {
                        refresh_token: refreshToken,
                        grant_type: 'user_refresh_token'
                    }
                )
                localStorage.setItem('access-token', json.accessToken)
                localStorage.setItem('access-token-expiry', json.accessTokenExpiration)
            } catch (error) {
                if (error.message.startsWith('HTTPError')) {
                    localStorage.removeItem ('refresh-token')
                    this.logout ()
                } 
                throw error
            }
        }
        return localStorage.getItem('access-token')
    }
    /** utility function to fetch JSON from service */
    async fetchJSON(path, method, body) {
        const response = await fetch(new URL(path, this.endpoint), {
            method,
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json' }
        })

        const json = await response.json()
        if (json.status === 'error') {
            throw new Error('HTTPError: ' + json.message)
        }
        return json
    }

    /** @returns {Scope} the current scopes*/
    scopes() {
        const accessToken = localStorage.getItem('access-token')
        if (!accessToken) {
            throw new Error('access token not present')
        }

        const comps = accessToken.split('.')
        const str = Buffer.from(comps[1], 'base64').toString('utf-8')
        const scope = JSON.parse(str).scope
        if (!scope || scope?.length <= 0) {
            return [];
        }

        var scopes = [];
        scope.split('').filter(
            (bit, index, arr) => bit === '1' && scopes.push(index >= 0 && index < this.scopeList().length && this.scopeList()[index])
        )

        return scopes;
    }

    scopeList() {
        return [
            'WA_STATE', // open, close, logout
            'WA_NEW_MESSAGE_ASSIGNED', // send a new message to assigned conversations
            // CRUD on contacts
            'CONTACTS_READ_ASSIGNED',
            'CONTACTS_READ_ALL',
            'CONTACTS_CREATE',
            'CONTACTS_DELETE',
            'CONTACTS_UPDATE',
            // CRUD on campaigns
            'CAMPAIGNS_READ',
            'CAMPAIGNS_CREATE',
            'CAMPAIGNS_DELETE',
            'CAMPAIGNS_UPDATE',
            // CRUD on keywords
            'KEYWORD_READ',
            'KEYWORD_CREATE',
            'KEYWORD_DELETE',
            'KEYWORD_UPDATE',
            // CRUD on message flows
            'FLOWS_READ',
            'FLOWS_CREATE',
            'FLOWS_DELETE',
            'FLOWS_UPDATE',
            // CRUD on tags
            'TAGS_READ',
            'TAGS_CREATE',
            'TAGS_DELETE',
            //Service Auth
            //CRUD on users
            'USER_READ_ALL',
            'USER_CREATE',
            'USER_UPDATE_ASSIGNED',
            'USER_UPDATE_ALL',
            'USER_DELETE',
            //CRUD on teams
            'TEAM_READ_ALL',
            'TEAM_CREATE',
            'TEAM_UPDATE_ASSIGNED',
            'TEAM_UPDATE_ALL',
            'TEAM_DELETE',
            'TEAM_SWITCH_ASSIGNED',
            'TEAM_SWITCH_ALL',
            //CRUD on teams Link
            'TEAM_LINK_READ_ASSIGNED',
            'TEAM_LINK_READ_ALL',
            'TEAM_LINK_UPDATE_ASSIGNED',
            'TEAM_LINK_UPDATE_ALL',
            'TEAM_LINK_CREATE',
            'TEAM_LINK_JOIN',
            //CRUD on members
            'MEMBER_READ_ASSIGNED',
            'MEMBER_READ_ALL',
            'MEMBER_CREATE_ASSIGNED',
            'MEMBER_CREATE_ALL',
            'MEMBER_UPDATE_ASSIGNED',
            'MEMBER_UPDATE_ALL',
            'MEMBER_DELETE_ASSIGNED',
            'MEMBER_DELETE_ALL',
            //CRUD on Tokens
            'TOKEN_READ_ALL',
            'TOKEN_CREATE',
            'TOKEN_DELETE_ASSIGNED',
            'TOKEN_DELETE_ALL',
            'TEAM_NOTIFY',
            'WA_HOOK',
            'ADMIN_PANEL_LOGIN'
        ]
    }
}