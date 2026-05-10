import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getFeaturedMovie,
  getCurrentMovies,
  getAllMovies,
  getHighestGrossingEgyptianMovies
} from '../../services/movieService'

import { getCinemas } from '../../services/bookingService'
import Layout from '../../components/Layout/Layout'
import { FaArrowRight, FaStar, FaTicketAlt } from 'react-icons/fa'
import styles from './Landing.module.css'

import sceneLogo from '../../assets/Cinemas/scene.png'
import voxLogo from '../../assets/Cinemas/vox.png'
import renaissanceLogo from '../../assets/Cinemas/renaissance.png'

const cinemaList = [
  { id: 1, name: "VOX Cinemas", logo: voxLogo },
  { id: 2, name: "Scene Cinemas", logo: sceneLogo },
  { id: 3, name: "Renaissance", logo: renaissanceLogo },
]

const Landing = () => {
  const [featured, setFeatured] = useState(null)
  const [currentMovies, setCurrentMovies] = useState([])
  const [libraryMovies, setLibraryMovies] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [selectedCinema, setSelectedCinema] = useState(0)
  const [highestGrossingMovies, setHighestGrossingMovies] = useState([])

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const featuredMovie = await getFeaturedMovie()
        const current = await getCurrentMovies()
        const allMovies = await getAllMovies()
        const cinemaData = await getCinemas()
        const highestMovies = await getHighestGrossingEgyptianMovies()

        setFeatured(featuredMovie || null)
        setCurrentMovies(Array.isArray(current) ? current : [])
        setLibraryMovies(Array.isArray(allMovies) ? allMovies.slice(0, 4) : [])
        setCinemas(Array.isArray(cinemaData) ? cinemaData : [])
        setHighestGrossingMovies(Array.isArray(highestMovies) ? highestMovies.slice(0, 6) : [])

      } catch (error) {
        console.error('Landing fetch error:', error)
      }
    }

    fetchLandingData()
  }, [])

  return (
    <Layout>
      <div className={styles.landingPage}>

        {/* ─── Hero Section ─── */}
        {featured && (
          <section className={styles.hero}>

            <div className={styles.heroOverlay} />

            <img
              src={featured.backdrop}
              alt={featured.title}
              className={styles.heroImage}
              onError={(e) => {
                e.target.src =
                  `https://placehold.co/1200x600/1a1a1a/cc0000?text=${encodeURIComponent(featured.title)}`
              }}
            />

            <div className={styles.heroContent}>

              <div className={styles.heroMeta}>
                <span className={styles.heroBadge}>Now Showing</span>
                <span className={styles.heroDate}>{Array.isArray(featured.genre) ? featured.genre.join(', ') : featured.genre}</span>
              </div>

              <h1 className={styles.heroTitle}>{featured.title}</h1>

              <p className={styles.heroSynopsis}>{featured.description}</p>

              <div className={styles.heroActions}>
                <Link
                  to={`/movies/${featured.id}/slots`}
                  className={styles.bookBtn}
                >
                  Book Tickets
                </Link>

                <Link
                  to={`/movies/${featured.id}`}
                  className={styles.detailsBtn}
                >
                  More Info
                </Link>
              </div>

            </div>

          </section>
        )}

        <div className={styles.pageContent}>

          {/* ─── Now Showing ─── */}
          <section className={styles.section}>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Movies Now Playing</h2>

              <Link to="/movies" className={styles.viewAllBtn}>
                View All <FaArrowRight />
              </Link>
            </div>

            <div className={styles.moviesGrid}>
              {currentMovies.map((movie) => (
                <Link
                  to={`/movies/${movie.id}`}
                  key={movie.id}
                  className={styles.movieCard}
                >
                  <div className={styles.moviePosterWrap}>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className={styles.moviePoster}
                      onError={(e) => {
                        e.target.src =
                          `https://placehold.co/200x300/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
                      }}
                    />

                    <div className={styles.movieOverlay}>
                      <span className={styles.bookNow}>Book Now</span>
                    </div>
                  </div>

                  <p className={styles.movieTitle}>{movie.title}</p>
                </Link>
              ))}
            </div>

          </section>

          {/* ─── CINEMAS (FIXED) ─── */}
          <section className={styles.section}>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Book Cinema Tickets</h2>

              <Link to="/booking" className={styles.bookTicketsBtn}>
                <FaTicketAlt /> Book Tickets
              </Link>
            </div>

            <div className={styles.cinemasRow}>

              {cinemaList.map((cinema) => (
                <div
                  key={cinema.id}
                  className={styles.cinemaLogoCard}
                >
                  <img
                    src={cinema.logo}
                    alt={cinema.name}
                    className={styles.cinemaLogoImage}
                  />

                  <p className={styles.cinemaName}>
                    {cinema.name}
                  </p>
                </div>
              ))}

            </div>

          </section>

          {/* ─── Highest Grossing ─── */}
          <section className={styles.section}>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Highest-Grossing Egyptian Films
              </h2>

              <Link to="/library" className={styles.viewAllBtn}>
                View All <FaArrowRight />
              </Link>
            </div>

            <div className={styles.libraryGrid}>

              {highestGrossingMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  className={styles.libraryCard}
                >
                  <div className={styles.libraryPosterWrap}>
                    <img
                      src={
                        movie.poster
                      }
                      alt={movie.title}
                      className={styles.libraryPoster}
                      onError={(e) => {
                        e.target.src =
                          `https://placehold.co/160x240/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
                      }}
                    />

                    <div className={styles.libraryOverlay}>
                      <span className={styles.movieRating}>
                        {movie.box_office_gross_egp?.toLocaleString?.() || movie.rating}
                      </span>
                    </div>

                  </div>

                  <p className={styles.libraryTitle}>
                    {movie.title}
                  </p>

                  <p className={styles.libraryYear}>
                    {movie.box_office_gross_egp ? `${Number(movie.box_office_gross_egp).toLocaleString()} EGP` : movie.genre?.join?.(', ')}
                  </p>

                </Link>
              ))}

            </div>

          </section>

        </div>
      </div>
    </Layout>
  )
}

export default Landing






// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { getFeaturedMovie,getCurrentMovies,getAllMovies,getEgyptianMovies } from '../../services/movieService'
// import { getCinemas } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import { FaArrowRight,FaStar,FaTicketAlt } from 'react-icons/fa'
// import styles from './Landing.module.css'

// import sceneLogo from '../../assets/cinemas/scene.png'
// import voxLogo from '../../assets/cinemas/vox.png'
// import renaissanceLogo from '../../assets/cinemas/renaissance.png'

// const cinemaList = [
//   { id: 1, name: "VOX Cinemas", logo: voxLogo },
//   { id: 2, name: "Scene Cinemas", logo: sceneLogo },
//   { id: 3, name: "Renaissance", logo: renaissanceLogo },
// ]

// const Landing = () => {
//   const [featured, setFeatured] = useState(null)
//   const [currentMovies, setCurrentMovies] = useState([])
//   const [libraryMovies, setLibraryMovies] = useState([])
//   const [cinemas, setCinemas] = useState([])
//   const [selectedCinema, setSelectedCinema] = useState(0)
//   const [highestGrossingMovie, setHighestGrossingMovie] = useState(null)

  
//   useEffect(() => {
//     const fetchLandingData = async () => {
//       try {
//         const featuredMovie = await getFeaturedMovie()
//         const current = await getCurrentMovies()
//         const allMovies = await getAllMovies()
//         const cinemaData = await getCinemas()

//         setFeatured(featuredMovie || null)
//         setCurrentMovies(Array.isArray(current) ? current : [])
//         setLibraryMovies(Array.isArray(allMovies) ? allMovies.slice(0, 4) : [])
//         setCinemas(Array.isArray(cinemaData) ? cinemaData : [])

//       } catch (error) {
//         console.error('Landing fetch error:', error)
//       }
//     }

//     fetchLandingData()
//   }, [])

//       const fetchHighestGrossingMovie = async () => {
//       const data = await getHighestGrossingEgyptianMovie()
//       setHighestGrossingMovie(data)
//     }

//     fetchHighestGrossingMovie()

//   return (
//     <Layout>
//       <div className={styles.landingPage}>

//         {/* ─── Hero Section ─── */}
//         {featured && (
//           <section className={styles.hero}>

//             <div className={styles.heroOverlay} />

//             <img
//               src={featured.image_url}
//               alt={featured.title}
//               className={styles.heroImage}
//               onError={(e) => {
//                 e.target.src =
//                   `https://placehold.co/1200x600/1a1a1a/cc0000?text=${encodeURIComponent(featured.title)}`
//               }}
//             />

//             <div className={styles.heroContent}>

//               <div className={styles.heroMeta}>
//                 <span className={styles.heroBadge}>Now Showing</span>
//                 <span className={styles.heroDate}>{featured.genre}</span>
//               </div>

//               <h1 className={styles.heroTitle}>{featured.title}</h1>

//               <p className={styles.heroSynopsis}>{featured.description}</p>

//               <div className={styles.heroActions}>
//                 <Link
//                   to={`/movies/${featured.id}/slots`}
//                   className={styles.bookBtn}
//                 >
//                   Book Tickets
//                 </Link>

//                 <Link
//                   to={`/movies/${featured.id}`}
//                   className={styles.detailsBtn}
//                 >
//                   More Info
//                 </Link>
//               </div>

//             </div>

//           </section>
//         )}

//         <div className={styles.pageContent}>

//           {/* ─── Now Showing ─── */}
//           <section className={styles.section}>

//             <div className={styles.sectionHeader}>
//               <h2 className={styles.sectionTitle}>Movies Now Playing</h2>
//               <Link to="/movies" className={styles.viewAllBtn}>
//                 View All <FaArrowRight />
//               </Link>
//             </div>

//             <div className={styles.moviesGrid}>
//               {currentMovies.map((movie) => (
//                 <Link
//                   to={`/movies/${movie.id}`}
//                   key={movie.id}
//                   className={styles.movieCard}
//                 >
//                   <div className={styles.moviePosterWrap}>
//                     <img
//                       src={movie.image_url}
//                       alt={movie.title}
//                       className={styles.moviePoster}
//                       onError={(e) => {
//                         e.target.src =
//                           `https://placehold.co/200x300/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//                       }}
//                     />

//                     <div className={styles.movieOverlay}>
//                       <span className={styles.bookNow}>Book Now</span>
//                     </div>
//                   </div>

//                   <p className={styles.movieTitle}>{movie.title}</p>
//                 </Link>
//               ))}
//             </div>

//           </section>

//           {/* ─── CINEMAS (FIXED) ─── */}
//           <section className={styles.section}>

//             <div className={styles.sectionHeader}>
//               <h2 className={styles.sectionTitle}>Book Cinema Tickets</h2>

//               <Link to="/booking" className={styles.bookTicketsBtn}>
//                 <FaTicketAlt /> Book Tickets
//               </Link>
//             </div>

//             <div className={styles.cinemasRow}>

//               {cinemaList.map((cinema) => (
//                 <div
//                   key={cinema.id}
//                   className={styles.cinemaLogoCard}
//                 >
//                   <img
//                     src={cinema.logo}
//                     alt={cinema.name}
//                     className={styles.cinemaLogoImage}
//                   />

//                   <p className={styles.cinemaName}>
//                     {cinema.name}
//                   </p>
//                 </div>
//               ))}

//             </div>

//           </section>

//           {/* ─── Highest Grossing ─── */}
//           <section className={styles.section}>

//             <div className={styles.sectionHeader}>
//               <h2 className={styles.sectionTitle}>
//                 Highest-Grossing Egyptian Films
//               </h2>

//               <Link to="/library" className={styles.viewAllBtn}>
//                 View All <FaArrowRight />
//               </Link>
//             </div>

//             <div className={styles.libraryGrid}>
//               {libraryMovies.map((movie) => (
//                 <Link
//                   to={`/movies/${movie.id}`}
//                   key={movie.id}
//                   className={styles.libraryCard}
//                 >
//                   <div className={styles.libraryPosterWrap}>
//                     <img
//                       src={movie.image_url}
//                       alt={movie.title}
//                       className={styles.libraryPoster}
//                       onError={(e) => {
//                         e.target.src =
//                           `https://placehold.co/160x240/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//                       }}
//                     />

//                     <div className={styles.libraryOverlay}>
//                       <span className={styles.movieRating}>
//                         <FaStar /> {movie.rating}
//                       </span>
//                     </div>

//                   </div>

//                   <p className={styles.libraryTitle}>{movie.title}</p>
//                   <p className={styles.libraryYear}>{movie.genre}</p>

//                 </Link>
//               ))}
//             </div>

//           </section>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Landing










