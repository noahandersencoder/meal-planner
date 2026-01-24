import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import { useAuth } from '../context/AuthContext'
import { logOut, isFirebaseEnabled, getUserProfile } from '../firebase'

function Layout({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const [userProfile, setUserProfile] = useState(null)

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
          <Link to="/" className="text-xl font-bold text-primary-600">
            Meal Planner
          </Link>
          {isFirebaseEnabled() && !loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <Link
                        to="/generate"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <span>✨</span> Generate
                      </Link>
                      <Link
                        to="/admin"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Admin
                      </Link>
                    </>
                  )}
                  <Link to="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userProfile.displayName || user.email}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 text-sm font-medium">
                          {(userProfile?.displayName || user.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-600 hidden sm:block">
                      {userProfile?.displayName || user.email}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Log out
                  </button>
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
