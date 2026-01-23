import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import recipes from '../data/recipes.json'
import { getApprovedRecipes, isFirebaseEnabled } from '../firebase'
import RecipeCard from '../components/RecipeCard'
import RecipeRow from '../components/RecipeRow'
import FilterPanel from '../components/FilterPanel'

function Browse() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isApproved } = useAuth()
  const { preferences, addRecipeToDay, recipeViewMode, setRecipeViewMode } = useStore()
  const [filters, setFilters] = useState(preferences)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userRecipes, setUserRecipes] = useState([])

  const selectedDay = searchParams.get('day')

  // Load user-submitted approved recipes
  useEffect(() => {
    if (isFirebaseEnabled()) {
      getApprovedRecipes().then(setUserRecipes).catch(console.error)
    }
  }, [])

  // Combine built-in recipes with user-submitted ones
  const allRecipes = useMemo(() => {
    return [...recipes, ...userRecipes.map(r => ({ ...r, isUserSubmitted: true }))]
  }, [userRecipes])

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
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
  }, [filters, searchQuery, allRecipes])

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
            {userRecipes.length > 0 && (
              <span className="text-primary-600"> ({userRecipes.length} community)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && isApproved && (
            <Link to="/submit-recipe" className="btn btn-primary text-sm">
              + Add Recipe
            </Link>
          )}
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRecipeViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                recipeViewMode === 'grid'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setRecipeViewMode('list')}
              className={`p-2 rounded transition-colors ${
                recipeViewMode === 'list'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>
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

      {recipeViewMode === 'grid' ? (
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
      ) : (
        <div className="space-y-3">
          {filteredRecipes.map((recipe) => (
            <RecipeRow
              key={recipe.id}
              recipe={recipe}
              onAddToMealPlan={handleAddToMealPlan}
            />
          ))}
        </div>
      )}

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
