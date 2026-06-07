import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  FaBan,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaComments,
  FaFilm,
  FaFlag,
  FaPlus,
  FaSyncAlt,
  FaTicketAlt,
  FaTrash,
  FaUsers,
} from 'react-icons/fa'
import Layout from '../../components/Layout/Layout'
import {
  banUser,
  createMovie,
  createReport,
  createShowtime,
  deleteAdminPost,
  deleteAdminUser,
  deleteMovie,
  deleteReport,
  deleteShowtime,
  getAdminUsers,
  getReports,
  getUsersStatistics,
  patchMovie,
  reviewReport,
  unbanUser,
} from '../../services/adminService'
import { getAllMovies } from '../../services/movieService'
import { getAllShowtimes } from '../../services/bookingService'
import { getFeedPosts } from '../../services/feedService'
import styles from './AdminDashboard.module.css'

const tabs = ['Overview', 'Users', 'Movies', 'Showtimes', 'Posts', 'Reports']

const emptyMovieForm = {
  title: '',
  description: '',
  duration: 100,
  genre: 'Drama',
  language: 'English',
  release_year: new Date().getFullYear(),
  country: 'Egypt',
  poster_url: '',
  image_url: '',
  backdrop_url: '',
  trailer_url: '',
  rating: '7.0',
  is_featured: false,
  is_now_playing: false,
  is_coming_soon: false,
  is_in_cinemas: false,
}

const emptyShowtimeForm = {
  movie: '',
  date: '',
  time: '',
  hall: '',
  city: 'Cairo',
  cinema_name: 'CEEMA Downtown',
  ticket_price: '80.00',
}

const emptyReportForm = {
  reason: '',
  content_type: 'post',
  content_id: '',
}

const asArray = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

const formatDate = (value) => {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (value) => (value ? String(value).slice(0, 5) : 'Not set')

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [posts, setPosts] = useState([])
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [movieForm, setMovieForm] = useState(emptyMovieForm)
  const [showtimeForm, setShowtimeForm] = useState(emptyShowtimeForm)
  const [reportForm, setReportForm] = useState(emptyReportForm)
  const [submitting, setSubmitting] = useState(false)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [statistics, usersData, moviesData, showtimesData, postsData, reportsData] =
        await Promise.all([
          getUsersStatistics(),
          getAdminUsers(),
          getAllMovies(),
          getAllShowtimes(),
          getFeedPosts(),
          getReports(),
        ])

      setStats(statistics)
      setUsers(asArray(usersData))
      setMovies(asArray(moviesData))
      setShowtimes(asArray(showtimesData))
      setPosts(asArray(postsData))
      setReports(asArray(reportsData))
    } catch {
      toast.error('Admin dashboard data could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDashboard()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) =>
      [user.name, user.email, user.role].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    )
  }, [users, search])

  const filteredMovies = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return movies
    return movies.filter((movie) =>
      [movie.title, movie.genre, movie.language, movie.country].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    )
  }, [movies, search])

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post) =>
      [post.content, post.user?.name].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    )
  }, [posts, search])

  const reportsOpen = reports.filter((report) => report.status === 'open').length

  const statCards = [
    {
      label: 'Bookings',
      value: stats?.bookings ?? 0,
      icon: <FaTicketAlt />,
    },
    {
      label: 'Open Reports',
      value: stats?.reports_open ?? reportsOpen,
      icon: <FaFlag />,
    },
    {
      label: 'Users',
      value: stats?.users ?? users.length,
      icon: <FaUsers />,
    },
    {
      label: 'Movies',
      value: stats?.movies ?? movies.length,
      icon: <FaFilm />,
    },
    {
      label: 'Showtimes',
      value: stats?.showtimes ?? showtimes.length,
      icon: <FaCalendarAlt />,
    },
    {
      label: 'Posts',
      value: stats?.posts ?? posts.length,
      icon: <FaComments />,
    },
  ]

  const handleBanToggle = async (user) => {
    try {
      const updated = user.is_banned ? await unbanUser(user.id) : await banUser(user.id)
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)))
      toast.success(user.is_banned ? 'User unbanned' : 'User banned')
    } catch {
      toast.error('User status could not be updated')
    }
  }

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name || user.email}?`)) return
    try {
      await deleteAdminUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
      toast.success('User deleted')
    } catch {
      toast.error('User could not be deleted')
    }
  }

  const handleMovieChange = (event) => {
    const { name, value, type, checked } = event.target
    setMovieForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleCreateMovie = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...movieForm,
        image_url: movieForm.image_url || movieForm.poster_url,
        duration: Number(movieForm.duration) || 100,
        release_year: Number(movieForm.release_year) || new Date().getFullYear(),
        description: movieForm.description || `${movieForm.title} is managed from CEEMA admin.`,
      }
      const created = await createMovie(payload)
      setMovies((prev) => [created, ...prev])
      setMovieForm(emptyMovieForm)
      toast.success('Movie created')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Movie could not be created')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMovieFlag = async (movie, field) => {
    try {
      const updated = await patchMovie(movie.id, { [field]: !movie[field] })
      setMovies((prev) => prev.map((item) => (item.id === movie.id ? updated : item)))
      toast.success('Movie updated')
    } catch {
      toast.error('Movie could not be updated')
    }
  }

  const handleDeleteMovie = async (movie) => {
    if (!window.confirm(`Delete ${movie.title}?`)) return
    try {
      await deleteMovie(movie.id)
      setMovies((prev) => prev.filter((item) => item.id !== movie.id))
      toast.success('Movie deleted')
    } catch {
      toast.error('Movie could not be deleted')
    }
  }

  const handleShowtimeChange = (event) => {
    const { name, value } = event.target
    setShowtimeForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateShowtime = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const created = await createShowtime({
        ...showtimeForm,
        movie: Number(showtimeForm.movie),
        ticket_price: showtimeForm.ticket_price || '80.00',
      })
      setShowtimes((prev) => [created, ...prev])
      setShowtimeForm(emptyShowtimeForm)
      toast.success('Showtime created')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Showtime could not be created')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteShowtime = async (showtime) => {
    if (!window.confirm(`Delete ${showtime.movie_title || 'this showtime'}?`)) return
    try {
      await deleteShowtime(showtime.id)
      setShowtimes((prev) => prev.filter((item) => item.id !== showtime.id))
      toast.success('Showtime deleted')
    } catch {
      toast.error('Showtime could not be deleted')
    }
  }

  const handleDeletePost = async (post) => {
    if (!window.confirm('Remove this community post?')) return
    try {
      await deleteAdminPost(post.id)
      setPosts((prev) => prev.filter((item) => item.id !== post.id))
      toast.success('Post removed')
    } catch {
      toast.error('Post could not be removed')
    }
  }

  const handleReportChange = (event) => {
    const { name, value } = event.target
    setReportForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateReport = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const created = await createReport({
        reason: reportForm.reason,
        content_type: reportForm.content_type,
        content_id: reportForm.content_id ? Number(reportForm.content_id) : null,
      })
      setReports((prev) => [created, ...prev])
      setReportForm(emptyReportForm)
      toast.success('Report created')
    } catch {
      toast.error('Report could not be created')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateReport = async () => {
    setSubmitting(true)
    try {
      const created = await createReport({
        reason: `Generated platform snapshot: ${users.length} users, ${movies.length} movies, ${showtimes.length} showtimes, ${posts.length} posts, ${reportsOpen} open reports.`,
        content_type: 'dashboard',
        content_id: null,
      })
      setReports((prev) => [created, ...prev])
      toast.success('Dashboard report generated')
      setActiveTab('Reports')
    } catch {
      toast.error('Dashboard report could not be generated')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewReport = async (report, status = 'reviewed') => {
    try {
      const updated = await reviewReport(report.id, { status })
      setReports((prev) => prev.map((item) => (item.id === report.id ? updated : item)))
      toast.success('Report updated')
    } catch {
      toast.error('Report could not be updated')
    }
  }

  const handleDeleteReport = async (report) => {
    if (!window.confirm('Delete this report?')) return
    try {
      await deleteReport(report.id)
      setReports((prev) => prev.filter((item) => item.id !== report.id))
      toast.success('Report deleted')
    } catch {
      toast.error('Report could not be deleted')
    }
  }

  return (
    <Layout>
      <div className={styles.adminPage}>
        <section className={styles.hero} aria-label="Admin dashboard overview">
          <div className={styles.heroOverlay} />
          <div className={styles.heroTitle}>
            <span>Admin</span>
            <strong>Dashboard</strong>
          </div>
        </section>

        <div className={styles.inner}>
          <div className={styles.commandBar}>
            <div>
              <p className={styles.kicker}>Operations console</p>
              <h1>Manage CEEMA content and platform activity</h1>
            </div>
            <div className={styles.commandActions}>
              <button className={styles.secondaryButton} onClick={loadDashboard} type="button">
                <FaSyncAlt />
                Refresh
              </button>
              <button
                className={styles.primaryButton}
                disabled={submitting}
                onClick={handleGenerateReport}
                type="button"
              >
                <FaChartLine />
                Generate Report
              </button>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {statCards.map((stat) => (
              <div className={styles.statCard} key={stat.label}>
                <span className={styles.statIcon}>{stat.icon}</span>
                <span className={styles.statLabel}>{stat.label}</span>
                <strong className={styles.statValue}>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Admin dashboard sections">
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab !== 'Overview' && (
            <div className={styles.searchRow}>
              <input
                aria-label={`Search ${activeTab}`}
                className={styles.input}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                type="search"
                value={search}
              />
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Loading admin data...</div>
          ) : (
            <>
              {activeTab === 'Overview' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Snapshot</p>
                      <h2>Reports Overview</h2>
                    </div>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setActiveTab('Reports')}
                      type="button"
                    >
                      Review All
                    </button>
                  </div>
                  <div className={styles.reportGrid}>
                    {reports.slice(0, 2).map((report) => (
                      <article className={styles.reportTile} key={report.id}>
                        <span className={styles.statusBadge}>{report.status}</span>
                        <h3>{report.content_type || 'Platform Report'}</h3>
                        <p>{report.reason || 'No report notes were provided.'}</p>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleReviewReport(report)}
                          type="button"
                        >
                          <FaCheckCircle />
                          Review
                        </button>
                      </article>
                    ))}
                  </div>
                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Area</th>
                          <th>Recent Item</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Users</td>
                          <td>{users[0]?.name || 'No users'}</td>
                          <td>{users.filter((user) => user.is_banned).length} banned</td>
                          <td>
                            <button className={styles.tableButton} onClick={() => setActiveTab('Users')} type="button">
                              Manage
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Movies</td>
                          <td>{movies[0]?.title || 'No movies'}</td>
                          <td>{movies.filter((movie) => movie.is_in_cinemas).length} in cinemas</td>
                          <td>
                            <button className={styles.tableButton} onClick={() => setActiveTab('Movies')} type="button">
                              Manage
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Posts</td>
                          <td>{posts[0]?.content?.slice(0, 50) || 'No posts'}</td>
                          <td>{posts.reduce((total, post) => total + (post.comments_count || 0), 0)} comments</td>
                          <td>
                            <button className={styles.tableButton} onClick={() => setActiveTab('Posts')} type="button">
                              Moderate
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'Users' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Access control</p>
                      <h2>Users Management</h2>
                    </div>
                  </div>
                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Points</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.points ?? 0}</td>
                            <td>
                              <span className={user.is_banned ? styles.dangerBadge : styles.statusBadge}>
                                {user.is_banned ? 'Banned' : 'Active'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.inlineActions}>
                                <button className={styles.tableButton} onClick={() => handleBanToggle(user)} type="button">
                                  <FaBan />
                                  {user.is_banned ? 'Unban' : 'Ban'}
                                </button>
                                <button className={styles.dangerButton} onClick={() => handleDeleteUser(user)} type="button">
                                  <FaTrash />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'Movies' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Catalog</p>
                      <h2>Movies Management</h2>
                    </div>
                  </div>

                  <form className={styles.formPanel} onSubmit={handleCreateMovie}>
                    <h3><FaPlus /> Add Movie</h3>
                    <div className={styles.formGrid}>
                      <input className={styles.input} name="title" onChange={handleMovieChange} placeholder="Title" required value={movieForm.title} />
                      <input className={styles.input} name="genre" onChange={handleMovieChange} placeholder="Genre" value={movieForm.genre} />
                      <input className={styles.input} name="language" onChange={handleMovieChange} placeholder="Language" value={movieForm.language} />
                      <input className={styles.input} min="1900" name="release_year" onChange={handleMovieChange} type="number" value={movieForm.release_year} />
                      <input className={styles.input} min="1" name="duration" onChange={handleMovieChange} type="number" value={movieForm.duration} />
                      <input className={styles.input} name="rating" onChange={handleMovieChange} placeholder="Rating" value={movieForm.rating} />
                      <input className={styles.inputWide} name="poster_url" onChange={handleMovieChange} placeholder="Poster URL" value={movieForm.poster_url} />
                      <input className={styles.inputWide} name="backdrop_url" onChange={handleMovieChange} placeholder="Wide poster / backdrop URL" value={movieForm.backdrop_url} />
                      <textarea className={styles.textarea} name="description" onChange={handleMovieChange} placeholder="Description" value={movieForm.description} />
                    </div>
                    <div className={styles.checkRow}>
                      <label><input checked={movieForm.is_featured} name="is_featured" onChange={handleMovieChange} type="checkbox" /> Featured</label>
                      <label><input checked={movieForm.is_now_playing} name="is_now_playing" onChange={handleMovieChange} type="checkbox" /> Now Playing</label>
                      <label><input checked={movieForm.is_in_cinemas} name="is_in_cinemas" onChange={handleMovieChange} type="checkbox" /> In Cinemas</label>
                    </div>
                    <button className={styles.primaryButton} disabled={submitting} type="submit">
                      <FaPlus />
                      Create Movie
                    </button>
                  </form>

                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Genre</th>
                          <th>Year</th>
                          <th>Flags</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovies.map((movie) => (
                          <tr key={movie.id}>
                            <td className={styles.mediaCell}>
                              <img alt="" src={movie.poster || movie.poster_url || movie.image_url} />
                              <span>{movie.title}</span>
                            </td>
                            <td>{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</td>
                            <td>{movie.release_year}</td>
                            <td>
                              <div className={styles.flagGroup}>
                                <button className={movie.is_featured ? styles.activeChip : styles.chip} onClick={() => handleMovieFlag(movie, 'is_featured')} type="button">Featured</button>
                                <button className={movie.is_now_playing ? styles.activeChip : styles.chip} onClick={() => handleMovieFlag(movie, 'is_now_playing')} type="button">Now</button>
                                <button className={movie.is_in_cinemas ? styles.activeChip : styles.chip} onClick={() => handleMovieFlag(movie, 'is_in_cinemas')} type="button">Cinema</button>
                              </div>
                            </td>
                            <td>
                              <button className={styles.dangerButton} onClick={() => handleDeleteMovie(movie)} type="button">
                                <FaTrash />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'Showtimes' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Cinema schedule</p>
                      <h2>Showtimes Management</h2>
                    </div>
                  </div>
                  <form className={styles.formPanel} onSubmit={handleCreateShowtime}>
                    <h3><FaPlus /> Add Showtime</h3>
                    <div className={styles.formGrid}>
                      <select className={styles.input} name="movie" onChange={handleShowtimeChange} required value={showtimeForm.movie}>
                        <option value="">Select movie</option>
                        {movies.map((movie) => (
                          <option key={movie.id} value={movie.id}>{movie.title}</option>
                        ))}
                      </select>
                      <input className={styles.input} name="date" onChange={handleShowtimeChange} required type="date" value={showtimeForm.date} />
                      <input className={styles.input} name="time" onChange={handleShowtimeChange} required type="time" value={showtimeForm.time} />
                      <input className={styles.input} name="hall" onChange={handleShowtimeChange} placeholder="Hall" required value={showtimeForm.hall} />
                      <input className={styles.input} name="city" onChange={handleShowtimeChange} placeholder="City" value={showtimeForm.city} />
                      <input className={styles.input} name="cinema_name" onChange={handleShowtimeChange} placeholder="Cinema name" value={showtimeForm.cinema_name} />
                      <input className={styles.input} min="0" name="ticket_price" onChange={handleShowtimeChange} step="0.01" type="number" value={showtimeForm.ticket_price} />
                    </div>
                    <button className={styles.primaryButton} disabled={submitting} type="submit">
                      <FaCalendarAlt />
                      Create Showtime
                    </button>
                  </form>
                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Movie</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Cinema</th>
                          <th>Price</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showtimes.map((showtime) => (
                          <tr key={showtime.id}>
                            <td>{showtime.movie_title}</td>
                            <td>{formatDate(showtime.date)}</td>
                            <td>{formatTime(showtime.time)}</td>
                            <td>{showtime.cinema_name} / {showtime.hall}</td>
                            <td>{showtime.ticket_price} EGP</td>
                            <td>
                              <button className={styles.dangerButton} onClick={() => handleDeleteShowtime(showtime)} type="button">
                                <FaTrash />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'Posts' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Community</p>
                      <h2>Posts Moderation</h2>
                    </div>
                  </div>
                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Content</th>
                          <th>Media</th>
                          <th>Engagement</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPosts.map((post) => (
                          <tr key={post.id}>
                            <td>{post.user?.name || `User #${post.user?.id || ''}`}</td>
                            <td>{post.content || 'Media post'}</td>
                            <td>{post.media_type || 'text'}</td>
                            <td>{post.likes_count || 0} likes / {post.comments_count || 0} comments</td>
                            <td>
                              <button className={styles.dangerButton} onClick={() => handleDeletePost(post)} type="button">
                                <FaTrash />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'Reports' && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.kicker}>Compliance</p>
                      <h2>Reports Management</h2>
                    </div>
                  </div>
                  <form className={styles.formPanel} onSubmit={handleCreateReport}>
                    <h3><FaPlus /> Create Report</h3>
                    <div className={styles.formGrid}>
                      <input className={styles.inputWide} name="reason" onChange={handleReportChange} placeholder="Report reason" required value={reportForm.reason} />
                      <select className={styles.input} name="content_type" onChange={handleReportChange} value={reportForm.content_type}>
                        <option value="post">Post</option>
                        <option value="movie">Movie</option>
                        <option value="user">User</option>
                        <option value="dashboard">Dashboard</option>
                      </select>
                      <input className={styles.input} min="1" name="content_id" onChange={handleReportChange} placeholder="Content ID" type="number" value={reportForm.content_id} />
                    </div>
                    <button className={styles.primaryButton} disabled={submitting} type="submit">
                      <FaFlag />
                      Create Report
                    </button>
                  </form>
                  <div className={styles.tableShell}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report.id}>
                            <td>{report.content_type || 'platform'}</td>
                            <td>{report.reason}</td>
                            <td>
                              <span className={report.status === 'open' ? styles.dangerBadge : styles.statusBadge}>
                                {report.status}
                              </span>
                            </td>
                            <td>{formatDate(report.created_at)}</td>
                            <td>
                              <div className={styles.inlineActions}>
                                <button className={styles.tableButton} onClick={() => handleReviewReport(report)} type="button">
                                  <FaCheckCircle />
                                  Review
                                </button>
                                <button className={styles.dangerButton} onClick={() => handleDeleteReport(report)} type="button">
                                  <FaTrash />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
