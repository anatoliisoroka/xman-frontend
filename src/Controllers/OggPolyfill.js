import { createContext, useContext, useEffect, useRef, useState } from "react"

export const supportsOgg = document.createElement ('audio').canPlayType ('audio/ogg')

const desiredSampleRate = 8000
const bitDepth = 16
const maxWaitTime = 250

const download = async url => {
    const response = await fetch (url)
    const buff = await response.arrayBuffer ()
    console.log (`downloaded ogg from ${url}, converting...`)
    const final = await new Promise (resolve => convertOggToWav(buff, resolve))
    return final
}
// store already polyfilled urls
export const OggPolyfillContext = createContext ({})
export const OggPolyfill = ({ oggUrl, mimetype }) => {
    const refs = useContext (OggPolyfillContext)
    const [url, setUrl] = useState ('')
    const [didPolyfill, setDidPolyfill] = useState (false)
    
    useEffect (() => {
        // if the file isn't ogg, then just let it be
        if ((!mimetype?.startsWith('audio/ogg') && !mimetype?.startsWith('audio/opus')) || supportsOgg || !oggUrl) {
            setUrl (oggUrl)
            setDidPolyfill (false)
            return
        }
        if (!refs[oggUrl]) refs[oggUrl] = download (oggUrl)
        refs[oggUrl].then (url => {
          setUrl (url)
          setDidPolyfill (true)
        })
    }, [ oggUrl, refs ])

    return [url, didPolyfill]
}

export function convertOggToWav (arrayBuffer, onComplete) {
    const decoderWorker = new Worker('/opus/decoderWorker.min.js')
    const wavWorker = new Worker('/opus/waveWorker.min.js')    
    let typedArray = new Uint8Array(arrayBuffer)

    let tmout
    let postDone = () => {
      tmout && clearTimeout (tmout)
      tmout = setTimeout (() => decoderWorker.postMessage({ command: 'done' }), maxWaitTime)
    }

    decoderWorker.postMessage({ 
      command: 'init',
      decoderSampleRate: desiredSampleRate,
      outputBufferSampleRate: desiredSampleRate
    })
    wavWorker.postMessage({ 
      command:'init',
      wavBitDepth: bitDepth,
      wavSampleRate: desiredSampleRate
    })

    decoderWorker.onmessage = function(e){
      postDone ()
      // null means decoder is finished
      if (e.data === null) {
        tmout && clearTimeout (tmout)
        wavWorker.postMessage({ command: 'done' })
      }
      // e.data contains decoded buffers as float32 values
      else {
        
        wavWorker.postMessage({
          command: 'encode',
          buffers: e.data
        }, e.data.map(typedArray => typedArray.buffer))
      }
    }
    wavWorker.onmessage = function(e) {
      if (e.data.message === "page") {
        const fileName = new Date().toISOString() + ".wav";
        
        const dataBlob = new Blob( [ e.data.page ], { type: "audio/wav" } );
        const url = URL.createObjectURL( dataBlob )
        console.log (`done with polyfill`)
        onComplete (url)

        decoderWorker.terminate ()
        wavWorker.terminate ()
      }
    }
    decoderWorker.postMessage({
      command: 'decode',
      pages: typedArray
    }, [typedArray.buffer] )
}