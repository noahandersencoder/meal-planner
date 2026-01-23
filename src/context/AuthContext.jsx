import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, isFirebaseEnabled, checkUserApproved, checkUserApprovedByEmail, isAdmin, ADMIN_EMAIL } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(false)
  const [checkingApproval, setCheckingApproval] = useState(true)

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false)
      setCheckingApproval(false)
      return
    }

    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // Admin is always approved
        if (user.email === ADMIN_EMAIL) {
          setIsApproved(true)
          setCheckingApproval(false)
          return
        }

        // Check if user is approved (by uid or by email for legacy users)
        setCheckingApproval(true)
        try {
          let approved = await checkUserApproved(user.uid)
          if (!approved) {
            // Check by email for legacy users
            approved = await checkUserApprovedByEmail(user.email)
          }
          setIsApproved(approved)
        } catch (err) {
          console.error('Error checking approval:', err)
          setIsApproved(false)
        }
        setCheckingApproval(false)
      } else {
        setIsApproved(false)
        setCheckingApproval(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const userIsAdmin = user ? isAdmin(user) : false

  return (
    <AuthContext.Provider value={{ user, loading, isApproved, checkingApproval, isAdmin: userIsAdmin }}>
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
