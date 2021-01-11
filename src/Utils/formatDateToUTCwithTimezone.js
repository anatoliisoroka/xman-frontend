export const formatDateToUTCwithTimezone = (date) => {
    const split = date.toTimeString().split(':00 GMT')
    const time = `${split[0]}${split[1].slice(0,3)}:${split[1].slice(3,5)}`
    return time
}

export const parseTimeFromServer = (date) => {
   const parsed =  new Date('1970-01-01T' + date + 'Z')
   const timezoneOffset = parsed.getTimezoneOffset() // -120 -90 90 120
   const minutes = timezoneOffset % 60 + parsed.getMinutes()
   const hours = Math.floor(timezoneOffset / 60) + parsed.getHours()
   parsed.setMinutes(minutes)
   parsed.setHours(hours)
   return parsed
}