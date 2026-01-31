import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import MealPlanDay from '../components/MealPlanDay'
import recipes from '../data/recipes.json'
import { getApprovedRecipes, isFirebaseEnabled } from '../firebase'

const dayOptions = [
  { value: 3, label: '3 Days' },
  { value: 5, label: '5 Days' },
  { value: 7, label: '1 Week' },
]

// Random plan generator component
function RandomPlanModal({ onClose, onGenerate, days }) {
  const [criteria, setCriteria] = useState({
    maxRedMeat: 2,
    maxPoultry: 3,
    maxSeafood: 2,
    preferEasy: true,
    maxCookTime: 60,
    budgetLevel: 3,
    vegetarianOnly: false,
    veganOnly: false,
  })

  const handleChange = (field, value) => {
    setCriteria({ ...criteria, [field]: value })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Random Meal Plan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Set your preferences and we'll randomly select {days} recipes for your meal plan.
          </p>

          {/* Protein Limits */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Protein Limits (per week)</h4>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Max red meat meals</label>
              <select
                value={criteria.maxRedMeat}
                onChange={(e) => handleChange('maxRedMeat', parseInt(e.target.value))}
                className="input w-20 py-1.5"
                disabled={criteria.vegetarianOnly || criteria.veganOnly}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Max poultry meals</label>
              <select
                value={criteria.maxPoultry}
                onChange={(e) => handleChange('maxPoultry', parseInt(e.target.value))}
                className="input w-20 py-1.5"
                disabled={criteria.vegetarianOnly || criteria.veganOnly}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Max seafood meals</label>
              <select
                value={criteria.maxSeafood}
                onChange={(e) => handleChange('maxSeafood', parseInt(e.target.value))}
                className="input w-20 py-1.5"
                disabled={criteria.vegetarianOnly || criteria.veganOnly}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Difficulty</h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={criteria.preferEasy}
                onChange={(e) => handleChange('preferEasy', e.target.checked)}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Prefer easy meals (70% easy, 30% medium)</span>
            </label>
          </div>

          {/* Time */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Max Cooking Time</h4>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={criteria.maxCookTime}
                onChange={(e) => handleChange('maxCookTime', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-16">{criteria.maxCookTime} min</span>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Budget Level</h4>
            <div className="flex gap-2">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  onClick={() => handleChange('budgetLevel', level)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    criteria.budgetLevel >= level
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {'$'.repeat(level)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Include recipes up to this cost level</p>
          </div>

          {/* Dietary */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900">Dietary</h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={criteria.vegetarianOnly}
                onChange={(e) => {
                  handleChange('vegetarianOnly', e.target.checked)
                  if (e.target.checked) handleChange('veganOnly', false)
                }}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Vegetarian only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={criteria.veganOnly}
                onChange={(e) => {
                  handleChange('veganOnly', e.target.checked)
                  if (e.target.checked) handleChange('vegetarianOnly', false)
                }}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">Vegan only</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => onGenerate(criteria)}
              className="btn btn-primary flex-1"
            >
              Generate Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MealPlan() {
  const navigate = useNavigate()
  const {
    mealPlan,
    setMealPlanDays,
    removeRecipeFromDay,
    clearMealPlan,
    generateGroceryList,
    getMealPlanTotalCost,
    getAllMealPlanRecipes,
    addRecipeToDay,
  } = useStore()

  const [showRandomModal, setShowRandomModal] = useState(false)
  const [userRecipes, setUserRecipes] = useState([])

  // Load user-submitted recipes
  useEffect(() => {
    if (isFirebaseEnabled()) {
      getApprovedRecipes().then(setUserRecipes).catch(console.error)
    }
  }, [])

  // All available recipes
  const allRecipes = useMemo(() => {
    return [...recipes, ...userRecipes]
  }, [userRecipes])

  const totalCost = getMealPlanTotalCost()
  const totalRecipes = getAllMealPlanRecipes().length

  const handleAddMeal = (dayIndex) => {
    navigate(`/browse?day=${dayIndex}`)
  }

  const handleRemoveRecipe = (dayIndex, recipeId) => {
    removeRecipeFromDay(dayIndex, recipeId)
  }

  const handleGenerateList = () => {
    generateGroceryList()
    navigate('/grocery-list')
  }

  const handleGenerateRandomPlan = (criteria) => {
    // Filter recipes based on criteria
    let eligible = allRecipes.filter((recipe) => {
      const totalTime = recipe.prepTime + recipe.cookTime
      if (totalTime > criteria.maxCookTime) return false
      if (recipe.costLevel > criteria.budgetLevel) return false
      if (criteria.veganOnly && !recipe.tags?.includes('vegan')) return false
      if (criteria.vegetarianOnly && !recipe.tags?.includes('vegetarian') && !recipe.tags?.includes('vegan')) return false
      return true
    })

    if (eligible.length < mealPlan.days) {
      alert(`Not enough recipes match your criteria. Only ${eligible.length} found, need ${mealPlan.days}.`)
      return
    }

    // Categorize recipes by protein type
    const redMeatRecipes = eligible.filter((r) => r.tags?.includes('red-meat'))
    const poultryRecipes = eligible.filter((r) => r.tags?.includes('poultry'))
    const seafoodRecipes = eligible.filter((r) => r.tags?.includes('fish'))
    const vegetarianRecipes = eligible.filter((r) =>
      r.tags?.includes('vegetarian') || r.tags?.includes('vegan')
    )
    const otherRecipes = eligible.filter((r) =>
      !r.tags?.includes('red-meat') &&
      !r.tags?.includes('poultry') &&
      !r.tags?.includes('fish') &&
      !r.tags?.includes('vegetarian') &&
      !r.tags?.includes('vegan')
    )

    // Shuffle function
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

    // Pick recipes based on criteria
    const selected = []
    const usedIds = new Set()

    const pickFrom = (pool, count) => {
      const shuffled = shuffle(pool.filter((r) => !usedIds.has(r.id)))
      const picked = shuffled.slice(0, count)
      picked.forEach((r) => usedIds.add(r.id))
      return picked
    }

    // Determine counts based on criteria
    const redMeatCount = Math.min(criteria.maxRedMeat, redMeatRecipes.length, mealPlan.days)
    const poultryCount = Math.min(criteria.maxPoultry, poultryRecipes.length, mealPlan.days - selected.length)
    const seafoodCount = Math.min(criteria.maxSeafood, seafoodRecipes.length, mealPlan.days - selected.length)

    // If preferring easy, bias the selection
    if (criteria.preferEasy) {
      const easyEligible = eligible.filter((r) => r.difficulty === 'easy')
      const mediumEligible = eligible.filter((r) => r.difficulty === 'medium')
      const hardEligible = eligible.filter((r) => r.difficulty === 'hard')

      // Try to get 70% easy, 30% medium/hard
      const easyTarget = Math.floor(mealPlan.days * 0.7)
      const otherTarget = mealPlan.days - easyTarget

      selected.push(...pickFrom(easyEligible, easyTarget))
      selected.push(...pickFrom([...mediumEligible, ...hardEligible], otherTarget))
    } else {
      // Apply protein limits
      if (!criteria.vegetarianOnly && !criteria.veganOnly) {
        selected.push(...pickFrom(redMeatRecipes, redMeatCount))
        selected.push(...pickFrom(poultryRecipes, Math.min(poultryCount, mealPlan.days - selected.length)))
        selected.push(...pickFrom(seafoodRecipes, Math.min(seafoodCount, mealPlan.days - selected.length)))
      }

      // Fill remaining with vegetarian or other
      const remaining = mealPlan.days - selected.length
      if (remaining > 0) {
        const fillPool = [...vegetarianRecipes, ...otherRecipes].filter((r) => !usedIds.has(r.id))
        selected.push(...pickFrom(fillPool, remaining))
      }
    }

    // If we still need more, pick from any eligible
    while (selected.length < mealPlan.days) {
      const remaining = eligible.filter((r) => !usedIds.has(r.id))
      if (remaining.length === 0) break
      selected.push(...pickFrom(remaining, 1))
    }

    // Shuffle the final selection
    const shuffledSelected = shuffle(selected)

    // Clear existing plan and add new recipes
    clearMealPlan()
    shuffledSelected.forEach((recipe, idx) => {
      if (idx < mealPlan.days) {
        addRecipeToDay(idx, recipe)
      }
    })

    setShowRandomModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Plan/List Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          className="px-4 py-2 font-medium text-sm border-b-2 border-primary-600 text-primary-600"
        >
          📅 Meal Plan
        </button>
        <button
          onClick={() => navigate('/grocery-list')}
          className="px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
        >
          🛒 Grocery List
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">
            {totalRecipes > 0
              ? `${totalRecipes} meal${totalRecipes !== 1 ? 's' : ''} planned`
              : 'Plan your meals for the week'}
          </p>
        </div>
        {totalRecipes > 0 && (
          <button
            onClick={clearMealPlan}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {dayOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMealPlanDays(opt.value)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mealPlan.days === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: mealPlan.days }).map((_, idx) => (
          <MealPlanDay
            key={idx}
            dayIndex={idx}
            recipes={mealPlan.recipes[idx] || []}
            onRemoveRecipe={(recipeId) => handleRemoveRecipe(idx, recipeId)}
            onAddClick={() => handleAddMeal(idx)}
          />
        ))}
      </div>

      {totalRecipes > 0 && (
        <div className="card p-4 bg-primary-50">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-primary-900">Estimated Total</span>
            <span className="text-2xl font-bold text-primary-700">
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleGenerateList}
            className="btn btn-primary w-full"
          >
            Generate Grocery List
          </button>
        </div>
      )}

      {totalRecipes === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No meals planned yet</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/browse')}
              className="btn btn-primary"
            >
              Browse Recipes
            </button>
            <button
              onClick={() => setShowRandomModal(true)}
              className="btn btn-secondary"
            >
              Random Plan
            </button>
          </div>
        </div>
      )}

      {/* Random Plan Button when there are recipes */}
      {totalRecipes > 0 && (
        <button
          onClick={() => setShowRandomModal(true)}
          className="btn btn-secondary w-full"
        >
          Regenerate Random Plan
        </button>
      )}

      {/* Random Plan Modal */}
      {showRandomModal && (
        <RandomPlanModal
          onClose={() => setShowRandomModal(false)}
          onGenerate={handleGenerateRandomPlan}
          days={mealPlan.days}
        />
      )}
    </div>
  )
}

export default MealPlan
