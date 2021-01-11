import AuthController from "./AuthController";
import { stringify } from 'query-string';

export default class TeamManagementController {
    endpoint = "https://api-auth.xman.tech";
    auth = new AuthController();

    async fetchTeamList() {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams`, { 
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

    async fetchDefaultTeam() {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams?is_default=true`, { 
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

            if (json.code === 200 && json.meta?.length > 0) {
                return json.meta[0];
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async handleTeamSwitch(teamId) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/switch`, { 
            method: 'POST', 
            body: JSON.stringify({id: teamId}),
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
                //force to regenerate token
                await this.auth.getToken(true);
            }

            return json;
        } catch {
            return false;
        }
    }

    async fetchTeamDetailsViaInviteCode(inviteCode) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/filters?code=${inviteCode}`, { 
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

            if (json.code === 200 && json.meta?.length > 0) {
                if(json.meta[0].is_link_sharing_enabled && this.auth.user().teamId !== json.meta[0].id) {
                    return json.meta[0];
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async handleJoinTeam(inviteCode) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/join/${inviteCode}`, { 
            method: 'POST', 
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

    async fetchInviteLink(teamId) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/link?id=${teamId}`, { 
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

            if (json.code === 200 && json.meta) {
                return json.meta;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async resetInviteLink(teamId) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/link?id=${teamId}`, { 
            method: 'POST', 
            headers: { 'content-type': 'application/json',
                        'authorization': `Bearer ${token}`
                    }
        })
        
        try {
            const json = await response.json ()
            if (json.error) {
                return false;
            }

            if (json.code === 200 && json.meta) {
                return json.meta;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async enableInviteLink(body) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams/link/enable`, { 
            method: 'POST', 
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

            if (json.code === 200) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async fetchTeamMembers(query) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/members?${stringify(query)}`, { 
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

            if (json.code === 200 && json.meta) {
                return json.meta;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async updateTeamDetails(body) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/teams`, { 
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

    async addTeamMember(body) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/members`, { 
            method: 'POST', 
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json',
                        'authorization': `Bearer ${token}`
                    }
        })
        
        try {
            const json = await response.json ()
            return json;
        } catch {
            return false;
        }
    }

    async updateTeamMember(body) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/members`, { 
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

            if (json.code === 200) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async deleteTeamMember(query) {
        const token = await this.auth.getToken();
        const response = await fetch (`${this.endpoint}/members?${stringify(query)}`, { 
            method: 'DELETE', 
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
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    scopeList() {
        return [
            //CRUD on teams
            'TEAM_UPDATE_ASSIGNED',
            'TEAM_SWITCH_ASSIGNED',
            //CRUD on teams Link
            'TEAM_LINK_READ_ASSIGNED',
            'TEAM_LINK_UPDATE_ASSIGNED',
            //CRUD on members
            'MEMBER_READ_ASSIGNED',
            'MEMBER_CREATE_ASSIGNED',
            'MEMBER_UPDATE_ASSIGNED',
            'MEMBER_DELETE_ASSIGNED',
        ]
    }

    scopeListOptions() {
        return [
            {
                label: 'Update Team Details',
                value: 'TEAM_UPDATE_ASSIGNED',
                tooltip: 'Allow to Update Team Details'
            },
            {
                label: 'Switch to Other Teams',
                value: 'TEAM_SWITCH_ASSIGNED',
                tooltip: 'Allow to switch to other teams'
            },
            {
                label: 'Read Team Link',
                value: 'TEAM_LINK_READ_ASSIGNED',
                tooltip: 'Allow to Read Team Link'
            },
            {
                label: 'Update Team Link',
                value: 'TEAM_LINK_UPDATE_ASSIGNED',
                tooltip: 'Allow to Update or Reset Team Link'
            },
            {
                label: 'Read Team Members',
                value: 'MEMBER_READ_ASSIGNED',
                tooltip: 'Allow to Read all team members'
            },
            {
                label: 'Create Team Members',
                value: 'MEMBER_CREATE_ASSIGNED',
                tooltip: 'Allow to Create new team members'
            },
            {
                label: 'Update Team Members',
                value: 'MEMBER_UPDATE_ASSIGNED',
                tooltip: 'Allow to Update Access of Team Members'
            },
            {
                label: 'Delete Team Members',
                value: 'MEMBER_DELETE_ASSIGNED',
                tooltip: 'Allow to Delete Team Members'
            },
        ]
    }

    scopeDefaultListOptions() {
        return [
            {
                label: 'Read Team Link',
                value: 'TEAM_LINK_READ_ASSIGNED',
                tooltip: 'Allow to Read Team Link'
            },
            {
                label: 'Read Team Members',
                value: 'MEMBER_READ_ASSIGNED',
                tooltip: 'Allow to Read all team members'
            },
        ]
    }
}