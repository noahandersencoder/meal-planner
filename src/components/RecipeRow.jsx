import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRecipeRatings, isFirebaseEnabled } from '../firebase'

const costLabels = { 1: '$', 2: '$$', 3: '$$$' }

function RecipeRow({ recipe, onAddToMealPlan, author }) {
  const totalTime = recipe.prepTime + recipe.cookTime
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
  const [rating, setRating] = useState({ average: 0, count: 0 })

  useEffect(() => {
    if (isFirebaseEnabled()) {
      getRecipeRatings(recipe.id).then(setRating).catch(console.error)
    }
  }, [recipe.id])

  const getEmoji = () => {
    if (recipe.tags.includes('vegan') || recipe.tags.includes('vegetarian')) return '🥗'
    if (recipe.tags.includes('fish')) return '🐟'
    if (recipe.tags.includes('poultry')) return '🍗'
    return '🍖'
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {recipe.photoURL ? (
          <img
            src={recipe.photoURL}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl opacity-50">{getEmoji()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/recipe/${recipe.id}`} className="hover:text-primary-600 transition-colors">
            <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
          </Link>
          {author && (
            <span className="text-xs text-gray-400">
              by {author === 'AI' ? (
                <span className="inline-flex items-center gap-0.5">
                  <span>AI</span>
                  <span className="text-purple-400">✨</span>
                </span>
              ) : author}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
          {rating.count > 0 && (
            <>
              <span className="flex items-center gap-0.5">
                <span className="text-yellow-400">★</span>
                <span className="font-medium text-gray-700">{rating.average.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({rating.count})</span>
              </span>
              <span>•</span>
            </>
          )}
          <span>{totalTime} min</span>
          <span>•</span>
          <span>{recipe.servings} servings</span>
          <span>•</span>
          <span className="text-primary-600 font-medium">{costLabels[recipe.costLevel]}</span>
          <span>•</span>
          <span>${totalCost.toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onAddToMealPlan(recipe)}
        className="btn btn-primary text-sm py-1.5 px-3 flex-shrink-0"
      >
        + Add
      </button>
    </div>
  )
}

export default RecipeRow
