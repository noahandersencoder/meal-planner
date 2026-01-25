import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCookingHistory,
  deleteCookingHistoryEntry,
  updateCookingHistoryEntry,
  isFirebaseEnabled
} from '../firebase'
import recipes from '../data/recipes.json'
import ImageCropper from '../components/ImageCropper'

function CookingHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [editPhotos, setEditPhotos] = useState([])
  const [imageToCrop, setImageToCrop] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user && isFirebaseEnabled()) {
      loadHistory()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const entries = await getCookingHistory(user.uid)
      setHistory(entries)
    } catch (err) {
      console.error('Error loading cooking history:', err)
    }
    setLoading(false)
  }

  const getRecipeDetails = (recipeId) => {
    // Check static recipes first
    const staticRecipe = recipes.find(r => r.id === recipeId)
    if (staticRecipe) return staticRecipe

    // For user recipes, we only have the ID stored
    return null
  }

  const handleDelete = async (entryId) => {
    if (!confirm('Delete this entry from your cooking history?')) return

    try {
      await deleteCookingHistoryEntry(user.uid, entryId)
      setHistory(history.filter(e => e.id !== entryId))
    } catch (err) {
      console.error('Error deleting entry:', err)
    }
  }

  const startEditing = (entry) => {
    setEditingEntry(entry.id)
    setEditNotes(entry.notes || '')
    setEditPhotos(entry.photos || [])
  }

  const cancelEditing = () => {
    setEditingEntry(null)
    setEditNotes('')
    setEditPhotos([])
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageToCrop(event.target.result)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const handleCropComplete = (croppedImage) => {
    setEditPhotos([...editPhotos, croppedImage])
    setImageToCrop(null)
  }

  const removePhoto = (index) => {
    setEditPhotos(editPhotos.filter((_, i) => i !== index))
  }

  const saveEdits = async () => {
    if (!editingEntry) return

    setSaving(true)
    try {
      await updateCookingHistoryEntry(user.uid, editingEntry, {
        notes: editNotes,
        photos: editPhotos
      })

      setHistory(history.map(e =>
        e.id === editingEntry
          ? { ...e, notes: editNotes, photos: editPhotos }
          : e
      ))
      cancelEditing()
    } catch (err) {
      console.error('Error saving edits:', err)
      alert('Failed to save changes')
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Please log in to view your cooking history</p>
        <Link to="/login" className="btn btn-primary">Log In</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Cooking History</h2>
          <p className="text-gray-500 text-sm">
            {history.length} {history.length === 1 ? 'recipe' : 'recipes'} made
          </p>
        </div>
        <Link to="/browse" className="btn btn-primary text-sm">
          Find Recipes
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cooking history yet</h3>
          <p className="text-gray-500 mb-4">
            Start cooking and track your culinary journey!
          </p>
          <p className="text-sm text-gray-400">
            Click "I Made This" on any recipe to add it to your history
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => {
            const recipe = getRecipeDetails(entry.recipeId)
            const isEditing = editingEntry === entry.id

            return (
              <div key={entry.id} className="card p-4">
                <div className="flex gap-4">
                  {/* Recipe Image/Emoji */}
                  <Link
                    to={`/recipe/${entry.recipeId}`}
                    className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden"
                  >
                    {entry.recipePhotoURL || recipe?.photoURL ? (
                      <img
                        src={entry.recipePhotoURL || recipe.photoURL}
                        alt={entry.recipeName || recipe?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl opacity-50">🍽️</span>
                    )}
                  </Link>

                  {/* Entry Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/recipe/${entry.recipeId}`}
                          className="font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {entry.recipeName || recipe?.name || 'Unknown Recipe'}
                        </Link>
                        <p className="text-sm text-gray-500">
                          Made on {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => startEditing(entry)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add notes about how it turned out, modifications you made, etc."
                          className="input min-h-[80px] text-sm"
                        />

                        {/* Photo Management */}
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editPhotos.map((photo, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={photo}
                                  alt={`Photo ${idx + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => removePhoto(idx)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoSelect}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            + Add Photo
                          </button>
                        </div>

                        {/* Save/Cancel */}
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdits}
                            disabled={saving}
                            className="btn btn-primary text-sm"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={saving}
                            className="btn btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {entry.notes && (
                          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                            {entry.notes}
                          </p>
                        )}

                        {/* Display Photos */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={4 / 3}
          maxSize={800}
          quality={0.8}
        />
      )}
    </div>
  )
}

export default CookingHistory
