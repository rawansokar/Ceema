import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import {
  getMovieLibrary,
  getMovieFilters,
  searchMoviesAPI
} from '../../services/movieService'

import Layout from '../../components/Layout/Layout'
import styles from './MovieLibrary.module.css'

const MovieLibrary = () => {

  const [movies, setMovies] = useState([])
  const [filtered, setFiltered] = useState([])

  const [genre, setGenre] = useState('All')
  const [language, setLanguage] = useState('All')
  const [year, setYear] = useState('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState({
    genres: [],
    languages: [],
    years: [],
  })

  // ─────────────────────────────
  // LOAD MOVIES (NOW PLAYING)
  // ─────────────────────────────
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)

        const [data, options] = await Promise.all([
          getMovieLibrary(),
          getMovieFilters(),
        ])

        setMovies(data)
        setFiltered(data)
        setFilterOptions(options)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  // ─────────────────────────────
  // APPLY FILTERS (CLIENT SIDE)
  // ─────────────────────────────
  const handleApplyFilters = async () => {
    let results = [...movies]

    // SEARCH (API)
    if (query.trim()) {
      results = await searchMoviesAPI(query)
      results = results.filter((movie) => !movie.is_in_cinemas)
    }

    // GENRE
    if (genre !== 'All') {
      results = results.filter((m) =>
        m.genre?.map((g) => g.toLowerCase()).includes(genre.toLowerCase())
      )
    }

    // LANGUAGE
    if (language !== 'All') {
      results = results.filter(
        (m) => m.language?.toLowerCase() === language.toLowerCase()
      )
    }

    // YEAR
    if (year !== 'All') {
      results = results.filter(
        (m) => Number(m.year) === Number(year)
      )
    }

    setFiltered(results)
  }

  // ─────────────────────────────
  // RESET
  // ─────────────────────────────
  const handleReset = async () => {
    setGenre('All')
    setLanguage('All')
    setYear('All')
    setQuery('')

    const data = await getMovieLibrary()
    setFiltered(data)
  }

  // ─────────────────────────────
  // LIVE SEARCH
  // ─────────────────────────────
  const handleSearch = async (e) => {
    const val = e.target.value
    setQuery(val)

    if (!val.trim()) {
      setFiltered(movies)
      return
    }

    const results = await searchMoviesAPI(val)
    setFiltered(results.filter((movie) => !movie.is_in_cinemas))
  }

  return (
    <Layout>
      <div className={styles.libraryPage}>

        {/* ─── Hero ─── */}
        <div className={styles.heroBanner}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Movies Library</h1>
          </div>
        </div>

        <div className={styles.inner}>

          <p className={styles.subtitle}>
            Discover New & Popular Movies
          </p>

          {/* ─── FILTERS ─── */}
          <div className={styles.filtersRow}>

            <select
              className={styles.filterSelect}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {['All', ...(filterOptions.genres || [])].map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? 'Genre ▾' : g}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {['All', ...(filterOptions.languages || [])].map((l) => (
                <option key={l} value={l}>
                  {l === 'All' ? 'Language ▾' : l}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {['All', ...(filterOptions.years || [])].map((y) => (
                <option key={y} value={y}>
                  {y === 'All' ? 'Year ▾' : y}
                </option>
              ))}
            </select>

            <button
              className={styles.applyBtn}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>

            {(genre !== 'All' || language !== 'All' || year !== 'All' || query) && (
              <button
                className={styles.resetBtn}
                onClick={handleReset}
              >
                Reset
              </button>
            )}

          </div>

         

          {/* ─── RESULTS ─── */}
          <p className={styles.resultsCount}>
            {filtered.length} movie{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* ─── GRID ─── */}
          {loading ? (
            <div className={styles.noResults}>
              <p>Loading movies...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.moviesGrid}>

              {filtered.map((movie) => (
                <Link
                  to={`/movies/${movie.id}`}
                  key={movie.id}
                  className={styles.movieCard}
                >

                  <div className={styles.posterWrap}>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className={styles.poster}
                      onError={(e) => {
                        e.target.src =
                          `https://placehold.co/200x300/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
                      }}
                    />

                    <div className={styles.posterOverlay}>
                      <span className={styles.rating}>
                        ★ {movie.rating}
                      </span>
                      <span className={styles.viewBtn}>
                        View Details
                      </span>
                    </div>

                  </div>

                  <div className={styles.movieInfo}>
                    <p className={styles.movieTitle}>
                      {movie.title}
                    </p>

                    {movie.titleAr && (
                      <p className={styles.movieTitleAr}>
                        {movie.titleAr}
                      </p>
                    )}

                    <div className={styles.movieMeta}>
                      <span>{movie.year}</span>
                      <span>{movie.language}</span>
                    </div>

                  </div>

                </Link>
              ))}

            </div>
          ) : (
            <div className={styles.noResults}>
              <p>No movies found matching your filters.</p>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default MovieLibrary

















// // const MovieLibrary = () => <div>MovieLibrary</div>; export default MovieLibrary;
// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { getAllMovies, filterMovies, searchMovies } from '../../services/movieService'
// import Layout from '../../components/Layout/Layout'
// import styles from './MovieLibrary.module.css'

// const GENRES = ['All', 'Drama', 'Romance', 'Comedy', 'Action', 'Horror', 'Sci-Fi', 'Animation', 'Crime', 'Music']
// const LANGUAGES = ['All', 'English', 'Arabic', 'French']
// const YEARS = ['All', '2022', '2016', '2014', '2010', '1999', '1997', '1994', '1957']

// const MovieLibrary = () => {
//   const [movies, setMovies] = useState([])
//   const [filtered, setFiltered] = useState([])
//   const [genre, setGenre] = useState('All')
//   const [language, setLanguage] = useState('All')
//   const [year, setYear] = useState('All')
//   const [query, setQuery] = useState('')

//   useEffect(() => {
//     const all = getAllMovies()
//     setMovies(all)
//     setFiltered(all)
//   }, [])

//   // ─── Apply Filters ───
//   const handleApplyFilters = () => {
//     let results = getAllMovies()

//     if (query.trim()) {
//       results = searchMovies(query)
//     }

//     if (genre !== 'All') {
//       results = results.filter((m) =>
//         m.genre.map((g) => g.toLowerCase()).includes(genre.toLowerCase())
//       )
//     }

//     if (language !== 'All') {
//       results = results.filter(
//         (m) => m.language.toLowerCase() === language.toLowerCase()
//       )
//     }

//     if (year !== 'All') {
//       results = results.filter((m) => m.year === Number(year))
//     }

//     setFiltered(results)
//   }

//   // ─── Reset Filters ───
//   const handleReset = () => {
//     setGenre('All')
//     setLanguage('All')
//     setYear('All')
//     setQuery('')
//     setFiltered(movies)
//   }

//   // ─── Live Search ───
//   const handleSearch = (e) => {
//     const val = e.target.value
//     setQuery(val)
//     if (!val.trim()) {
//       setFiltered(movies)
//       return
//     }
//     setFiltered(searchMovies(val))
//   }

//   return (
//     <Layout>
//       <div className={styles.libraryPage}>

//         {/* ─── Hero Banner ─── */}
//         <div className={styles.heroBanner}>
//           <div className={styles.heroOverlay} />
//           <div className={styles.heroContent}>
//             <h1 className={styles.heroTitle}>Movies Library</h1>
//           </div>
//         </div>

//         <div className={styles.inner}>

//           {/* ─── Subtitle ─── */}
//           <p className={styles.subtitle}>Discover New & Popular Movies</p>

//           {/* ─── Filters ─── */}
//           <div className={styles.filtersRow}>

//             {/* Genre */}
//             <select
//               className={styles.filterSelect}
//               value={genre}
//               onChange={(e) => setGenre(e.target.value)}
//             >
//               {GENRES.map((g) => (
//                 <option key={g} value={g}>{g === 'All' ? 'Genre ▾' : g}</option>
//               ))}
//             </select>

//             {/* Language */}
//             <select
//               className={styles.filterSelect}
//               value={language}
//               onChange={(e) => setLanguage(e.target.value)}
//             >
//               {LANGUAGES.map((l) => (
//                 <option key={l} value={l}>{l === 'All' ? 'Language ▾' : l}</option>
//               ))}
//             </select>

//             {/* Year */}
//             <select
//               className={styles.filterSelect}
//               value={year}
//               onChange={(e) => setYear(e.target.value)}
//             >
//               {YEARS.map((y) => (
//                 <option key={y} value={y}>{y === 'All' ? 'Year ▾' : y}</option>
//               ))}
//             </select>

//             {/* Apply Button */}
//             <button className={styles.applyBtn} onClick={handleApplyFilters}>
//               Apply Filters
//             </button>

//             {/* Reset */}
//             {(genre !== 'All' || language !== 'All' || year !== 'All' || query) && (
//               <button className={styles.resetBtn} onClick={handleReset}>
//                 Reset
//               </button>
//             )}

//           </div>

//           {/* ─── Search ─── */}
//           <input
//             type="text"
//             placeholder="Search movies by title..."
//             className={styles.searchInput}
//             value={query}
//             onChange={handleSearch}
//           />

//           {/* ─── Results Count ─── */}
//           <p className={styles.resultsCount}>
//             {filtered.length} movie{filtered.length !== 1 ? 's' : ''} found
//           </p>

//           {/* ─── Movies Grid ─── */}
//           {filtered.length > 0 ? (
//             <div className={styles.moviesGrid}>
//               {filtered.map((movie) => (
//                 <Link
//                   to={`/movies/${movie.id}`}
//                   key={movie.id}
//                   className={styles.movieCard}
//                 >
//                   {/* Poster */}
//                   <div className={styles.posterWrap}>
//                     <img
//                       src={movie.poster}
//                       alt={movie.title}
//                       className={styles.poster}
//                       onError={(e) => {
//                         e.target.src = `https://placehold.co/200x300/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//                       }}
//                     />
//                     {/* Hover Overlay */}
//                     <div className={styles.posterOverlay}>
//                       <span className={styles.rating}>★ {movie.rating}</span>
//                       <span className={styles.viewBtn}>View Details</span>
//                     </div>
//                   </div>

//                   {/* Info */}
//                   <div className={styles.movieInfo}>
//                     <p className={styles.movieTitle}>{movie.title}</p>
//                     {movie.titleAr && (
//                       <p className={styles.movieTitleAr}>{movie.titleAr}</p>
//                     )}
//                     <div className={styles.movieMeta}>
//                       <span className={styles.movieYear}>{movie.year}</span>
//                       <span className={styles.movieLang}>{movie.language}</span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           ) : (
//             <div className={styles.noResults}>
//               <p>No movies found matching your filters.</p>
//               <button className={styles.resetBtn} onClick={handleReset}>
//                 Clear Filters
//               </button>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieLibrary
