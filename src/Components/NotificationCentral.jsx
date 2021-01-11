import React, { createContext, useState } from 'react'
import NotificationToast from '../Components/Toast'
import whatsappWebSound from './../Assets/WhatsappWeb.mp3'

const NotificationCentral = () => {
  const [notifications, setNotifications] = useState([])
  const [notificationSound] = useState(new Audio(whatsappWebSound))
  notificationSound.preload = 'auto'

  const handleClose = (notification) => {
    setNotifications(notifications.filter((n) => n.id !== notification.id))
  }

  const addMessageNotification = (senderId, name, message, openChatByJid, participant) => {
    const nameOrNumber = name || `+${senderId.split('@')[0]}`
    const participantNameOrNumber = `+${participant?.split('@')[0]}`
    const title = participant
      ? `${participantNameOrNumber} sent you a message on ${nameOrNumber}`
      : `${nameOrNumber} sent you a message!`
    const notification = { title, message, id: notifications.length, time: Date.now(), senderId, openChatByJid }

    notificationSound.play().catch((error) => console.error('error in playing n sound', error))

    setNotifications([...notifications, notification])
  }

  const toast = <NotificationToast notification={notifications[notifications.length - 1]} handleClose={handleClose} />

  return { addMessageNotification, toast }
}

const NotificationCentralContext = createContext({
  addMessageNotification: (senderId, name, message, openChatByJid) => {},
  toast: () => {},
})

export { NotificationCentral, NotificationCentralContext }
