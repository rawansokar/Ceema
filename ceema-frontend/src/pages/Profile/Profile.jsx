import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { updateUser, updateUserProfile, getCurrentUser, getUserById } from '../../services/authService'
import { FiEdit2 } from 'react-icons/fi'
import { BsTicketPerforated } from 'react-icons/bs'
import Layout from '../../components/Layout/Layout'
import styles from './Profile.module.css'

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ name: '', bio: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const stored = getCurrentUser()
    if (!stored) {
      toast.error('Please login to view your profile')
      navigate('/login')
      return
    }
      const fresh = await getUserById(stored.id)
      const current = fresh || stored
      localStorage.setItem('ceema_user', JSON.stringify(current))
    setUser(current)
    setEditData({
        name: current.name || '',
        bio: current.profile?.bio || ''
    })
    }
    loadUser()
  }, [navigate])

  // ─── Validation ───
  const validate = () => {
    const newErrors = {}
    if (!editData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (editData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    }
    if (editData.bio.length > 200) {
      newErrors.bio = 'Bio must be under 200 characters'
    }
    return newErrors
  }

  // ─── Save via API ───
  const handleSave = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    try {
      const [userResult, profileResult] = await Promise.all([
        updateUser(user.id, { name: editData.name }),
        updateUserProfile(user.id, { bio: editData.bio }),
      ])
      if (userResult.success && profileResult.success) {
        const updatedUser = {
          ...user,
          ...userResult.user,
          profile: {
            ...(user.profile || {}),
            ...profileResult.profile,
          },
        }
        localStorage.setItem('ceema_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setIsEditing(false)
        setErrors({})
        toast.success('Profile updated!')
      } else {
        toast.error(userResult.message || profileResult.message || 'Update failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({ name: user.name || '', bio: user.profile?.bio || '' })
    setErrors({})
    setIsEditing(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const dataUrl = await fileToDataUrl(file)
      const existing = Array.isArray(user.profile?.portfolio)
        ? user.profile.portfolio
        : user.profile?.portfolio
          ? [user.profile.portfolio]
          : []
      const portfolio = [...existing, dataUrl]
      const result = await updateUserProfile(user.id, { portfolio })

      if (!result.success) {
        toast.error(result.message)
        return
      }

      setUser(result.user)
      toast.success('Portfolio image updated!')
    } catch {
      toast.error('Portfolio upload failed')
    } finally {
      e.target.value = ''
    }
  }

  const formatStat = (val) => {
    if (!val && val !== 0) return '0'
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
    return val
  }

  if (!user) return null

  return (
    <Layout showBack={true}>
      <div className={styles.profilePage}>
        <div className={styles.inner}>

          {/* ─── Title ─── */}
          <h1 className={styles.pageTitle}>Profile Page</h1>

          {/* ─── Avatar + Name + Edit Button ─── */}
          <div className={styles.avatarSection}>
            <img
              src={
                user.profile?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=cc0000&color=fff&size=90`
              }
              alt={user.name}
              className={styles.avatar}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=cc0000&color=fff&size=90`
              }}
            />
            <p className={styles.userName}>{user.name}</p>
            <button
              className={styles.editProfileBtn}
              onClick={() => setIsEditing(!isEditing)}
            >
              Edit Profile <FiEdit2 size={12} />
            </button>
          </div>

          {/* ─── Edit Form ─── */}
          {isEditing && (
            <div className={styles.editCard}>
              {/* Name */}
<div className={styles.editField}>
  <label className={styles.editLabel}>Name</label>
  <input
    type="text"
    name="name"
    value={editData.name}
    onChange={handleChange}
    className={`${styles.editInput} ${errors.name ? styles.inputError : ''}`}
  />
  {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
</div>

{/* About Me */}
<div className={styles.editField}>
        <label className={styles.editLabel}>
          About Me
          <span className={styles.charCount}>{editData.bio.length}/200</span>
          </label>
          <textarea
            name="bio"
            value={editData.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us about yourself..."
            className={`${styles.editTextarea} ${errors.bio ? styles.inputError : ''}`}/>
          {errors.bio && <span className={styles.errorMsg}>{errors.bio}</span>}
          </div>
              <div className={styles.editActions}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className={styles.cancelBtn} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ─── Stats Row ─── */}
          <div className={styles.statsRow}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Likes</span>
              <span className={styles.statNumber}>
                {formatStat(user.profile?.followers_count)}
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Followers</span>
              <span className={styles.statNumber}>
                {formatStat(user.followers_count)}
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Friends</span>
              <span className={styles.statNumber}>
                {formatStat(user.following_count)}
              </span>
            </div>
          </div>

          {/* ─── Bottom 4-column Grid ─── */}
          <div className={styles.bottomGrid}>

            {/* About Me */}
            <div className={styles.gridBlock}>
              <h3 className={styles.blockTitle}>About me</h3>
              <p className={styles.bioText}>
                {user.profile?.bio || 'No bio added yet.'}
              </p>
            </div>

            {/* Portfolio */}
            {/* <div className={styles.gridBlock}>
              <h3 className={styles.blockTitle}>Portfolio</h3>
              <div className={styles.portfolioGrid}>
                {user.profile?.portfolio && (
                  <img
                    src={user.profile.portfolio}
                    alt="portfolio"
                    className={styles.portfolioImg}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className={styles.portfolioAdd}>
                  <span>+</span>
                </div>
              </div>
            </div> */}
            {/* Portfolio */}
<div className={styles.gridBlock}>
  <h3 className={styles.blockTitle}>Portfolio</h3>
  <div className={styles.portfolioGrid}>
    {(Array.isArray(user.profile?.portfolio)
      ? user.profile.portfolio
      : user.profile?.portfolio
        ? [user.profile.portfolio]
        : []
    ).map((item, index) => (
      <img
        key={`${item}-${index}`}
        src={item}
        alt="portfolio"
        className={styles.portfolioImg}
        onError={(e) => { e.target.style.display = 'none' }}
      />
    ))}
    <label className={styles.portfolioAdd} title="Add to portfolio">
      <span>+</span>
      <input
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handlePortfolioUpload}
      />
    </label>
  </div>
</div>

            {/* Tickets History */}
            {/* <div className={styles.gridBlock}> */}
            <div className={`${styles.gridBlock} ${styles.ticketsBlock}`}>
              <h3 className={styles.blockTitle}>Tickets History</h3>
              <Link to="/tickets-history" className={styles.ticketsWrap}>
                <BsTicketPerforated size={60} className={styles.ticketIcon} />
              </Link>
            </div>

            {/* Points / Loyalty */}
            <div className={styles.gridBlock}>
              <Link to="/points-rewards" className={styles.blockTitleLink}>
                Points/Loyalty →
              </Link>
              <p className={styles.pointsText}>
                <strong>{user.points || 0}</strong> Points
              </p>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Profile


