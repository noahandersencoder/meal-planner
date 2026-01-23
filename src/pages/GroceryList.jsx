import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import GroceryItem from '../components/GroceryItem'

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
  const {
    groceryList,
    checkedItems,
    toggleGroceryItem,
    clearCheckedItems,
    clearGroceryList,
    getGroceryListTotal,
    generateGroceryList,
    getAllMealPlanRecipes,
  } = useStore()

  const totalCost = getGroceryListTotal()
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = groceryList.length
  const allChecked = totalCount > 0 && checkedCount === totalCount

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
          </p>
        </div>
        <div className="flex gap-2">
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
