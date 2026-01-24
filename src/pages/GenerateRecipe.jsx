import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { submitRecipe, isFirebaseEnabled } from '../firebase'

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'gluten-free', label: 'Gluten Free' },
]

const CUISINE_OPTIONS = [
  { value: '', label: 'Any Cuisine' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
]

// API endpoint - update this after deploying to Vercel
const API_URL = import.meta.env.VITE_RECIPE_AI_API_URL || 'http://localhost:3000'

function GenerateRecipe() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [ingredientInput, setIngredientInput] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [dietary, setDietary] = useState([])
  const [cuisine, setCuisine] = useState('')

  const [generating, setGenerating] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [error, setError] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Admin-only check
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">AI Recipe Generator</h2>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Admin Access Required
          </h3>
          <p className="text-gray-600">
            This feature is currently only available to administrators.
          </p>
        </div>
      </div>
    )
  }

  const addIngredient = () => {
    const trimmed = ingredientInput.trim().toLowerCase()
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed])
      setIngredientInput('')
    }
  }

  const removeIngredient = (ingredient) => {
    setIngredients(ingredients.filter(i => i !== ingredient))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  const toggleDietary = (value) => {
    if (dietary.includes(value)) {
      setDietary(dietary.filter(d => d !== value))
    } else {
      setDietary([...dietary, value])
    }
  }

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient')
      return
    }

    setError('')
    setGenerating(true)
    setGeneratedRecipe(null)
    setSaved(false)

    try {
      const response = await fetch(`${API_URL}/api/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          preferences: {
            dietary: dietary.length > 0 ? dietary : undefined,
            cuisine: cuisine || undefined,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate recipe')
      }

      const data = await response.json()
      setGeneratedRecipe(data.recipe)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate recipe. Please try again.')
    }

    setGenerating(false)
  }

  const handleSave = async () => {
    if (!generatedRecipe || !user) return

    setSaving(true)
    setError('')

    try {
      // Add AI-generated tag
      const recipeToSave = {
        ...generatedRecipe,
        tags: [...(generatedRecipe.tags || []), 'ai-generated'],
      }

      await submitRecipe(user.uid, user.email, recipeToSave)
      setSaved(true)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save recipe. Please try again.')
    }

    setSaving(false)
  }

  const handleReset = () => {
    setGeneratedRecipe(null)
    setSaved(false)
    setError('')
  }

  const getCategoryIcon = (category) => {
    const icons = {
      produce: '🥬',
      meat: '🥩',
      seafood: '🐟',
      dairy: '🧀',
      pantry: '🥫',
      spices: '🧂',
      baking: '🧁',
      frozen: '🧊',
      other: '📦'
    }
    return icons[category] || '📦'
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <span className="text-3xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">AI Recipe Generator</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Recipe Preview */}
      {generatedRecipe && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{generatedRecipe.name}</h3>
                <p className="text-gray-600 mt-1">{generatedRecipe.description}</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                AI Generated
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>⏱ Prep: {generatedRecipe.prepTime}min</span>
              <span>🍳 Cook: {generatedRecipe.cookTime}min</span>
              <span>👥 Serves: {generatedRecipe.servings}</span>
              <span className="capitalize">📊 {generatedRecipe.difficulty}</span>
              <span>💰 {'$'.repeat(generatedRecipe.costLevel || 2)}</span>
            </div>

            {generatedRecipe.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {generatedRecipe.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🥗</span> Ingredients
            </h4>
            <ul className="space-y-2">
              {generatedRecipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span>{getCategoryIcon(ing.category)}</span>
                  <span>
                    <strong>{ing.amount} {ing.unit}</strong> {ing.name}
                  </span>
                  {ing.cost > 0 && (
                    <span className="text-gray-400 ml-auto">${ing.cost.toFixed(2)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>📋</span> Instructions
            </h4>
            <ol className="space-y-3">
              {generatedRecipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!saved ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !isFirebaseEnabled()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Saving...' : 'Save as My Recipe'}
                </button>
                <button
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  Generate Another
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
                  Recipe saved! It will appear in Admin for approval.
                </div>
                <button
                  onClick={handleReset}
                  className="btn btn-primary"
                >
                  Generate Another
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      {!generatedRecipe && (
        <div className="space-y-6">
          {/* Ingredients Input */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🥕</span> What ingredients do you have?
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type an ingredient and press Enter"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map(ingredient => (
                  <span
                    key={ingredient}
                    className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient)}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {ingredients.length === 0 && (
              <p className="text-sm text-gray-500">
                Add ingredients you have on hand (e.g., chicken, rice, garlic, onion)
              </p>
            )}
          </div>

          {/* Preferences */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">⚙️</span> Preferences (Optional)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDietary(option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      dietary.includes(option.value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Style
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="input"
              >
                {CUISINE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || ingredients.length === 0}
            className="btn btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Recipe...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate Recipe
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default GenerateRecipe
