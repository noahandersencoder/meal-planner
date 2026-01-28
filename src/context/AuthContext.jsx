import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, isFirebaseEnabled, isAdmin, ADMIN_EMAIL, checkUserBanned } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isBanned, setIsBanned] = useState(false)

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // Check if user has been removed/banned by admin
        try {
          const banned = await checkUserBanned(user.uid)
          setIsBanned(banned)
        } catch (err) {
          console.error('Error checking ban status:', err)
          setIsBanned(false)
        }
      } else {
        setIsBanned(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const userIsAdmin = user ? isAdmin(user) : false

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isApproved: !!user && !isBanned,
      checkingApproval: false,
      isAdmin: userIsAdmin,
      isBanned
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
