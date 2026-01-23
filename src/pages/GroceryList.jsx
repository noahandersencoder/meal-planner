import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useStore from '../store/useStore'
import GroceryItem from '../components/GroceryItem'
import { generateListId, saveGroceryList, loadGroceryList, subscribeToList } from '../firebase'

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
  const [searchParams] = useSearchParams()
  const [shareUrl, setShareUrl] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [firebaseError, setFirebaseError] = useState(false)

  const {
    groceryList,
    checkedItems,
    toggleGroceryItem,
    clearCheckedItems,
    clearGroceryList,
    getGroceryListTotal,
    generateGroceryList,
    getAllMealPlanRecipes,
    sharedListId,
    setSharedListId,
    setGroceryListFromCloud,
  } = useStore()

  const totalCost = getGroceryListTotal()
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = groceryList.length
  const allChecked = totalCount > 0 && checkedCount === totalCount

  // Check for shared list in URL on mount
  useEffect(() => {
    const listId = searchParams.get('list')
    if (listId && listId !== sharedListId) {
      setIsLoading(true)
      loadGroceryList(listId)
        .then((data) => {
          if (data) {
            setGroceryListFromCloud(data.groceryList || [], data.checkedItems || {})
            setSharedListId(listId)
          }
          setIsLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load list:', err)
          setFirebaseError(true)
          setIsLoading(false)
        })
    }
  }, [searchParams])

  // Subscribe to real-time updates if we have a shared list
  useEffect(() => {
    if (sharedListId && !firebaseError) {
      try {
        const unsubscribe = subscribeToList(sharedListId, (data) => {
          if (data) {
            setGroceryListFromCloud(data.groceryList || [], data.checkedItems || {})
          }
        })
        return () => unsubscribe()
      } catch (err) {
        console.error('Subscribe error:', err)
        setFirebaseError(true)
      }
    }
  }, [sharedListId, firebaseError])

  // Sync changes to cloud when list changes
  useEffect(() => {
    if (sharedListId && groceryList.length > 0 && !firebaseError) {
      setIsSyncing(true)
      saveGroceryList(sharedListId, { groceryList, checkedItems })
        .then(() => setIsSyncing(false))
        .catch((err) => {
          console.error('Sync error:', err)
          setFirebaseError(true)
          setIsSyncing(false)
        })
    }
  }, [groceryList, checkedItems, sharedListId, firebaseError])

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

  const handleShare = async () => {
    let listId = sharedListId
    if (!listId) {
      listId = generateListId()
      setSharedListId(listId)
    }

    try {
      await saveGroceryList(listId, { groceryList, checkedItems })
      const url = `${window.location.origin}/grocery-list?list=${listId}`
      setShareUrl(url)
      setShowShareModal(true)
    } catch (err) {
      console.error('Share error:', err)
      setFirebaseError(true)
      alert('Unable to share. Please set up Firebase first (see console for details).')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading shared list...</p>
        </div>
      </div>
    )
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grocery List</h2>
          <p className="text-gray-500 text-sm">
            {checkedCount} of {totalCount} items checked
            {isSyncing && <span className="ml-2 text-primary-600">Syncing...</span>}
            {sharedListId && !isSyncing && <span className="ml-2 text-green-600">Synced</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="btn btn-primary text-sm"
            title="Share this list"
          >
            Share
          </button>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary text-sm"
            title="Regenerate from meal plan"
          >
            Refresh
          </button>
        </div>
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
            setSharedListId(null)
            navigate('/meal-plan')
          }}
          className="btn btn-outline flex-1 text-red-600 border-red-300 hover:bg-red-50"
        >
          Clear List
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Your List</h3>
            <p className="text-gray-600 mb-4">
              Anyone with this link can view and check off items. Changes sync in real-time!
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-primary whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="btn btn-secondary w-full"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroceryList
