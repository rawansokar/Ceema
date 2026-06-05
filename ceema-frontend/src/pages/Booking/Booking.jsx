import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import styles from './Booking.module.css'
import sceneLogo from '../../assets/Cinemas/scene.png'
import voxLogo from '../../assets/Cinemas/vox.png'
import renaissanceLogo from '../../assets/Cinemas/renaissance.png'

const cinemas = [
  {
    id: 1,
    name: 'Scene Cinema',
    location: 'Mall of Egypt',
    screens: 8,
    logo: sceneLogo,
  },
  {
    id: 2,
    name: 'VOX Cinema',
    location: 'Cairo Festival City',
    screens: 12,
    logo: voxLogo,
  },
  {
    id: 3,
    name: 'Renaissance Cinema',
    location: 'Downtown Cairo',
    screens: 6,
    logo: renaissanceLogo,
  },
]

const Booking = () => {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState(null)

  const handleSelectCinema = (cinema) => {
    navigate('/cinemas', {
      state: {
        selectedCinema: cinema,
      },
    })
  }

  return (
    <Layout>
      <div className={styles.bookingPage}>
        <div className={styles.inner}>

          {/* ─── Title ─── */}
          <h1 className={styles.pageTitle}>
            Choose Your Cinema
          </h1>

          <p className={styles.pageSubtitle}>
            Select your preferred cinema to continue booking
          </p>

          {/* ─── Cinemas Grid ─── */}
          <div className={styles.cinemasGrid}>

            {cinemas.map((cinema) => (
              <button
                key={cinema.id}
                className={`${styles.cinemaCard} ${
                  hoveredId === cinema.id
                    ? styles.cinemaCardHovered
                    : ''
                }`}
                onClick={() => handleSelectCinema(cinema)}
                onMouseEnter={() => setHoveredId(cinema.id)}
                onMouseLeave={() => setHoveredId(null)}
              >

                {/* Glow */}
                <div className={styles.cardGlow} />

                {/* Logo */}
                <div className={styles.cinemaLogoWrap}>
                  <img
                    src={cinema.logo}
                    alt={cinema.name}
                    className={styles.cinemaLogo}
                  />
                </div>

                {/* Name */}
                <h2 className={styles.cinemaName}>
                  {cinema.name}
                </h2>

                {/* Location */}
                <p className={styles.cinemaLocation}>
                  {cinema.location}
                </p>

                {/* Screens */}
                <p className={styles.cinemaScreens}>
                  {cinema.screens} Screens
                </p>

                {/* Button */}
                <div className={styles.selectIndicator}>
                  Select Cinema →
                </div>

              </button>
            ))}

          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Booking

