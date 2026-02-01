import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'
import {
  isFirebaseEnabled,
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
  clearUserMealPlanRecipes,
  setUserMealPlanDays,
  setFullUserMealPlan,
} from '../firebase'

export default function useMealPlan() {
  const { user } = useAuth()

  const addRecipeToDay = useStore((s) => s.addRecipeToDay)
  const removeRecipeFromDay = useStore((s) => s.removeRecipeFromDay)
  const clearMealPlanStore = useStore((s) => s.clearMealPlan)
  const setMealPlanDaysStore = useStore((s) => s.setMealPlanDays)
  const setMealPlanStore = useStore((s) => s.setMealPlan)

  const addRecipe = (day, recipe) => {
    addRecipeToDay(day, recipe)
    if (isFirebaseEnabled() && user) {
      addRecipeToMealPlan(user.uid, day, recipe).catch(console.error)
    }
  }

  const removeRecipe = (day, recipeId) => {
    removeRecipeFromDay(day, recipeId)
    if (isFirebaseEnabled() && user) {
      removeRecipeFromMealPlan(user.uid, day, recipeId).catch(console.error)
    }
  }

  const clearPlan = () => {
    clearMealPlanStore()
    if (isFirebaseEnabled() && user) {
      clearUserMealPlanRecipes(user.uid).catch(console.error)
    }
  }

  const setDays = (days) => {
    setMealPlanDaysStore(days)
    if (isFirebaseEnabled() && user) {
      setUserMealPlanDays(user.uid, days).catch(console.error)
    }
  }

  const setFullPlan = (plan) => {
    setMealPlanStore(plan)
    if (isFirebaseEnabled() && user) {
      setFullUserMealPlan(user.uid, plan).catch(console.error)
    }
  }

  return { addRecipe, removeRecipe, clearPlan, setDays, setFullPlan }
}
