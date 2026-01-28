import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import GroceryItem from '../components/GroceryItem'
import IngredientAutocomplete from '../components/IngredientAutocomplete'
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
  baking: { label: 'Baking', icon: '🧁' },
  frozen: { label: 'Frozen', icon: '🧊' },
  snacks: { label: 'Snacks', icon: '🍿' },
  breakfast: { label: 'Breakfast', icon: '🥣' },
  drinks: { label: 'Drinks', icon: '🥤' },
  other: { label: 'Other', icon: '📦' },
}

const categoryOrder = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'baking', 'frozen', 'snacks', 'breakfast', 'drinks', 'other']

// Quick add component for empty state
function QuickAddItem({ addItemToGroceryList }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState('whole')
  const [category, setCategory] = useState('snacks')
  const [cost, setCost] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    addItemToGroceryList({
      name: name.trim(),
      amount: parseFloat(amount) || 1,
      unit,
      category,
      cost: parseFloat(cost) || 0,
    })
    setName('')
    setAmount(1)
    setCost('')
  }

  const handleSelect = (ingredient) => {
    setName(ingredient.name)
    setUnit(ingredient.defaultUnit)
    setCategory(ingredient.category)
    setCost(ingredient.avgCost.toFixed(2))
  }

  return (
    <div className="space-y-3">
      <IngredientAutocomplete
        value={name}
        onChange={setName}
        onSelect={handleSelect}
        placeholder="Search for items..."
      />
      <div className="grid grid-cols-4 gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          placeholder="Qty"
          min="0.25"
          step="0.25"
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input">
          <option value="whole">whole</option>
          <option value="box">box</option>
          <option value="bag">bag</option>
          <option value="pack">pack</option>
          <option value="bottle">bottle</option>
          <option value="can">can</option>
          <option value="oz">oz</option>
          <option value="lb">lb</option>
          <option value="gallon">gallon</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          {categoryOrder.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat].icon} {categoryLabels[cat].label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="input"
          placeholder="$"
          min="0"
          step="0.01"
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        className="btn btn-primary w-full"
      >
        Add to List
      </button>
    </div>
  )
}

// List selector component
function ListSelector({ lists, activeListId, onSelect, onCreate, onRename, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRenaming, setIsRenaming] = useState(null)
  const [newName, setNewName] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
        setIsCreating(false)
        setIsRenaming(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const listArray = Object.values(lists).sort((a, b) => a.createdAt - b.createdAt)
  const activeList = lists[activeListId]

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim())
      setNewName('')
      setIsCreating(false)
      setShowMenu(false)
    }
  }

  const handleRename = (listId) => {
    if (newName.trim()) {
      onRename(listId, newName.trim())
      setNewName('')
      setIsRenaming(null)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">📋</span>
        <span className="font-medium text-gray-900 max-w-[150px] truncate">
          {activeList?.name || 'Select List'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase px-2">Your Lists</p>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {listArray.map((list) => (
              <div
                key={list.id}
                className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 ${
                  list.id === activeListId ? 'bg-primary-50' : ''
                }`}
              >
                {isRenaming === list.id ? (
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(list.id)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="List name"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(list.id)}
                      className="px-2 py-1 text-xs bg-primary-500 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelect(list.id)
                        setShowMenu(false)
                      }}
                      className="flex-1 text-left"
                    >
                      <span className={`font-medium ${list.id === activeListId ? 'text-primary-700' : 'text-gray-900'}`}>
                        {list.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({list.items?.length || 0} items)
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setNewName(list.name)
                          setIsRenaming(list.id)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {listArray.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${list.name}"?`)) {
                              onDelete(list.id)
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-gray-100">
            {isCreating ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="New list name"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  className="px-2 py-1 text-sm bg-primary-500 text-white rounded"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded flex items-center gap-2"
              >
                <span>+</span> New List
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
    groceryLists,
    activeListId,
    getActiveList,
    setActiveList,
    createGroceryList,
    deleteGroceryList,
    renameGroceryList,
    ensureActiveList,
    toggleGroceryItem,
    clearCheckedItems,
    clearGroceryList,
    getGroceryListTotal,
    generateGroceryList,
    getAllMealPlanRecipes,
    setGroceryListsFromCloud,
    setGroceryListFromCloud,
    addItemToGroceryList,
    removeItemFromGroceryList,
  } = useStore()

  const [servingMultiplier, setServingMultiplier] = useState(1)

  // Ensure we have at least one list
  useEffect(() => {
    if (!isLoading && Object.keys(groceryLists).length === 0) {
      ensureActiveList()
    }
  }, [isLoading, groceryLists])

  // Auto-refresh grocery list from meal plan on page load
  useEffect(() => {
    if (!isLoading && getAllMealPlanRecipes().length > 0) {
      generateGroceryList()
    }
  }, [isLoading])

  const activeList = getActiveList()
  const groceryList = activeList.items || []
  const checkedItems = activeList.checkedItems || {}
  const sourceRecipes = activeList.sourceRecipes || []

  const totalCost = getGroceryListTotal() * servingMultiplier
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = groceryList.length
  const allChecked = totalCount > 0 && checkedCount === totalCount

  // Load user's grocery lists on login
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
        if (data) {
          // Support both old format (groceryList) and new format (groceryLists)
          if (data.groceryLists) {
            setGroceryListsFromCloud(data.groceryLists, data.activeListId)
          } else if (data.groceryList) {
            // Migrate old format to new
            setGroceryListFromCloud(data.groceryList, data.checkedItems || {})
          }
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
        if (data.groceryLists) {
          setGroceryListsFromCloud(data.groceryLists, data.activeListId)
        } else if (data.groceryList) {
          setGroceryListFromCloud(data.groceryList || [], data.checkedItems || {})
        }
        setTimeout(() => { isFromFirebase.current = false }, 100)
      }
    })

    return () => unsubscribe()
  }, [user, firebaseError])

  // Sync changes to cloud when lists change (debounced)
  useEffect(() => {
    if (!isFirebaseEnabled() || !user || firebaseError) return
    if (!initialLoadDone.current) return
    if (isFromFirebase.current) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveUserGroceryList(user.uid, { groceryLists, activeListId })
        .catch((err) => {
          console.error('Sync error:', err)
          setFirebaseError(true)
        })
    }, 500)

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [groceryLists, activeListId, user, firebaseError])

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
              addItemToGroceryList={addItemToGroceryList}
              removeItemFromGroceryList={removeItemFromGroceryList}
            />
          </div>
        )}
      </div>
    )
  }

  // List selector props
  const listSelectorProps = {
    lists: groceryLists,
    activeListId,
    onSelect: setActiveList,
    onCreate: createGroceryList,
    onRename: renameGroceryList,
    onDelete: deleteGroceryList,
  }

  // Empty state
  if (groceryList.length === 0) {
    const hasRecipes = getAllMealPlanRecipes().length > 0

    return (
      <div className="space-y-6">
        {/* Plan/List Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => navigate('/meal-plan')}
            className="px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
          >
            📅 Meal Plan
          </button>
          <button
            className="px-4 py-2 font-medium text-sm border-b-2 border-primary-600 text-primary-600"
          >
            🛒 Grocery List
          </button>
        </div>

        <div className="flex items-center justify-between">
          <ListSelector {...listSelectorProps} />
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500 mb-4">This list is empty</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {hasRecipes && (
              <button onClick={handleRefresh} className="btn btn-primary">
                Generate from Meal Plan
              </button>
            )}
            <button onClick={() => navigate('/meal-plan')} className="btn btn-secondary">
              Go to Meal Plan
            </button>
          </div>
        </div>

        {/* Quick Add Section */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Add Items</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add snacks, drinks, breakfast items, or anything else to your list
          </p>
          <QuickAddItem addItemToGroceryList={addItemToGroceryList} />
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
      addItemToGroceryList={addItemToGroceryList}
      removeItemFromGroceryList={removeItemFromGroceryList}
      listSelectorProps={listSelectorProps}
      sourceRecipes={sourceRecipes}
      servingMultiplier={servingMultiplier}
      setServingMultiplier={setServingMultiplier}
    />
  )
}

const SORT_OPTIONS = [
  { value: 'aisle', label: 'By Aisle (Store Layout)' },
  { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
  { value: 'unchecked', label: 'Unchecked First' },
  { value: 'cost-high', label: 'Cost (Highest First)' },
  { value: 'cost-low', label: 'Cost (Lowest First)' },
]

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
  addItemToGroceryList,
  removeItemFromGroceryList,
  listSelectorProps,
  sourceRecipes = [],
  servingMultiplier = 1,
  setServingMultiplier,
}) {
  const [showAddItem, setShowAddItem] = useState(false)
  const [sortBy, setSortBy] = useState('aisle')
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState(1)
  const [newItemUnit, setNewItemUnit] = useState('whole')
  const [newItemCategory, setNewItemCategory] = useState('other')
  const [newItemCost, setNewItemCost] = useState('')

  const handleAddItem = () => {
    if (!newItemName.trim()) return

    addItemToGroceryList({
      name: newItemName.trim(),
      amount: parseFloat(newItemAmount) || 1,
      unit: newItemUnit,
      category: newItemCategory,
      cost: parseFloat(newItemCost) || 0,
    })

    // Reset form
    setNewItemName('')
    setNewItemAmount(1)
    setNewItemUnit('whole')
    setNewItemCategory('other')
    setNewItemCost('')
    setShowAddItem(false)
  }

  const handleSelectIngredient = (ingredient) => {
    setNewItemName(ingredient.name)
    setNewItemUnit(ingredient.defaultUnit)
    setNewItemCategory(ingredient.category)
    setNewItemCost(ingredient.avgCost.toFixed(2))
  }

  return (
    <div className="space-y-6">
      {/* Plan/List Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => navigate('/meal-plan')}
          className="px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
        >
          📅 Meal Plan
        </button>
        <button
          className="px-4 py-2 font-medium text-sm border-b-2 border-primary-600 text-primary-600"
        >
          🛒 Grocery List
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {listSelectorProps && <ListSelector {...listSelectorProps} />}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="btn btn-primary text-sm"
          >
            + Add Item
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
      <div className="flex items-center justify-between flex-wrap gap-2 -mt-4">
        <p className="text-gray-500 text-sm">
          {checkedCount} of {totalCount} items checked
          {user && <span className="ml-2 text-green-600">Synced</span>}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input py-1.5 text-sm w-auto"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source Recipes */}
      {sourceRecipes.length > 0 && (
        <div className="card p-3 bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Generated from:</span>{' '}
            {sourceRecipes.join(', ')}
          </p>
        </div>
      )}

      {/* Serving Multiplier */}
      {setServingMultiplier && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 text-sm">Serving Multiplier</h4>
            <p className="text-xs text-gray-500">Scale all quantities up or down</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors text-sm"
            >
              -
            </button>
            <span className="text-lg font-bold text-gray-900 w-12 text-center">
              {servingMultiplier}x
            </span>
            <button
              onClick={() => setServingMultiplier(Math.min(5, servingMultiplier + 0.5))}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors text-sm"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddItem && (
        <div className="card p-4 space-y-3 bg-gray-50">
          <h3 className="font-medium text-gray-900">Add Item</h3>
          <IngredientAutocomplete
            value={newItemName}
            onChange={setNewItemName}
            onSelect={handleSelectIngredient}
            placeholder="Search snacks, drinks, breakfast items..."
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="input"
              placeholder="Qty"
              min="0.25"
              step="0.25"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="input"
            >
              <option value="whole">whole</option>
              <option value="box">box</option>
              <option value="bag">bag</option>
              <option value="pack">pack</option>
              <option value="bottle">bottle</option>
              <option value="can">can</option>
              <option value="cup">cup</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
              <option value="gallon">gallon</option>
              <option value="liter">liter</option>
            </select>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="input"
            >
              {categoryOrder.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat].icon} {categoryLabels[cat].label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newItemCost}
              onChange={(e) => setNewItemCost(e.target.value)}
              className="input"
              placeholder="$ Cost"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="btn btn-primary flex-1"
            >
              Add to List
            </button>
            <button
              onClick={() => setShowAddItem(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
        {sortBy === 'aisle' ? (
          // Group by category/aisle
          sortedCategories.map((category) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{categoryLabels[category]?.icon || '📦'}</span>
                <h3 className="font-semibold text-gray-900">
                  {categoryLabels[category]?.label || category}
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
                    onRemove={removeItemFromGroceryList ? () => removeItemFromGroceryList(item.id) : null}
                    multiplier={servingMultiplier}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat list with custom sorting
          <div className="space-y-2">
            {[...groceryList]
              .sort((a, b) => {
                switch (sortBy) {
                  case 'alphabetical':
                    return a.name.localeCompare(b.name)
                  case 'unchecked':
                    // Unchecked items first, then alphabetical
                    const aChecked = checkedItems[a.id] ? 1 : 0
                    const bChecked = checkedItems[b.id] ? 1 : 0
                    if (aChecked !== bChecked) return aChecked - bChecked
                    return a.name.localeCompare(b.name)
                  case 'cost-high':
                    return (b.cost || 0) - (a.cost || 0)
                  case 'cost-low':
                    return (a.cost || 0) - (b.cost || 0)
                  default:
                    return 0
                }
              })
              .map((item) => (
                <GroceryItem
                  key={item.id}
                  item={item}
                  checked={checkedItems[item.id] || false}
                  onToggle={() => toggleGroceryItem(item.id)}
                  onRemove={removeItemFromGroceryList ? () => removeItemFromGroceryList(item.id) : null}
                  showCategory={true}
                  multiplier={servingMultiplier}
                />
              ))}
          </div>
        )}
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
