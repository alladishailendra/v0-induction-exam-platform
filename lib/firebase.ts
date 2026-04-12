import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase is properly configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.projectId !== 'undefined'
)

// Use mock mode only when Firebase is not configured or Firestore init fails
let isMockMode = false

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || firebaseConfig.apiKey === 'undefined' || firebaseConfig.projectId === 'undefined') {
    isMockMode = true
    console.log('[Firebase] Mock mode active: missing config')
  } else {
    isMockMode = false
    console.log('[Firebase] Firestore mode active: config present')
  }
} catch (e) {
  isMockMode = true
  console.log('[Firebase] Mock mode active: config error', e)
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } | null {
  if (isMockMode) {
    console.log('[Firebase] Running in mock mode - localStorage fallback active')
    return null
  }

  try {
    // Safe initialization pattern: check if already initialized
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    const firestore = getFirestore(firebaseApp)
    const firebaseAuth = getAuth(firebaseApp)
    
    console.log('[Firebase] Initialized successfully with project:', firebaseConfig.projectId)
    console.log('[Firebase] Firestore mode active')
    
    return { app: firebaseApp, db: firestore, auth: firebaseAuth }
  } catch (error) {
    isMockMode = true
    console.error('[Firebase] Initialization error, switching to mock mode:', error)
    return null
  }
}

// Initialize on module load
const firebase = initializeFirebase()
if (firebase) {
  app = firebase.app
  db = firebase.db
  auth = firebase.auth
}

export { app, db, auth, isMockMode }
