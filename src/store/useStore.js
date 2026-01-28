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

      // Multiple Grocery Lists
      groceryLists: {},
      activeListId: null,

      // Helper to get/create default list
      ensureActiveList: () => {
        const { groceryLists, activeListId } = get()
        if (activeListId && groceryLists[activeListId]) {
          return activeListId
        }
        // Create default list if none exists
        const defaultId = 'default-list'
        if (!groceryLists[defaultId]) {
          set({
            groceryLists: {
              ...groceryLists,
              [defaultId]: {
                id: defaultId,
                name: 'My Grocery List',
                items: [],
                checkedItems: {},
                createdAt: Date.now()
              }
            },
            activeListId: defaultId
          })
        } else {
          set({ activeListId: defaultId })
        }
        return defaultId
      },

      createGroceryList: (name) => {
        const id = `list-${Date.now()}`
        set((state) => ({
          groceryLists: {
            ...state.groceryLists,
            [id]: {
              id,
              name: name || 'New List',
              items: [],
              checkedItems: {},
              createdAt: Date.now()
            }
          },
          activeListId: id
        }))
        return id
      },

      deleteGroceryList: (listId) =>
        set((state) => {
          const { [listId]: deleted, ...remaining } = state.groceryLists
          const remainingIds = Object.keys(remaining)
          return {
            groceryLists: remaining,
            activeListId: remainingIds.length > 0 ? remainingIds[0] : null
          }
        }),

      renameGroceryList: (listId, newName) =>
        set((state) => ({
          groceryLists: {
            ...state.groceryLists,
            [listId]: {
              ...state.groceryLists[listId],
              name: newName
            }
          }
        })),

      setActiveList: (listId) => set({ activeListId: listId }),

      getActiveList: () => {
        const { groceryLists, activeListId, ensureActiveList } = get()
        const id = activeListId || ensureActiveList()
        return groceryLists[id] || { items: [], checkedItems: {} }
      },

      generateGroceryList: () => {
        const { getAllMealPlanRecipes, groceryLists, ensureActiveList } = get()
        const listId = ensureActiveList()
        const recipes = getAllMealPlanRecipes()
        const ingredientMap = new Map()

        // Track recipe names for display
        const sourceRecipes = recipes.map(r => r.name)

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

        const items = Array.from(ingredientMap.values()).sort((a, b) => {
          const categoryOrder = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'baking', 'frozen', 'snacks', 'breakfast', 'drinks', 'other']
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
        })

        set({
          groceryLists: {
            ...groceryLists,
            [listId]: {
              ...groceryLists[listId],
              items,
              checkedItems: {}, // Clear all checkmarks when regenerating
              sourceRecipes, // Store which recipes this list was generated from
              generatedAt: Date.now()
            }
          }
        })
      },

      addItemToGroceryList: (item) => {
        // First ensure we have an active list (this must happen outside set())
        const { activeListId, groceryLists } = get()
        let listId = activeListId

        // If no active list, create one
        if (!listId || !groceryLists[listId]) {
          const defaultId = 'default-list'
          if (!groceryLists[defaultId]) {
            set({
              groceryLists: {
                ...groceryLists,
                [defaultId]: {
                  id: defaultId,
                  name: 'My Grocery List',
                  items: [],
                  checkedItems: {},
                  createdAt: Date.now()
                }
              },
              activeListId: defaultId
            })
          } else {
            set({ activeListId: defaultId })
          }
          listId = defaultId
        }

        // Now add the item
        set((state) => {
          const list = state.groceryLists[listId]
          if (!list) return state

          const key = `${item.name.toLowerCase()}-${item.unit}`
          const existingIndex = list.items.findIndex(i => i.id === key)

          let newItems
          if (existingIndex >= 0) {
            newItems = [...list.items]
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              amount: newItems[existingIndex].amount + item.amount,
              cost: newItems[existingIndex].cost + (item.cost || 0)
            }
          } else {
            const newItem = {
              id: key,
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              cost: item.cost || 0,
              category: item.category || 'other',
            }
            const categoryOrder = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'baking', 'frozen', 'snacks', 'breakfast', 'drinks', 'other']
            newItems = [...list.items, newItem].sort((a, b) => {
              return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
            })
          }

          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: { ...list, items: newItems }
            }
          }
        })
      },

      removeItemFromGroceryList: (itemId) =>
        set((state) => {
          const listId = state.activeListId
          const list = state.groceryLists[listId]
          if (!list) return state

          const { [itemId]: removed, ...remainingChecked } = list.checkedItems || {}
          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: {
                ...list,
                items: list.items.filter(item => item.id !== itemId),
                checkedItems: remainingChecked
              }
            }
          }
        }),

      toggleGroceryItem: (itemId) =>
        set((state) => {
          const listId = state.activeListId
          const list = state.groceryLists[listId]
          if (!list) return state

          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: {
                ...list,
                checkedItems: {
                  ...list.checkedItems,
                  [itemId]: !list.checkedItems?.[itemId]
                }
              }
            }
          }
        }),

      clearCheckedItems: () =>
        set((state) => {
          const listId = state.activeListId
          const list = state.groceryLists[listId]
          if (!list) return state

          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: { ...list, checkedItems: {} }
            }
          }
        }),

      clearGroceryList: () =>
        set((state) => {
          const listId = state.activeListId
          const list = state.groceryLists[listId]
          if (!list) return state

          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: { ...list, items: [], checkedItems: {} }
            }
          }
        }),

      getGroceryListTotal: () => {
        const list = get().getActiveList()
        return (list.items || []).reduce((sum, item) => sum + item.cost, 0)
      },

      // Shared list functionality
      sharedListId: null,
      setSharedListId: (id) => set({ sharedListId: id }),

      // Set grocery lists from cloud (for sync)
      setGroceryListsFromCloud: (groceryLists, activeListId) =>
        set({ groceryLists: groceryLists || {}, activeListId }),

      // Legacy: Set single list from cloud (backwards compatible)
      setGroceryListFromCloud: (groceryList, checkedItems) =>
        set((state) => {
          const listId = state.activeListId || 'default-list'
          return {
            groceryLists: {
              ...state.groceryLists,
              [listId]: {
                id: listId,
                name: state.groceryLists[listId]?.name || 'My Grocery List',
                items: groceryList || [],
                checkedItems: checkedItems || {},
                createdAt: state.groceryLists[listId]?.createdAt || Date.now()
              }
            },
            activeListId: listId
          }
        }),
    }),
    {
      name: 'meal-planner-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        mealPlan: state.mealPlan,
        groceryLists: state.groceryLists,
        activeListId: state.activeListId,
        sharedListId: state.sharedListId,
        recipeViewMode: state.recipeViewMode,
      }),
    }
  )
)

export default useStore
