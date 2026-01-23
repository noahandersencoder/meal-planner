import { Link } from 'react-router-dom'

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

function RecipeCard({ recipe, onAddToMealPlan, showAddButton = false }) {
  const totalTime = recipe.prepTime + recipe.cookTime
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        <span className="text-6xl opacity-50">
          {recipe.tags.includes('vegan') || recipe.tags.includes('vegetarian')
            ? '🥗'
            : recipe.tags.includes('fish')
            ? '🐟'
            : recipe.tags.includes('poultry')
            ? '🍗'
            : '🍖'}
        </span>
      </div>
      <div className="p-4">
        <Link to={`/recipe/${recipe.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {recipe.name}
          </h3>
        </Link>
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
