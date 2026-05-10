import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import {
  getMoviesInCinemas,
  getFeaturedMovie
} from '../../services/movieService'

import { getCinemas } from '../../services/bookingService'

import Layout from '../../components/Layout/Layout'
import styles from './CurrentMovies.module.css'

const GENRES = [
  'All',
  'Comedy',
  'Action',
  'Horror',
  'Drama',
  'Sci-Fi',
  'Animation',
  'Romance'
]

const CurrentMovies = () => {
  const [movies, setMovies] = useState([])
  const [filtered, setFiltered] = useState([])
  const [featured, setFeatured] = useState(null)
  const [cinemas, setCinemas] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [loading, setLoading] = useState(true)

  // ─────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [
          currentMoviesData,
          featuredMovieData,
          cinemasData
        ] = await Promise.all([
          getMoviesInCinemas(),
          getFeaturedMovie(),
          getCinemas()
        ])

        setMovies(currentMoviesData)
        setFiltered(currentMoviesData)

        // normalize featured movie
        if (featuredMovieData) {
          setFeatured({
            ...featuredMovieData,

            poster:
              featuredMovieData.poster ||
              featuredMovieData.poster_url ||
              featuredMovieData.image_url,

            backdrop:
              featuredMovieData.backdrop_url ||
              featuredMovieData.wide_poster_url ||
              featuredMovieData.poster_url ||
              featuredMovieData.image_url,

            featured: featuredMovieData.is_featured,

            releaseDate: featuredMovieData.release_year,

            genre: Array.isArray(featuredMovieData.genre)
              ? featuredMovieData.genre
              : featuredMovieData.genre
                ? featuredMovieData.genre.split(',').map((g) => g.trim())
                : []
          })
        }

        setCinemas(cinemasData || [])

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ─────────────────────────────────────
  // FILTER
  // ─────────────────────────────────────
  useEffect(() => {
    let results = [...movies]

    // genre filter
    if (selectedGenre !== 'All') {
      results = results.filter((movie) =>
        movie.genre
          ?.map((g) => g.toLowerCase())
          .includes(selectedGenre.toLowerCase())
      )
    }

    setFiltered(results)

  }, [selectedGenre, movies])

  return (
    <Layout>
      <div className={styles.currentMoviesPage}>

        {/* ─── Hero Featured Movie ─── */}
        {featured && (
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />

            <img
              src={featured.backdrop || featured.poster}
              alt={featured.title}
              className={styles.heroImage}
              onError={(e) => {
                e.target.src =
                  `https://placehold.co/1200x500/1a1a1a/cc0000?text=${encodeURIComponent(featured.title)}`
              }}
            />

            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>
                Now Showing
              </span>

              <h1 className={styles.heroTitle}>
                {featured.title}
              </h1>

              {featured.titleAr && (
                <p className={styles.heroTitleAr}>
                  {featured.titleAr}
                </p>
              )}

              <p className={styles.heroDate}>
                {featured.releaseDate}
              </p>

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
          </div>
        )}

        <div className={styles.inner}>

          {/* ─── Filters ─── */}
          <div className={styles.filtersBar}>

            
            {/* Genre Filter */}
            <div className={styles.genreFilter}>
              <span className={styles.filterLabel}>
                Genre:
              </span>

              <div className={styles.genreButtons}>
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    className={`${styles.genreBtn} ${
                      selectedGenre === genre
                        ? styles.genreBtnActive
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedGenre(genre)
                    }
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Loading */}
          {loading ? (
            <div className={styles.noResults}>
              <p>Loading movies...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <p className={styles.resultsCount}>
                {filtered.length} movie
                {filtered.length !== 1 ? 's' : ''}
                {' '}showing now
              </p>

              {/* Movies Grid */}
              {filtered.length > 0 ? (
                <div className={styles.moviesGrid}>

                  {filtered.map((movie) => (
                    <div
                      key={movie.id}
                      className={styles.movieCard}
                    >

                      {/* Poster */}
                      <div className={styles.posterWrap}>

                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className={styles.poster}
                          onError={(e) => {
                            e.target.src =
                              `https://placehold.co/220x330/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
                          }}
                        />

                        {/* Hover Overlay */}
                        <div className={styles.posterOverlay}>

                          <Link
                            to={`/movies/${movie.id}/slots`}
                            className={styles.bookNowBtn}
                          >
                            Book Now
                          </Link>

                          <Link
                            to={`/movies/${movie.id}`}
                            className={styles.detailsLink}
                          >
                            Details
                          </Link>

                        </div>

                        {/* Featured Badge */}
                        {movie.featured && (
                          <span className={styles.featuredBadge}>
                            Featured
                          </span>
                        )}

                      </div>

                      {/* Info */}
                      <div className={styles.movieInfo}>

                        <p className={styles.movieTitle}>
                          {movie.title}
                        </p>

                        {movie.titleAr && (
                          <p className={styles.movieTitleAr}>
                            {movie.titleAr}
                          </p>
                        )}

                        <div className={styles.movieTags}>
                          {movie.genre
                            ?.slice(0, 2)
                            .map((g) => (
                              <span
                                key={g}
                                className={styles.genreTag}
                              >
                                {g}
                              </span>
                            ))}
                        </div>

                        <p className={styles.movieLanguage}>
                          {movie.language}
                        </p>

                      </div>

                    </div>
                  ))}

                </div>
              ) : (
                <div className={styles.noResults}>

                  <p>
                    No movies found for the selected filters.
                  </p>

                  <button
                    className={styles.resetBtn}
                    onClick={() => {
                      setSelectedGenre('All')
                    }}
                  >
                    Clear Filters
                  </button>

                </div>
              )}
            </>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default CurrentMovies


















// // const CurrentMovies = () => <div>CurrentMovies</div>; export default CurrentMovies;
// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { getCurrentMovies, getFeaturedMovie } from '../../services/movieService'
// import { getCinemas } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import styles from './CurrentMovies.module.css'

// const GENRES = ['All', 'Comedy', 'Action', 'Horror', 'Drama', 'Sci-Fi', 'Animation', 'Romance']

// const CurrentMovies = () => {
//   const [movies, setMovies] = useState([])
//   const [filtered, setFiltered] = useState([])
//   const [featured, setFeatured] = useState(null)
//   const [cinemas, setCinemas] = useState([])
//   const [selectedGenre, setSelectedGenre] = useState('All')
//   const [selectedCinema, setSelectedCinema] = useState('All')

//   useEffect(() => {
//     const data = getCurrentMovies()
//     setMovies(data)
//     setFiltered(data)
//     setFeatured(getFeaturedMovie())
//     setCinemas(getCinemas())
//   }, [])

//   // ─── Filter ───
//   useEffect(() => {
//     let results = movies
//     if (selectedGenre !== 'All') {
//       results = results.filter((m) =>
//         m.genre.map((g) => g.toLowerCase()).includes(selectedGenre.toLowerCase())
//       )
//     }
//     setFiltered(results)
//   }, [selectedGenre, movies])

//   return (
//     <Layout>
//       <div className={styles.currentMoviesPage}>

//         {/* ─── Hero Featured Movie ─── */}
//         {featured && (
//           <div className={styles.hero}>
//             <div className={styles.heroOverlay} />
//             <img
//               src={featured.backdrop || featured.poster}
//               alt={featured.title}
//               className={styles.heroImage}
//               onError={(e) => {
//                 e.target.src = `https://placehold.co/1200x500/1a1a1a/cc0000?text=${encodeURIComponent(featured.title)}`
//               }}
//             />
//             <div className={styles.heroContent}>
//               <span className={styles.heroBadge}>Now Showing</span>
//               <h1 className={styles.heroTitle}>{featured.title}</h1>
//               {featured.titleAr && (
//                 <p className={styles.heroTitleAr}>{featured.titleAr}</p>
//               )}
//               <p className={styles.heroDate}>{featured.releaseDate}</p>
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
//           </div>
//         )}

//         <div className={styles.inner}>

//           {/* ─── Cinema Filter ─── */}
//           <div className={styles.filtersBar}>
//             <div className={styles.cinemaFilter}>
//               <span className={styles.filterLabel}>Cinema:</span>
//               <div className={styles.cinemaButtons}>
//                 <button
//                   className={`${styles.cinemaBtn} ${selectedCinema === 'All' ? styles.cinemaBtnActive : ''}`}
//                   onClick={() => setSelectedCinema('All')}
//                 >
//                   All
//                 </button>
//                 {cinemas.map((cinema) => (
//                   <button
//                     key={cinema.id}
//                     className={`${styles.cinemaBtn} ${selectedCinema === cinema.name ? styles.cinemaBtnActive : ''}`}
//                     onClick={() => setSelectedCinema(cinema.name)}
//                   >
//                     {cinema.name}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Genre Filter */}
//             <div className={styles.genreFilter}>
//               <span className={styles.filterLabel}>Genre:</span>
//               <div className={styles.genreButtons}>
//                 {GENRES.map((genre) => (
//                   <button
//                     key={genre}
//                     className={`${styles.genreBtn} ${selectedGenre === genre ? styles.genreBtnActive : ''}`}
//                     onClick={() => setSelectedGenre(genre)}
//                   >
//                     {genre}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* ─── Results Count ─── */}
//           <p className={styles.resultsCount}>
//             {filtered.length} movie{filtered.length !== 1 ? 's' : ''} showing now
//           </p>

//           {/* ─── Movies Grid ─── */}
//           {filtered.length > 0 ? (
//             <div className={styles.moviesGrid}>
//               {filtered.map((movie) => (
//                 <div key={movie.id} className={styles.movieCard}>

//                   {/* Poster */}
//                   <div className={styles.posterWrap}>
//                     <img
//                       src={movie.poster}
//                       alt={movie.title}
//                       className={styles.poster}
//                       onError={(e) => {
//                         e.target.src = `https://placehold.co/220x330/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//                       }}
//                     />

//                     {/* Hover Overlay */}
//                     <div className={styles.posterOverlay}>
//                       <Link
//                         to={`/movies/${movie.id}/slots`}
//                         className={styles.bookNowBtn}
//                       >
//                         Book Now
//                       </Link>
//                       <Link
//                         to={`/movies/${movie.id}`}
//                         className={styles.detailsLink}
//                       >
//                         Details
//                       </Link>
//                     </div>

//                     {/* Featured badge */}
//                     {movie.featured && (
//                       <span className={styles.featuredBadge}>Featured</span>
//                     )}
//                   </div>

//                   {/* Info */}
//                   <div className={styles.movieInfo}>
//                     <p className={styles.movieTitle}>{movie.title}</p>
//                     {movie.titleAr && (
//                       <p className={styles.movieTitleAr}>{movie.titleAr}</p>
//                     )}
//                     <div className={styles.movieTags}>
//                       {movie.genre.slice(0, 2).map((g) => (
//                         <span key={g} className={styles.genreTag}>{g}</span>
//                       ))}
//                     </div>
//                     <p className={styles.movieLanguage}>{movie.language}</p>
//                   </div>

//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className={styles.noResults}>
//               <p>No movies found for the selected filters.</p>
//               <button
//                 className={styles.resetBtn}
//                 onClick={() => {
//                   setSelectedGenre('All')
//                   setSelectedCinema('All')
//                 }}
//               >
//                 Clear Filters
//               </button>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default CurrentMovies
