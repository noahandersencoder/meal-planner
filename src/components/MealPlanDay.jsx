import { Link } from 'react-router-dom'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function MealPlanDay({ dayIndex, recipes, onRemoveRecipe, onAddClick }) {
  const today = new Date()
  const dayDate = new Date(today)
  dayDate.setDate(today.getDate() + dayIndex)

  const dayName = dayNames[dayDate.getDay()]
  const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const totalCost = recipes.reduce((sum, recipe) => {
    return sum + recipe.ingredients.reduce((s, ing) => s + (ing.cost || 0), 0)
  }, 0)

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{dayName}</h3>
          <p className="text-sm text-gray-500">{dateStr}</p>
        </div>
        {recipes.length > 0 && (
          <span className="text-sm text-primary-600 font-medium">
            ${totalCost.toFixed(2)}
          </span>
        )}
      </div>

      <div className="p-4">
        {recipes.length === 0 ? (
          <button
            onClick={onAddClick}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
          >
            + Add a meal
          </button>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <Link
                  to={`/recipe/${recipe.id}`}
                  state={{ servings: recipe.servings }}
                  className="flex-1 hover:text-primary-600 transition-colors"
                >
                  <span className="font-medium text-gray-800">{recipe.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {recipe.prepTime + recipe.cookTime} min • {recipe.servings} servings
                  </span>
                </Link>
                <button
                  onClick={() => onRemoveRecipe(recipe.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={onAddClick}
              className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              + Add another meal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealPlanDay
