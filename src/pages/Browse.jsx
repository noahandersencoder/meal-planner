import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import useMealPlan from '../hooks/useMealPlan'
import recipes from '../data/recipes.json'
import { getApprovedRecipes, getAllRatings, getAllTagOverrides, getAllPhotoOverrides, isFirebaseEnabled } from '../firebase'
import RecipeCard from '../components/RecipeCard'
import RecipeRow from '../components/RecipeRow'
import FilterPanel from '../components/FilterPanel'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'rating', label: 'Rating (highest)' },
  { value: 'time', label: 'Time (fastest)' },
  { value: 'cost', label: 'Cost (lowest)' },
  { value: 'difficulty', label: 'Difficulty (easiest)' },
  { value: 'author', label: 'Author (A-Z)' },
]

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 }

// Helper to get author display name
function getAuthorName(recipe) {
  // AI-generated recipes
  if (recipe.tags?.includes('ai-generated')) return 'AI'
  // User-submitted recipes
  if (recipe.submitterEmail) return recipe.submitterEmail.split('@')[0]
  // Built-in recipes
  return 'AI'
}

function Browse() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isApproved } = useAuth()
  const { preferences, recipeViewMode, setRecipeViewMode } = useStore()
  const { addRecipe } = useMealPlan()
  const [filters, setFilters] = useState(preferences)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userRecipes, setUserRecipes] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [allRatings, setAllRatings] = useState({})
  const [tagOverrides, setTagOverrides] = useState({})
  const [photoOverrides, setPhotoOverrides] = useState({})

  const selectedDay = searchParams.get('day')

  // Load user-submitted approved recipes, ratings, tag overrides, and photo overrides
  useEffect(() => {
    if (isFirebaseEnabled()) {
      getApprovedRecipes().then(setUserRecipes).catch(console.error)
      getAllRatings().then(setAllRatings).catch(console.error)
      getAllTagOverrides().then(setTagOverrides).catch(console.error)
      getAllPhotoOverrides().then(setPhotoOverrides).catch(console.error)
    }
  }, [])

  // Combine built-in recipes with user-submitted ones, applying tag and photo overrides
  const allRecipes = useMemo(() => {
    const staticWithOverrides = recipes.map(r => ({
      ...r,
      tags: tagOverrides[r.id] || r.tags,
      photoURL: photoOverrides[r.id] || r.photoURL
    }))
    return [...staticWithOverrides, ...userRecipes.map(r => ({ ...r, isUserSubmitted: true }))]
  }, [userRecipes, tagOverrides, photoOverrides])

  const filteredRecipes = useMemo(() => {
    const filtered = allRecipes.filter((recipe) => {
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

      // Cuisine filter
      if (filters.cuisine) {
        if (!recipe.tags?.includes(filters.cuisine)) return false
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

    // Sort the filtered results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating': {
          const ratingA = allRatings[a.id]?.average || 0
          const ratingB = allRatings[b.id]?.average || 0
          return ratingB - ratingA // Highest first
        }
        case 'time':
          return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime)
        case 'cost': {
          const costA = a.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
          const costB = b.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
          return costA - costB
        }
        case 'difficulty':
          return (DIFFICULTY_ORDER[a.difficulty] || 2) - (DIFFICULTY_ORDER[b.difficulty] || 2)
        case 'author':
          return getAuthorName(a).localeCompare(getAuthorName(b))
        default:
          return 0
      }
    })
  }, [filters, searchQuery, allRecipes, sortBy, allRatings])

  const handleAddToMealPlan = (recipe) => {
    if (selectedDay !== null) {
      addRecipe(parseInt(selectedDay), recipe)
      navigate('/meal-plan')
    } else {
      addRecipe(0, recipe)
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
        {user && isApproved && (
          <div className="flex gap-2">
            <Link to="/generate" className="btn btn-secondary text-sm flex items-center gap-1">
              <span>✨</span> Generate
            </Link>
            <Link to="/submit-recipe" className="btn btn-primary text-sm">
              + Add
            </Link>
          </div>
        )}
      </div>

      {/* Search Bar */}
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

      {/* Filters - all on one line with labels */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input py-1.5 text-xs w-auto"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Time</label>
          <select
            value={filters.maxCookTime || 60}
            onChange={(e) => setFilters({ ...filters, maxCookTime: Number(e.target.value) })}
            className="input py-1.5 text-xs w-auto"
          >
            <option value={15}>≤ 15 min</option>
            <option value={30}>≤ 30 min</option>
            <option value={45}>≤ 45 min</option>
            <option value={60}>≤ 1 hr</option>
            <option value={120}>≤ 1 hr+</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Budget</label>
          <select
            value={filters.budgetLevel || 3}
            onChange={(e) => setFilters({ ...filters, budgetLevel: Number(e.target.value) })}
            className="input py-1.5 text-xs w-auto"
          >
            <option value={1}>$</option>
            <option value={2}>$$</option>
            <option value={3}>$$$</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Cuisine</label>
          <select
            value={filters.cuisine || ''}
            onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            className="input py-1.5 text-xs w-auto"
          >
            <option value="">All</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="chinese">Chinese</option>
            <option value="japanese">Japanese</option>
            <option value="thai">Thai</option>
            <option value="indian">Indian</option>
            <option value="american">American</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="french">French</option>
            <option value="greek">Greek</option>
            <option value="korean">Korean</option>
            <option value="vietnamese">Vietnamese</option>
            <option value="middle-eastern">Middle Eastern</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">View</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setRecipeViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                recipeViewMode === 'grid'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setRecipeViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                recipeViewMode === 'list'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => setFilters({ ...filters, vegetarianMode: !filters.vegetarianMode })}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            filters.vegetarianMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vegetarian
        </button>

        <button
          onClick={() => setFilters({ ...filters, veganMode: !filters.veganMode })}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            filters.veganMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vegan
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            showFilters
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showFilters ? 'Less' : 'More'}
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} />
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
              author={getAuthorName(recipe)}
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
              author={getAuthorName(recipe)}
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
