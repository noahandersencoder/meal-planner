import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addReview,
  getRecipeReviews,
  getUserReview,
  deleteReview,
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
  const [reviewData, setReviewData] = useState({ reviews: [], average: 0, count: 0 })
  const [userReview, setUserReview] = useState(null)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
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
      const data = await getRecipeReviews(recipeId)
      setReviewData(data)

      if (user) {
        const myReview = await getUserReview(recipeId, user.uid)
        setUserReview(myReview)
        if (myReview) {
          setNewRating(myReview.rating)
          setNewComment(myReview.comment || '')
        }
      }
    } catch (err) {
      console.error('Error loading reviews:', err)
    }
    setLoading(false)
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
        setReviewPhoto(compressed)
      } catch (err) {
        console.error('Error processing image:', err)
      }
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user || !isApproved || newRating === 0) return

    setSubmitting(true)
    try {
      await addReview(
        recipeId,
        user.uid,
        user.email,
        newRating,
        newComment.trim(),
        reviewPhoto || userReview?.photoURL
      )

      // Reload data
      const data = await getRecipeReviews(recipeId)
      setReviewData(data)

      const myReview = await getUserReview(recipeId, user.uid)
      setUserReview(myReview)

      setIsEditing(false)
      setReviewPhoto(null)
    } catch (err) {
      console.error('Error submitting review:', err)
    }
    setSubmitting(false)
  }

  const handleDeleteReview = async (oderId) => {
    if (!confirm('Delete this review?')) return
    try {
      await deleteReview(recipeId, oderId)

      // If deleting own review, clear state
      if (oderId === user?.uid) {
        setUserReview(null)
        setNewRating(0)
        setNewComment('')
      }

      // Reload data
      const data = await getRecipeReviews(recipeId)
      setReviewData(data)
    } catch (err) {
      console.error('Error deleting review:', err)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
    if (userReview) {
      setNewRating(userReview.rating)
      setNewComment(userReview.comment || '')
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    if (userReview) {
      setNewRating(userReview.rating)
      setNewComment(userReview.comment || '')
    } else {
      setNewRating(0)
      setNewComment('')
    }
    setReviewPhoto(null)
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

  const showReviewForm = user && isApproved && (!userReview || isEditing)

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>

      {/* Rating Summary */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {reviewData.average.toFixed(1)}
          </div>
          <StarRating rating={reviewData.average} size="sm" />
          <div className="text-sm text-gray-500 mt-1">
            {reviewData.count} {reviewData.count === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {user && isApproved && userReview && !isEditing && (
          <div className="flex-1 border-l border-gray-200 pl-6">
            <p className="text-sm text-gray-600 mb-1">Your review:</p>
            <div className="flex items-center gap-2">
              <StarRating rating={userReview.rating} size="sm" />
              <span className="text-sm text-gray-500">({userReview.rating} stars)</span>
            </div>
            <button
              onClick={startEditing}
              className="text-sm text-primary-600 hover:text-primary-700 mt-2"
            >
              Edit your review
            </button>
          </div>
        )}
      </div>

      {/* Write/Edit Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>

          {/* Star Rating */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Your rating: *</p>
            <StarRating
              rating={newRating}
              onRate={setNewRating}
              interactive={true}
              size="lg"
            />
            {newRating > 0 && (
              <p className="text-sm text-gray-500 mt-1">{newRating} stars</p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Your review:</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this recipe... What did you like? Any tips or modifications?"
              className="input min-h-[100px]"
            />
          </div>

          {/* Photo Preview */}
          {(reviewPhoto || (userReview?.photoURL && !reviewPhoto)) && (
            <div className="relative inline-block mb-4">
              <img
                src={reviewPhoto || userReview?.photoURL}
                alt="Review photo"
                className="max-h-40 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setReviewPhoto('REMOVE')}
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
              {reviewPhoto || userReview?.photoURL ? 'Change Photo' : 'Add Photo'}
            </button>
            <button
              type="submit"
              disabled={submitting || newRating === 0}
              className="btn btn-primary text-sm"
            >
              {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEditing}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg mb-6">
          Log in to write a review
        </p>
      )}

      {/* Reviews List */}
      {reviewData.reviews.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-4">
          {reviewData.reviews.map((review) => (
            <div key={review.userId} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                {review.userPhoto ? (
                  <img
                    src={review.userPhoto}
                    alt={review.userName || review.userEmail}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-medium">
                      {(review.userName || review.userEmail)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        {review.userName || review.userEmail}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {(user?.uid === review.userId || isAdmin) && (
                      <button
                        onClick={() => handleDeleteReview(review.userId)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-sm text-gray-500">({review.rating})</span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}

                  {/* Photo */}
                  {review.photoURL && review.photoURL !== 'REMOVE' && (
                    <img
                      src={review.photoURL}
                      alt="Review photo"
                      className="mt-3 max-h-64 rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => window.open(review.photoURL, '_blank')}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecipeComments
