## Xman Frontend

## Run the project

- Clone the project
- Run `npm install` or `yarn`
- Run `npm start` or `yarn start`

## Integration with the backend

- The frontend connects to the different services of the backend via REST APIs. The docs to the services are linked below
    - [WhatsApp/Message Template](https://api-wa.xman.tech/docs)
    - [Broadcast Campaigns](https://api-campaigns.xman.tech/docs)
    - [NLP/Keyword Reply](https://api-nlp.xman.tech/docs)
    - [Audience](https://api-audience.xman.tech/docs)
    - [Authentication](https://api-auth.xman.tech/docs)

- If you need to access the user's access token, you can do so via
``` js
import AuthController from '../Controllers/AuthController.js'
const token = await new AuthController().getToken() // will automatically renew the token if required
```

## Structure

- Each page must be contained in its own folder.
- Components that do not require a context & do not affect anything outside their running environment must be placed in the `src/Components` folder.
For example, `Button`, `Switch` etc.
- All the logic for interacting with services, fetch calls, managing a store, etc. must be placed in the `src/Controllers` folder.
- Images must be placed in `src/Images`

Whenever a user visits the pages, they first visit:
- The login page, code [here](/src/Login)
- Once authenticated, the user is led to the dashboard. 
    - The dashboard has multiple pages, which are controlled by the [Router](/src/Router) component
- Each page is maintained in a separate folder. One can work independently on their folder without bothering someone else's code.
    - [Audience](/src/Audience)
    - [Automation](/src/Automation)
        - [Broadcast](/src/Automation/Broadcast)
        - [NLP/Keyword Reply](/src/Automation/NLP)
        - [Message Templates](/src/Automation/MessageTemplates)
    - [live-chat](/src/LiveChat)
    - [Login](/src/Login)

## General ideas

- Do not override a component's CSS directly, create another class or a `bootstrap variant`
- Use hooks instead of classes
- Use React context to handle global variables
    - Make sure to not clump together all contexts into a single context
    - Each page must be maintained by one context

## Progress Tracker
(https://www.notion.so/UIUX-9e99abe17d9f4fe091010766313e41f6)