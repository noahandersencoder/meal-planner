import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // User Preferences
      preferences: {
        maxCookTime: 60,
        dietaryRestrictions: [],
        budgetLevel: 2,
        servings: 4,
      },

      // View preferences
      recipeViewMode: 'grid', // 'grid' or 'list'
      setRecipeViewMode: (mode) => set({ recipeViewMode: mode }),

      setPreferences: (newPrefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPrefs },
        })),

      // Meal Plan
      mealPlan: {
        days: 7,
        recipes: {},
      },

      setMealPlanDays: (days) =>
        set((state) => ({
          mealPlan: { ...state.mealPlan, days },
        })),

      addRecipeToDay: (day, recipe) =>
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            recipes: {
              ...state.mealPlan.recipes,
              [day]: [...(state.mealPlan.recipes[day] || []), recipe],
            },
          },
        })),

      removeRecipeFromDay: (day, recipeId) =>
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            recipes: {
              ...state.mealPlan.recipes,
              [day]: (state.mealPlan.recipes[day] || []).filter(
                (r) => r.id !== recipeId
              ),
            },
          },
        })),

      clearMealPlan: () =>
        set((state) => ({
          mealPlan: { ...state.mealPlan, recipes: {} },
        })),

      getAllMealPlanRecipes: () => {
        const { mealPlan } = get()
        return Object.values(mealPlan.recipes).flat()
      },

      getMealPlanTotalCost: () => {
        const recipes = get().getAllMealPlanRecipes()
        return recipes.reduce((total, recipe) => {
          const recipeCost = recipe.ingredients.reduce(
            (sum, ing) => sum + (ing.cost || 0),
            0
          )
          return total + recipeCost
        }, 0)
      },

      // Grocery List
      groceryList: [],
      checkedItems: {},

      generateGroceryList: () => {
        const recipes = get().getAllMealPlanRecipes()
        const ingredientMap = new Map()

        recipes.forEach((recipe) => {
          recipe.ingredients.forEach((ing) => {
            const key = `${ing.name.toLowerCase()}-${ing.unit}`
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)
              existing.amount += ing.amount
              existing.cost += ing.cost || 0
            } else {
              ingredientMap.set(key, {
                id: key,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                cost: ing.cost || 0,
                category: ing.category,
              })
            }
          })
        })

        const groceryList = Array.from(ingredientMap.values()).sort((a, b) => {
          const categoryOrder = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'frozen', 'other']
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        })

        set({ groceryList })
      },

      toggleGroceryItem: (itemId) =>
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [itemId]: !state.checkedItems[itemId],
          },
        })),

      clearCheckedItems: () => set({ checkedItems: {} }),

      clearGroceryList: () => set({ groceryList: [], checkedItems: {} }),

      getGroceryListTotal: () => {
        const { groceryList } = get()
        return groceryList.reduce((sum, item) => sum + item.cost, 0)
      },

      // Shared list functionality
      sharedListId: null,
      setSharedListId: (id) => set({ sharedListId: id }),

      // Set grocery list from cloud
      setGroceryListFromCloud: (groceryList, checkedItems) =>
        set({ groceryList, checkedItems: checkedItems || {} }),
    }),
    {
      name: 'meal-planner-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        mealPlan: state.mealPlan,
        groceryList: state.groceryList,
        checkedItems: state.checkedItems,
        sharedListId: state.sharedListId,
        recipeViewMode: state.recipeViewMode,
      }),
    }
  )
)

export default useStore
