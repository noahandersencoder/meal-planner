import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRecipeRatings, isFirebaseEnabled } from '../firebase'

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const costLabels = {
  1: '$',
  2: '$$',
  3: '$$$',
}

function RecipeCard({ recipe, onAddToMealPlan, showAddButton = false, author }) {
  const [rating, setRating] = useState({ average: 0, count: 0 })

  useEffect(() => {
    if (isFirebaseEnabled()) {
      getRecipeRatings(recipe.id).then(setRating).catch(console.error)
    }
  }, [recipe.id])
  const totalTime = recipe.prepTime + recipe.cookTime
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)

  const getEmoji = () => {
    if (recipe.tags.includes('vegan') || recipe.tags.includes('vegetarian')) return '🥗'
    if (recipe.tags.includes('fish')) return '🐟'
    if (recipe.tags.includes('poultry')) return '🍗'
    return '🍖'
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
        {recipe.photoURL ? (
          <img
            src={recipe.photoURL}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl opacity-50">{getEmoji()}</span>
        )}
      </div>
      <div className="p-4">
        <Link to={`/recipe/${recipe.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {recipe.name}
          </h3>
        </Link>
        {author && (
          <p className="text-xs text-gray-400 mt-0.5">
            by {author === 'AI' ? (
              <span className="inline-flex items-center gap-1">
                <span>AI</span>
                <span className="text-purple-400">✨</span>
              </span>
            ) : author}
          </p>
        )}
        {rating.count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-medium text-gray-700">{rating.average.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({rating.count})</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {totalTime} min
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
            {costLabels[recipe.costLevel]}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            {recipe.servings} servings • ${totalCost.toFixed(2)}
          </span>
          {showAddButton && (
            <button
              onClick={() => onAddToMealPlan(recipe)}
              className="btn btn-primary text-sm py-1"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
