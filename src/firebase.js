import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, onValue } from 'firebase/database'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

let database = null
let auth = null
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
    auth = getAuth(app)
    firebaseEnabled = true
    console.log('Firebase initialized successfully')
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
} else {
  console.log('Firebase not configured - cloud features disabled')
}

// Check if Firebase is available
export function isFirebaseEnabled() {
  return firebaseEnabled
}

// Auth functions
export async function signUp(email, password) {
  if (!auth) throw new Error('Firebase not configured')
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function logIn(email, password) {
  if (!auth) throw new Error('Firebase not configured')
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function logOut() {
  if (!auth) throw new Error('Firebase not configured')
  await signOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser() {
  return auth?.currentUser || null
}

// Generate a random list ID (for legacy/sharing)
export function generateListId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

// Save a grocery list for a user
export async function saveUserGroceryList(userId, data) {
  if (!firebaseEnabled) {
    throw new Error('Firebase not configured')
  }
  const listRef = ref(database, `users/${userId}/groceryList`)
  await set(listRef, {
    ...data,
    updatedAt: Date.now()
  })
}

// Load a grocery list for a user
export async function loadUserGroceryList(userId) {
  if (!firebaseEnabled) {
    throw new Error('Firebase not configured')
  }
  const listRef = ref(database, `users/${userId}/groceryList`)
  const snapshot = await get(listRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  return null
}

// Subscribe to user's grocery list updates
export function subscribeToUserList(userId, callback) {
  if (!firebaseEnabled) {
    return () => {}
  }
  const listRef = ref(database, `users/${userId}/groceryList`)
  return onValue(listRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}

// Legacy functions for shared lists (keeping for backwards compatibility)
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

export function subscribeToList(listId, callback) {
  if (!firebaseEnabled) {
    return () => {}
  }
  const listRef = ref(database, `lists/${listId}`)
  return onValue(listRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}

export { database, auth }
