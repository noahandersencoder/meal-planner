import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { submitRecipe, isFirebaseEnabled } from '../firebase'
import IngredientAutocomplete from '../components/IngredientAutocomplete'
import { getCostPerUnitConverted } from '../utils/unitConversions'

const CATEGORIES = [
  { value: 'produce', label: 'Produce', icon: '🥬' },
  { value: 'meat', label: 'Meat', icon: '🥩' },
  { value: 'seafood', label: 'Seafood', icon: '🐟' },
  { value: 'dairy', label: 'Dairy', icon: '🧀' },
  { value: 'pantry', label: 'Pantry', icon: '🥫' },
  { value: 'spices', label: 'Spices', icon: '🧂' },
  { value: 'baking', label: 'Baking', icon: '🧁' },
  { value: 'frozen', label: 'Frozen', icon: '🧊' },
  { value: 'snacks', label: 'Snacks', icon: '🍿' },
  { value: 'breakfast', label: 'Breakfast', icon: '🥣' },
  { value: 'drinks', label: 'Drinks', icon: '🥤' },
  { value: 'other', label: 'Other', icon: '📦' },
]

const DIETARY_TAGS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'red-meat', label: 'Contains Red Meat' },
  { value: 'poultry', label: 'Contains Poultry' },
  { value: 'fish', label: 'Contains Fish' },
  { value: 'quick', label: 'Quick (Under 30 min)' },
]

function RecipeSubmit() {
  const navigate = useNavigate()
  const { user, isApproved } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [recipe, setRecipe] = useState({
    name: '',
    description: '',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'easy',
    costLevel: 2,
    tags: [],
    ingredients: [{ name: '', amount: 1, unit: 'cups', cost: '', costPerUnit: null, baseUnit: null, category: 'produce' }],
    instructions: ['']
  })

  if (!isFirebaseEnabled()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Recipe submission requires Firebase configuration.</p>
      </div>
    )
  }

  if (!user || !isApproved) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit a Recipe</h2>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Login Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to be logged in and approved to submit recipes.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Log In
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Recipe Submitted!</h2>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thanks for your contribution!
          </h3>
          <p className="text-gray-600 mb-6">
            Your recipe has been submitted for admin approval. Once approved,
            it will appear in the recipe list for everyone to enjoy.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false)
                setRecipe({
                  name: '',
                  description: '',
                  prepTime: 10,
                  cookTime: 20,
                  servings: 4,
                  difficulty: 'easy',
                  costLevel: 2,
                  tags: [],
                  ingredients: [{ name: '', amount: 1, unit: 'cups', cost: '', costPerUnit: null, baseUnit: null, category: 'produce' }],
                  instructions: ['']
                })
              }}
              className="btn btn-primary"
            >
              Submit Another
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="btn btn-secondary"
            >
              Browse Recipes
            </button>
          </div>
        </div>
      </div>
    )
  }

  const updateRecipe = (field, value) => {
    setRecipe(prev => ({ ...prev, [field]: value }))
  }

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...recipe.ingredients]
    const currentIng = newIngredients[index]

    // Update the field
    newIngredients[index] = { ...currentIng, [field]: value }

    // If amount changed and we have a costPerUnit, recalculate cost
    if (field === 'amount' && currentIng.costPerUnit) {
      const amount = parseFloat(value) || 0
      // Convert costPerUnit to current unit if different from base
      let effectiveCostPerUnit = currentIng.costPerUnit
      if (currentIng.baseUnit && currentIng.baseUnit !== currentIng.unit) {
        const converted = getCostPerUnitConverted(
          currentIng.costPerUnit,
          currentIng.baseUnit,
          currentIng.unit,
          currentIng.name
        )
        if (converted !== null) effectiveCostPerUnit = converted
      }
      newIngredients[index].cost = (amount * effectiveCostPerUnit).toFixed(2)
    }

    // If unit changed and we have a costPerUnit, recalculate cost
    if (field === 'unit' && currentIng.costPerUnit && currentIng.baseUnit) {
      const newCostPerUnit = getCostPerUnitConverted(
        currentIng.costPerUnit,
        currentIng.baseUnit,
        value,
        currentIng.name
      )
      if (newCostPerUnit !== null) {
        const amount = parseFloat(currentIng.amount) || 0
        newIngredients[index].cost = (amount * newCostPerUnit).toFixed(2)
      }
      // Note: we keep the original costPerUnit and baseUnit so conversions remain accurate
    }

    // If user manually changes cost, clear costPerUnit to stop auto-calculation
    if (field === 'cost') {
      newIngredients[index].costPerUnit = null
      newIngredients[index].baseUnit = null
    }

    updateRecipe('ingredients', newIngredients)
  }

  // Handle ingredient selection from autocomplete
  const selectIngredient = (index, ingredient) => {
    const newIngredients = [...recipe.ingredients]
    const currentAmount = parseFloat(newIngredients[index].amount) || 1
    newIngredients[index] = {
      ...newIngredients[index],
      name: ingredient.name,
      unit: ingredient.defaultUnit,
      costPerUnit: ingredient.avgCost,
      baseUnit: ingredient.defaultUnit, // Store the unit the cost is based on
      cost: (currentAmount * ingredient.avgCost).toFixed(2),
      category: ingredient.category
    }
    updateRecipe('ingredients', newIngredients)
  }

  const addIngredient = () => {
    updateRecipe('ingredients', [
      ...recipe.ingredients,
      { name: '', amount: 1, unit: 'cups', cost: '', costPerUnit: null, baseUnit: null, category: 'produce' }
    ])
  }

  const removeIngredient = (index) => {
    if (recipe.ingredients.length > 1) {
      updateRecipe('ingredients', recipe.ingredients.filter((_, i) => i !== index))
    }
  }

  const updateInstruction = (index, value) => {
    const newInstructions = [...recipe.instructions]
    newInstructions[index] = value
    updateRecipe('instructions', newInstructions)
  }

  const addInstruction = () => {
    updateRecipe('instructions', [...recipe.instructions, ''])
  }

  const removeInstruction = (index) => {
    if (recipe.instructions.length > 1) {
      updateRecipe('instructions', recipe.instructions.filter((_, i) => i !== index))
    }
  }

  const toggleTag = (tag) => {
    if (recipe.tags.includes(tag)) {
      updateRecipe('tags', recipe.tags.filter(t => t !== tag))
    } else {
      updateRecipe('tags', [...recipe.tags, tag])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!recipe.name.trim()) {
      setError('Please enter a recipe name')
      return
    }
    if (!recipe.description.trim()) {
      setError('Please enter a description')
      return
    }
    if (recipe.ingredients.some(i => !i.name.trim())) {
      setError('Please fill in all ingredient names')
      return
    }
    if (recipe.instructions.some(i => !i.trim())) {
      setError('Please fill in all instruction steps')
      return
    }

    setSubmitting(true)
    try {
      // Clean up the recipe data
      const cleanedRecipe = {
        ...recipe,
        ingredients: recipe.ingredients.map(i => ({
          ...i,
          amount: parseFloat(i.amount) || 1,
          cost: parseFloat(i.cost) || 0
        })),
        instructions: recipe.instructions.filter(i => i.trim())
      }

      await submitRecipe(user.uid, user.email, cleanedRecipe)
      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit recipe. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-gray-900">Submit a Recipe</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📝</span> Basic Info
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Name *
            </label>
            <input
              type="text"
              value={recipe.name}
              onChange={(e) => updateRecipe('name', e.target.value)}
              className="input"
              placeholder="e.g., Grandma's Chicken Soup"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={recipe.description}
              onChange={(e) => updateRecipe('description', e.target.value)}
              className="input min-h-[80px]"
              placeholder="A brief description of your recipe..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (min)
              </label>
              <input
                type="number"
                value={recipe.prepTime}
                onChange={(e) => updateRecipe('prepTime', parseInt(e.target.value) || 0)}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cook Time (min)
              </label>
              <input
                type="number"
                value={recipe.cookTime}
                onChange={(e) => updateRecipe('cookTime', parseInt(e.target.value) || 0)}
                className="input"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servings
              </label>
              <input
                type="number"
                value={recipe.servings}
                onChange={(e) => updateRecipe('servings', parseInt(e.target.value) || 1)}
                className="input"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={recipe.difficulty}
                onChange={(e) => updateRecipe('difficulty', e.target.value)}
                className="input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Level
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateRecipe('costLevel', level)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    recipe.costLevel === level
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {'$'.repeat(level)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏷️</span> Dietary Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  recipe.tags.includes(tag.value)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🥗</span> Ingredients
          </h3>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Ingredient {index + 1}
                  </span>
                  {recipe.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <IngredientAutocomplete
                  value={ingredient.name}
                  onChange={(value) => updateIngredient(index, 'name', value)}
                  onSelect={(ing) => selectIngredient(index, ing)}
                  placeholder="Start typing ingredient name..."
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    className="input"
                    placeholder="Qty"
                    step="0.25"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="input"
                  >
                    <option value="whole">whole</option>
                    <option value="cup">cup</option>
                    <option value="cups">cups</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="can">can</option>
                    <option value="bunch">bunch</option>
                    <option value="head">head</option>
                    <option value="cloves">cloves</option>
                    <option value="stalks">stalks</option>
                    <option value="sprigs">sprigs</option>
                    <option value="slices">slices</option>
                    <option value="pint">pint</option>
                    <option value="packet">packet</option>
                  </select>
                  <input
                    type="number"
                    value={ingredient.cost}
                    onChange={(e) => updateIngredient(index, 'cost', e.target.value)}
                    className="input"
                    placeholder="Cost $"
                    step="0.01"
                  />
                </div>

                <select
                  value={ingredient.category}
                  onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addIngredient}
            className="btn btn-secondary w-full"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span> Instructions
          </h3>

          <div className="space-y-3">
            {recipe.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="input min-h-[60px]"
                    placeholder={`Step ${index + 1}...`}
                  />
                </div>
                {recipe.instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="text-red-500 hover:text-red-700 text-sm self-start mt-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addInstruction}
            className="btn btn-secondary w-full"
          >
            + Add Step
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full py-3 text-lg"
        >
          {submitting ? 'Submitting...' : 'Submit Recipe for Approval'}
        </button>
      </form>
    </div>
  )
}

export default RecipeSubmit
