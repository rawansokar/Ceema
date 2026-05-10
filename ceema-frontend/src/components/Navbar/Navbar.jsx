import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiUser } from 'react-icons/fi'
import { IoArrowBack } from 'react-icons/io5'
import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

import { searchMovies } from '../../services/movieService'

const Navbar = ({ showBack = false }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)

  const syncAuth = () => {
    setIsLoggedIn(!!localStorage.getItem('ceema_access'))
  }

  useEffect(() => {
    syncAuth()
  }, [location])

  useEffect(() => {
    window.addEventListener('storage', syncAuth)
    return () => window.removeEventListener('storage', syncAuth)
  }, [])

  // 🔥 SEARCH USING SERVICE (FIXED)
  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    try {
      setLoading(true)

      const results = await searchMovies(searchQuery)

      console.log('Search results:', results)

      navigate('/movies', {
        state: { searchResults: results }
      })

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ceema_access')
    localStorage.removeItem('ceema_refresh')
    localStorage.removeItem('ceema_user')
    syncAuth()
    navigate('/login')
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>

        {/* LEFT */}
        <div className={styles.navLeft}>
          {showBack && (
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              <IoArrowBack />
            </button>
          )}
          <Link to="/" className={styles.logo}>
            CEEMA
          </Link>
        </div>

        {/* CENTER */}
        <ul className={styles.navLinks}>
          <li><Link to="/" className={styles.navLink}>Home</Link></li>
          <li><Link to="/movies" className={styles.navLink}>Movies</Link></li>
          <li><Link to="/booking" className={styles.navLink}>Booking</Link></li>
          <li><Link to="/feed" className={styles.navLink}>Feed</Link></li>
          <li><Link to="/news" className={styles.navLink}>News</Link></li>
          <li><Link to="/education" className={styles.navLink}>Education</Link></li>
        </ul>

        {/* RIGHT */}
        <div className={styles.navRight}>

          <Link to="/profile" className={styles.userIcon}>
            <FiUser size={20} />
          </Link>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <FiSearch className={styles.searchIcon} size={14} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              placeholder="Search movies..."
            />
            {loading && <span style={{ fontSize: '12px' }}>...</span>}
          </form>

          {isLoggedIn ? (
            <button onClick={handleLogout} className={styles.logBtn}>
              Logout
            </button>
          ) : (
            <Link to="/login" className={styles.logBtn}>
              Login
            </Link>
          )}

        </div>

      </div>
    </nav>
  )
}

export default Navbar








// import { Link, useNavigate, useLocation } from 'react-router-dom'
// import { FiSearch, FiUser } from 'react-icons/fi'
// import { IoArrowBack } from 'react-icons/io5'
// import { useState, useEffect } from 'react'
// import styles from './Navbar.module.css'

// const Navbar = ({ showBack = false }) => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [loading, setLoading] = useState(false)

//   const syncAuth = () => {
//     setIsLoggedIn(!!localStorage.getItem('token'))
//   }

//   useEffect(() => {
//     syncAuth()
//   }, [location])

//   useEffect(() => {
//     window.addEventListener('storage', syncAuth)
//     return () => window.removeEventListener('storage', syncAuth)
//   }, [])

//   // 🔥 SEARCH API FUNCTION
//   const handleSearch = async (e) => {
//     e.preventDefault()

//     if (!searchQuery.trim()) return

//     try {
//       setLoading(true)

//       const response = await fetch(
//         `/api/movies/search/?q=${encodeURIComponent(searchQuery)}`
//       )

//       if (!response.ok) {
//         throw new Error('Search failed')
//       }

//       const data = await response.json()

//       console.log('Search result:', data)

//       // ✅ OPTION 1: navigate to results page
//       navigate('/movies', { state: { searchResults: data } })

//       // OR OPTION 2 (if no results page yet):
//       // console.log(data)

//     } catch (error) {
//       console.error('Search error:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleLogout = () => {
//     localStorage.removeItem('token')
//     syncAuth()
//     navigate('/login')
//   }

//   return (
//     <nav className={styles.navbar}>
//       <div className={styles.navInner}>

//         {/* LEFT */}
//         <div className={styles.navLeft}>
//           {showBack && (
//             <button className={styles.backBtn} onClick={() => navigate(-1)}>
//               <IoArrowBack />
//             </button>
//           )}
//           <Link to="/" className={styles.logo}>
//             CEEMA
//           </Link>
//         </div>

//         {/* CENTER */}
//         <ul className={styles.navLinks}>
//           <li><Link to="/" className={styles.navLink}>Home</Link></li>
//           <li><Link to="/movies" className={styles.navLink}>Movies</Link></li>
//           <li><Link to="/seats" className={styles.navLink}>Booking</Link></li>
//           <li><Link to="/feed" className={styles.navLink}>Feed</Link></li>
//           <li><Link to="/news" className={styles.navLink}>News</Link></li>
//           <li><Link to="/education" className={styles.navLink}>Education</Link></li>
//         </ul>

//         {/* RIGHT */}
//         <div className={styles.navRight}>

//           <Link to="/profile" className={styles.userIcon}>
//             <FiUser size={20} />
//           </Link>

//           <form onSubmit={handleSearch} className={styles.searchForm}>
//             <FiSearch className={styles.searchIcon} size={14} />

//             <input
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className={styles.searchInput}
//               placeholder="Search movies..."
//             />

//             {loading && (
//               <span style={{ marginLeft: '8px', fontSize: '12px' }}>
//                 ...
//               </span>
//             )}
//           </form>

//           {/* AUTH BUTTON */}
//           {isLoggedIn ? (
//             <button onClick={handleLogout} className={styles.logBtn}>
//               Logout
//             </button>
//           ) : (
//             <Link to="/login" className={styles.logBtn}>
//               Login
//             </Link>
//           )}

//         </div>

//       </div>
//     </nav>
//   )
// }

// export default Navbar






// import { Link, useNavigate } from 'react-router-dom'
// import { FiSearch, FiUser } from 'react-icons/fi'
// import { IoArrowBack } from 'react-icons/io5'
// import { useState } from 'react'
// import styles from './Navbar.module.css'

// const Navbar = ({ showBack = false }) => {
//   const navigate = useNavigate()
//   const [searchQuery, setSearchQuery] = useState('')

//   const handleSearch = (e) => {
//     e.preventDefault()
//     // search logic will connect to API later
//     console.log('Searching:', searchQuery)
//   }

//   return (
//     <nav className={styles.navbar}>
//       <div className={styles.navInner}>

//         {/* ─── Left: Back arrow + Logo ─── */}
//         <div className={styles.navLeft}>
//           {showBack && (
//             <button className={styles.backBtn} onClick={() => navigate(-1)}>
//               <IoArrowBack />
//             </button>
//           )}
//           <Link to="/" className={styles.logo}>
//             CEEMA
//           </Link>
//         </div>

//         {/* ─── Center: Nav Links ─── */}
//         <ul className={styles.navLinks}>
//           <li><Link to="/" className={styles.navLink}>Home</Link></li>
//           <li><Link to="/movies" className={styles.navLink}>Movies</Link></li>
//           <li><Link to="/seats" className={styles.navLink}>Booking</Link></li>
//           <li><Link to="/feed" className={styles.navLink}>Feed</Link></li>
//           <li><Link to="/news" className={styles.navLink}>News</Link></li>
//           <li><Link to="/education" className={styles.navLink}>Education</Link></li>
//         </ul>

//         {/* ─── Right: User icon + Search ─── */}
//         <div className={styles.navRight}>
//           <Link to="/profile" className={styles.userIcon}>
//             <FiUser size={20} />
//           </Link>
//           <form onSubmit={handleSearch} className={styles.searchForm}>
//             <FiSearch className={styles.searchIcon} size={14} />
//             <input
//               type="text"
//               placeholder="Search movies, actors, cinemas..."
//               className={styles.searchInput}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </form>
//         </div>

//       </div>
//     </nav>
//   )
// }

// export default Navbar
