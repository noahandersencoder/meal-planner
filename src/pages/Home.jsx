import { Link } from 'react-router-dom'
import useStore from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { isFirebaseEnabled } from '../firebase'

function Home() {
  const { mealPlan, getActiveList } = useStore()
  const { user } = useAuth()
  const totalRecipes = Object.values(mealPlan.recipes).flat().length
  const groceryList = getActiveList()?.items || []

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Plan Your Week
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Discover recipes, plan your meals, and generate a shopping list in minutes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/browse"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-4xl mb-3">🍳</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            Recipes
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Explore 50+ recipes with filters for time, budget, and diet
          </p>
        </Link>

        <Link
          to="/meal-plan"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            Meal Plan
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {totalRecipes > 0
              ? `${totalRecipes} meal${totalRecipes !== 1 ? 's' : ''} planned`
              : 'Start planning your week'}
          </p>
        </Link>

        <Link
          to="/grocery-list"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            Grocery List
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {groceryList.length > 0
              ? `${groceryList.length} item${groceryList.length !== 1 ? 's' : ''} to buy`
              : 'Generate from your meal plan'}
          </p>
        </Link>

        <Link
          to="/profile"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-4xl mb-3">👤</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            Profile
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {user ? 'My cooking, community & settings' : 'Log in to track your cooking'}
          </p>
        </Link>
      </div>

      <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100">
        <h3 className="font-semibold text-primary-900 mb-2">Quick Start</h3>
        <ol className="text-sm text-primary-800 space-y-2">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>Browse recipes and add to your meal plan</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>Generate your grocery list automatically</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>Shop with your checkable list (works offline!)</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>Track what you cook and share with the community</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default Home
