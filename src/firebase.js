import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, onValue } from 'firebase/database'

// You'll replace these with your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

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
  const listRef = ref(database, `lists/${listId}`)
  await set(listRef, {
    ...data,
    updatedAt: Date.now()
  })
}

// Load a grocery list from Firebase
export async function loadGroceryList(listId) {
  const listRef = ref(database, `lists/${listId}`)
  const snapshot = await get(listRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  return null
}

// Subscribe to real-time updates
export function subscribeToList(listId, callback) {
  const listRef = ref(database, `lists/${listId}`)
  return onValue(listRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}

export { database }
