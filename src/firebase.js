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

// Admin email - only this user can approve others
export const ADMIN_EMAIL = 'noah.andersen95@gmail.com'

// Check if user is admin
export function isAdmin(user) {
  return user?.email === ADMIN_EMAIL
}

// Save user to pending list on signup
export async function registerPendingUser(user) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Admin is auto-approved
  if (user.email === ADMIN_EMAIL) {
    const approvedRef = ref(database, `approvedUsers/${user.uid}`)
    await set(approvedRef, {
      email: user.email,
      approvedAt: Date.now()
    })
    return
  }

  const pendingRef = ref(database, `pendingUsers/${user.uid}`)
  await set(pendingRef, {
    email: user.email,
    requestedAt: Date.now()
  })
}

// Check if user is approved
export async function checkUserApproved(userId) {
  if (!firebaseEnabled) return false
  const approvedRef = ref(database, `approvedUsers/${userId}`)
  const snapshot = await get(approvedRef)
  return snapshot.exists()
}

// Get all pending users (admin only)
export async function getPendingUsers() {
  if (!firebaseEnabled) return []
  const pendingRef = ref(database, 'pendingUsers')
  const snapshot = await get(pendingRef)
  if (!snapshot.exists()) return []

  const users = []
  snapshot.forEach((child) => {
    users.push({ uid: child.key, ...child.val() })
  })
  return users
}

// Approve a user (admin only)
export async function approveUser(userId, email) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Add to approved list
  const approvedRef = ref(database, `approvedUsers/${userId}`)
  await set(approvedRef, {
    email: email,
    approvedAt: Date.now()
  })

  // Remove from pending list
  const pendingRef = ref(database, `pendingUsers/${userId}`)
  await set(pendingRef, null)
}

// Manually approve a user by email (for legacy accounts)
export async function manuallyApproveByEmail(email) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Create a deterministic ID from the email for legacy users
  const oderId = 'legacy-' + email.replace(/[^a-zA-Z0-9]/g, '-')
  const approvedRef = ref(database, `approvedUsers/${oderId}`)
  await set(approvedRef, {
    email: email,
    approvedAt: Date.now(),
    manuallyApproved: true
  })
}

// Check if user is approved (updated to check by email too for legacy users)
export async function checkUserApprovedByEmail(email) {
  if (!firebaseEnabled) return false
  const approvedRef = ref(database, 'approvedUsers')
  const snapshot = await get(approvedRef)
  if (!snapshot.exists()) return false

  let found = false
  snapshot.forEach((child) => {
    if (child.val().email === email) {
      found = true
    }
  })
  return found
}

// Reject/remove a user (admin only)
export async function rejectUser(userId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const pendingRef = ref(database, `pendingUsers/${userId}`)
  await set(pendingRef, null)
}

// Submit a recipe for approval
export async function submitRecipe(userId, userEmail, recipe) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const recipeId = `user-${userId}-${Date.now()}`
  const pendingRef = ref(database, `pendingRecipes/${recipeId}`)
  await set(pendingRef, {
    ...recipe,
    id: recipeId,
    submittedBy: userId,
    submitterEmail: userEmail,
    submittedAt: Date.now(),
    status: 'pending'
  })
  return recipeId
}

// Get all pending recipes (admin only)
export async function getPendingRecipes() {
  if (!firebaseEnabled) return []
  const pendingRef = ref(database, 'pendingRecipes')
  const snapshot = await get(pendingRef)
  if (!snapshot.exists()) return []

  const recipes = []
  snapshot.forEach((child) => {
    recipes.push({ ...child.val(), id: child.key })
  })
  return recipes
}

// Approve a recipe (admin only)
export async function approveRecipe(recipeId, recipe) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Add to approved recipes list
  const approvedRef = ref(database, `approvedRecipes/${recipeId}`)
  await set(approvedRef, {
    ...recipe,
    approvedAt: Date.now(),
    status: 'approved'
  })

  // Remove from pending list
  const pendingRef = ref(database, `pendingRecipes/${recipeId}`)
  await set(pendingRef, null)
}

// Reject a recipe (admin only)
export async function rejectRecipe(recipeId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const pendingRef = ref(database, `pendingRecipes/${recipeId}`)
  await set(pendingRef, null)
}

// Get all approved user-submitted recipes
export async function getApprovedRecipes() {
  if (!firebaseEnabled) return []
  const approvedRef = ref(database, 'approvedRecipes')
  const snapshot = await get(approvedRef)
  if (!snapshot.exists()) return []

  const recipes = []
  snapshot.forEach((child) => {
    recipes.push({ ...child.val(), id: child.key })
  })
  return recipes
}

export { database, auth }
