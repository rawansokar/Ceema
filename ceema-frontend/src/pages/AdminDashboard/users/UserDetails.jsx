import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  getAdminUserById,
  patchAdminUser,
} from '../../../services/adminService'

import styles from '../AdminDashboard.module.css'

const UserDetails = () => {
  const { id } = useParams()

  const [user, setUser] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    mood_preference: '',
    preferred_genres: '',
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const data = await getAdminUserById(id)

      setUser(data)

      setFormData({
        name: data.name || '',
        email: data.email || '',
        age: data.age || '',
        mood_preference:
          data.mood_preference || '',
        preferred_genres:
          data.preferred_genres || '',
      })
    } catch (error) {
      toast.error('Failed to load user')
      console.error(error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await patchAdminUser(id, formData)

      toast.success('User updated')

      fetchUser()
    } catch (error) {
      toast.error('Update failed')
      console.error(error)
    }
  }

  if (!user) return <p>Loading...</p>

  return (
    <div className={styles.container}>
      <h1>User Details</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />

        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          placeholder="Age"
        />

        <input
          type="text"
          name="mood_preference"
          value={formData.mood_preference}
          onChange={handleChange}
          placeholder="Mood Preference"
        />

        <input
          type="text"
          name="preferred_genres"
          value={formData.preferred_genres}
          onChange={handleChange}
          placeholder="Preferred Genres"
        />

        <button type="submit">
          Save Changes
        </button>
      </form>

      <div className={styles.profileSection}>
        <h3>Profile</h3>

        <p>Bio: {user.profile?.bio}</p>

        <p>
          Followers:{' '}
          {user.profile?.followers_count}
        </p>

        <p>
          Following: {user.following_count}
        </p>
      </div>
    </div>
  )
}

export default UserDetails
