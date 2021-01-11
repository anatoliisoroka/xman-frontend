import React from 'react'
import { useContext } from 'react'
import { WAStateContext } from '../Controllers/WAStateStore'
import SelectContactWindow from './SelectContactWindow'

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {function()} props.hide
 * @param {function(string)} props.onSelectedJid
 */
export default ({ visible, hide, onSelectedJid }) => {
  const { controller } = useContext(WAStateContext)

  const startConversation = async (contacts, groupName) => {
    const values = Object.values(contacts)
    if (values.length === 0) return

    const jids = values.map(({ phone }) => phone + '@s.whatsapp.net')

    if (values.length === 1) {
      onSelectedJid(jids[0])
    } else {
      if (!groupName) return

      const jid = await controller.createGroup(groupName, jids)
      onSelectedJid(jid)
    }

    hide()
  }

  const pickButtonText = (contacts) => {
    return Object.keys(contacts).length <= 1 ? 'Chat' : 'Create Group'
  }

  return (
    <SelectContactWindow
      visible={visible}
      hide={hide}
      submitFunction={startConversation}
      pickButtonText={pickButtonText}
      isNewConversation
    ></SelectContactWindow>
  )
}
