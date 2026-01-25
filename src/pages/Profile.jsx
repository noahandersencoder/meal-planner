import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getUserProfile,
  getCookingHistory,
  getFollowers,
  getFollowing,
  isFirebaseEnabled
} from '../firebase'

function Profile() {
  const { user, isApproved } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ recipes: 0, followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && isFirebaseEnabled()) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const [profileData, history, followers, following] = await Promise.all([
        getUserProfile(user.uid),
        getCookingHistory(user.uid),
        getFollowers(user.uid),
        getFollowing(user.uid)
      ])

      setProfile(profileData)
      setStats({
        recipes: history.length,
        followers: followers.length,
        following: following.length
      })
    } catch (err) {
      console.error('Error loading profile:', err)
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not logged in</h3>
          <p className="text-gray-500 mb-4">Log in to track your cooking and connect with others</p>
          <Link to="/login" className="btn btn-primary">Log In</Link>
        </div>
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

  const menuItems = [
    {
      to: '/my-cooking',
      icon: '👨‍🍳',
      label: 'My Cooking',
      description: 'View your cooking history',
      show: isApproved
    },
    {
      to: '/community',
      icon: '👥',
      label: 'Community',
      description: 'See what others are cooking',
      show: true
    },
    {
      to: '/generate',
      icon: '✨',
      label: 'Generate Recipe',
      description: 'Create a new AI recipe',
      show: isApproved
    },
    {
      to: '/submit-recipe',
      icon: '📝',
      label: 'Submit Recipe',
      description: 'Share your own recipe',
      show: isApproved
    },
    {
      to: '/settings',
      icon: '⚙️',
      label: 'Settings',
      description: 'Profile & preferences',
      show: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName || user.email}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-3xl text-primary-600 font-medium">
                {(profile?.displayName || user.email)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.displayName || user.email}
            </h1>
            <p className="text-gray-500 text-sm">{user.email}</p>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <Link to="/my-cooking" className="hover:text-primary-600">
                <strong className="text-gray-900">{stats.recipes}</strong>
                <span className="text-gray-500"> recipes</span>
              </Link>
              <span>
                <strong className="text-gray-900">{stats.followers}</strong>
                <span className="text-gray-500"> followers</span>
              </span>
              <span>
                <strong className="text-gray-900">{stats.following}</strong>
                <span className="text-gray-500"> following</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.filter(item => item.show).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Profile
