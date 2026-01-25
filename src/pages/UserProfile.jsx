import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getUserProfile,
  getCookingHistory,
  isFollowing,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFirebaseEnabled
} from '../firebase'
import recipes from '../data/recipes.json'

function UserProfile() {
  const { oderId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const isOwnProfile = user?.uid === oderId

  useEffect(() => {
    if (isFirebaseEnabled() && oderId) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [oderId, user])

  const loadProfile = async () => {
    try {
      const [profileData, historyData, followers, followingList] = await Promise.all([
        getUserProfile(oderId),
        getCookingHistory(oderId),
        getFollowers(oderId),
        getFollowing(oderId)
      ])

      setProfile(profileData)
      setHistory(historyData)
      setFollowerCount(followers.length)
      setFollowingCount(followingList.length)

      // Check if current user is following this profile
      if (user && user.uid !== oderId) {
        const isFollowingUser = await isFollowing(user.uid, oderId)
        setFollowing(isFollowingUser)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
    setLoading(false)
  }

  const handleFollow = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      if (following) {
        await unfollowUser(user.uid, oderId)
        setFollowing(false)
        setFollowerCount(c => c - 1)
      } else {
        await followUser(user.uid, oderId)
        setFollowing(true)
        setFollowerCount(c => c + 1)
      }
    } catch (err) {
      console.error('Error updating follow status:', err)
    }
    setActionLoading(false)
  }

  const getRecipeDetails = (recipeId) => {
    const staticRecipe = recipes.find(r => r.id === recipeId)
    return staticRecipe || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link to="/community" className="btn btn-primary mt-4">
          Back to Community
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName || 'User'}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-3xl text-primary-600 font-medium">
                {(profile.displayName || profile.email)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.displayName || profile.email}
            </h1>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span><strong className="text-gray-900">{history.length}</strong> recipes made</span>
              <span><strong className="text-gray-900">{followerCount}</strong> followers</span>
              <span><strong className="text-gray-900">{followingCount}</strong> following</span>
            </div>

            {!isOwnProfile && user && (
              <button
                onClick={handleFollow}
                disabled={actionLoading}
                className={`mt-3 text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                  following
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {actionLoading ? '...' : following ? 'Following' : 'Follow'}
              </button>
            )}

            {isOwnProfile && (
              <Link
                to="/settings"
                className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Cooking History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isOwnProfile ? 'My Cooking History' : `${profile.displayName || 'User'}'s Cooking History`}
        </h2>

        {history.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">
            {isOwnProfile
              ? "You haven't logged any recipes yet. Click 'I Made This' on recipes you cook!"
              : "This user hasn't logged any recipes yet."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((entry) => {
              const recipe = getRecipeDetails(entry.recipeId)

              return (
                <Link
                  key={entry.id}
                  to={`/recipe/${entry.recipeId}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Photo or Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                    {entry.photos?.[0] || entry.recipePhotoURL || recipe?.photoURL ? (
                      <img
                        src={entry.photos?.[0] || entry.recipePhotoURL || recipe?.photoURL}
                        alt={entry.recipeName || recipe?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl opacity-50">🍽️</span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {entry.recipeName || recipe?.name || 'Unknown Recipe'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
