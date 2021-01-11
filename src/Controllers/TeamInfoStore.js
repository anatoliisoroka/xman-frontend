import React, { createContext, useContext, useEffect, useState } from "react"
import { FirebaseContext } from "../Firebase"
import { AudienceStoreContext } from "./AudienceStore"
import AuthController from "./AuthController"
import TeamManagementController from "./TeamManagementController"

export const useTeamInfoStore = () => { 
    const { patchContacts } = useContext (AudienceStoreContext)
    const teamManagementController = new TeamManagementController ()
    const auth = new AuthController()
    const { analytics } = useContext(FirebaseContext)

    const [teamMembers, setTeamMembers] = useState ([])
    const [loadedTeamMembers, setLoadedTeamMembers] = useState(false)

    const currentUser = auth.user()
    
    const loadTeamMembers = async () => {
        const members = await teamManagementController.fetchTeamMembers ()
        console.log(members)
        setTeamMembers (members || [])
        setLoadedTeamMembers (true)
    }

    const assignTeamMember = async (phone, userId) => {
       await patchContacts(new Set([ phone ]), {assignee:userId})
    }

    const teamMemberInfo = userId => teamMembers.find(user => user.userId === userId)

    useEffect (() => {
        loadTeamMembers ()
    }, [])

    return {
        currentUser,
        teamMembers,
        loadTeamMembers,
        loadedTeamMembers,
        assignTeamMember,
        teamMemberInfo
    }
}

export const TeamInfoStoreContext = createContext (
    { teamMembers: [], loadTeamMembers: () => {}, assignTeamMember:(phone,userId) => {}, loadedTeamMembers: false }
)
export const TeamInfoStoreContextMaker = ({ children }) => {
    const store = useTeamInfoStore ()
    return (
        <TeamInfoStoreContext.Provider value={store}>
            { children }
        </TeamInfoStoreContext.Provider>
    )
}