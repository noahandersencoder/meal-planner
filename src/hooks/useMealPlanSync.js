import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'
import {
  isFirebaseEnabled,
  subscribeToUserMealPlan,
  setFullUserMealPlan,
} from '../firebase'

export default function useMealPlanSync() {
  const { user, loading: authLoading } = useAuth()
  const setMealPlanFromCloud = useStore((s) => s.setMealPlanFromCloud)

  useEffect(() => {
    if (authLoading) return
    if (!isFirebaseEnabled() || !user) return

    const unsubscribe = subscribeToUserMealPlan(user.uid, (data) => {
      if (!data) return

      // Old format: { mealPlan: { days, recipes }, updatedAt }
      // New format: { days, recipes }
      if (data.mealPlan) {
        const plan = data.mealPlan
        setMealPlanFromCloud(plan)
        // Migrate old format to new keyed format
        setFullUserMealPlan(user.uid, plan).catch(console.error)
        return
      }

      setMealPlanFromCloud(data)
    })

    return () => unsubscribe()
  }, [user, authLoading, setMealPlanFromCloud])
}
