import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  getAdminUsers,
  banUser,
  unbanUser,
  deleteAdminUser,
} from '../../../services/adminService'

import styles from '../AdminDashboard.module.css'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleBanToggle = async (user) => {
    try {
      if (user.is_banned) {
        await unbanUser(user.id)
        toast.success('User unbanned')
      } else {
        await banUser(user.id)
        toast.success('User banned')
      }

      fetchUsers()
    } catch (error) {
      toast.error('Action failed')
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this user?'
    )

    if (!confirmDelete) return

    try {
      await deleteAdminUser(id)
      toast.success('User deleted')

      setUsers(users.filter((user) => user.id !== id))
    } catch (error) {
      toast.error('Delete failed')
      console.error(error)
    }
  }

  if (loading) return <p>Loading users...</p>

  return (
    <div className={styles.container}>
      <h1>Users Management</h1>

      <div className={styles.cardsContainer}>
        {users.map((user) => (
          <div key={user.id} className={styles.card}>
            <h3>{user.name}</h3>

            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>Points: {user.points}</p>

            <p>
              Status:{' '}
              {user.is_banned ? 'Banned' : 'Active'}
            </p>

            <div className={styles.actions}>
              <button
                onClick={() =>
                  navigate(`/admin/users/${user.id}`)
                }
              >
                View Details
              </button>

              <button
                onClick={() => handleBanToggle(user)}
              >
                {user.is_banned ? 'Unban' : 'Ban'}
              </button>

              <button
                onClick={() => handleDelete(user.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Users
