import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  rateRecipe,
  getRecipeRatings,
  getUserRating,
  deleteRating,
  addRecipeComment,
  getRecipeComments,
  deleteRecipeComment,
  isFirebaseEnabled
} from '../firebase'

function StarRating({ rating, onRate, interactive = false, size = 'md' }) {
  const [hoverRating, setHoverRating] = useState(0)
  const sizeClasses = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'

  const handleClick = (star, event) => {
    if (!interactive || !onRate) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onRate(isLeftHalf ? star - 0.5 : star)
  }

  const handleMouseMove = (star, event) => {
    if (!interactive) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverRating(isLeftHalf ? star - 0.5 : star)
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={(e) => handleClick(star, e)}
          onMouseMove={(e) => handleMouseMove(star, e)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${sizeClasses} transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} relative`}
        >
          {/* Full star background (gray) */}
          <span className="text-gray-300">★</span>
          {/* Filled portion overlay */}
          <span
            className="absolute left-0 top-0 text-yellow-400 overflow-hidden"
            style={{
              width: displayRating >= star ? '100%' : displayRating >= star - 0.5 ? '50%' : '0%'
            }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

function RecipeComments({ recipeId }) {
  const { user, isApproved, isAdmin } = useAuth()
  const [ratings, setRatings] = useState({ average: 0, count: 0, ratings: [] })
  const [userRating, setUserRating] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentPhoto, setCommentPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isFirebaseEnabled()) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [recipeId, user])

  const loadData = async () => {
    try {
      const [ratingsData, commentsData] = await Promise.all([
        getRecipeRatings(recipeId),
        getRecipeComments(recipeId)
      ])
      setRatings(ratingsData)
      setComments(commentsData)

      if (user) {
        const myRating = await getUserRating(recipeId, user.uid)
        setUserRating(myRating)
      }
    } catch (err) {
      console.error('Error loading recipe data:', err)
    }
    setLoading(false)
  }

  const handleRate = async (rating) => {
    if (!user || !isApproved) return
    try {
      await rateRecipe(recipeId, user.uid, rating)
      setUserRating(rating)
      // Reload ratings to get updated average
      const ratingsData = await getRecipeRatings(recipeId)
      setRatings(ratingsData)
    } catch (err) {
      console.error('Error rating recipe:', err)
    }
  }

  const handleDeleteRating = async (oderId) => {
    if (!confirm('Delete this rating?')) return
    try {
      await deleteRating(recipeId, oderId)
      // Check if we deleted our own rating
      if (oderId === user?.uid) {
        setUserRating(null)
      }
      // Reload ratings
      const ratingsData = await getRecipeRatings(recipeId)
      setRatings(ratingsData)
    } catch (err) {
      console.error('Error deleting rating:', err)
    }
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

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 0.7)
        setCommentPhoto(compressed)
      } catch (err) {
        console.error('Error processing image:', err)
      }
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user || !isApproved || (!newComment.trim() && !commentPhoto)) return

    setSubmitting(true)
    try {
      await addRecipeComment(recipeId, user.uid, user.email, newComment.trim(), commentPhoto)
      setNewComment('')
      setCommentPhoto(null)
      // Reload comments
      const commentsData = await getRecipeComments(recipeId)
      setComments(commentsData)
    } catch (err) {
      console.error('Error adding comment:', err)
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await deleteRecipeComment(recipeId, commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  if (!isFirebaseEnabled()) return null

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ratings Section */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ratings & Reviews</h2>

        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {ratings.average.toFixed(1)}
            </div>
            <StarRating rating={Math.round(ratings.average)} size="sm" />
            <div className="text-sm text-gray-500 mt-1">
              {ratings.count} {ratings.count === 1 ? 'rating' : 'ratings'}
            </div>
          </div>

          {user && isApproved && (
            <div className="flex-1 border-l border-gray-200 pl-6">
              <p className="text-sm text-gray-600 mb-2">
                {userRating ? 'Your rating:' : 'Rate this recipe:'}
              </p>
              <StarRating
                rating={userRating || 0}
                onRate={handleRate}
                interactive={true}
                size="lg"
              />
            </div>
          )}
        </div>

        {!user && (
          <p className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
            Log in to rate and comment on recipes
          </p>
        )}

        {/* Admin: Manage Individual Ratings */}
        {isAdmin && ratings.ratings && ratings.ratings.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Manage Ratings (Admin)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ratings.ratings.map((r) => (
                <div key={r.oderId} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">{'★'.repeat(Math.floor(r.rating))}{r.rating % 1 ? '½' : ''}</span>
                    <span className="text-gray-500">{r.rating} stars</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">{r.oderId.substring(0, 8)}...</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRating(r.oderId)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        {user && isApproved && (
          <form onSubmit={handleSubmitComment} className="mb-6 pb-6 border-b border-gray-200">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts, modifications, or tips..."
              className="input min-h-[100px] mb-3"
            />

            {/* Photo Preview */}
            {commentPhoto && (
              <div className="relative inline-block mb-3">
                <img
                  src={commentPhoto}
                  alt="Upload preview"
                  className="max-h-40 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setCommentPhoto(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
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
                className="btn btn-secondary text-sm"
              >
                Add Photo
              </button>
              <button
                type="submit"
                disabled={submitting || (!newComment.trim() && !commentPhoto)}
                className="btn btn-primary text-sm"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  {comment.userPhoto ? (
                    <img
                      src={comment.userPhoto}
                      alt={comment.userName || comment.userEmail}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-medium">
                        {(comment.userName || comment.userEmail)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-gray-900">
                          {comment.userName || comment.userEmail}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {(user?.uid === comment.userId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {comment.comment && (
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    )}

                    {comment.photoURL && (
                      <img
                        src={comment.photoURL}
                        alt="Comment attachment"
                        className="mt-3 max-h-64 rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(comment.photoURL, '_blank')}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeComments
