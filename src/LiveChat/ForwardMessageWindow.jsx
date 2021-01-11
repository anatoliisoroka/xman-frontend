import React, { useState } from 'react'
import { useContext } from 'react'
import { WAStateContext } from '../Controllers/WAStateStore'

import SelectContactWindow from './SelectContactWindow'

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {function()} props.hide
 * @param {function(string)} props.onSelectedJid
 */
export default ({ visible, hide, chatId, messageId }) => {
  const { controller } = useContext(WAStateContext)

  const forwardMessage = async (contacts) => {
    const values = Object.values(contacts)
    if (values.length === 0) return

    const jids = values.map(({ phone }) => phone + '@s.whatsapp.net')
    await controller.forwardMessage(chatId, messageId, jids)
    hide()
  }

  const pickButtonText = () => {
    return 'Forward'
  }

  return (
    <SelectContactWindow
      visible={visible}
      hide={hide}
      submitFunction={forwardMessage}
      pickButtonText={pickButtonText}
      maxContacts={10}
    ></SelectContactWindow>
  )
}
