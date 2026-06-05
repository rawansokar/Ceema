import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FaFilm, FaTicketAlt, FaVideo, FaGift, FaStar } from 'react-icons/fa'
import { GiPopcorn } from 'react-icons/gi'

import Layout from '../../components/Layout/Layout'
import { getCurrentUser } from '../../services/authService'
import { getAllRewards, redeemReward } from '../../services/rewardsService'
import styles from './PointsRewards.module.css'

const ICONS = [GiPopcorn, FaTicketAlt, FaVideo, FaStar, FaFilm, FaGift]

const PointsRewards = () => {
  const [rewards, setRewards] = useState([])
  const [points, setPoints] = useState(getCurrentUser()?.points || 0)
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState(null)

  useEffect(() => {
    const loadRewards = async () => {
      setLoading(true)
      const data = await getAllRewards()
      setRewards(data)
      setLoading(false)
    }

    loadRewards()
  }, [])

  const handleRedeem = async (reward) => {
    setRedeemingId(reward.id)
    const result = await redeemReward(reward.id)
    setRedeemingId(null)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    const nextPoints = result.data.points
    setPoints(nextPoints)
    const stored = getCurrentUser()
    if (stored) {
      localStorage.setItem('ceema_user', JSON.stringify({ ...stored, points: nextPoints }))
    }
    toast.success(result.data.detail || 'Reward redeemed')
  }

  return (
    <Layout showBack>
      <main className={styles.page}>
        <section className={styles.header}>
          <h1>Rewards Shop</h1>
          <p>Redeem your points for exclusive rewards.</p>
          <div className={styles.pointsPill}>{points} Points</div>
        </section>

        {loading ? (
          <p className={styles.empty}>Loading rewards...</p>
        ) : rewards.length ? (
          <section className={styles.grid}>
            {rewards.map((reward, index) => {
              const Icon = ICONS[index % ICONS.length]
              const canRedeem = points >= reward.points

              return (
                <article key={reward.id} className={styles.card}>
                  <div>
                    <h2>{reward.title}</h2>
                    <p>{reward.points} Point</p>
                    <button
                      className={styles.redeemBtn}
                      disabled={!canRedeem || redeemingId === reward.id}
                      onClick={() => handleRedeem(reward)}
                    >
                      {redeemingId === reward.id ? 'Redeeming...' : canRedeem ? 'Redeem' : 'Not Enough'}
                    </button>
                  </div>
                  <Icon className={styles.icon} />
                </article>
              )
            })}
          </section>
        ) : (
          <p className={styles.empty}>No rewards are available yet.</p>
        )}
      </main>
    </Layout>
  )
}

export default PointsRewards
