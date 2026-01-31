import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navigation from './Navigation'
import { useAuth } from '../context/AuthContext'
import { logOut, isFirebaseEnabled, getUserProfile } from '../firebase'
import useMealPlanSync from '../hooks/useMealPlanSync'

function Layout({ children }) {
  const { user, loading, isAdmin, isApproved } = useAuth()
  useMealPlanSync()
  const [userProfile, setUserProfile] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Pages where we should show a back button
  const mainPages = ['/', '/browse', '/meal-plan', '/grocery-list', '/community', '/profile']
  const showBackButton = !mainPages.includes(location.pathname)

  useEffect(() => {
    if (user && isFirebaseEnabled()) {
      getUserProfile(user.uid).then(setUserProfile).catch(console.error)
    } else {
      setUserProfile(null)
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <Link to="/" className="text-xl font-bold text-primary-600">
              Meal Planner
            </Link>
          </div>
          {isFirebaseEnabled() && !loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Log out
                  </button>
                  <Link to="/profile" className="flex-shrink-0">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary-200 hover:border-primary-400 transition-colors"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200 hover:border-primary-400 transition-colors">
                        <span className="text-primary-600 text-sm font-medium">
                          {user.email?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <Navigation />
    </div>
  )
}

export default Layout
