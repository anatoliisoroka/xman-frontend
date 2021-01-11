import AuthController from "./AuthController";

export default class WindowController{
    async handleFetch(path,method,body){
        const token = await new AuthController ().getToken ()
        const response = await fetch (new URL(path, 'https://api-auth.xman.tech'), { 
            method, 
            body: JSON.stringify(body), 
            headers: { 'content-type': 'application/json',
                        'authorization': `Bearer ${token}`
                    }
        })
        
        try {
            const json = await response.json ()
            if (json.error) {
                console.error (json)
                throw new Error (json.error || json.message)
            }
            return json
        } catch {

        }
    }
}