import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import {
  generateListId,
  createSharedGroceryList,
  subscribeToSharedGroceryList,
  joinSharedGroceryList,
  leaveSharedGroceryList,
  deleteSharedGroceryList,
  getUserSharedListRefs,
  addUserSharedListRef,
  renameSharedGroceryList,
} from '../firebase'

export default function useSharedGroceryLists(user) {
  const subscriptionsRef = useRef({}) // shareCode → unsubscribe fn

  const setSharedListFromCloud = useStore((s) => s.setSharedListFromCloud)
  const removeSharedListLocally = useStore((s) => s.removeSharedListLocally)
  const groceryLists = useStore((s) => s.groceryLists)

  // Subscribe to a single shared list
  const subscribeTo = useCallback(
    (shareCode) => {
      if (subscriptionsRef.current[shareCode]) return // already subscribed
      const unsub = subscribeToSharedGroceryList(shareCode, (data) => {
        // No echo guard needed — granular writes from useGroceryList don't
        // trigger a blob save, so there's no echo to suppress.
        setSharedListFromCloud(shareCode, data)
      })
      subscriptionsRef.current[shareCode] = unsub
    },
    [setSharedListFromCloud]
  )

  // On mount: load user's shared list refs and subscribe to each
  useEffect(() => {
    if (!user) return

    let cancelled = false
    getUserSharedListRefs(user.uid).then((refs) => {
      if (cancelled) return
      for (const code of Object.keys(refs)) {
        subscribeTo(code)
      }
    })

    return () => {
      cancelled = true
      // Unsubscribe all on unmount
      for (const unsub of Object.values(subscriptionsRef.current)) {
        unsub()
      }
      subscriptionsRef.current = {}
    }
  }, [user, subscribeTo])

  // Share a personal list → returns the share code
  const shareList = useCallback(
    async (listId) => {
      if (!user) return null
      const list = groceryLists[listId]
      if (!list) return null

      const code = generateListId()
      await createSharedGroceryList(
        code,
        user.uid,
        user.email,
        list.name,
        list.items,
        list.checkedItems
      )
      await addUserSharedListRef(user.uid, code, list.name)
      subscribeTo(code)
      // Put it in the store immediately
      setSharedListFromCloud(code, {
        name: list.name,
        items: list.items,
        checkedItems: list.checkedItems,
        ownerId: user.uid,
        members: { [user.uid]: { email: user.email, joinedAt: Date.now() } },
        createdAt: Date.now(),
      })
      return code
    },
    [user, groceryLists, subscribeTo, setSharedListFromCloud]
  )

  // Join a shared list by code → returns list data or null
  const joinList = useCallback(
    async (shareCode) => {
      if (!user) return null
      const trimmed = shareCode.trim().toLowerCase()
      const data = await joinSharedGroceryList(trimmed, user.uid, user.email)
      if (!data) return null // code not found
      setSharedListFromCloud(trimmed, data)
      subscribeTo(trimmed)
      return data
    },
    [user, setSharedListFromCloud, subscribeTo]
  )

  // Leave a shared list
  const leaveList = useCallback(
    async (shareCode) => {
      if (!user) return
      await leaveSharedGroceryList(shareCode, user.uid)
      if (subscriptionsRef.current[shareCode]) {
        subscriptionsRef.current[shareCode]()
        delete subscriptionsRef.current[shareCode]
      }
      removeSharedListLocally(shareCode)
    },
    [user, removeSharedListLocally]
  )

  // Delete a shared list (owner only)
  const deleteList = useCallback(
    async (shareCode) => {
      if (!user) return
      await deleteSharedGroceryList(shareCode, user.uid)
      if (subscriptionsRef.current[shareCode]) {
        subscriptionsRef.current[shareCode]()
        delete subscriptionsRef.current[shareCode]
      }
      removeSharedListLocally(shareCode)
    },
    [user, removeSharedListLocally]
  )

  // Rename a shared list
  const renameShared = useCallback(async (shareCode, newName) => {
    await renameSharedGroceryList(shareCode, newName)
  }, [])

  return {
    shareList,
    joinList,
    leaveList,
    deleteList,
    renameShared,
  }
}
