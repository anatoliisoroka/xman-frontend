import React, { useState, useEffect } from 'react'
import Tab from 'react-bootstrap/Tab'
import { MessageTemplatePreviewContextMaker } from './Automation/MessageTemplates/MessageTemplatePreview';
import { AlertCentral, AlertCentralContext } from './Components/AlertCentral';
import { AudienceStoreContextMaker, TagStoreContextMaker } from './Controllers/AudienceStore';
import AuthController from './Controllers/AuthController';
import AutoUpdater from './Controllers/AutoUpdater';
import { LocalizationContextMaker } from './Controllers/LocalizationStore';
import { WAStateContextMaker } from './Controllers/WAStateStore';
import Login from './Login/Login';
import Router from './Router/Router'
import Firebase, { FirebaseContext } from './Firebase'
import { NotificationCentral, NotificationCentralContext } from './Components/NotificationCentral'
import { TeamInfoStoreContextMaker } from './Controllers/TeamInfoStore';

const App = () => {
  const [screen, setScreen] = useState('')
  const alert = AlertCentral()
  const notifications = NotificationCentral()

  useEffect(() => {
    setScreen(new AuthController().isLoggedIn() ? 'app' : 'login')
  }, [])

  return (
  <FirebaseContext.Provider value={new Firebase()}>
    <div className="App">
      <LocalizationContextMaker>
      <AlertCentralContext.Provider value={alert}>
        { alert.alert }
        <NotificationCentralContext.Provider value={notifications}>
              {notifications.toast}
        <Tab.Container id="app_tabs" activeKey={screen}>
          <Tab.Content>
            <Tab.Pane eventKey="login" mountOnEnter={true} unmountOnExit={true}>
              <Login onSuccessfulLogin={() => setScreen ('app')}/>
            </Tab.Pane>
            <Tab.Pane eventKey="app" mountOnEnter={true} unmountOnExit={true}>
              <AutoUpdater> { /* Checks for updates */ }
              <MessageTemplatePreviewContextMaker> { /* message flows are used throughout the app*/ }
              <TagStoreContextMaker> { /* audience info like contact name, tags and all are used throughout the app */ }
              
              <AudienceStoreContextMaker>
              <WAStateContextMaker>
              <TeamInfoStoreContextMaker>
                <Router onLogout={() => {}}/>
              </TeamInfoStoreContextMaker>
              </WAStateContextMaker>
              </AudienceStoreContextMaker>
              </TagStoreContextMaker>
              </MessageTemplatePreviewContextMaker>
              </AutoUpdater>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
        </NotificationCentralContext.Provider>
      </AlertCentralContext.Provider>
      </LocalizationContextMaker>
    </div>
  </FirebaseContext.Provider>
  )
}
export default App
