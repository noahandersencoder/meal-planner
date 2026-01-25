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

// Update a pending recipe (admin only)
export async function updatePendingRecipe(recipeId, updates) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const recipeRef = ref(database, `pendingRecipes/${recipeId}`)
  const snapshot = await get(recipeRef)
  if (!snapshot.exists()) throw new Error('Recipe not found')

  await set(recipeRef, {
    ...snapshot.val(),
    ...updates,
    updatedAt: Date.now()
  })
}

// Update an approved recipe (admin only)
export async function updateApprovedRecipe(recipeId, updates) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const recipeRef = ref(database, `approvedRecipes/${recipeId}`)
  const snapshot = await get(recipeRef)
  if (!snapshot.exists()) throw new Error('Recipe not found')

  await set(recipeRef, {
    ...snapshot.val(),
    ...updates,
    updatedAt: Date.now()
  })
}

// Delete an approved recipe (admin only)
export async function deleteApprovedRecipe(recipeId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const recipeRef = ref(database, `approvedRecipes/${recipeId}`)
  await set(recipeRef, null)
}

// User profile functions
export async function updateUserProfile(userId, profileData) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const profileRef = ref(database, `userProfiles/${userId}`)
  await set(profileRef, {
    ...profileData,
    updatedAt: Date.now()
  })
}

export async function getUserProfile(userId) {
  if (!firebaseEnabled) return null
  const profileRef = ref(database, `userProfiles/${userId}`)
  const snapshot = await get(profileRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  return null
}

export async function getUserProfileByEmail(email) {
  if (!firebaseEnabled) return null
  const profilesRef = ref(database, 'userProfiles')
  const snapshot = await get(profilesRef)
  if (!snapshot.exists()) return null

  let profile = null
  snapshot.forEach((child) => {
    if (child.val().email === email) {
      profile = { id: child.key, ...child.val() }
    }
  })
  return profile
}

// Recipe ratings and comments

// Add or update a rating for a recipe
export async function rateRecipe(recipeId, userId, rating) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const ratingRef = ref(database, `recipeRatings/${recipeId}/${userId}`)
  await set(ratingRef, {
    rating,
    updatedAt: Date.now()
  })
}

// Get all ratings for a recipe
export async function getRecipeRatings(recipeId) {
  if (!firebaseEnabled) return { ratings: [], average: 0, count: 0 }
  const ratingsRef = ref(database, `recipeRatings/${recipeId}`)
  const snapshot = await get(ratingsRef)
  if (!snapshot.exists()) return { ratings: [], average: 0, count: 0 }

  const ratings = []
  let total = 0
  snapshot.forEach((child) => {
    const data = child.val()
    ratings.push({ oderId: child.key, ...data })
    total += data.rating
  })

  return {
    ratings,
    average: ratings.length > 0 ? total / ratings.length : 0,
    count: ratings.length
  }
}

// Get user's rating for a recipe
export async function getUserRating(recipeId, userId) {
  if (!firebaseEnabled) return null
  const ratingRef = ref(database, `recipeRatings/${recipeId}/${userId}`)
  const snapshot = await get(ratingRef)
  if (snapshot.exists()) {
    return snapshot.val().rating
  }
  return null
}

// Delete a rating (admin only)
export async function deleteRating(recipeId, oderId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const ratingRef = ref(database, `recipeRatings/${recipeId}/${oderId}`)
  await set(ratingRef, null)
}

// Get all ratings for all recipes (for sorting)
export async function getAllRatings() {
  if (!firebaseEnabled) return {}
  const ratingsRef = ref(database, 'recipeRatings')
  const snapshot = await get(ratingsRef)
  if (!snapshot.exists()) return {}

  const allRatings = {}
  snapshot.forEach((recipeChild) => {
    const recipeId = recipeChild.key
    let total = 0
    let count = 0
    recipeChild.forEach((ratingChild) => {
      total += ratingChild.val().rating
      count++
    })
    allRatings[recipeId] = {
      average: count > 0 ? total / count : 0,
      count
    }
  })
  return allRatings
}

// Add a comment to a recipe (legacy - kept for backwards compatibility)
export async function addRecipeComment(recipeId, userId, userEmail, comment, photoURL = null) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const commentRef = ref(database, `recipeComments/${recipeId}/${commentId}`)

  // Get user profile for display name
  const profile = await getUserProfile(userId)

  await set(commentRef, {
    id: commentId,
    userId,
    userEmail,
    userName: profile?.displayName || null,
    userPhoto: profile?.photoURL || null,
    comment,
    photoURL,
    createdAt: Date.now()
  })
  return commentId
}

// Get all comments for a recipe (legacy)
export async function getRecipeComments(recipeId) {
  if (!firebaseEnabled) return []
  const commentsRef = ref(database, `recipeComments/${recipeId}`)
  const snapshot = await get(commentsRef)
  if (!snapshot.exists()) return []

  const comments = []
  snapshot.forEach((child) => {
    comments.push({ id: child.key, ...child.val() })
  })

  // Sort by newest first
  return comments.sort((a, b) => b.createdAt - a.createdAt)
}

// Delete a comment (user can delete their own, admin can delete any)
export async function deleteRecipeComment(recipeId, commentId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const commentRef = ref(database, `recipeComments/${recipeId}/${commentId}`)
  await set(commentRef, null)
}

// ============ UNIFIED REVIEWS (rating + comment together) ============

// Add or update a review (rating + comment)
export async function addReview(recipeId, userId, userEmail, rating, comment, photoURL = null) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Get user profile for display name
  const profile = await getUserProfile(userId)

  // Check if user already has a review to preserve createdAt
  const existingRef = ref(database, `recipeReviews/${recipeId}/${userId}`)
  const existingSnapshot = await get(existingRef)
  const existingCreatedAt = existingSnapshot.exists() ? existingSnapshot.val().createdAt : Date.now()

  const reviewRef = ref(database, `recipeReviews/${recipeId}/${userId}`)
  await set(reviewRef, {
    userId,
    userEmail,
    userName: profile?.displayName || null,
    userPhoto: profile?.photoURL || null,
    rating,
    comment: comment || '',
    photoURL,
    createdAt: existingCreatedAt,
    updatedAt: Date.now()
  })

  // Also update the legacy ratings for backwards compatibility with sorting
  const ratingRef = ref(database, `recipeRatings/${recipeId}/${userId}`)
  await set(ratingRef, {
    rating,
    updatedAt: Date.now()
  })
}

// Get all reviews for a recipe
export async function getRecipeReviews(recipeId) {
  if (!firebaseEnabled) return { reviews: [], average: 0, count: 0 }
  const reviewsRef = ref(database, `recipeReviews/${recipeId}`)
  const snapshot = await get(reviewsRef)

  if (!snapshot.exists()) {
    // Fall back to old ratings system for backwards compatibility
    return { reviews: [], average: 0, count: 0 }
  }

  const reviews = []
  let total = 0
  snapshot.forEach((child) => {
    const data = child.val()
    reviews.push({ id: child.key, ...data })
    total += data.rating
  })

  // Sort by newest first
  reviews.sort((a, b) => b.createdAt - a.createdAt)

  return {
    reviews,
    average: reviews.length > 0 ? total / reviews.length : 0,
    count: reviews.length
  }
}

// Get user's review for a recipe
export async function getUserReview(recipeId, userId) {
  if (!firebaseEnabled) return null
  const reviewRef = ref(database, `recipeReviews/${recipeId}/${userId}`)
  const snapshot = await get(reviewRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  return null
}

// Delete a review (admin only or own review)
export async function deleteReview(recipeId, oderId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Delete from reviews
  const reviewRef = ref(database, `recipeReviews/${recipeId}/${oderId}`)
  await set(reviewRef, null)

  // Also delete from legacy ratings
  const ratingRef = ref(database, `recipeRatings/${recipeId}/${oderId}`)
  await set(ratingRef, null)
}

// Update recipe photo (admin only)
export async function updateRecipePhoto(recipeId, photoURL) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Check if it's an approved recipe
  const approvedRef = ref(database, `approvedRecipes/${recipeId}`)
  const approvedSnapshot = await get(approvedRef)
  if (approvedSnapshot.exists()) {
    await set(approvedRef, {
      ...approvedSnapshot.val(),
      photoURL,
      updatedAt: Date.now()
    })
    return
  }

  // Check pending recipes
  const pendingRef = ref(database, `pendingRecipes/${recipeId}`)
  const pendingSnapshot = await get(pendingRef)
  if (pendingSnapshot.exists()) {
    await set(pendingRef, {
      ...pendingSnapshot.val(),
      photoURL,
      updatedAt: Date.now()
    })
    return
  }

  throw new Error('Recipe not found')
}

// Tag overrides for static recipes (admin only)
export async function getRecipeTagOverrides(recipeId) {
  if (!firebaseEnabled) return null
  const tagRef = ref(database, `recipeTagOverrides/${recipeId}`)
  const snapshot = await get(tagRef)
  if (snapshot.exists()) {
    return snapshot.val().tags
  }
  return null
}

export async function setRecipeTagOverrides(recipeId, tags) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const tagRef = ref(database, `recipeTagOverrides/${recipeId}`)
  await set(tagRef, {
    tags,
    updatedAt: Date.now()
  })
}

// Get all tag overrides (for bulk loading)
export async function getAllTagOverrides() {
  if (!firebaseEnabled) return {}
  const overridesRef = ref(database, 'recipeTagOverrides')
  const snapshot = await get(overridesRef)
  if (!snapshot.exists()) return {}

  const overrides = {}
  snapshot.forEach((child) => {
    overrides[child.key] = child.val().tags
  })
  return overrides
}

// Photo overrides for static recipes (admin only)
export async function getRecipePhotoOverride(recipeId) {
  if (!firebaseEnabled) return null
  const photoRef = ref(database, `recipePhotoOverrides/${recipeId}`)
  const snapshot = await get(photoRef)
  if (snapshot.exists()) {
    return snapshot.val().photoURL
  }
  return null
}

export async function setRecipePhotoOverride(recipeId, photoURL) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const photoRef = ref(database, `recipePhotoOverrides/${recipeId}`)
  if (photoURL === null) {
    await set(photoRef, null)
  } else {
    await set(photoRef, {
      photoURL,
      updatedAt: Date.now()
    })
  }
}

// Get all photo overrides (for bulk loading)
export async function getAllPhotoOverrides() {
  if (!firebaseEnabled) return {}
  const overridesRef = ref(database, 'recipePhotoOverrides')
  const snapshot = await get(overridesRef)
  if (!snapshot.exists()) return {}

  const overrides = {}
  snapshot.forEach((child) => {
    overrides[child.key] = child.val().photoURL
  })
  return overrides
}

// ============ COOKING HISTORY ============

// Add entry to cooking history
export async function addCookingHistoryEntry(userId, entry) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const entryId = `entry-${Date.now()}`
  const entryRef = ref(database, `cookingHistory/${userId}/${entryId}`)
  await set(entryRef, {
    ...entry,
    id: entryId,
    createdAt: Date.now()
  })
  return entryId
}

// Update a cooking history entry
export async function updateCookingHistoryEntry(userId, entryId, updates) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const entryRef = ref(database, `cookingHistory/${userId}/${entryId}`)
  const snapshot = await get(entryRef)
  if (!snapshot.exists()) throw new Error('Entry not found')

  await set(entryRef, {
    ...snapshot.val(),
    ...updates,
    updatedAt: Date.now()
  })
}

// Delete a cooking history entry
export async function deleteCookingHistoryEntry(userId, entryId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const entryRef = ref(database, `cookingHistory/${userId}/${entryId}`)
  await set(entryRef, null)
}

// Get user's cooking history
export async function getCookingHistory(userId) {
  if (!firebaseEnabled) return []
  const historyRef = ref(database, `cookingHistory/${userId}`)
  const snapshot = await get(historyRef)
  if (!snapshot.exists()) return []

  const entries = []
  snapshot.forEach((child) => {
    entries.push({ id: child.key, ...child.val() })
  })

  // Sort by newest first
  return entries.sort((a, b) => b.createdAt - a.createdAt)
}

// ============ SOCIAL CONNECTIONS ============

// Follow a user
export async function followUser(userId, targetUserId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Add to following list
  const followingRef = ref(database, `following/${userId}/${targetUserId}`)
  await set(followingRef, { followedAt: Date.now() })

  // Add to followers list (reverse index)
  const followerRef = ref(database, `followers/${targetUserId}/${userId}`)
  await set(followerRef, { followedAt: Date.now() })
}

// Unfollow a user
export async function unfollowUser(userId, targetUserId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')

  // Remove from following list
  const followingRef = ref(database, `following/${userId}/${targetUserId}`)
  await set(followingRef, null)

  // Remove from followers list
  const followerRef = ref(database, `followers/${targetUserId}/${userId}`)
  await set(followerRef, null)
}

// Check if user is following another user
export async function isFollowing(userId, targetUserId) {
  if (!firebaseEnabled) return false
  const followingRef = ref(database, `following/${userId}/${targetUserId}`)
  const snapshot = await get(followingRef)
  return snapshot.exists()
}

// Get list of users that a user is following
export async function getFollowing(userId) {
  if (!firebaseEnabled) return []
  const followingRef = ref(database, `following/${userId}`)
  const snapshot = await get(followingRef)
  if (!snapshot.exists()) return []

  const following = []
  snapshot.forEach((child) => {
    following.push({ oderId: child.key, ...child.val() })
  })
  return following
}

// Get list of followers for a user
export async function getFollowers(userId) {
  if (!firebaseEnabled) return []
  const followersRef = ref(database, `followers/${userId}`)
  const snapshot = await get(followersRef)
  if (!snapshot.exists()) return []

  const followers = []
  snapshot.forEach((child) => {
    followers.push({ oderId: child.key, ...child.val() })
  })
  return followers
}

// Get cooking history for multiple users (for activity feed)
export async function getFollowingActivity(userId, limit = 20) {
  if (!firebaseEnabled) return []

  // Get list of followed users
  const following = await getFollowing(userId)
  if (following.length === 0) return []

  // Get recent entries from all followed users
  const allEntries = []
  for (const follow of following) {
    const entries = await getCookingHistory(follow.oderId)
    // Get user profile for display
    const profile = await getUserProfile(follow.oderId)
    entries.forEach(entry => {
      allEntries.push({
        ...entry,
        oderId: follow.oderId,
        userName: profile?.displayName || profile?.email,
        userPhoto: profile?.photoURL
      })
    })
  }

  // Sort by newest and limit
  return allEntries
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
}

// Get all users (for discovery) - returns basic profiles
export async function getAllUsers() {
  if (!firebaseEnabled) return []
  const profilesRef = ref(database, 'userProfiles')
  const snapshot = await get(profilesRef)
  if (!snapshot.exists()) return []

  const users = []
  snapshot.forEach((child) => {
    const profile = child.val()
    users.push({
      oderId: child.key,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL
    })
  })
  return users
}

// ============ LIKES & COMMENTS ON COOKING HISTORY ============

// Like a cooking history entry
export async function likeHistoryEntry(oderId, entryId, oderId2) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const likeRef = ref(database, `historyLikes/${oderId}/${entryId}/${oderId2}`)
  await set(likeRef, { likedAt: Date.now() })
}

// Unlike a cooking history entry
export async function unlikeHistoryEntry(oderId, entryId, oderId2) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const likeRef = ref(database, `historyLikes/${oderId}/${entryId}/${oderId2}`)
  await set(likeRef, null)
}

// Get likes for a cooking history entry
export async function getHistoryEntryLikes(oderId, entryId) {
  if (!firebaseEnabled) return { count: 0, likedBy: [] }
  const likesRef = ref(database, `historyLikes/${oderId}/${entryId}`)
  const snapshot = await get(likesRef)
  if (!snapshot.exists()) return { count: 0, likedBy: [] }

  const likedBy = []
  snapshot.forEach((child) => {
    likedBy.push(child.key)
  })
  return { count: likedBy.length, likedBy }
}

// Check if user liked an entry
export async function hasUserLikedEntry(oderId, entryId, oderId2) {
  if (!firebaseEnabled) return false
  const likeRef = ref(database, `historyLikes/${oderId}/${entryId}/${oderId2}`)
  const snapshot = await get(likeRef)
  return snapshot.exists()
}

// Add comment to cooking history entry
export async function addHistoryComment(oderId, entryId, commenterId, commenterEmail, text) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const commentId = `comment-${Date.now()}`
  const commentRef = ref(database, `historyComments/${oderId}/${entryId}/${commentId}`)

  const profile = await getUserProfile(commenterId)

  await set(commentRef, {
    id: commentId,
    userId: commenterId,
    userEmail: commenterEmail,
    userName: profile?.displayName || null,
    userPhoto: profile?.photoURL || null,
    text,
    createdAt: Date.now()
  })
  return commentId
}

// Get comments for a cooking history entry
export async function getHistoryComments(oderId, entryId) {
  if (!firebaseEnabled) return []
  const commentsRef = ref(database, `historyComments/${oderId}/${entryId}`)
  const snapshot = await get(commentsRef)
  if (!snapshot.exists()) return []

  const comments = []
  snapshot.forEach((child) => {
    comments.push({ id: child.key, ...child.val() })
  })
  return comments.sort((a, b) => a.createdAt - b.createdAt)
}

// Delete a comment
export async function deleteHistoryComment(oderId, entryId, commentId) {
  if (!firebaseEnabled) throw new Error('Firebase not configured')
  const commentRef = ref(database, `historyComments/${oderId}/${entryId}/${commentId}`)
  await set(commentRef, null)
}

export { database, auth }
