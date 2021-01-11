import firebase from 'firebase/app'
import "firebase/analytics"

const firebaseConfig = {
  apiKey: 'AIzaSyBQYWvZPc-b5xdOaESBzWj_FaNNmOgRUoc',
  authDomain: 'xman-2da31.firebaseapp.com',
  databaseURL: 'https://xman-2da31.firebaseio.com',
  projectId: 'xman-2da31',
  storageBucket: 'xman-2da31.appspot.com',
  messagingSenderId: '540491764293',
  appId: '1:540491764293:web:a2fb3ab4d72271b33b892c',
  measurementId: 'G-ZB7RRFFL49',
}

class Firebase {
  constructor() {
    if (!firebase.apps.length) {
       firebase.initializeApp(firebaseConfig)
    }
    this.analytics = firebase.analytics()
  }
}

export default Firebase

