import KeyedDB from "@adiwajshing/keyed-db"

const JID_REGEX = /^[0-9]{1,20}((\-[0-9]{1,20})|)@(s.whatsapp.net|g.us|broadcast)$/gi
const PHONE_REGEX = /^\+{0,2}([\-\. ])?(\(?\d{0,3}\))?([\-\. ])?\(?\d{0,3}\)?([\-\. ])?\d{3}([\-\. ])?/i

export const isValidPhoneNumber = text => {
  return text.length >= 6 && text.length <= 15 && text.match (PHONE_REGEX)
}

export const messageTimestampToDate = stamp => new Date((stamp.low || stamp)*1000)

export const isValidJid = jid => jid.match (JID_REGEX)
export const phoneNumber = (str) =>  '+' + str.replace ('@s.whatsapp.net', '')
export const isGroupID = (str) => str.endsWith ('@g.us')
export const whatsappID = jid => jid.replace ('@c.us', '@s.whatsapp.net')
export const chatTitle = chat => chat.profile?.name || chat.name || phoneNumber (chat.jid || chat.id)
export const chatOnline = chat => {
  if (isGroupID(chat.jid)) return false 
  const presence = chat.presences && chat.presences[chat.jid]
  return presence?.lastKnownPresence === 'composing' || presence?.lastKnownPresence === 'available'
}

export const isMessageAction = message => (!!message.messageStubType && (message.messageStubType !== 'REVOKE' && message.messageStubType !== 1)) || message.message?.ephemeralMessage?.message?.protocolMessage
export const isMediaMessage = content => content && !!(content.imageMessage || content.videoMessage || content.audioMessage || content.stickerMessage || content.documentMessage || content.productMessage)

export const messageUrl = message => (
  message.file && ( message.file.url || URL.createObjectURL (message.file) )
)
export const classForMessageStatus = status => {
  return status === 'READ' || status === 'HEARD' || status >= 4 ? 'read' : status === 'DELIVERY_ACK' || status === 3 ? 'delivered' : ''
}
export const waChatKey = {
  key: (c) => (c.pin ? '1' : '0') + (c.archive === 'true' ? '0' : '1') + c.t.toString(16).padStart(8, '0') + c.jid,
  compare: (k1, k2) => k2.localeCompare (k1)
}
export const ChatDB = () => (
  new KeyedDB (waChatKey, c => c.jid)
)

const URL_REGEX = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/g
export const parsingLinks = text => text.replace (URL_REGEX, str => `<a href="${str.startsWith('http') ? str : `http://${str}`}">${str}</a>`)

export const senderTitle = (jid, metadata, chat, mID) => {
  jid = whatsappID (jid)
  if (jid === mID) return 'You'
  let title = metadata?.participantMap && (
    metadata.participantMap[jid]?.name || phoneNumber(jid)
  )
  title = title || chat?.name || phoneNumber(jid)
  return title
}
const MIMETYPE_MAP = {
  'image/jpeg': 'imageMessage',
  'image/png': 'imageMessage',
  'video/mp4': 'videoMessage',
  'image/gif': 'videoMessage',
  'audio/mp4': 'audioMessage',
  'audio/mpeg': 'audioMessage',
  'audio/mp3': 'audioMessage',
  'audio/ogg': 'audioMessage',
  'audio/ogg; codecs=opus': 'audioMessage',
  'image/webp': 'stickerMessage',
}
export const getMessageType = mimetype => MIMETYPE_MAP[mimetype] || 'documentMessage'

export const MEDIA_DEFAULT_TEXT_MAP = {
  'imageMessage': 'sent an image 🏞️',
  'stickerMessage': 'sent a sticker',
  'audioMessage': 'sent an audio 🎵',
  'videoMessage': 'sent a video 📹 ',
  'documentMessage': 'sent a document 📄',
  'locationMessage': 'sent a location'
}

const participantAdded = message =>
  (message.participant
    ? `{{${whatsappID(message.participant)}}} added ${message.messageStubParameters.map(p => `{{${whatsappID(p)}}}`).join(', ')} to this group`
    : `${message.messageStubParameters.map(p => `{{${whatsappID(p)}}}`).join(', ')} was added to this group`)

const STUB_TYPE_MAP = {
    REVOKE: '🚫 This message was deleted',
    '1': '🚫 This message was deleted',
    E2E_ENCRYPTED: '🔒 Messages you send to this chat and calls are secured with end-to-end encryption.',
    E2E_IDENTITY_CHANGED: '{{{{0}}}}\'s security code changed',
    // This chat is with the official business account of "X". Click for more info.
    // [AFTER CLICK] WhatsApp has verified that this is the official business account of "X".
    BIZ_INTRO_BOTTOM: 'This chat is with an official business account.',
    BIZ_INTRO_TOP: 'This chat is with an official business account.',
    BIZ_TWO_TIER_MIGRATION_TOP: 'This chat is with an official business account.',
    
    BIZ_TWO_TIER_MIGRATION_BOTTOM: 'This chat is with a business account.',
    BIZ_MOVE_TO_CONSUMER_APP: 'This business account has now registered as a standard account.',
    INDIVIDUAL_CHANGE_NUMBER: '{{sender}} changed their phone number to a new number {{0}}',
    VERIFIED_HIGH: 'This chat is with a verified business account.',
    CALL_MISSED_VIDEO: 'Missed video call',
    CALL_MISSED_VOICE: 'Missed voice call',
    CALL_MISSED_GROUP_VIDEO: 'Missed group video call',
    CALL_MISSED_GROUP_VOICE: 'Missed group voice call',
    GROUP_CHANGE_DESCRIPTION: '{{sender}} changed the group description',
    GROUP_CHANGE_SUBJECT: '{{sender}} changed the group subject to {{0}}',
    GROUP_CHANGE_ICON: "{{sender}} changed this group's icon",
    GROUP_PARTICIPANT_LEAVE: message =>
      `${message.messageStubParameters.map(p => `{{${whatsappID(p)}}}`).join(', ')} left`,
    GROUP_PARTICIPANT_REMOVE: message => `{{sender}} removed {{${whatsappID(message.messageStubParameters[0])}}} from this group`,
    GROUP_PARTICIPANT_CHANGE_NUMBER: '{{sender}} changed their phone number to a new number {{0}}',
    GROUP_PARTICIPANT_INVITE: "{{sender}} joined using this group's invite link",
    GROUP_PARTICIPANT_PROMOTE: '{{sender}} was made an admin',
    GROUP_PARTICIPANT_DEMOTE: '{{sender}} was demoted',
    GROUP_PARTICIPANT_ADD: participantAdded,
    GROUP_PARTICIPANT_ADD_REQUEST_JOIN: participantAdded,
    GROUP_CREATE: '{{sender}} created this group',
    GROUP_CHANGE_RESTRICT: message => {
      if (message.messageStubParameters[0] === 'on') return '{{sender}} changed this group\'s settings to allow only admins to edit this group\'s info'
      return '{{sender}} changed this group\'s settings to allow all participants to edit this group\'s info'
    },
    GROUP_CHANGE_ANNOUNCE: message => {
      if (message.messageStubParameters[0] === 'on') return '📢 {{sender}} changed this group\'s settings to allow only admins to send messages to this group'
      return '📢 {{sender}} changed this group\'s settings to allow all participants to send messages to this group'
    },
    GROUP_CHANGE_INVITE_LINK: '{{sender}} revoked this group\'s invite link',
    BROADCAST_CREATE: '{{sender}} created this broadcast list',
    BROADCAST_REMOVE: '{{sender}} was removed from this broadcast list',
    BROADCAST_ADD: '{{sender}} was added to this broadcast list',
  
    GENERIC_NOTIFICATION: '{{0}}',
    ASSIGNEE_CHANGED: m => m.messageStubParameters[0] ? `{{sender}} assigned this chat to {{{{0}}}}` : `{{sender}} unassigned this conversation`
  }

/**
 * @param {Object} message 
 * @param {string} meID 
 * @param { [ { jid: string, name: string } ] } participants
 */
export const messageText = (message, meID, participants) => {
    let text = ''
    if (message.messageStubType) {
        const m = STUB_TYPE_MAP[message.messageStubType.toString()]
        if (typeof m === 'function') text = m (message)
        else text = m
        text = text || ''

        message.messageStubParameters && (
           message.messageStubParameters.forEach ((p, i) => text = text.replace (`{{${i}}}`, p))
        )
    } else {
        text = messageTextFromContent ( getMessageContent(message) )
    }
    text = text.replace (`{{sender}}`, `{{${message.participant || message.key.participant || message.key.remoteJid}}}`)
    text = text.replace (`{{${meID}}}`, 'You')
    if (participants && text.includes('{{')) {
      participants.forEach (p => {
        const id = p.jid || p.userId
        const name = p.name || p.user?.username || phoneNumber (id)
        if (id) text = text.replace(`{{${id}}}`, `${name}`)
      })
    }
    return text
}
export const getMessageContent = message => {
  let content = message.message
  if (content?.ephemeralMessage) {
    content = content.ephemeralMessage.message
  }
  return content
}
export const messageTextFromContent = content => {

  let text = content?.conversation || content?.extendedTextMessage?.text || ''
  if (!text) {
      const obj = content?.imageMessage || content?.videoMessage || content?.audioMessage
      text = obj?.caption || ''
  }
  if (!text) {
    const obj = content?.contactsArrayMessage || content?.contactMessage
    text = obj?.displayName || ''
  }
  if (!text) {
    if(content.protocolMessage?.type === 3 || content.protocolMessage?.type === 'EPHEMERAL_SETTING') {
      const exp = content.protocolMessage.ephemeralExpiration
      if (exp) {
        const expDays = Math.floor(exp/(60*60*24)) // convert seconds -> days
        text = `{{sender}} has turned on disappearing messages. New messages will disappear from this chat after ${expDays} days.`
      } else {
        text = '{{sender}} turned off disappearing messages.'
      }
    }
  }
  return text
}
/**
 * 
 * @param {string} jid 
 * @param {Object} options 
 * @param {string} options.text
 * @param {string} options.tag
 * @param {Object} options.image
 * @param {Object} options.video
 * @param {Object} options.audio
 * @param {number} options.scheduleAt
 */
export const constructPendingMessage = (jid, options, meID, includePending) => {
  const content = {}
  if (options.document) {
    content.documentMessage = {
      fileName: options.document.name,
      mimetype: options.document.type,
      caption: options.text,
      file: options.document
    }
  } else if (options.image) {
    content.imageMessage = {
      fileName: options.image.name,
      mimetype: options.image.type,
      caption: options.text,
      file: options.image
    }
  } else if (options.video) {
    content.videoMessage = {
      fileName: options.video.name,
      mimetype: options.video.type,
      caption: options.text,
      file: options.video
    }
  } else if (options.audio) {
    content.audioMessage = {
      fileName: options.audio.name,
      mimetype: options.audio.type,
      file: options.audio
    }
  } else {
    content.extendedTextMessage = {
      text: options.text
    }
  }
  if (options.quoted) {
    const quoted = options.quoted
    const key = Object.keys (content)[0]
    content[key].contextInfo = {
      quotedMessage: quoted.message,
      stanzaId: quoted.key.id,
      participant: quoted.participant || (quoted?.key.fromMe ? meID : quoted?.key?.remoteJid)
    }
  }
  return (
    {
      key: {
        id: 'pending-' + Math.floor(Math.random()*100000).toString(),
        remoteJid: jid,
        fromMe: true
      },
      message: content,
      messageTimestamp: options.scheduleAt || Math.floor(new Date().getTime()/1000),
      scheduled: !!options.scheduleAt,
      tag: options.tag,
      pending: includePending !== false && options
    }
  )
}
/**
 * 
 * @param {string} jid 
 * @param {Object} options 
 * @param {string} options.text
 * @param {string} options.tag
 */
export const constructPendingNote = (jid, options) => (
  {
    key: {
      id: 'pending-' + Math.floor(Math.random()*100000).toString(),
      remoteJid: jid,
      fromMe: true
    },
    message: {
      extendedTextMessage: {
        text: options.text
      }
    },
    messageTimestamp: Math.floor(new Date().getTime()/1000),
    tag: options.tag,
    note: {
      edits: []
    },
    pending: options
  }
)