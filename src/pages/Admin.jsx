import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
  isFirebaseEnabled,
  getApprovedRecipes,
  updatePendingRecipe,
  updateApprovedRecipe,
  deleteApprovedRecipe,
  getAllUsers,
  banUser,
  unbanUser,
  checkUserBanned,
  ADMIN_EMAIL
} from '../firebase'
import RecipeEditModal from '../components/RecipeEditModal'

function Admin() {
  const navigate = useNavigate()
  const { user, loading, isAdmin } = useAuth()
  const [allUsers, setAllUsers] = useState([])
  const [bannedUserIds, setBannedUserIds] = useState(new Set())
  const [pendingRecipes, setPendingRecipes] = useState([])
  const [approvedRecipes, setApprovedRecipes] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedRecipe, setExpandedRecipe] = useState(null)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [editingType, setEditingType] = useState(null) // 'pending' or 'approved'
  const [savingEdit, setSavingEdit] = useState(false)

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
      const [users, pending, approved] = await Promise.all([
        getAllUsers(),
        getPendingRecipes(),
        getApprovedRecipes()
      ])
      // Filter out admin from user list
      setAllUsers(users.filter(u => u.email !== ADMIN_EMAIL))

      // Check ban status for each user
      const banChecks = await Promise.all(
        users.map(async (u) => {
          const banned = await checkUserBanned(u.oderId)
          return banned ? u.oderId : null
        })
      )
      setBannedUserIds(new Set(banChecks.filter(Boolean)))

      setPendingRecipes(pending)
      setApprovedRecipes(approved)
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoadingData(false)
  }

  const handleBanUser = async (userProfile) => {
    if (!confirm(`Remove "${userProfile.displayName || userProfile.email}"? They will lose access to all features.`)) return
    setActionLoading(prev => ({ ...prev, [`user-${userProfile.oderId}`]: 'ban' }))
    try {
      await banUser(userProfile.oderId, userProfile.email)
      setBannedUserIds(prev => new Set([...prev, userProfile.oderId]))
    } catch (err) {
      console.error('Error banning user:', err)
    }
    setActionLoading(prev => ({ ...prev, [`user-${userProfile.oderId}`]: null }))
  }

  const handleUnbanUser = async (userProfile) => {
    setActionLoading(prev => ({ ...prev, [`user-${userProfile.oderId}`]: 'unban' }))
    try {
      await unbanUser(userProfile.oderId)
      setBannedUserIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userProfile.oderId)
        return newSet
      })
    } catch (err) {
      console.error('Error unbanning user:', err)
    }
    setActionLoading(prev => ({ ...prev, [`user-${userProfile.oderId}`]: null }))
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

  const handleEditRecipe = (recipe, type) => {
    setEditingRecipe(recipe)
    setEditingType(type)
  }

  const handleSaveEdit = async (updatedRecipe) => {
    setSavingEdit(true)
    try {
      if (editingType === 'pending') {
        await updatePendingRecipe(updatedRecipe.id, updatedRecipe)
        setPendingRecipes(prev =>
          prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        )
      } else {
        await updateApprovedRecipe(updatedRecipe.id, updatedRecipe)
        setApprovedRecipes(prev =>
          prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)
        )
      }
      setEditingRecipe(null)
      setEditingType(null)
    } catch (err) {
      console.error('Error saving recipe:', err)
      alert('Failed to save recipe. Please try again.')
    }
    setSavingEdit(false)
  }

  const handleDeleteRecipe = async (recipe) => {
    if (!confirm(`Are you sure you want to delete "${recipe.name}"? This cannot be undone.`)) {
      return
    }
    setActionLoading(prev => ({ ...prev, [`delete-${recipe.id}`]: true }))
    try {
      await deleteApprovedRecipe(recipe.id)
      setApprovedRecipes(prev => prev.filter(r => r.id !== recipe.id))
    } catch (err) {
      console.error('Error deleting recipe:', err)
      alert('Failed to delete recipe. Please try again.')
    }
    setActionLoading(prev => ({ ...prev, [`delete-${recipe.id}`]: null }))
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

      {/* Manage Users */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👤</span> Manage Users
          <span className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">
            {allUsers.length}
          </span>
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Remove users who violate guidelines. Removed users lose access to all features.
        </p>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No users yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allUsers.map((userProfile) => {
              const isBanned = bannedUserIds.has(userProfile.oderId)
              return (
                <div
                  key={userProfile.oderId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isBanned ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {userProfile.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium">
                          {(userProfile.displayName || userProfile.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isBanned ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                        {userProfile.displayName || userProfile.email}
                      </p>
                      {userProfile.displayName && (
                        <p className="text-xs text-gray-500">{userProfile.email}</p>
                      )}
                      {isBanned && (
                        <p className="text-xs text-red-600 font-medium">Removed</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(userProfile)}
                        disabled={actionLoading[`user-${userProfile.oderId}`]}
                        className="btn btn-secondary text-sm px-3 py-1"
                      >
                        {actionLoading[`user-${userProfile.oderId}`] === 'unban' ? '...' : 'Restore'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(userProfile)}
                        disabled={actionLoading[`user-${userProfile.oderId}`]}
                        className="btn btn-outline text-sm px-3 py-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {actionLoading[`user-${userProfile.oderId}`] === 'ban' ? '...' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
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
                        onClick={() => handleEditRecipe(recipe, 'pending')}
                        className="btn btn-secondary flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleApproveRecipe(recipe)}
                        disabled={actionLoading[`recipe-${recipe.id}`]}
                        className="btn btn-primary flex-1"
                      >
                        {actionLoading[`recipe-${recipe.id}`] === 'approve' ? 'Approving...' : 'Approve'}
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

      {/* Approved Recipes (for editing) */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>✅</span> Approved User Recipes
          {approvedRecipes.length > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {approvedRecipes.length}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Edit approved recipes to standardize ingredients and costs.
        </p>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : approvedRecipes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No approved user recipes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approvedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{recipe.name}</p>
                  <p className="text-sm text-gray-500">
                    by {recipe.submitterEmail} • {recipe.ingredients?.length || 0} ingredients
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRecipe(recipe, 'approved')}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe)}
                    disabled={actionLoading[`delete-${recipe.id}`]}
                    className="btn btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {actionLoading[`delete-${recipe.id}`] ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin Info</h3>
        <p className="text-blue-800 text-sm">
          You are logged in as the admin ({user?.email}). Recipe submissions
          will appear here for approval. You can remove users who violate guidelines.
        </p>
      </div>

      {/* Edit Modal */}
      {editingRecipe && (
        <RecipeEditModal
          recipe={editingRecipe}
          onSave={handleSaveEdit}
          onClose={() => {
            setEditingRecipe(null)
            setEditingType(null)
          }}
          saving={savingEdit}
        />
      )}
    </div>
  )
}

export default Admin
