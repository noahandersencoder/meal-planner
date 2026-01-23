import { Link } from 'react-router-dom'

const costLabels = { 1: '$', 2: '$$', 3: '$$$' }

function RecipeRow({ recipe, onAddToMealPlan }) {
  const totalTime = recipe.prepTime + recipe.cookTime
  const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <Link to={`/recipe/${recipe.id}`} className="hover:text-primary-600 transition-colors">
          <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
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
