import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FaUserCheck, FaUserPlus } from 'react-icons/fa'

import Layout from '../../components/Layout/Layout'
import {
  followUser,
  getCurrentUser,
  getUserFollowers,
  getUserFollowing,
  unfollowUser,
} from '../../services/authService'
import styles from './BrowseFollowers.module.css'

const BrowseFollowers = () => {
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const user = getCurrentUser()

  const loadConnections = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [followersData, followingData] = await Promise.all([
      getUserFollowers(user.id),
      getUserFollowing(user.id),
    ])
    setFollowers(followersData)
    setFollowing(followingData)
    setLoading(false)
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const followingIds = new Set(following.map((item) => item.following))

  const handleToggle = async (targetId) => {
    const result = followingIds.has(targetId)
      ? await unfollowUser(targetId)
      : await followUser(targetId)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(followingIds.has(targetId) ? 'Unfollowed' : 'Following')
    loadConnections()
  }

  const people = [
    ...followers.map((item) => ({
      id: item.follower,
      name: item.follower_name,
      relation: 'Follower',
    })),
    ...following.map((item) => ({
      id: item.following,
      name: item.following_name,
      relation: 'Following',
    })),
  ].filter((person, index, list) => list.findIndex((item) => item.id === person.id) === index)

  return (
    <Layout showBack>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Browse Followers</h1>
          <p>Review your CEEMA network and manage who you follow.</p>
        </header>

        {!user ? (
          <p className={styles.empty}>Login to browse followers and following.</p>
        ) : loading ? (
          <p className={styles.empty}>Loading network...</p>
        ) : people.length ? (
          <section className={styles.grid}>
            {people.map((person) => {
              const isFollowing = followingIds.has(person.id)

              return (
                <article key={person.id} className={styles.card}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'CEEMA User')}&background=1a1a1a&color=fff&size=80`}
                    alt={person.name}
                  />
                  <div>
                    <h2>{person.name || `User ${person.id}`}</h2>
                    <p>{person.relation}</p>
                  </div>
                  <button className={styles.followBtn} onClick={() => handleToggle(person.id)}>
                    {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </article>
              )
            })}
          </section>
        ) : (
          <p className={styles.empty}>No followers or following yet.</p>
        )}
      </main>
    </Layout>
  )
}

export default BrowseFollowers
