import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'
import {
  isFirebaseEnabled,
  setGroceryListItem,
  removeGroceryListItem,
  setGroceryListCheckedItem,
  clearGroceryListCheckedItems,
  clearGroceryListItems,
  setFullGroceryList,
  createGroceryListMeta,
  deleteGroceryListNode,
  renameGroceryListNode,
  setSharedGroceryListItem,
  removeSharedGroceryListItem,
  setSharedGroceryListCheckedItem,
  clearSharedGroceryListCheckedItems,
  clearSharedGroceryListItems,
  setFullSharedGroceryList,
  renameSharedGroceryList,
} from '../firebase'

/**
 * Hook that wraps every grocery-list store mutation with a granular Firebase
 * write, following the same pattern as useMealPlan.js.
 *
 * Each function:
 *   1. Updates the Zustand store (instant local UI)
 *   2. Fires a granular Firebase write (no debounce, no useEffect loop)
 */
export default function useGroceryList() {
  const { user } = useAuth()

  // Store actions
  const storeAddItem = useStore((s) => s.addItemToGroceryList)
  const storeRemoveItem = useStore((s) => s.removeItemFromGroceryList)
  const storeToggle = useStore((s) => s.toggleGroceryItem)
  const storeClearChecked = useStore((s) => s.clearCheckedItems)
  const storeClearList = useStore((s) => s.clearGroceryList)
  const storeGenerate = useStore((s) => s.generateGroceryList)
  const storeCreateList = useStore((s) => s.createGroceryList)
  const storeDeleteList = useStore((s) => s.deleteGroceryList)
  const storeRenameList = useStore((s) => s.renameGroceryList)
  const storeEnsureActive = useStore((s) => s.ensureActiveList)

  // Helper: determine if the active list is shared
  const getListMeta = () => {
    const { activeListId, groceryLists } = useStore.getState()
    const list = groceryLists[activeListId]
    return {
      listId: activeListId,
      list,
      isShared: !!list?.shared,
      shareCode: list?.shareCode,
    }
  }

  const firebaseWrite = (fn) => {
    if (isFirebaseEnabled() && user) {
      fn().catch(console.error)
    }
  }

  // --- Public API ---

  const addItem = (item) => {
    storeAddItem(item)
    const { listId, list, isShared, shareCode } = getListMeta()
    // Re-read the list after store update to get the resolved item (merged amounts etc.)
    const { groceryLists } = useStore.getState()
    const updatedList = groceryLists[listId || useStore.getState().activeListId]
    if (!updatedList) return
    const key = `${item.name.toLowerCase()}-${item.unit}`
    const resolvedItem = updatedList.items.find((i) => i.id === key)
    if (!resolvedItem) return

    firebaseWrite(() =>
      isShared
        ? setSharedGroceryListItem(shareCode, resolvedItem)
        : setGroceryListItem(user.uid, listId || useStore.getState().activeListId, resolvedItem)
    )
  }

  const removeItem = (itemId) => {
    const { listId, isShared, shareCode } = getListMeta()
    storeRemoveItem(itemId)
    firebaseWrite(() =>
      isShared
        ? removeSharedGroceryListItem(shareCode, itemId)
        : removeGroceryListItem(user.uid, listId, itemId)
    )
  }

  const toggleItem = (itemId) => {
    const { listId, list, isShared, shareCode } = getListMeta()
    // Determine new checked state BEFORE toggling (toggle inverts it)
    const wasChecked = list?.checkedItems?.[itemId] || false
    const newChecked = !wasChecked
    storeToggle(itemId)
    firebaseWrite(() =>
      isShared
        ? setSharedGroceryListCheckedItem(shareCode, itemId, newChecked)
        : setGroceryListCheckedItem(user.uid, listId, itemId, newChecked)
    )
  }

  const clearChecked = () => {
    const { listId, isShared, shareCode } = getListMeta()
    storeClearChecked()
    firebaseWrite(() =>
      isShared
        ? clearSharedGroceryListCheckedItems(shareCode)
        : clearGroceryListCheckedItems(user.uid, listId)
    )
  }

  const clearList = () => {
    const { listId, isShared, shareCode } = getListMeta()
    storeClearList()
    firebaseWrite(() =>
      isShared
        ? clearSharedGroceryListItems(shareCode)
        : clearGroceryListItems(user.uid, listId)
    )
  }

  const generateList = () => {
    storeGenerate()
    // After generate, push the full list to Firebase
    const { activeListId, groceryLists } = useStore.getState()
    const list = groceryLists[activeListId]
    if (!list) return
    const { isShared, shareCode } = getListMeta()
    firebaseWrite(() =>
      isShared
        ? setFullSharedGroceryList(shareCode, list)
        : setFullGroceryList(user.uid, activeListId, list)
    )
  }

  const createList = (name) => {
    const id = storeCreateList(name)
    firebaseWrite(() => createGroceryListMeta(user.uid, id, name || 'New List'))
    return id
  }

  const deleteList = (listId) => {
    storeDeleteList(listId)
    firebaseWrite(() => deleteGroceryListNode(user.uid, listId))
  }

  const renameList = (listId, newName) => {
    const { groceryLists } = useStore.getState()
    const list = groceryLists[listId]
    storeRenameList(listId, newName)
    if (list?.shared && list.shareCode) {
      firebaseWrite(() => renameSharedGroceryList(list.shareCode, newName))
    } else {
      firebaseWrite(() => renameGroceryListNode(user.uid, listId, newName))
    }
  }

  const ensureActiveList = () => {
    const id = storeEnsureActive()
    // If a default list was just created, persist its metadata
    const { groceryLists } = useStore.getState()
    const list = groceryLists[id]
    if (list && !list.shared) {
      firebaseWrite(() => createGroceryListMeta(user.uid, id, list.name))
    }
    return id
  }

  return {
    addItem,
    removeItem,
    toggleItem,
    clearChecked,
    clearList,
    generateList,
    createList,
    deleteList,
    renameList,
    ensureActiveList,
  }
}
