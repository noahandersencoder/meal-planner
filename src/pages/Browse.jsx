import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useStore from '../store/useStore'
import recipes from '../data/recipes.json'
import RecipeCard from '../components/RecipeCard'
import FilterPanel from '../components/FilterPanel'

function Browse() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { preferences, addRecipeToDay } = useStore()
  const [filters, setFilters] = useState(preferences)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedDay = searchParams.get('day')

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const totalTime = recipe.prepTime + recipe.cookTime
      if (totalTime > filters.maxCookTime) return false

      if (recipe.costLevel > filters.budgetLevel) return false

      if (filters.veganMode && !recipe.tags.includes('vegan')) return false

      if (filters.vegetarianMode && !recipe.tags.includes('vegetarian') && !recipe.tags.includes('vegan')) return false

      if (filters.dietaryRestrictions?.length > 0) {
        for (const restriction of filters.dietaryRestrictions) {
          if (recipe.tags.includes(restriction)) return false
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          recipe.name.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      return true
    })
  }, [filters, searchQuery])

  const handleAddToMealPlan = (recipe) => {
    if (selectedDay !== null) {
      addRecipeToDay(parseInt(selectedDay), recipe)
      navigate('/meal-plan')
    } else {
      addRecipeToDay(0, recipe)
      navigate('/meal-plan')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recipes</h2>
          <p className="text-gray-500 text-sm">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary"
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showFilters ? (
        <FilterPanel filters={filters} onChange={setFilters} />
      ) : (
        <FilterPanel filters={filters} onChange={setFilters} compact />
      )}

      {selectedDay !== null && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-primary-800 text-sm">
          Adding to Day {parseInt(selectedDay) + 1} of your meal plan
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            showAddButton
            onAddToMealPlan={handleAddToMealPlan}
          />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No recipes match your filters.</p>
          <button
            onClick={() => setFilters({ maxCookTime: 120, budgetLevel: 3, dietaryRestrictions: [] })}
            className="btn btn-outline mt-4"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default Browse
