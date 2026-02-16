import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'
import {
  isFirebaseEnabled,
  subscribeToUserGroceryLists,
  loadUserGroceryList,
  setFullGroceryList,
} from '../firebase'

const categoryOrder = [
  'produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices',
  'baking', 'frozen', 'snacks', 'breakfast', 'drinks', 'other',
]

/**
 * Convert Firebase keyed-object items back to a sorted array.
 * Handles both old array format and new keyed-object format.
 */
function itemsToArray(items) {
  if (!items) return []
  if (Array.isArray(items)) return items.filter(Boolean)
  // keyed object → array, sorted by category
  return Object.values(items)
    .filter(Boolean)
    .sort(
      (a, b) =>
        categoryOrder.indexOf(a.category || 'other') -
        categoryOrder.indexOf(b.category || 'other')
    )
}

/**
 * Convert a single list node from Firebase into the format the store expects.
 */
function normalizeList(listId, raw) {
  return {
    id: listId,
    name: raw.name || 'My Grocery List',
    items: itemsToArray(raw.items),
    checkedItems: raw.checkedItems || {},
    sourceRecipes: raw.sourceRecipes
      ? Array.isArray(raw.sourceRecipes)
        ? raw.sourceRecipes
        : Object.values(raw.sourceRecipes)
      : [],
    generatedAt: raw.generatedAt || null,
    createdAt: raw.createdAt || Date.now(),
  }
}

/**
 * Global subscription to the user's personal grocery lists.
 * Call once in Layout (like useMealPlanSync).
 *
 * Also handles migration from the old `users/{uid}/groceryList` path.
 */
export default function useGroceryListSync() {
  const { user, loading: authLoading } = useAuth()
  const setGroceryListsFromCloud = useStore((s) => s.setGroceryListsFromCloud)

  useEffect(() => {
    if (authLoading) return
    if (!isFirebaseEnabled() || !user) return

    let migrated = false

    const unsubscribe = subscribeToUserGroceryLists(user.uid, async (data) => {
      if (data) {
        // Convert each list's items from keyed objects to arrays
        const lists = {}
        for (const [listId, raw] of Object.entries(data)) {
          if (raw && typeof raw === 'object') {
            lists[listId] = normalizeList(listId, raw)
          }
        }
        setGroceryListsFromCloud(lists)
        return
      }

      // No data at new path — try migrating from old path once
      if (!migrated) {
        migrated = true
        try {
          const oldData = await loadUserGroceryList(user.uid)
          if (oldData) {
            // Old format: { groceryLists: { id: listData } } or { groceryList: [...], checkedItems: {} }
            if (oldData.groceryLists) {
              const lists = {}
              for (const [id, raw] of Object.entries(oldData.groceryLists)) {
                if (raw && typeof raw === 'object' && !raw.shared) {
                  lists[id] = normalizeList(id, raw)
                  // Write each list to new path
                  await setFullGroceryList(user.uid, id, raw)
                }
              }
              if (Object.keys(lists).length > 0) {
                setGroceryListsFromCloud(lists)
              }
            } else if (oldData.groceryList) {
              // Very old single-list format
              const listId = 'default-list'
              const list = {
                name: 'My Grocery List',
                items: oldData.groceryList || [],
                checkedItems: oldData.checkedItems || {},
                createdAt: Date.now(),
              }
              setGroceryListsFromCloud({
                [listId]: normalizeList(listId, list),
              })
              await setFullGroceryList(user.uid, listId, list)
            }
          }
        } catch (err) {
          console.error('Migration from old grocery list path failed:', err)
        }
      }
    })

    return () => unsubscribe()
  }, [user, authLoading, setGroceryListsFromCloud])
}
