import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import MealPlanDay from '../components/MealPlanDay'

const dayOptions = [
  { value: 3, label: '3 Days' },
  { value: 5, label: '5 Days' },
  { value: 7, label: '1 Week' },
]

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
  } = useStore()

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meal Plan</h2>
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
          <button
            onClick={() => navigate('/browse')}
            className="btn btn-primary"
          >
            Browse Recipes
          </button>
        </div>
      )}
    </div>
  )
}

export default MealPlan
