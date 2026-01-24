import { useState, useEffect } from 'react'
import IngredientAutocomplete from './IngredientAutocomplete'
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

function RecipeEditModal({ recipe, onSave, onClose, saving }) {
  const [editedRecipe, setEditedRecipe] = useState(null)

  useEffect(() => {
    if (recipe) {
      // Initialize with recipe data, adding costPerUnit to ingredients
      setEditedRecipe({
        ...recipe,
        ingredients: recipe.ingredients?.map(ing => ({
          ...ing,
          costPerUnit: null // Start without auto-calc for existing recipes
        })) || []
      })
    }
  }, [recipe])

  if (!editedRecipe) return null

  const updateField = (field, value) => {
    setEditedRecipe(prev => ({ ...prev, [field]: value }))
  }

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...editedRecipe.ingredients]
    const currentIng = newIngredients[index]
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
    }

    // If user manually changes cost, clear costPerUnit
    if (field === 'cost') {
      newIngredients[index].costPerUnit = null
      newIngredients[index].baseUnit = null
    }

    updateField('ingredients', newIngredients)
  }

  const selectIngredient = (index, ingredient) => {
    const newIngredients = [...editedRecipe.ingredients]
    const currentAmount = parseFloat(newIngredients[index].amount) || 1
    newIngredients[index] = {
      ...newIngredients[index],
      name: ingredient.name,
      unit: ingredient.defaultUnit,
      costPerUnit: ingredient.avgCost,
      baseUnit: ingredient.defaultUnit,
      cost: (currentAmount * ingredient.avgCost).toFixed(2),
      category: ingredient.category
    }
    updateField('ingredients', newIngredients)
  }

  const addIngredient = () => {
    updateField('ingredients', [
      ...editedRecipe.ingredients,
      { name: '', amount: 1, unit: 'cups', cost: '', costPerUnit: null, baseUnit: null, category: 'produce' }
    ])
  }

  const removeIngredient = (index) => {
    if (editedRecipe.ingredients.length > 1) {
      updateField('ingredients', editedRecipe.ingredients.filter((_, i) => i !== index))
    }
  }

  const updateInstruction = (index, value) => {
    const newInstructions = [...editedRecipe.instructions]
    newInstructions[index] = value
    updateField('instructions', newInstructions)
  }

  const addInstruction = () => {
    updateField('instructions', [...editedRecipe.instructions, ''])
  }

  const removeInstruction = (index) => {
    if (editedRecipe.instructions.length > 1) {
      updateField('instructions', editedRecipe.instructions.filter((_, i) => i !== index))
    }
  }

  const toggleTag = (tag) => {
    const tags = editedRecipe.tags || []
    if (tags.includes(tag)) {
      updateField('tags', tags.filter(t => t !== tag))
    } else {
      updateField('tags', [...tags, tag])
    }
  }

  const handleSave = () => {
    // Clean up costPerUnit before saving (don't need it in DB)
    const cleanedRecipe = {
      ...editedRecipe,
      ingredients: editedRecipe.ingredients.map(ing => {
        const { costPerUnit, ...rest } = ing
        return {
          ...rest,
          amount: parseFloat(ing.amount) || 1,
          cost: parseFloat(ing.cost) || 0
        }
      }),
      instructions: editedRecipe.instructions.filter(i => i.trim())
    }
    onSave(cleanedRecipe)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Edit Recipe</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Info</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Name
              </label>
              <input
                type="text"
                value={editedRecipe.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editedRecipe.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="input min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={editedRecipe.prepTime}
                  onChange={(e) => updateField('prepTime', parseInt(e.target.value) || 0)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={editedRecipe.cookTime}
                  onChange={(e) => updateField('cookTime', parseInt(e.target.value) || 0)}
                  className="input"
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
                  value={editedRecipe.servings}
                  onChange={(e) => updateField('servings', parseInt(e.target.value) || 1)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={editedRecipe.difficulty}
                  onChange={(e) => updateField('difficulty', e.target.value)}
                  className="input"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Dietary Tags</h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    (editedRecipe.tags || []).includes(tag.value)
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
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Ingredients</h3>

            {editedRecipe.ingredients?.map((ingredient, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Ingredient {index + 1}
                  </span>
                  {editedRecipe.ingredients.length > 1 && (
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

            <button
              type="button"
              onClick={addIngredient}
              className="btn btn-secondary w-full"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Instructions</h3>

            {editedRecipe.instructions?.map((instruction, index) => (
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
                {editedRecipe.instructions.length > 1 && (
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

            <button
              type="button"
              onClick={addInstruction}
              className="btn btn-secondary w-full"
            >
              + Add Step
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeEditModal
