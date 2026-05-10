import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { FaFilm, FaTicketAlt, FaBuilding } from 'react-icons/fa'

import Layout from '../../components/Layout/Layout'
import styles from './MovieSlots.module.css'

import { getMovieById, getAllShowtimes } from '../../services/movieService'
import { getCinemas } from '../../services/bookingService'

const MovieSlots = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [movie, setMovie] = useState(null)
  const [showtimes, setShowtimes] = useState([])
  const [cinemas, setCinemas] = useState([])

  const [selectedCinema, setSelectedCinema] = useState(null)

  const [selectedShowtimes, setSelectedShowtimes] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const movieData = await getMovieById(id)
      const allShowtimes = await getAllShowtimes({ movie: id })
      const cinemasData = await getCinemas()

      if (!movieData) {
        navigate('/movies')
        return
      }

      setMovie(movieData)
      setCinemas(cinemasData)

      setShowtimes(allShowtimes.filter((s) => s.movie === Number(id)))
    }

    fetchData()
  }, [id, navigate])

  const visibleShowtimes = selectedCinema
    ? showtimes.filter((showtime) => {
        const cinemaName = showtime.cinema_name || showtime.cinema || showtime.hall || ''
        const sameCinema = cinemaName === selectedCinema.name
        const sameCity = !selectedCinema.city || showtime.city === selectedCinema.city
        return sameCinema && sameCity
      })
    : []

  // 🔥 toggle selection (multi select)
  const toggleShowtime = (showtime) => {
    setSelectedShowtimes((prev) => {
      const exists = prev.find((s) => s.id === showtime.id)

      if (exists) {
        return prev.filter((s) => s.id !== showtime.id)
      }

      return [...prev, showtime]
    })
  }

  const handleContinue = () => {
    if (!selectedCinema) {
      toast.error('Please select a cinema')
      return
    }

    if (selectedShowtimes.length === 0) {
      toast.error('Please select at least one showtime')
      return
    }

    navigate('/seats', {
      state: {
        movieId: movie.id,
        movie: movie.title,
        cinema: selectedCinema.name,
        showtimeId: selectedShowtimes[0].id,
        showtime: `${selectedShowtimes[0].date} ${selectedShowtimes[0].time}`,
        ticketPrice: Number(selectedShowtimes[0].ticket_price || 200),
        showtimes: selectedShowtimes,
      }
    })
  }

  if (!movie) return null

  return (
    <Layout showBack={true}>
      <div className={styles.slotsPage}>
        <div className={styles.inner}>

          {/* MOVIE */}
          <div className={styles.movieHeader}>
            <img
              src={movie.poster}
              alt={movie.title}
              className={styles.moviePoster}
            />

            <div className={styles.movieInfo}>
              <h1 className={styles.movieTitle}>
                <FaFilm style={{ marginRight: '8px' }} />
                {movie.title}
              </h1>

              <p className={styles.movieSynopsis}>
                {movie.description}
              </p>
            </div>
          </div>

          {/* CINEMAS */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FaBuilding style={{ marginRight: '8px' }} />
              Select Cinema
            </h2>

            <div className={styles.showtimesGrid}>
              {cinemas.map((c) => (
                <button
                  key={c.id}
                  className={`${styles.showtimeBtn} ${
                    selectedCinema?.id === c.id
                      ? styles.showtimeActive
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedCinema(c)
                    setSelectedShowtimes([]) // reset
                  }}
                >
                  <strong>{c.name}</strong>
                </button>
              ))}
            </div>
          </div>

          {/* SHOWTIMES */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FaTicketAlt style={{ marginRight: '8px' }} />
              Available Showtimes
            </h2>

            <div className={styles.showtimesGrid}>
              {!selectedCinema ? (
                <p>Please select a cinema first</p>
              ) : visibleShowtimes.length === 0 ? (
                <p>No showtimes available now</p>
              ) : (
                visibleShowtimes.map((s) => {
                  const isSelected = selectedShowtimes.some(
                    (x) => x.id === s.id
                  )

                  return (
                    <button
                      key={s.id}
                      className={`${styles.showtimeBtn} ${
                        isSelected ? styles.showtimeActive : ''
                      }`}
                      onClick={() => toggleShowtime(s)}
                    >
                      <div>
                        <strong>{s.time}</strong>
                        <p>{s.hall}</p>
                        <small>{s.date}</small>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* SUMMARY */}
          {selectedCinema && selectedShowtimes.length > 0 && (
            <div className={styles.selectionSummary}>
              <FaFilm style={{ marginRight: '6px' }} />
              {movie.title} · {selectedCinema.name} ·{' '}
              {selectedShowtimes.length} showtime(s) selected
            </div>
          )}

          {/* CONTINUE */}
          <button
            className={styles.continueBtn}
            onClick={handleContinue}
            disabled={!selectedCinema || selectedShowtimes.length === 0}
          >
            Select Seats →
          </button>

        </div>
      </div>
    </Layout>
  )
}

export default MovieSlots




// import { useState, useEffect } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { toast } from 'react-toastify'

// import { FaFilm, FaTicketAlt, FaBuilding } from 'react-icons/fa'

// import Layout from '../../components/Layout/Layout'
// import styles from './MovieSlots.module.css'

// import { getMovieById, getAllShowtimes } from '../../services/movieService'
// import { getCinemas } from '../../services/bookingService'

// const MovieSlots = () => {
//   const navigate = useNavigate()
//   const { id } = useParams()

//   const [movie, setMovie] = useState(null)
//   const [showtimes, setShowtimes] = useState([])
//   const [cinemas, setCinemas] = useState([])

//   const [selectedCinema, setSelectedCinema] = useState(null)
//   const [selectedShowtime, setSelectedShowtime] = useState(null)

//   // ─────────────────────────────
//   // CINEMA → HALL MAPPING (WORKAROUND)
//   // ─────────────────────────────
//   const CINEMA_MAP = {
//     1: ['Hall 1'],
//     2: ['Hall 2'],
//     3: ['Hall 3']
//   }

//   // ─────────────────────────────
//   // FETCH DATA
//   // ─────────────────────────────
//   useEffect(() => {
//     const fetchData = async () => {
//       const movieData = await getMovieById(id)
//       const allShowtimes = await getAllShowtimes()
//       const cinemasData = await getCinemas()

//       if (!movieData) {
//         navigate('/movies')
//         return
//       }

//       setMovie(movieData)
//       setCinemas(cinemasData)

//       const filtered = allShowtimes.filter(
//         (s) => s.movie === Number(id)
//       )

//       setShowtimes(filtered)
//     }

//     fetchData()
//   }, [id, navigate])

//   // ─────────────────────────────
//   // FILTER SHOWTIMES BASED ON CINEMA
//   // ─────────────────────────────
//   const filteredShowtimes = selectedCinema
//     ? showtimes.filter((s) =>
//         CINEMA_MAP[selectedCinema.id]?.includes(s.hall)
//       )
//     : []

//   // ─────────────────────────────
//   // CONTINUE
//   // ─────────────────────────────
//   const handleContinue = () => {
//     if (!selectedCinema) {
//       toast.error('Please select a cinema')
//       return
//     }

//     if (!selectedShowtime) {
//       toast.error('Please select a showtime')
//       return
//     }

//     navigate('/seats', {
//       state: {
//         movieId: movie.id,
//         movie: movie.title,
//         cinema: selectedCinema.name,
//         showtime: selectedShowtime.time,
//         date: selectedShowtime.date,
//         hall: selectedShowtime.hall
//       }
//     })
//   }

//   if (!movie) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.slotsPage}>
//         <div className={styles.inner}>

//           {/* ───── MOVIE HEADER ───── */}
//           <div className={styles.movieHeader}>
//             <img
//               src={movie.image_url}
//               alt={movie.title}
//               className={styles.moviePoster}
//             />

//             <div className={styles.movieInfo}>
//               <h1 className={styles.movieTitle}>
//                 <FaFilm style={{ marginRight: '8px' }} />
//                 {movie.title}
//               </h1>

//               <p className={styles.movieSynopsis}>
//                 {movie.description}
//               </p>
//             </div>
//           </div>

//           {/* ───── CINEMAS ───── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>
//               <FaBuilding style={{ marginRight: '8px' }} />
//               Select Cinema
//             </h2>

//             <div className={styles.showtimesGrid}>
//               {cinemas.map((c) => (
//                 <button
//                   key={c.id}
//                   className={`${styles.showtimeBtn} ${
//                     selectedCinema?.id === c.id
//                       ? styles.showtimeActive
//                       : ''
//                   }`}
//                   onClick={() => {
//                     setSelectedCinema(c)
//                     setSelectedShowtime(null)
//                   }}
//                 >
//                   <strong>{c.name}</strong>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ───── SHOWTIMES ───── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>
//               <FaTicketAlt style={{ marginRight: '8px' }} />
//               Available Showtimes
//             </h2>

//             <div className={styles.showtimesGrid}>
//               {!selectedCinema ? (
//                 <p>Please select a cinema first</p>
//               ) : filteredShowtimes.length === 0 ? (
//                 <p>No showtimes available now</p>
//               ) : (
//                 filteredShowtimes.map((s) => (
//                   <button
//                     key={s.id}
//                     className={`${styles.showtimeBtn} ${
//                       selectedShowtime?.id === s.id
//                         ? styles.showtimeActive
//                         : ''
//                     }`}
//                     onClick={() => setSelectedShowtime(s)}
//                   >
//                     <div>
//                       <strong>{s.time}</strong>
//                       <p>{s.hall}</p>
//                       <small>{s.date}</small>
//                     </div>
//                   </button>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* ───── SUMMARY ───── */}
//           {selectedCinema && selectedShowtime && (
//             <div className={styles.selectionSummary}>
//               <FaFilm style={{ marginRight: '6px' }} />
//               {movie.title} · {selectedCinema.name} ·{' '}
//               {selectedShowtime.hall} · {selectedShowtime.time}
//             </div>
//           )}

//           {/* ───── CONTINUE ───── */}
//           <button
//             className={styles.continueBtn}
//             onClick={handleContinue}
//             disabled={!selectedCinema || !selectedShowtime}
//           >
//             Select Seats →
//           </button>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieSlots













// import { useState, useEffect } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { toast } from 'react-toastify'

// import { FaFilm, FaTicketAlt, FaBuilding } from 'react-icons/fa'

// import Layout from '../../components/Layout/Layout'
// import styles from './MovieSlots.module.css'

// import { getMovieById, getAllShowtimes } from '../../services/movieService'
// import { getCinemas } from '../../services/bookingService'

// const MovieSlots = () => {
//   const navigate = useNavigate()
//   const { id } = useParams()

//   const [movie, setMovie] = useState(null)
//   const [showtimes, setShowtimes] = useState([])
//   const [cinemas, setCinemas] = useState([])

//   const [selectedCinema, setSelectedCinema] = useState(null)
//   const [selectedShowtime, setSelectedShowtime] = useState(null)

//   // ─────────────────────────────
//   // FETCH DATA
//   // ─────────────────────────────
//   useEffect(() => {
//     const fetchData = async () => {
//       const movieData = await getMovieById(id)
//       const allShowtimes = await getAllShowtimes()
//       const cinemasData = await getCinemas()

//       if (!movieData) {
//         navigate('/movies')
//         return
//       }

//       setMovie(movieData)
//       setCinemas(cinemasData)

//       const filtered = allShowtimes.filter(
//         (s) => s.movie === Number(id)
//       )

//       setShowtimes(filtered)
//     }

//     fetchData()
//   }, [id, navigate])

//   // ─────────────────────────────
//   // FILTER SHOWTIMES
//   // ─────────────────────────────
//   const filteredShowtimes = showtimes.filter(
//     (s) => !selectedCinema || s.cinema === selectedCinema.id
//   )

//   // ─────────────────────────────
//   // CONTINUE
//   // ─────────────────────────────
//   const handleContinue = () => {
//     if (!selectedCinema) {
//       toast.error('Please select a cinema')
//       return
//     }

//     if (!selectedShowtime) {
//       toast.error('Please select a showtime')
//       return
//     }

//     navigate('/seats', {
//       state: {
//         movieId: movie.id,
//         movie: movie.title,
//         cinema: selectedCinema.name,
//         showtime: selectedShowtime.time,
//         date: selectedShowtime.date,
//         hall: selectedShowtime.hall
//       }
//     })
//   }

//   if (!movie) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.slotsPage}>
//         <div className={styles.inner}>

//           {/* ───── MOVIE HEADER ───── */}
//           <div className={styles.movieHeader}>
//             <img
//               src={movie.image_url}
//               alt={movie.title}
//               className={styles.moviePoster}
//             />

//             <div className={styles.movieInfo}>
//               <h1 className={styles.movieTitle}>
//                 <FaFilm style={{ marginRight: '8px' }} />
//                 {movie.title}
//               </h1>

//               <p className={styles.movieSynopsis}>
//                 {movie.description}
//               </p>
//             </div>
//           </div>

//           {/* ───── CINEMAS ───── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>
//               <FaBuilding style={{ marginRight: '8px' }} />
//               Select Cinema
//             </h2>

//             <div className={styles.showtimesGrid}>
//               {cinemas.length === 0 && (
//                 <p>No cinemas available</p>
//               )}

//               {cinemas.map((c) => (
//                 <button
//                   key={c.id}
//                   className={`${styles.showtimeBtn} ${
//                     selectedCinema?.id === c.id
//                       ? styles.showtimeActive
//                       : ''
//                   }`}
//                   onClick={() => {
//                     setSelectedCinema(c)
//                     setSelectedShowtime(null)
//                   }}
//                 >
//                   <strong>{c.name}</strong>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ───── SHOWTIMES ───── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>
//               <FaTicketAlt style={{ marginRight: '8px' }} />
//               Available Showtimes
//             </h2>

//             <div className={styles.showtimesGrid}>
//               {filteredShowtimes.length === 0 && (
//                 <p>No showtimes available</p>
//               )}

//               {filteredShowtimes.map((s) => (
//                 <button
//                   key={s.id}
//                   className={`${styles.showtimeBtn} ${
//                     selectedShowtime?.id === s.id
//                       ? styles.showtimeActive
//                       : ''
//                   }`}
//                   onClick={() => setSelectedShowtime(s)}
//                 >
//                   <div>
//                     <strong>{s.time}</strong>
//                     <p>{s.hall}</p>
//                     <small>{s.date}</small>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ───── SUMMARY ───── */}
//           {selectedShowtime && selectedCinema && (
//             <div className={styles.selectionSummary}>
//               <FaFilm style={{ marginRight: '6px' }} />
//               {movie.title} · {selectedCinema.name} ·{' '}
//               {selectedShowtime.hall} · {selectedShowtime.time}
//             </div>
//           )}

//           {/* ───── CONTINUE ───── */}
//           <button
//             className={styles.continueBtn}
//             onClick={handleContinue}
//             disabled={!selectedCinema || !selectedShowtime}
//           >
//             Select Seats →
//           </button>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieSlots




















// import { useState, useEffect } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import Layout from '../../components/Layout/Layout'
// import styles from './MovieSlots.module.css'

// import {
//   getMovieById,
//   getAllShowtimes
// } from '../../services/movieService'

// const MovieSlots = () => {
//   const navigate = useNavigate()
//   const { id } = useParams()

//   const [movie, setMovie] = useState(null)
//   const [showtimes, setShowtimes] = useState([])
//   const [selectedShowtime, setSelectedShowtime] = useState(null)

//   // ─────────────────────────────
//   // FETCH MOVIE + SHOWTIMES
//   // ─────────────────────────────
//   useEffect(() => {
//     const fetchData = async () => {
//       const movieData = await getMovieById(id)
//       const allShowtimes = await getAllShowtimes()

//       if (!movieData) {
//         navigate('/movies')
//         return
//       }

//       setMovie(movieData)

//       // filter showtimes for this movie
//       const filtered = allShowtimes.filter(
//         (s) => s.movie === Number(id)
//       )

//       setShowtimes(filtered)
//     }

//     fetchData()
//   }, [id, navigate])

//   // ─────────────────────────────
//   // CONTINUE
//   // ─────────────────────────────
//   const handleContinue = () => {
//     if (!selectedShowtime) {
//       toast.error('Please select a showtime')
//       return
//     }

//     navigate('/seats', {
//       state: {
//         movieId: movie.id,
//         movie: movie.title,
//         showtime: selectedShowtime.time,
//         date: selectedShowtime.date,
//         hall: selectedShowtime.hall
//       }
//     })
//   }

//   if (!movie) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.slotsPage}>
//         <div className={styles.inner}>

//           {/* ───── MOVIE HEADER ───── */}
//           <div className={styles.movieHeader}>
//             <img
//               src={movie.image_url}
//               alt={movie.title}
//               className={styles.moviePoster}
//             />

//             <div className={styles.movieInfo}>
//               <h1 className={styles.movieTitle}>
//                 {movie.title}
//               </h1>

//               <p className={styles.movieSynopsis}>
//                 {movie.description}
//               </p>
//             </div>
//           </div>

//           {/* ───── SHOWTIMES ───── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>
//               Available Showtimes
//             </h2>

//             <div className={styles.showtimesGrid}>
//               {showtimes.length === 0 && (
//                 <p>No showtimes available</p>
//               )}

//               {showtimes.map((s) => (
//                 <button
//                   key={s.id}
//                   className={`${styles.showtimeBtn} ${
//                     selectedShowtime?.id === s.id
//                       ? styles.showtimeActive
//                       : ''
//                   }`}
//                   onClick={() => setSelectedShowtime(s)}
//                 >
//                   <div>
//                     <strong>{s.time}</strong>
//                     <p>{s.hall}</p>
//                     <small>{s.date}</small>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ───── SUMMARY ───── */}
//           {selectedShowtime && (
//             <div className={styles.selectionSummary}>
//               🎬 {movie.title} · {selectedShowtime.hall} ·{' '}
//               {selectedShowtime.time}
//             </div>
//           )}

//           {/* ───── CONTINUE ───── */}
//           <button
//             className={styles.continueBtn}
//             onClick={handleContinue}
//             disabled={!selectedShowtime}
//           >
//             Select Seats →
//           </button>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieSlots






// // const MovieSlots = () => <div>MovieSlots</div>; export default MovieSlots;
// import { useState, useEffect } from 'react'
// import { useNavigate, useParams, useLocation } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { getCurrentMovies, getAllMovies } from '../../services/movieService'
// import { getCinemas } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import styles from './MovieSlots.module.css'

// const DAYS = [
//   { label: 'Today', date: 'May 2' },
//   { label: 'Tomorrow', date: 'May 3' },
//   { label: 'Sat', date: 'May 4' },
//   { label: 'Sun', date: 'May 5' },
//   { label: 'Mon', date: 'May 6' },
//   { label: 'Tue', date: 'May 7' },
// ]

// const MovieSlots = () => {
//   const navigate = useNavigate()
//   const { id } = useParams()
//   const location = useLocation()

//   const [movie, setMovie] = useState(null)
//   const [cinemas, setCinemas] = useState([])
//   const [selectedDay, setSelectedDay] = useState(0)
//   const [selectedCinema, setSelectedCinema] = useState(null)
//   const [selectedScreen, setSelectedScreen] = useState(null)
//   const [selectedShowtime, setSelectedShowtime] = useState(null)

//   useEffect(() => {
//     // find movie from both lists
//     const allCurrent = getCurrentMovies()
//     const allLibrary = getAllMovies()
//     const found =
//       allCurrent.find((m) => m.id === Number(id)) ||
//       allLibrary.find((m) => m.id === Number(id))
//     setMovie(found || allCurrent[0])

//     const cinemasData = getCinemas()
//     setCinemas(cinemasData)
//     setSelectedCinema(cinemasData[0])
//     setSelectedScreen(cinemasData[0]?.screens[0])
//   }, [id])

//   // ─── Handle cinema change ───
//   const handleCinemaChange = (cinema) => {
//     setSelectedCinema(cinema)
//     setSelectedScreen(cinema.screens[0])
//     setSelectedShowtime(null)
//   }

//   // ─── Handle screen change ───
//   const handleScreenChange = (screen) => {
//     setSelectedScreen(screen)
//     setSelectedShowtime(null)
//   }

//   // ─── Continue to Seats ───
//   const handleContinue = () => {
//     if (!selectedShowtime) {
//       toast.error('Please select a showtime')
//       return
//     }
//     navigate('/seats', {
//       state: {
//         cinema: selectedCinema.name,
//         movie: movie.title,
//         showtime: selectedShowtime,
//         movieId: movie.id,
//         screen: selectedScreen.name
//       }
//     })
//   }

//   if (!movie) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.slotsPage}>
//         <div className={styles.inner}>

//           {/* ─── Movie Info Header ─── */}
//           <div className={styles.movieHeader}>
//             <img
//               src={movie.poster}
//               alt={movie.title}
//               className={styles.moviePoster}
//               onError={(e) => {
//                 e.target.src = `https://placehold.co/120x180/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//               }}
//             />
//             <div className={styles.movieInfo}>
//               <h1 className={styles.movieTitle}>{movie.title}</h1>
//               {movie.titleAr && (
//                 <p className={styles.movieTitleAr}>{movie.titleAr}</p>
//               )}
//               {movie.rated && (
//                 <span className={styles.movieRated}>{movie.rated}</span>
//               )}
//               {movie.duration && (
//                 <span className={styles.movieDuration}>{movie.duration}</span>
//               )}
//               {movie.synopsis && (
//                 <p className={styles.movieSynopsis}>{movie.synopsis}</p>
//               )}
//             </div>
//           </div>

//           {/* ─── Day Selector ─── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>Select Day</h2>
//             <div className={styles.daysRow}>
//               {DAYS.map((day, index) => (
//                 <button
//                   key={day.label}
//                   className={`${styles.dayBtn} ${selectedDay === index ? styles.dayActive : ''}`}
//                   onClick={() => {
//                     setSelectedDay(index)
//                     setSelectedShowtime(null)
//                   }}
//                 >
//                   <span className={styles.dayLabel}>{day.label}</span>
//                   <span className={styles.dayDate}>{day.date}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ─── Cinema Selector ─── */}
//           <div className={styles.section}>
//             <h2 className={styles.sectionTitle}>Select Cinema</h2>
//             <div className={styles.cinemasRow}>
//               {cinemas.map((cinema) => (
//                 <button
//                   key={cinema.id}
//                   className={`${styles.cinemaBtn} ${
//                     selectedCinema?.id === cinema.id ? styles.cinemaActive : ''
//                   }`}
//                   onClick={() => handleCinemaChange(cinema)}
//                 >
//                   {cinema.name}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ─── Screen Type Selector ─── */}
//           {selectedCinema && selectedCinema.screens.length > 1 && (
//             <div className={styles.section}>
//               <h2 className={styles.sectionTitle}>Select Screen</h2>
//               <div className={styles.screensRow}>
//                 {selectedCinema.screens.map((screen) => (
//                   <button
//                     key={screen.id}
//                     className={`${styles.screenBtn} ${
//                       selectedScreen?.id === screen.id ? styles.screenActive : ''
//                     }`}
//                     onClick={() => handleScreenChange(screen)}
//                   >
//                     {screen.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ─── Showtimes ─── */}
//           {selectedScreen && (
//             <div className={styles.section}>
//               <h2 className={styles.sectionTitle}>
//                 {selectedCinema?.name} —{' '}
//                 <span className={styles.screenName}>{selectedScreen.name}</span>
//               </h2>
//               <div className={styles.showtimesGrid}>
//                 {selectedScreen.showtimes.map((time) => (
//                   <button
//                     key={time}
//                     className={`${styles.showtimeBtn} ${
//                       selectedShowtime === time ? styles.showtimeActive : ''
//                     }`}
//                     onClick={() => setSelectedShowtime(time)}
//                   >
//                     {time}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ─── Selected Summary ─── */}
//           {selectedShowtime && (
//             <div className={styles.selectionSummary}>
//               <span className={styles.summaryText}>
//                 🎬 {selectedCinema?.name} · {selectedScreen?.name} · {selectedShowtime} · {DAYS[selectedDay].label}
//               </span>
//             </div>
//           )}

//           {/* ─── Continue Button ─── */}
//           <button
//             className={styles.continueBtn}
//             onClick={handleContinue}
//             disabled={!selectedShowtime}
//           >
//             Select Seats →
//           </button>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieSlots
