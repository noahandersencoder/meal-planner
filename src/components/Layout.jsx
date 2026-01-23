import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import { useAuth } from '../context/AuthContext'
import { logOut, isFirebaseEnabled } from '../firebase'

function Layout({ children }) {
  const { user, loading, isAdmin } = useAuth()

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
                    <Link
                      to="/admin"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.email}
                  </span>
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
