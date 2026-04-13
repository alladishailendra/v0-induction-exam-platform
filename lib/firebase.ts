import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Detect environment: Vite or Next.js
let envStyle: 'vite' | 'next' = 'vite'
if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  envStyle = 'next'
}

console.log('[Firebase] Using env style:', envStyle)

const firebaseConfig = envStyle === 'vite' ? {
  apiKey: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_API_KEY : undefined,
  authDomain: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined,
  projectId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined,
  storageBucket: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined,
  messagingSenderId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined,
  appId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined,
  measurementId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined,
} : {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
let storage: FirebaseStorage | null = null

function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth; storage: FirebaseStorage } | null {
  if (isMockMode) {
    console.log('[Firebase] Running in mock mode - localStorage fallback active')
    return null
  }

  try {
    // Safe initialization pattern: check if already initialized
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    const firestore = getFirestore(firebaseApp)
    const firebaseAuth = getAuth(firebaseApp)
    const firebaseStorage = getStorage(firebaseApp)
    
    console.log('[Firebase] Initialized successfully with project:', firebaseConfig.projectId)
    console.log('[Firebase] Firestore mode active')
    
    return { app: firebaseApp, db: firestore, auth: firebaseAuth, storage: firebaseStorage }
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
  storage = firebase.storage
}

export { app, db, auth, storage, isMockMode }
