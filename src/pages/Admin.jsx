import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPendingUsers, approveUser, rejectUser, isFirebaseEnabled } from '../firebase'

function Admin() {
  const navigate = useNavigate()
  const { user, loading, isAdmin } = useAuth()
  const [pendingUsers, setPendingUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    if (loading) return
    if (!user || !isAdmin) {
      navigate('/')
      return
    }

    loadPendingUsers()
  }, [user, loading, isAdmin, navigate])

  const loadPendingUsers = async () => {
    setLoadingUsers(true)
    try {
      const users = await getPendingUsers()
      setPendingUsers(users)
    } catch (err) {
      console.error('Error loading pending users:', err)
    }
    setLoadingUsers(false)
  }

  const handleApprove = async (pendingUser) => {
    setActionLoading(prev => ({ ...prev, [pendingUser.uid]: 'approve' }))
    try {
      await approveUser(pendingUser.uid, pendingUser.email)
      setPendingUsers(prev => prev.filter(u => u.uid !== pendingUser.uid))
    } catch (err) {
      console.error('Error approving user:', err)
    }
    setActionLoading(prev => ({ ...prev, [pendingUser.uid]: null }))
  }

  const handleReject = async (pendingUser) => {
    setActionLoading(prev => ({ ...prev, [pendingUser.uid]: 'reject' }))
    try {
      await rejectUser(pendingUser.uid)
      setPendingUsers(prev => prev.filter(u => u.uid !== pendingUser.uid))
    } catch (err) {
      console.error('Error rejecting user:', err)
    }
    setActionLoading(prev => ({ ...prev, [pendingUser.uid]: null }))
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
          onClick={loadPendingUsers}
          className="btn btn-secondary text-sm"
          disabled={loadingUsers}
        >
          {loadingUsers ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending User Approvals
        </h3>

        {loadingUsers ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading pending users...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-gray-500">No pending users to approve</p>
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
                    onClick={() => handleApprove(pendingUser)}
                    disabled={actionLoading[pendingUser.uid]}
                    className="btn btn-primary text-sm px-4 py-2"
                  >
                    {actionLoading[pendingUser.uid] === 'approve' ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(pendingUser)}
                    disabled={actionLoading[pendingUser.uid]}
                    className="btn btn-outline text-sm px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {actionLoading[pendingUser.uid] === 'reject' ? '...' : 'Reject'}
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
          You are logged in as the admin ({user?.email}). New users who sign up
          will appear here for approval. Once approved, they can access their
          grocery lists.
        </p>
      </div>
    </div>
  )
}

export default Admin
