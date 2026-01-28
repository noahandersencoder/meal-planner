import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import recipes from '../data/recipes.json'
import { getApprovedRecipes, isFirebaseEnabled, getUserProfileByEmail, updateRecipePhoto, updateApprovedRecipe, getRecipeTagOverrides, setRecipeTagOverrides, getRecipePhotoOverride, setRecipePhotoOverride, addCookingHistoryEntry, addReview } from '../firebase'

const CUISINE_TAGS = [
  'italian', 'mediterranean', 'mexican', 'chinese', 'japanese',
  'thai', 'indian', 'american', 'french', 'greek', 'korean',
  'vietnamese', 'middle-eastern'
]

const COMMON_TAGS = [
  'vegetarian', 'vegan', 'dairy-free', 'gluten-free',
  'red-meat', 'poultry', 'fish', 'quick', 'healthy', 'comfort-food'
]
import RecipeComments from '../components/RecipeComments'
import IngredientWithUnitSelect from '../components/IngredientWithUnitSelect'
import ImageCropper from '../components/ImageCropper'

const categoryLabels = {
  produce: 'Produce',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  pantry: 'Pantry',
  spices: 'Spices',
  baking: 'Baking',
  frozen: 'Frozen',
  snacks: 'Snacks',
  breakfast: 'Breakfast',
  drinks: 'Drinks',
  other: 'Other',
}

function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isApproved } = useAuth()
  const { addRecipeToDay, preferences } = useStore()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatorProfile, setCreatorProfile] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [savingTags, setSavingTags] = useState(false)
  const [tempTags, setTempTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [imageToCrop, setImageToCrop] = useState(null)
  const [showIMadeThisModal, setShowIMadeThisModal] = useState(false)
  const [iMadeThisNotes, setIMadeThisNotes] = useState('')
  const [iMadeThisPhotos, setIMadeThisPhotos] = useState([])
  const [iMadeThisRating, setIMadeThisRating] = useState(0)
  const [iMadeThisReview, setIMadeThisReview] = useState('')
  const [savingHistory, setSavingHistory] = useState(false)
  const [historyImageToCrop, setHistoryImageToCrop] = useState(null)
  const [adjustedServings, setAdjustedServings] = useState(null) // null means use recipe default
  const photoInputRef = useRef(null)
  const historyPhotoInputRef = useRef(null)

  useEffect(() => {
    // First check static recipes
    const staticRecipe = recipes.find((r) => r.id === id)
    if (staticRecipe) {
      // Load any tag and photo overrides from Firebase
      if (isFirebaseEnabled()) {
        Promise.all([
          getRecipeTagOverrides(id),
          getRecipePhotoOverride(id)
        ]).then(([overrideTags, overridePhoto]) => {
          setRecipe({
            ...staticRecipe,
            tags: overrideTags || staticRecipe.tags,
            photoURL: overridePhoto || staticRecipe.photoURL,
            isStaticRecipe: true
          })
          setLoading(false)
        }).catch(() => {
          setRecipe({ ...staticRecipe, isStaticRecipe: true })
          setLoading(false)
        })
      } else {
        setRecipe({ ...staticRecipe, isStaticRecipe: true })
        setLoading(false)
      }
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
  const currentServings = adjustedServings || recipe.servings
  const servingMultiplier = currentServings / recipe.servings
  const scaledIngredients = recipe.ingredients.map(ing => ({
    ...ing,
    amount: Math.round((ing.amount * servingMultiplier) * 100) / 100,
    cost: Math.round((ing.cost * servingMultiplier) * 100) / 100
  }))
  const baseTotalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
  const scaledTotalCost = baseTotalCost * servingMultiplier

  const handleAddToMealPlan = () => {
    const scaledRecipe = {
      ...recipe,
      servings: currentServings,
      ingredients: scaledIngredients
    }
    addRecipeToDay(0, scaledRecipe)
    navigate('/meal-plan')
  }

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ratio = Math.min(maxWidth / img.width, 1)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Check if recipe is stored in Firebase (user-submitted or AI-generated)
  const isFirebaseRecipe = recipe?.id?.startsWith('user-')

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read file and show cropper
    const reader = new FileReader()
    reader.onload = (event) => {
      setImageToCrop(event.target.result)
    }
    reader.readAsDataURL(file)

    // Reset file input so same file can be selected again
    e.target.value = ''
  }

  const handleCropComplete = async (croppedImage) => {
    setImageToCrop(null)
    setUploadingPhoto(true)

    try {
      if (isFirebaseRecipe) {
        // For Firebase recipes (AI-generated or user-submitted)
        await updateRecipePhoto(recipe.id, croppedImage)
      } else {
        // For static recipes, store photo override in Firebase
        await setRecipePhotoOverride(recipe.id, croppedImage)
      }
      setRecipe({ ...recipe, photoURL: croppedImage })
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Failed to upload photo')
    }
    setUploadingPhoto(false)
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Remove recipe photo?')) return

    setUploadingPhoto(true)
    try {
      if (isFirebaseRecipe) {
        await updateRecipePhoto(recipe.id, null)
      } else {
        await setRecipePhotoOverride(recipe.id, null)
      }
      setRecipe({ ...recipe, photoURL: null })
    } catch (err) {
      console.error('Error removing photo:', err)
    }
    setUploadingPhoto(false)
  }

  // Tag management functions
  const startEditingTags = () => {
    setTempTags([...(recipe.tags || [])])
    setEditingTags(true)
  }

  const cancelEditingTags = () => {
    setEditingTags(false)
    setTempTags([])
    setNewTag('')
  }

  const addTag = (tag) => {
    const normalizedTag = tag.toLowerCase().trim()
    if (normalizedTag && !tempTags.includes(normalizedTag)) {
      setTempTags([...tempTags, normalizedTag])
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove) => {
    setTempTags(tempTags.filter(t => t !== tagToRemove))
  }

  const saveTags = async () => {
    if (!isFirebaseEnabled()) return

    setSavingTags(true)
    try {
      if (isFirebaseRecipe) {
        // For Firebase recipes (AI-generated or user-submitted)
        await updateApprovedRecipe(recipe.id, { tags: tempTags })
      } else {
        // For static recipes, store tag overrides in Firebase
        await setRecipeTagOverrides(recipe.id, tempTags)
      }
      setRecipe({ ...recipe, tags: tempTags })
      setEditingTags(false)
    } catch (err) {
      console.error('Error saving tags:', err)
      alert('Failed to save tags')
    }
    setSavingTags(false)
  }

  // "I Made This" functions
  const handleHistoryPhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setHistoryImageToCrop(event.target.result)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const handleHistoryCropComplete = (croppedImage) => {
    setIMadeThisPhotos([...iMadeThisPhotos, croppedImage])
    setHistoryImageToCrop(null)
  }

  const removeHistoryPhoto = (index) => {
    setIMadeThisPhotos(iMadeThisPhotos.filter((_, i) => i !== index))
  }

  const handleIMadeThis = async () => {
    if (!user || !isApproved) return

    setSavingHistory(true)
    try {
      // Add to cooking history
      await addCookingHistoryEntry(user.uid, {
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipePhotoURL: recipe.photoURL || null,
        notes: iMadeThisNotes.trim(),
        photos: iMadeThisPhotos,
        rating: iMadeThisRating || null
      })

      // If they gave a rating, also save it as a review
      if (iMadeThisRating > 0) {
        await addReview(
          recipe.id,
          user.uid,
          user.email,
          iMadeThisRating,
          iMadeThisReview.trim(),
          iMadeThisPhotos[0] || null // Use first photo as review photo
        )
      }

      setShowIMadeThisModal(false)
      setIMadeThisNotes('')
      setIMadeThisPhotos([])
      setIMadeThisRating(0)
      setIMadeThisReview('')
      alert('Added to your cooking history!' + (iMadeThisRating > 0 ? ' Review saved!' : ''))
    } catch (err) {
      console.error('Error saving to history:', err)
      alert('Failed to save to history')
    }
    setSavingHistory(false)
  }

  const groupedIngredients = scaledIngredients.reduce((acc, ing) => {
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
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
          {recipe.photoURL ? (
            <img
              src={recipe.photoURL}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-8xl opacity-50">
              {(recipe.tags || []).includes('vegan') || (recipe.tags || []).includes('vegetarian')
                ? '🥗'
                : (recipe.tags || []).includes('fish')
                ? '🐟'
                : (recipe.tags || []).includes('poultry')
                ? '🍗'
                : '🍖'}
            </span>
          )}

          {/* Admin Photo Controls */}
          {isAdmin && isFirebaseEnabled() && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-medium shadow-md transition-colors"
              >
                {uploadingPhoto ? 'Uploading...' : recipe.photoURL ? 'Change Photo' : 'Add Photo'}
              </button>
              {recipe.photoURL && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="px-3 py-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg text-sm font-medium shadow-md transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          <p className="text-gray-600 mt-2">{recipe.description}</p>

          {/* Author attribution */}
          <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
            {recipe.isUserSubmitted && !recipe.tags?.includes('ai-generated') ? (
              <>
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
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recipe by</p>
                  <p className="font-medium text-gray-900">AI</p>
                </div>
              </>
            )}
          </div>

          {/* Tags Display and Admin Edit */}
          <div className="mt-4">
            {!editingTags ? (
              <>
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
                {isAdmin && isFirebaseEnabled() && (
                  <button
                    onClick={startEditingTags}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Edit Tags
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Edit Recipe Tags</p>

                {/* Current Tags */}
                <div className="flex flex-wrap gap-2">
                  {tempTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {tempTags.length === 0 && (
                    <span className="text-sm text-gray-400">No tags yet</span>
                  )}
                </div>

                {/* Quick Add - Cuisines */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cuisine Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {CUISINE_TAGS.filter(t => !tempTags.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs hover:bg-gray-100 hover:border-primary-400"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Add - Common Tags */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Common Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_TAGS.filter(t => !tempTags.includes(t)).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs hover:bg-gray-100 hover:border-primary-400"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag(newTag)}
                    placeholder="Add custom tag..."
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => addTag(newTag)}
                    disabled={!newTag.trim()}
                    className="btn btn-secondary text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* Save/Cancel */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveTags}
                    disabled={savingTags}
                    className="btn btn-primary text-sm"
                  >
                    {savingTags ? 'Saving...' : 'Save Tags'}
                  </button>
                  <button
                    onClick={cancelEditingTags}
                    disabled={savingTags}
                    className="btn btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

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
              <p className="text-2xl font-bold text-primary-600">${scaledTotalCost.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Est. Cost</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Servings:</span>
            <button
              onClick={() => setAdjustedServings(Math.max(1, currentServings - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-gray-900">{currentServings}</span>
            <button
              onClick={() => setAdjustedServings(Math.min(24, currentServings + 1))}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              +
            </button>
            {adjustedServings && adjustedServings !== recipe.servings && (
              <button
                onClick={() => setAdjustedServings(null)}
                className="text-xs text-primary-600 hover:text-primary-700 ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {adjustedServings && adjustedServings !== recipe.servings && (
          <p className="text-xs text-gray-500 mb-3 -mt-2">
            Scaled from {recipe.servings} servings • Est. ${scaledTotalCost.toFixed(2)}
          </p>
        )}
        <div className="space-y-4">
          {Object.entries(groupedIngredients).map(([category, ingredients]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {categoryLabels[category] || category}
              </h3>
              <ul className="space-y-1">
                {ingredients.map((ing, idx) => (
                  <IngredientWithUnitSelect key={idx} ingredient={ing} />
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
        <div className="flex gap-3">
          <button onClick={handleAddToMealPlan} className="btn btn-primary flex-1">
            Add to Meal Plan
          </button>
          {user && isApproved && isFirebaseEnabled() && (
            <button
              onClick={() => setShowIMadeThisModal(true)}
              className="btn btn-secondary flex-shrink-0"
            >
              I Made This
            </button>
          )}
        </div>
      </div>

      {/* "I Made This" Modal */}
      {showIMadeThisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">I Made This!</h3>
                <button
                  onClick={() => setShowIMadeThisModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Add this recipe to your cooking history and optionally leave a review!
              </p>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (optional)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setIMadeThisRating(iMadeThisRating === star ? 0 : star)}
                      className="text-3xl transition-transform hover:scale-110"
                    >
                      <span className={star <= iMadeThisRating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {iMadeThisRating > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{iMadeThisRating} star{iMadeThisRating !== 1 ? 's' : ''}</p>
                )}
              </div>

              {/* Review (shown if rating is given) */}
              {iMadeThisRating > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review (optional)
                  </label>
                  <textarea
                    value={iMadeThisReview}
                    onChange={(e) => setIMadeThisReview(e.target.value)}
                    placeholder="Share your thoughts about this recipe..."
                    className="input min-h-[60px]"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Notes (optional)
                </label>
                <textarea
                  value={iMadeThisNotes}
                  onChange={(e) => setIMadeThisNotes(e.target.value)}
                  placeholder="Private notes: modifications, tips for next time..."
                  className="input min-h-[60px]"
                />
              </div>

              {/* Photos */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {iMadeThisPhotos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeHistoryPhoto(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  ref={historyPhotoInputRef}
                  onChange={handleHistoryPhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => historyPhotoInputRef.current?.click()}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Photo
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIMadeThisModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIMadeThis}
                  disabled={savingHistory}
                  className="btn btn-primary flex-1"
                >
                  {savingHistory ? 'Saving...' : 'Save to History'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={16 / 9}
          maxSize={800}
          quality={0.8}
        />
      )}

      {/* History Image Cropper Modal */}
      {historyImageToCrop && (
        <ImageCropper
          image={historyImageToCrop}
          onCropComplete={handleHistoryCropComplete}
          onCancel={() => setHistoryImageToCrop(null)}
          aspect={4 / 3}
          maxSize={800}
          quality={0.8}
        />
      )}
    </div>
  )
}

export default RecipeDetail
