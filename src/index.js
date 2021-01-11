import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css'
import './Components/index.css';
import './Components/table.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// setup time ago module -- used for last seen
import JavascriptTimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en' 
// polyfill for Safari
import AudioRecorder from 'audio-recorder-polyfill'
import mpegEncoder from 'audio-recorder-polyfill/mpeg-encoder'
AudioRecorder.encoder = mpegEncoder
AudioRecorder.prototype.mimeType = 'audio/mpeg'
window.MediaRecorder = AudioRecorder

JavascriptTimeAgo.addLocale (en)

ReactDOM.render (
  <React.StrictMode>
    <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Cabin" />
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
