import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, onValue } from 'firebase/database'

let database = null
let firebaseEnabled = false

// Check if Firebase config is available
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Only initialize Firebase if config is present
if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    const app = initializeApp(firebaseConfig)
    database = getDatabase(app)
    firebaseEnabled = true
    console.log('Firebase initialized successfully')
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
} else {
  console.log('Firebase not configured - sharing features disabled')
}

// Check if Firebase is available
export function isFirebaseEnabled() {
  return firebaseEnabled
}

// Generate a random list ID
export function generateListId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

// Save a grocery list to Firebase
export async function saveGroceryList(listId, data) {
  if (!firebaseEnabled) {
    throw new Error('Firebase not configured')
  }
  const listRef = ref(database, `lists/${listId}`)
  await set(listRef, {
    ...data,
    updatedAt: Date.now()
  })
}

// Load a grocery list from Firebase
export async function loadGroceryList(listId) {
  if (!firebaseEnabled) {
    throw new Error('Firebase not configured')
  }
  const listRef = ref(database, `lists/${listId}`)
  const snapshot = await get(listRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  return null
}

// Subscribe to real-time updates
export function subscribeToList(listId, callback) {
  if (!firebaseEnabled) {
    return () => {} // Return empty unsubscribe function
  }
  const listRef = ref(database, `lists/${listId}`)
  return onValue(listRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}

export { database }
