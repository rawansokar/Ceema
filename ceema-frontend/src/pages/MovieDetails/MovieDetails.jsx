import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getMovieById
} from '../../services/movieService'

import Layout from '../../components/Layout/Layout'

import {
  FaStar,
  FaClock,
  FaFilm,
  FaBookmark
} from 'react-icons/fa'

import styles from './MovieDetails.module.css'

const MovieDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('about')
  const [inWatchlist, setInWatchlist] = useState(false)

  // ─────────────────────────────────────
  // FETCH MOVIE
  // ─────────────────────────────────────
  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true)

      const foundMovie = await getMovieById(id)

      if (!foundMovie) {
        navigate('/movies')
        return
      }

      setMovie(foundMovie)
      setLoading(false)

      window.scrollTo(0, 0)
    }

    fetchMovie()
  }, [id, navigate])

  if (loading) {
    return (
      <Layout showBack={true}>
        <div className={styles.loading}>
          Loading movie details...
        </div>
      </Layout>
    )
  }

  if (!movie) return null

  const genres = Array.isArray(movie.genre)
    ? movie.genre
    : movie.genre
      ? String(movie.genre).split(',').map((g) => g.trim()).filter(Boolean)
      : []
  const poster = movie.poster || movie.poster_url || movie.image_url
  const backdrop = movie.backdrop || movie.backdrop_url || movie.wide_poster_url || poster
  const canBook = movie.is_in_cinemas || movie.is_now_playing

  return (
    <Layout showBack={true}>
      <div className={styles.detailsPage}>

        {/* ───────────────── BACKDROP ───────────────── */}
        <div className={styles.backdrop}>
          <img
            src={backdrop}
            alt={movie.title}
            className={styles.backdropImg}
          />

          <div className={styles.backdropOverlay} />
        </div>

        <div className={styles.inner}>

          {/* ───────────────── MAIN CARD ───────────────── */}
          <div className={styles.mainCard}>

            {/* Poster */}
            <div className={styles.posterBlock}>
              <img
                src={poster}
                alt={movie.title}
                className={styles.poster}
              />
            </div>

            {/* Info */}
            <div className={styles.infoBlock}>

              {/* Title */}
              <div className={styles.titleBlock}>
                <h1 className={styles.movieTitle}>
                  {movie.title}
                </h1>
              </div>

              {/* Meta */}
              <div className={styles.metaRow}>

                <span className={styles.metaTag}>
                  <FaClock />
                  {movie.duration} min
                </span>

                <span className={styles.metaTag}>
                  <FaFilm />
                  {genres.join(', ')}
                </span>

                <span className={styles.ratingTag}>
                  <FaStar />
                  {movie.rating}/10
                </span>

              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className={styles.genreRow}>
                  {genres.map((g) => (
                      <span
                        key={g}
                        className={styles.genreTag}
                      >
                        {g}
                      </span>
                    ))}
                </div>
              )}

              {/* Description */}
              <p className={styles.synopsis}>
                {movie.description}
              </p>

              {/* Actions */}
              <div className={styles.actions}>

                {canBook ? (
                  <Link
                    to={`/movies/${movie.id}/slots`}
                    className={styles.bookBtn}
                  >
                    Book Tickets
                  </Link>
                ) : (
                  <span className={styles.bookBtn}>
                    Not Showing Now
                  </span>
                )}


              </div>

            </div>

          </div>

          {/* ───────────────── TABS ───────────────── */}
          <div className={styles.tabs}>

            {['about', 'reviews'].map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${
                  tab === t
                    ? styles.tabActive
                    : ''
                }`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() +
                  t.slice(1)}
              </button>
            ))}

          </div>

          {/* ───────────────── ABOUT ───────────────── */}
          {tab === 'about' && (
            <div className={styles.tabContent}>

              <div className={styles.aboutGrid}>

                <div className={styles.aboutCard}>
                  <h3 className={styles.aboutTitle}>
                    Story
                  </h3>

                  <p className={styles.aboutText}>
                    {movie.description}
                  </p>
                </div>

                <div className={styles.aboutCard}>
                  <h3 className={styles.aboutTitle}>
                    Details
                  </h3>

                  <div className={styles.detailsList}>

                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>
                        Duration
                      </span>

                      <span className={styles.detailVal}>
                        {movie.duration} min
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>
                        Genre
                      </span>

                      <span className={styles.detailVal}>
                        {genres.join(', ')}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>
                        Rating
                      </span>

                      <span className={styles.detailVal}>
                        {movie.rating}/10
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ───────────────── REVIEWS ───────────────── */}
          {tab === 'reviews' && (
            <div className={styles.tabContent}>

              <div className={styles.reviewsPlaceholder}>

                <p className={styles.reviewsText}>
                  Reviews will be available soon.
                </p>

                <Link
                  to="/feed"
                  className={styles.feedLink}
                >
                  Share your thoughts →
                </Link>

              </div>

            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default MovieDetails
























// // const MovieDetails = () => <div>MovieDetails</div>; export default MovieDetails;
// import { useState, useEffect } from 'react'
// import { useParams, Link, useNavigate } from 'react-router-dom'
// import { getMovieById } from '../../services/movieService'
// import { getCurrentMovies } from '../../services/movieService'
// import Layout from '../../components/Layout/Layout'
// import styles from './MovieDetails.module.css'

// const MovieDetails = () => {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const [movie, setMovie] = useState(null)
//   const [tab, setTab] = useState('about')
//   const [inWatchlist, setInWatchlist] = useState(false)

//   useEffect(() => {
//     // search in both library and current movies
//     let found = getMovieById(id)
//     if (!found) {
//       const current = getCurrentMovies()
//       found = current.find((m) => m.id === Number(id))
//     }
//     if (!found) {
//       navigate('/movies')
//       return
//     }
//     setMovie(found)
//     window.scrollTo(0, 0)
//   }, [id, navigate])

//   if (!movie) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.detailsPage}>

//         {/* ─── Backdrop ─── */}
//         <div className={styles.backdrop}>
//           <img
//             src={movie.backdrop || movie.poster}
//             alt={movie.title}
//             className={styles.backdropImg}
//             onError={(e) => {
//               e.target.src = `https://placehold.co/1200x400/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//             }}
//           />
//           <div className={styles.backdropOverlay} />
//         </div>

//         <div className={styles.inner}>

//           {/* ─── Main Info Card ─── */}
//           <div className={styles.mainCard}>

//             {/* Poster */}
//             <div className={styles.posterBlock}>
//               <img
//                 src={movie.poster}
//                 alt={movie.title}
//                 className={styles.poster}
//                 onError={(e) => {
//                   e.target.src = `https://placehold.co/220x330/1a1a1a/cc0000?text=${encodeURIComponent(movie.title)}`
//                 }}
//               />
//             </div>

//             {/* Info */}
//             <div className={styles.infoBlock}>

//               {/* Title */}
//               <div className={styles.titleBlock}>
//                 <h1 className={styles.movieTitle}>{movie.title}</h1>
//                 {movie.titleAr && (
//                   <p className={styles.movieTitleAr}>{movie.titleAr}</p>
//                 )}
//               </div>

//               {/* Meta Row */}
//               <div className={styles.metaRow}>
//                 {movie.year && (
//                   <span className={styles.metaTag}>{movie.year}</span>
//                 )}
//                 {movie.rated && (
//                   <span className={styles.metaTag}>{movie.rated}</span>
//                 )}
//                 {movie.duration && (
//                   <span className={styles.metaTag}>{movie.duration}</span>
//                 )}
//                 {movie.rating && (
//                   <span className={styles.ratingTag}>★ {movie.rating}/10</span>
//                 )}
//               </div>

//               {/* Genres */}
//               {movie.genre && (
//                 <div className={styles.genreRow}>
//                   {movie.genre.map((g) => (
//                     <span key={g} className={styles.genreTag}>{g}</span>
//                   ))}
//                 </div>
//               )}

//               {/* Synopsis */}
//               <p className={styles.synopsis}>{movie.synopsis}</p>

//               {/* Crew */}
//               <div className={styles.crewGrid}>
//                 {movie.director && (
//                   <div className={styles.crewItem}>
//                     <span className={styles.crewLabel}>Director</span>
//                     <span className={styles.crewValue}>{movie.director}</span>
//                   </div>
//                 )}
//                 {movie.writer && (
//                   <div className={styles.crewItem}>
//                     <span className={styles.crewLabel}>Writer</span>
//                     <span className={styles.crewValue}>{movie.writer}</span>
//                   </div>
//                 )}
//                 {movie.stars && (
//                   <div className={styles.crewItem}>
//                     <span className={styles.crewLabel}>Stars</span>
//                     <span className={styles.crewValue}>
//                       {movie.stars.join(', ')}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {/* Actions */}
//               <div className={styles.actions}>
//                 <Link
//                   to={`/movies/${movie.id}/slots`}
//                   className={styles.bookBtn}
//                 >
//                   Book Tickets
//                 </Link>
//                 <button
//                   className={`${styles.watchlistBtn} ${inWatchlist ? styles.watchlistActive : ''}`}
//                   onClick={() => setInWatchlist(!inWatchlist)}
//                 >
//                   {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
//                 </button>
//               </div>

//             </div>

//           </div>

//           {/* ─── Tabs ─── */}
//           <div className={styles.tabs}>
//             {['about', 'cast', 'reviews'].map((t) => (
//               <button
//                 key={t}
//                 className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
//                 onClick={() => setTab(t)}
//               >
//                 {t.charAt(0).toUpperCase() + t.slice(1)}
//               </button>
//             ))}
//           </div>

//           {/* ─── About Tab ─── */}
//           {tab === 'about' && (
//             <div className={styles.tabContent}>
//               <div className={styles.aboutGrid}>
//                 <div className={styles.aboutCard}>
//                   <h3 className={styles.aboutTitle}>Story</h3>
//                   <p className={styles.aboutText}>{movie.synopsis}</p>
//                 </div>
//                 <div className={styles.aboutCard}>
//                   <h3 className={styles.aboutTitle}>Details</h3>
//                   <div className={styles.detailsList}>
//                     {movie.year && (
//                       <div className={styles.detailRow}>
//                         <span className={styles.detailKey}>Year</span>
//                         <span className={styles.detailVal}>{movie.year}</span>
//                       </div>
//                     )}
//                     {movie.language && (
//                       <div className={styles.detailRow}>
//                         <span className={styles.detailKey}>Language</span>
//                         <span className={styles.detailVal}>{movie.language}</span>
//                       </div>
//                     )}
//                     {movie.rated && (
//                       <div className={styles.detailRow}>
//                         <span className={styles.detailKey}>Rating</span>
//                         <span className={styles.detailVal}>{movie.rated}</span>
//                       </div>
//                     )}
//                     {movie.duration && (
//                       <div className={styles.detailRow}>
//                         <span className={styles.detailKey}>Duration</span>
//                         <span className={styles.detailVal}>{movie.duration}</span>
//                       </div>
//                     )}
//                     {movie.genre && (
//                       <div className={styles.detailRow}>
//                         <span className={styles.detailKey}>Genre</span>
//                         <span className={styles.detailVal}>{movie.genre.join(', ')}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ─── Cast Tab ─── */}
//           {tab === 'cast' && (
//             <div className={styles.tabContent}>
//               <div className={styles.castGrid}>
//                 {/* Director */}
//                 {movie.director && (
//                   <div className={styles.castCard}>
//                     <div className={styles.castAvatar}>
//                       {movie.director.charAt(0)}
//                     </div>
//                     <p className={styles.castName}>{movie.director}</p>
//                     <span className={styles.castRole}>Director</span>
//                   </div>
//                 )}
//                 {/* Writer */}
//                 {movie.writer && (
//                   <div className={styles.castCard}>
//                     <div className={styles.castAvatar}>
//                       {movie.writer.charAt(0)}
//                     </div>
//                     <p className={styles.castName}>{movie.writer}</p>
//                     <span className={styles.castRole}>Writer</span>
//                   </div>
//                 )}
//                 {/* Stars */}
//                 {movie.stars &&
//                   movie.stars.map((star) => (
//                     <div key={star} className={styles.castCard}>
//                       <div className={styles.castAvatar}>{star.charAt(0)}</div>
//                       <p className={styles.castName}>{star}</p>
//                       <span className={styles.castRole}>Actor</span>
//                     </div>
//                   ))}
//               </div>
//             </div>
//           )}

//           {/* ─── Reviews Tab ─── */}
//           {tab === 'reviews' && (
//             <div className={styles.tabContent}>
//               <div className={styles.reviewsPlaceholder}>
//                 <p className={styles.reviewsText}>
//                   User reviews will be available when the backend API is connected. 🔌
//                 </p>
//                 <Link to="/feed" className={styles.feedLink}>
//                   Share your thoughts on the Feed →
//                 </Link>
//               </div>
//             </div>
//           )}

//           {/* ─── More Like This ─── */}
//           <div className={styles.moreLikeThis}>
//             <h2 className={styles.moreTitle}>More Like This</h2>
//             <div className={styles.moreGrid}>
//               {[1, 2, 3, 4].map((i) => {
//                 const related = getMovieById(i)
//                 if (!related || related.id === movie.id) return null
//                 return (
//                   <Link
//                     to={`/movies/${related.id}`}
//                     key={related.id}
//                     className={styles.moreCard}
//                   >
//                     <div className={styles.morePosterWrap}>
//                       <img
//                         src={related.poster}
//                         alt={related.title}
//                         className={styles.morePoster}
//                         onError={(e) => {
//                           e.target.src = `https://placehold.co/160x240/1a1a1a/cc0000?text=${encodeURIComponent(related.title)}`
//                         }}
//                       />
//                       <div className={styles.moreOverlay}>
//                         <span className={styles.moreRating}>★ {related.rating}</span>
//                       </div>
//                     </div>
//                     <p className={styles.moreMovieTitle}>{related.title}</p>
//                     <p className={styles.moreYear}>{related.year}</p>
//                   </Link>
//                 )
//               })}
//             </div>
//           </div>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default MovieDetails
