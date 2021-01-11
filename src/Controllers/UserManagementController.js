import AuthController from "./AuthController";

export default class TeamManagementController {
    endpoint = "https://api-auth.xman.tech";
    auth = new AuthController();

    async fetchUserDetails() {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/users`, { 
            method: 'GET', 
            headers: { 'content-type': 'application/json',
                        'authorization': `Bearer ${token}`
                    }
        })
        
        try {
            const json = await response.json ()
            if (json.error) {
                return false;
            }

            if (json.code === 200) {
                return json.meta;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async updateUserDetails(body) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/users`, { 
            method: 'PATCH', 
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json',
                        'authorization': `Bearer ${token}`
                    }
        })
        
        try {
            const json = await response.json ()
            if (json.error) {
                return false;
            }

            return json;
        } catch {
            return false;
        }
    }
}