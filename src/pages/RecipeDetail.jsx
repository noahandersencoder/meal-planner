import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import recipes from '../data/recipes.json'
import { getApprovedRecipes, isFirebaseEnabled, getUserProfileByEmail } from '../firebase'
import RecipeComments from '../components/RecipeComments'

const categoryLabels = {
  produce: 'Produce',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  pantry: 'Pantry',
  spices: 'Spices',
  baking: 'Baking',
  frozen: 'Frozen',
  other: 'Other',
}

function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addRecipeToDay, preferences } = useStore()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatorProfile, setCreatorProfile] = useState(null)

  useEffect(() => {
    // First check static recipes
    const staticRecipe = recipes.find((r) => r.id === id)
    if (staticRecipe) {
      setRecipe(staticRecipe)
      setLoading(false)
      return
    }

    // If not found and Firebase is enabled, check user-submitted recipes
    if (isFirebaseEnabled()) {
      getApprovedRecipes()
        .then(async (userRecipes) => {
          const userRecipe = userRecipes.find((r) => r.id === id)
          if (userRecipe) {
            setRecipe({ ...userRecipe, isUserSubmitted: true })
            // Try to get creator's profile
            if (userRecipe.submitterEmail) {
              const profile = await getUserProfileByEmail(userRecipe.submitterEmail)
              setCreatorProfile(profile)
            }
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching user recipes:', err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Recipe not found</p>
        <button onClick={() => navigate('/browse')} className="btn btn-primary mt-4">
          Back to Recipes
        </button>
      </div>
    )
  }

  const totalTime = recipe.prepTime + recipe.cookTime
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
  const costPerServing = totalCost / recipe.servings
  const adjustedCost = costPerServing * preferences.servings

  const handleAddToMealPlan = () => {
    addRecipeToDay(0, recipe)
    navigate('/meal-plan')
  }

  const groupedIngredients = recipe.ingredients.reduce((acc, ing) => {
    const category = ing.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(ing)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <span className="text-8xl opacity-50">
            {(recipe.tags || []).includes('vegan') || (recipe.tags || []).includes('vegetarian')
              ? '🥗'
              : (recipe.tags || []).includes('fish')
              ? '🐟'
              : (recipe.tags || []).includes('poultry')
              ? '🍗'
              : '🍖'}
          </span>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          <p className="text-gray-600 mt-2">{recipe.description}</p>

          {recipe.isUserSubmitted && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
              {creatorProfile?.photoURL ? (
                <img
                  src={creatorProfile.photoURL}
                  alt={creatorProfile.displayName || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {(creatorProfile?.displayName || recipe.submitterEmail || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Recipe by</p>
                <p className="font-medium text-gray-900">
                  {creatorProfile?.displayName || recipe.submitterEmail}
                </p>
              </div>
            </div>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{recipe.prepTime}</p>
              <p className="text-sm text-gray-500">Prep (min)</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{recipe.cookTime}</p>
              <p className="text-sm text-gray-500">Cook (min)</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{recipe.servings}</p>
              <p className="text-sm text-gray-500">Servings</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">${totalCost.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Est. Cost</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <div className="space-y-4">
          {Object.entries(groupedIngredients).map(([category, ingredients]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {categoryLabels[category]}
              </h3>
              <ul className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-gray-800">
                      {ing.amount} {ing.unit} {ing.name}
                    </span>
                    <span className="text-gray-500">${(ing.cost || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-4">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3">
                {idx + 1}
              </span>
              <p className="text-gray-700 pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Ratings and Comments */}
      <RecipeComments recipeId={recipe.id} />

      <div className="sticky bottom-20 bg-white p-4 border-t border-gray-200 -mx-4">
        <button onClick={handleAddToMealPlan} className="btn btn-primary w-full">
          Add to Meal Plan
        </button>
      </div>
    </div>
  )
}

export default RecipeDetail
