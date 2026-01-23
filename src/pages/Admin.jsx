import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
  isFirebaseEnabled
} from '../firebase'

function Admin() {
  const navigate = useNavigate()
  const { user, loading, isAdmin } = useAuth()
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingRecipes, setPendingRecipes] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedRecipe, setExpandedRecipe] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user || !isAdmin) {
      navigate('/')
      return
    }

    loadAllPending()
  }, [user, loading, isAdmin, navigate])

  const loadAllPending = async () => {
    setLoadingData(true)
    try {
      const [users, recipes] = await Promise.all([
        getPendingUsers(),
        getPendingRecipes()
      ])
      setPendingUsers(users)
      setPendingRecipes(recipes)
    } catch (err) {
      console.error('Error loading pending data:', err)
    }
    setLoadingData(false)
  }

  const handleApproveUser = async (pendingUser) => {
    setActionLoading(prev => ({ ...prev, [`user-${pendingUser.uid}`]: 'approve' }))
    try {
      await approveUser(pendingUser.uid, pendingUser.email)
      setPendingUsers(prev => prev.filter(u => u.uid !== pendingUser.uid))
    } catch (err) {
      console.error('Error approving user:', err)
    }
    setActionLoading(prev => ({ ...prev, [`user-${pendingUser.uid}`]: null }))
  }

  const handleRejectUser = async (pendingUser) => {
    setActionLoading(prev => ({ ...prev, [`user-${pendingUser.uid}`]: 'reject' }))
    try {
      await rejectUser(pendingUser.uid)
      setPendingUsers(prev => prev.filter(u => u.uid !== pendingUser.uid))
    } catch (err) {
      console.error('Error rejecting user:', err)
    }
    setActionLoading(prev => ({ ...prev, [`user-${pendingUser.uid}`]: null }))
  }

  const handleApproveRecipe = async (recipe) => {
    setActionLoading(prev => ({ ...prev, [`recipe-${recipe.id}`]: 'approve' }))
    try {
      await approveRecipe(recipe.id, recipe)
      setPendingRecipes(prev => prev.filter(r => r.id !== recipe.id))
      setExpandedRecipe(null)
    } catch (err) {
      console.error('Error approving recipe:', err)
    }
    setActionLoading(prev => ({ ...prev, [`recipe-${recipe.id}`]: null }))
  }

  const handleRejectRecipe = async (recipe) => {
    setActionLoading(prev => ({ ...prev, [`recipe-${recipe.id}`]: 'reject' }))
    try {
      await rejectRecipe(recipe.id)
      setPendingRecipes(prev => prev.filter(r => r.id !== recipe.id))
      setExpandedRecipe(null)
    } catch (err) {
      console.error('Error rejecting recipe:', err)
    }
    setActionLoading(prev => ({ ...prev, [`recipe-${recipe.id}`]: null }))
  }

  if (!isFirebaseEnabled()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Admin panel requires Firebase configuration.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <button
          onClick={loadAllPending}
          className="btn btn-secondary text-sm"
          disabled={loadingData}
        >
          {loadingData ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Pending Users */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👤</span> Pending User Approvals
          {pendingUsers.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </h3>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-gray-500">No pending users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser.uid}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{pendingUser.email}</p>
                  <p className="text-sm text-gray-500">
                    Requested: {new Date(pendingUser.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveUser(pendingUser)}
                    disabled={actionLoading[`user-${pendingUser.uid}`]}
                    className="btn btn-primary text-sm px-4 py-2"
                  >
                    {actionLoading[`user-${pendingUser.uid}`] === 'approve' ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectUser(pendingUser)}
                    disabled={actionLoading[`user-${pendingUser.uid}`]}
                    className="btn btn-outline text-sm px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {actionLoading[`user-${pendingUser.uid}`] === 'reject' ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Recipes */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🍳</span> Pending Recipe Approvals
          {pendingRecipes.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingRecipes.length}
            </span>
          )}
        </h3>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : pendingRecipes.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-gray-500">No pending recipes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-50 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{recipe.name}</p>
                    <p className="text-sm text-gray-500">
                      by {recipe.submitterEmail} • {new Date(recipe.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">
                      {expandedRecipe === recipe.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="p-4 border-t border-gray-200 space-y-4">
                    <p className="text-gray-600">{recipe.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="bg-white p-2 rounded">
                        <span className="text-gray-500">Prep:</span> {recipe.prepTime}min
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="text-gray-500">Cook:</span> {recipe.cookTime}min
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="text-gray-500">Servings:</span> {recipe.servings}
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="text-gray-500">Difficulty:</span> {recipe.difficulty}
                      </div>
                    </div>

                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ingredients ({recipe.ingredients?.length || 0})</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {recipe.ingredients?.map((ing, i) => (
                          <li key={i}>
                            • {ing.amount} {ing.unit} {ing.name}
                            {ing.cost > 0 && <span className="text-gray-400"> (${ing.cost})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                      <ol className="text-sm text-gray-600 space-y-2">
                        {recipe.instructions?.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-medium text-primary-600">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveRecipe(recipe)}
                        disabled={actionLoading[`recipe-${recipe.id}`]}
                        className="btn btn-primary flex-1"
                      >
                        {actionLoading[`recipe-${recipe.id}`] === 'approve' ? 'Approving...' : 'Approve Recipe'}
                      </button>
                      <button
                        onClick={() => handleRejectRecipe(recipe)}
                        disabled={actionLoading[`recipe-${recipe.id}`]}
                        className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex-1"
                      >
                        {actionLoading[`recipe-${recipe.id}`] === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin Info</h3>
        <p className="text-blue-800 text-sm">
          You are logged in as the admin ({user?.email}). New users and recipe submissions
          will appear here for approval.
        </p>
      </div>
    </div>
  )
}

export default Admin
