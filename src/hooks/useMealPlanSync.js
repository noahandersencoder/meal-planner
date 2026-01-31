import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'
import {
  isFirebaseEnabled,
  saveUserMealPlan,
  loadUserMealPlan,
  subscribeToUserMealPlan,
} from '../firebase'

export default function useMealPlanSync() {
  const { user, loading: authLoading } = useAuth()
  const mealPlan = useStore((s) => s.mealPlan)
  const mealPlanUpdatedAt = useStore((s) => s.mealPlanUpdatedAt)
  const setMealPlanFromCloud = useStore((s) => s.setMealPlanFromCloud)

  const saveTimeout = useRef(null)
  const initialLoadDone = useRef(false)
  const isSaving = useRef(false)

  // Load meal plan from cloud on login
  useEffect(() => {
    if (authLoading) return
    if (!isFirebaseEnabled() || !user) {
      initialLoadDone.current = true
      return
    }

    loadUserMealPlan(user.uid)
      .then((data) => {
        if (data && data.mealPlan) {
          setMealPlanFromCloud(data.mealPlan, data.updatedAt || 0)
        }
        initialLoadDone.current = true
      })
      .catch((err) => {
        console.error('Failed to load meal plan:', err)
        initialLoadDone.current = true
      })
  }, [user, authLoading])

  // Subscribe to real-time meal plan updates from other devices
  useEffect(() => {
    if (!isFirebaseEnabled() || !user) return

    const unsubscribe = subscribeToUserMealPlan(user.uid, (data) => {
      if (!initialLoadDone.current) return
      // Skip updates that we just saved ourselves
      if (isSaving.current) return
      if (data && data.mealPlan) {
        setMealPlanFromCloud(data.mealPlan, data.updatedAt || 0)
      }
    })

    return () => unsubscribe()
  }, [user])

  // Sync local changes to cloud (debounced)
  useEffect(() => {
    if (!isFirebaseEnabled() || !user) return
    if (!initialLoadDone.current) return
    if (!mealPlanUpdatedAt) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      isSaving.current = true
      saveUserMealPlan(user.uid, { mealPlan })
        .catch((err) => console.error('Meal plan sync error:', err))
        .finally(() => {
          // Give Firebase subscription time to fire before we stop ignoring
          setTimeout(() => { isSaving.current = false }, 1000)
        })
    }, 500)

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [mealPlan, mealPlanUpdatedAt, user])
}
