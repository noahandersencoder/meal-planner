import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import GroceryItem from '../components/GroceryItem'
import {
  saveUserGroceryList,
  loadUserGroceryList,
  subscribeToUserList,
  isFirebaseEnabled
} from '../firebase'

const categoryLabels = {
  produce: { label: 'Produce', icon: '🥬' },
  meat: { label: 'Meat', icon: '🥩' },
  seafood: { label: 'Seafood', icon: '🐟' },
  dairy: { label: 'Dairy', icon: '🧀' },
  pantry: { label: 'Pantry', icon: '🥫' },
  spices: { label: 'Spices', icon: '🧂' },
  frozen: { label: 'Frozen', icon: '🧊' },
  other: { label: 'Other', icon: '📦' },
}

const categoryOrder = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'frozen', 'other']

function GroceryList() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isApproved, checkingApproval } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState(false)

  // Track if update came from Firebase to prevent sync loops
  const isFromFirebase = useRef(false)
  const saveTimeout = useRef(null)
  const initialLoadDone = useRef(false)

  const {
    groceryList,
    checkedItems,
    toggleGroceryItem,
    clearCheckedItems,
    clearGroceryList,
    getGroceryListTotal,
    generateGroceryList,
    getAllMealPlanRecipes,
    setGroceryListFromCloud,
  } = useStore()

  const totalCost = getGroceryListTotal()
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = groceryList.length
  const allChecked = totalCount > 0 && checkedCount === totalCount

  // Load user's grocery list on login
  useEffect(() => {
    if (authLoading) return
    if (!isFirebaseEnabled() || !user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    isFromFirebase.current = true

    loadUserGroceryList(user.uid)
      .then((data) => {
        if (data && data.groceryList) {
          setGroceryListFromCloud(data.groceryList, data.checkedItems || {})
        }
        setIsLoading(false)
        initialLoadDone.current = true
        setTimeout(() => { isFromFirebase.current = false }, 100)
      })
      .catch((err) => {
        console.error('Failed to load list:', err)
        setFirebaseError(true)
        setIsLoading(false)
        isFromFirebase.current = false
      })
  }, [user, authLoading])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isFirebaseEnabled() || !user || firebaseError) return

    const unsubscribe = subscribeToUserList(user.uid, (data) => {
      if (data && initialLoadDone.current) {
        isFromFirebase.current = true
        setGroceryListFromCloud(data.groceryList || [], data.checkedItems || {})
        setTimeout(() => { isFromFirebase.current = false }, 100)
      }
    })

    return () => unsubscribe()
  }, [user, firebaseError])

  // Sync changes to cloud when list changes (debounced)
  useEffect(() => {
    if (!isFirebaseEnabled() || !user || firebaseError) return
    if (!initialLoadDone.current) return
    if (isFromFirebase.current) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveUserGroceryList(user.uid, { groceryList, checkedItems })
        .catch((err) => {
          console.error('Sync error:', err)
          setFirebaseError(true)
        })
    }, 500)

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [groceryList, checkedItems, user, firebaseError])

  const groupedItems = groceryList.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  const sortedCategories = categoryOrder.filter((cat) => groupedItems[cat])

  const handleRefresh = () => {
    generateGroceryList()
  }

  // Show loading state
  if (authLoading || isLoading || checkingApproval) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your grocery list...</p>
        </div>
      </div>
    )
  }

  // Show pending approval message for logged-in but not approved users
  if (isFirebaseEnabled() && user && !isApproved) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pending Approval
          </h3>
          <p className="text-gray-600 mb-4">
            Your account is waiting for admin approval. You'll be able to access
            your grocery list once approved.
          </p>
          <p className="text-sm text-gray-500">
            Logged in as: {user.email}
          </p>
        </div>
      </div>
    )
  }

  // Prompt to log in if not authenticated
  if (isFirebaseEnabled() && !user) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Log in to save your list
          </h3>
          <p className="text-gray-600 mb-6">
            Your grocery list will sync across all your devices automatically.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Log In or Sign Up
          </button>
        </div>

        {/* Still allow using the app without login */}
        {groceryList.length > 0 && (
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-4 text-center">
              Or continue with your current list (won't sync):
            </p>
            <LocalGroceryList
              groceryList={groceryList}
              checkedItems={checkedItems}
              toggleGroceryItem={toggleGroceryItem}
              clearCheckedItems={clearCheckedItems}
              clearGroceryList={clearGroceryList}
              totalCost={totalCost}
              checkedCount={checkedCount}
              totalCount={totalCount}
              allChecked={allChecked}
              groupedItems={groupedItems}
              sortedCategories={sortedCategories}
              handleRefresh={handleRefresh}
              navigate={navigate}
            />
          </div>
        )}
      </div>
    )
  }

  // Empty state
  if (groceryList.length === 0) {
    const hasRecipes = getAllMealPlanRecipes().length > 0

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500 mb-4">
            {hasRecipes
              ? 'Generate a grocery list from your meal plan'
              : 'Add some recipes to your meal plan first'}
          </p>
          {hasRecipes ? (
            <button onClick={handleRefresh} className="btn btn-primary">
              Generate List
            </button>
          ) : (
            <button onClick={() => navigate('/meal-plan')} className="btn btn-primary">
              Go to Meal Plan
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <LocalGroceryList
      groceryList={groceryList}
      checkedItems={checkedItems}
      toggleGroceryItem={toggleGroceryItem}
      clearCheckedItems={clearCheckedItems}
      clearGroceryList={clearGroceryList}
      totalCost={totalCost}
      checkedCount={checkedCount}
      totalCount={totalCount}
      allChecked={allChecked}
      groupedItems={groupedItems}
      sortedCategories={sortedCategories}
      handleRefresh={handleRefresh}
      navigate={navigate}
      user={user}
    />
  )
}

// Extracted list component to avoid duplication
function LocalGroceryList({
  groceryList,
  checkedItems,
  toggleGroceryItem,
  clearCheckedItems,
  clearGroceryList,
  totalCost,
  checkedCount,
  totalCount,
  allChecked,
  groupedItems,
  sortedCategories,
  handleRefresh,
  navigate,
  user,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
          <p className="text-gray-500 text-sm">
            {checkedCount} of {totalCount} items checked
            {user && <span className="ml-2 text-green-600">Synced</span>}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary text-sm"
          title="Regenerate from meal plan"
        >
          Refresh
        </button>
      </div>

      <div className="card p-4 bg-primary-50 flex items-center justify-between">
        <span className="font-medium text-primary-900">Estimated Total</span>
        <span className="text-2xl font-bold text-primary-700">
          ${totalCost.toFixed(2)}
        </span>
      </div>

      {allChecked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">All items checked! Ready to cook!</p>
        </div>
      )}

      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{categoryLabels[category].icon}</span>
              <h3 className="font-semibold text-gray-900">
                {categoryLabels[category].label}
              </h3>
              <span className="text-sm text-gray-400">
                ({groupedItems[category].length})
              </span>
            </div>
            <div className="space-y-2">
              {groupedItems[category].map((item) => (
                <GroceryItem
                  key={item.id}
                  item={item}
                  checked={checkedItems[item.id] || false}
                  onToggle={() => toggleGroceryItem(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {checkedCount > 0 && (
          <button
            onClick={clearCheckedItems}
            className="btn btn-secondary flex-1"
          >
            Uncheck All
          </button>
        )}
        <button
          onClick={() => {
            clearGroceryList()
            navigate('/meal-plan')
          }}
          className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
        >
          Clear List
        </button>
      </div>
    </div>
  )
}

export default GroceryList
