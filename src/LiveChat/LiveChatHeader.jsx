import React, {useContext} from 'react'
import Dropdown from '../Components/Dropdown'
import { ReactComponent as ThreeDots } from '../Images/ThreeDots.svg'
import ProfilePictureImage from './ProfilePictureImage'
import { phoneNumber } from '../Controllers/Utils'
import { WAStateContext } from '../Controllers/WAStateStore'

export default () => {
    const {controller, state} = useContext (WAStateContext)
    const user = state?.user
    
    const close = () => {
        if (!window.confirm('This will close the connection to WhatsApp -- none of your broadcasts or keyword replies will go though till you connect again. Are you sure you want to proceed?')) {
            return
        }
        controller.closeConnection ()
    }

    return (
        <div className='live-chat-header'>
            <div style={{height: '100%'}}>
                <ProfilePictureImage user={user}/>
                <b style={{marginLeft: '0.75rem'}}>{ user.name }</b> ({ phoneNumber(user.jid) }) 
            </div>
            <div>
                <Dropdown drop="left">
                    <Dropdown.Toggle variant="ham" style={{width: '40px'}}>
                        <ThreeDots style={{fill: 'var(--color-secondary)'}}/>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {
                            state.connections.waWeb === 'open' &&
                            <>
                            <Dropdown.Item onClick={close}> Close Connection to WhatsApp </Dropdown.Item>
                            <Dropdown.Divider />
                            </>
                        }
                        
                        <Dropdown.Item className='error-text' onClick={() => controller.logoutWithConfirm()}> Logout from WhatsApp </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            
        </div>
    )
}