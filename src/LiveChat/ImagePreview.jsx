import React from "react";
import { AspectRatio } from "react-aspect-ratio";
import { Modal, Image } from "react-bootstrap";
import { ReactComponent as Download } from '../Images/Download.svg'
import ProgressButton from '../Components/ProgressButton'
/**
 * @param {Object} props 
 * @param {boolean} props.visible
 * @param {string} [props.filename]
 * @param {function()} props.hide
 * @param {string} props.imgUrl
 */
export default ({visible, hide, filename, imgUrl, downloadUrl}) => {
    const download = async () => {
        const response = await fetch(downloadUrl || imgUrl)
        const blob = await response.blob()
        
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename || 'image.jpeg';
        document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
        
        a.click();    
        a.remove();  //afterwards we remove the element again  
    }

    return (
        <Modal show={visible} onHide={hide} className='profile-picture-preview' centered>
            {
                visible && (
                    <>
                    <Image src={imgUrl} />
                    <ProgressButton loaderType='spinner' onClick={download} className='download' variant='transparent'>
                        <Download style={{ fill: 'var(--color-quat)' }} />
                    </ProgressButton>
                    </>
                )
            }
        </Modal>
    )
}