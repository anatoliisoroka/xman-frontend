import React, { useContext, useEffect, useState } from 'react'
import { Image } from 'react-bootstrap'
import DefaultPP from '../Images/default_profile.jpg'
import ImagePreview from './ImagePreview'
import { ReactComponent as Pin } from '../Images/Pin.svg'
import { WAStateContext } from '../Controllers/WAStateStore'
import { phoneNumber } from '../Controllers/Utils'

/**
 * @param {import('react-bootstrap').ImageProps & { user: { jid: string, imgUrl: string, pin?: 'true' | 'false', count?: number }} props
 */
export default function ProfilePictureImage (props) {
    const {controller} = useContext (WAStateContext)
    const [url, setUrl] = useState (undefined)
    const [openPP, setOpenPP] = useState (false)
    useEffect (() => {
        if (typeof props.user.imgUrl !== 'undefined' && props.user.imgUrl !== null) {
            setUrl(props.user.imgUrl)
        } else {
            setUrl ()

            controller.profilePictureUrl (props.user.jid)
            .then (setUrl)
        }
        
    }, [ props.user?.jid ])

    return (
        <>
        <ImagePreview imgUrl={url} filename={phoneNumber(props.user.jid) + '.jpeg'} visible={openPP} hide={setOpenPP}/>
        <picture className='profile-picture'>
            { url && <source srcSet={url}/> }
            <source srcSet={DefaultPP}/>
            <Image 
                height='100%' 
                { ...{...props, user: undefined} } 
                src={DefaultPP} 
                onError={() => setUrl()} 
                onClick={ () => setOpenPP(true) } 
                roundedCircle/>
        </picture> 
        { !!props.user.count && <span className='chat-unread profile-unread' >&nbsp;</span> }
        { props.user.pin && <div className='chat-pin'> <Pin style={{ fill: 'var(--color-note)' }}/> </div> } 
        </>           
    )
}