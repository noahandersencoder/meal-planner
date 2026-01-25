import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getAllUsers,
  getFollowing,
  getFollowingActivity,
  followUser,
  unfollowUser,
  isFirebaseEnabled
} from '../firebase'
import recipes from '../data/recipes.json'

function Community() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('activity')
  const [users, setUsers] = useState([])
  const [following, setFollowing] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState(new Set())

  useEffect(() => {
    if (isFirebaseEnabled()) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    try {
      const [allUsers, followingList, activityFeed] = await Promise.all([
        getAllUsers(),
        user ? getFollowing(user.uid) : [],
        user ? getFollowingActivity(user.uid, 30) : []
      ])

      // Filter out current user from users list
      setUsers(allUsers.filter(u => u.oderId !== user?.uid))
      setFollowing(followingList)
      setFollowingIds(new Set(followingList.map(f => f.oderId)))
      setActivity(activityFeed)
    } catch (err) {
      console.error('Error loading community data:', err)
    }
    setLoading(false)
  }

  const handleFollow = async (targetUserId) => {
    if (!user) return

    const isCurrentlyFollowing = followingIds.has(targetUserId)

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(user.uid, targetUserId)
        setFollowingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(targetUserId)
          return newSet
        })
      } else {
        await followUser(user.uid, targetUserId)
        setFollowingIds(prev => new Set([...prev, targetUserId]))
      }
    } catch (err) {
      console.error('Error updating follow status:', err)
    }
  }

  const getRecipeDetails = (recipeId) => {
    return recipes.find(r => r.id === recipeId) || null
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Community</h2>
        <p className="text-gray-500 text-sm">Connect with other cooks and see what they're making</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'discover'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Discover People
        </button>
      </div>

      {/* Activity Feed Tab */}
      {activeTab === 'activity' && (
        <div>
          {!user ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500 mb-4">Log in to see what people you follow are cooking</p>
              <Link to="/login" className="btn btn-primary">Log In</Link>
            </div>
          ) : activity.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-500 mb-4">
                Follow other cooks to see what they're making!
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="btn btn-primary"
              >
                Discover People
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((entry) => {
                const recipe = getRecipeDetails(entry.recipeId)

                return (
                  <div key={`${entry.oderId}-${entry.id}`} className="card p-4">
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <Link to={`/user/${entry.oderId}`}>
                        {entry.userPhoto ? (
                          <img
                            src={entry.userPhoto}
                            alt={entry.userName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {entry.userName?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <Link
                            to={`/user/${entry.oderId}`}
                            className="font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {entry.userName}
                          </Link>
                          <span className="text-gray-500"> made </span>
                          <Link
                            to={`/recipe/${entry.recipeId}`}
                            className="font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {entry.recipeName || recipe?.name || 'a recipe'}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>

                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            "{entry.notes}"
                          </p>
                        )}

                        {/* Photos */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {entry.photos.slice(0, 3).map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            ))}
                            {entry.photos.length > 3 && (
                              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                +{entry.photos.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Discover People Tab */}
      {activeTab === 'discover' && (
        <div>
          {users.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No other users yet. Be the first to invite friends!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((profile) => (
                <div key={profile.oderId} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Link to={`/user/${profile.oderId}`}>
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt={profile.displayName || profile.email}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {(profile.displayName || profile.email)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${profile.oderId}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {profile.displayName || profile.email}
                      </Link>
                    </div>

                    {user && (
                      <button
                        onClick={() => handleFollow(profile.oderId)}
                        className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
                          followingIds.has(profile.oderId)
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {followingIds.has(profile.oderId) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Community
