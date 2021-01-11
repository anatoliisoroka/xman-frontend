function hexToHSL(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  let r = parseInt(result[1], 16)
  let g = parseInt(result[2], 16)
  let b = parseInt(result[3], 16)

  r = r /= 255
  g = g /= 255
  b = b /= 255
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h,
    s,
    l = (max + min) / 2

  if (max == min) {
    h = s = 0 // achromatic
  } else {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  s = s * 110
  s = Math.round(s)
  // l = l * 100
  // l = Math.round(l)
  // making all colours same lightness replace with above for exact conversion
  l = 37
  h = Math.round(360*h);

  return 'hsl(' + h + ', ' + s + '%, ' + l + '%)'
}

const stringToColour = (str) => {
  if (!str) {
    return
  }
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  var colour = '#'
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff
    colour += ('00' + value.toString(16)).substr(-2)
  }
  return colour
}

export const createLightColourFromString = (string) => {
  const hex = stringToColour(string)
  if (!hex) return
  const hsl = hexToHSL(hex)
  return hsl
}
