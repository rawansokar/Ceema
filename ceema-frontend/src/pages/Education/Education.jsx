import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import styles from './Education.module.css'
import { getAllCourses, enrollCourse, unenrollCourse } from '../../services/educationService'

const LEVELS = ['All']

const Education = () => {
  const [courses, setCourses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [enrolledIds, setEnrolledIds] = useState([])
  const [loading, setLoading] = useState(true)

  // ─── FETCH COURSES ───
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      const data = await getAllCourses()
      setCourses(data)
      setFiltered(data)
      setLoading(false)
    }

    loadCourses()
  }, [])

  // ─── ENROLL / UNENROLL ───
  const handleEnroll = async (courseId) => {
    const isEnrolled = enrolledIds.includes(courseId)

    if (isEnrolled) {
      const res = await unenrollCourse(courseId)

      if (res.success) {
        setEnrolledIds((prev) => prev.filter((id) => id !== courseId))
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId
              ? { ...course, enrolled_count: Math.max(0, (course.enrolled_count || 0) - 1) }
              : course
          )
        )
      }
    } else {
      const res = await enrollCourse(courseId)

      if (res.success) {
        setEnrolledIds((prev) => [...prev, courseId])
        setCourses((prev) =>
          prev.map((course) =>
            course.id === courseId
              ? { ...course, enrolled_count: (course.enrolled_count || 0) + 1 }
              : course
          )
        )
      }
    }
  }

  // ─── UI ───
  return (
    <Layout>
      <div className={styles.educationPage}>

        <div className={styles.heroBanner}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Learning Hub</h1>
          </div>
        </div>

        <div className={styles.inner}>

          <p className={styles.resultsCount}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>

          {loading ? (
            <p style={{ color: '#fff' }}>Loading courses...</p>
          ) : (
            <div className={styles.coursesGrid}>
              {courses.map((course) => {
                const isEnrolled = enrolledIds.includes(course.id)

                return (
                  <div key={course.id} className={styles.courseCard}>

                    {/* Course Info ONLY (API FIXED) */}
                    <div className={styles.courseInfo}>
                      <h3 className={styles.courseTitle}>{course.title}</h3>

                      <p className={styles.instructor}>
                        {course.description}
                      </p>

                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.metaItem}
                        style={{ color: '#ffcc00' }}
                      >
                        Open Course ↗
                      </a>

                      <p className={styles.metaItem}>
                        👥 {course.enrolled_count} enrolled
                      </p>

                      <button
                        className={`${styles.enrollBtn} ${
                          isEnrolled ? styles.enrolledBtn : ''
                        }`}
                        onClick={() => handleEnroll(course.id)}
                      >
                        {isEnrolled ? '✓ Enrolled' : 'Enroll'}
                      </button>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default Education

// import { useState, useEffect } from 'react'
// // import { getAllCourses } from '../../services/feedService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Education.module.css'

// const CATEGORIES = ['All', 'Video Editing', 'Cinematography', 'Mobile Filmmaking', 'Sound Design', 'Photography', 'Film Studies', 'Production Design', 'Screenwriting']
// const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced']

// const Education = () => {
//   const [courses, setCourses] = useState([])
//   const [filtered, setFiltered] = useState([])
//   const [category, setCategory] = useState('All')
//   const [level, setLevel] = useState('All')
//   const [enrolledIds, setEnrolledIds] = useState([])

//   useEffect(() => {
//     const data = getAllCourses()
//     setCourses(data)
//     setFiltered(data)
//   }, [])

//   // ─── Filter ───
//   useEffect(() => {
//     let results = courses

//     if (category !== 'All') {
//       results = results.filter((c) => c.category === category)
//     }
//     if (level !== 'All') {
//       results = results.filter((c) => c.level === level)
//     }

//     setFiltered(results)
//   }, [category, level, courses])

//   // ─── Enroll ───
//   const handleEnroll = (e, courseId) => {
//     e.preventDefault()
//     e.stopPropagation()
//     setEnrolledIds((prev) =>
//       prev.includes(courseId)
//         ? prev.filter((id) => id !== courseId)
//         : [...prev, courseId]
//     )
//   }

//   return (
//     <Layout>
//       <div className={styles.educationPage}>

//         {/* ─── Hero Banner ─── */}
//         <div className={styles.heroBanner}>
//           <div className={styles.heroOverlay} />
//           <div className={styles.heroContent}>
//             <h1 className={styles.heroTitle}>Learning Hub</h1>
//           </div>
//         </div>

//         <div className={styles.inner}>

//           {/* ─── Filters ─── */}
//           <div className={styles.filtersRow}>
//             <div className={styles.filterGroup}>
//               {CATEGORIES.map((cat) => (
//                 <button
//                   key={cat}
//                   className={`${styles.filterBtn} ${category === cat ? styles.filterActive : ''}`}
//                   onClick={() => setCategory(cat)}
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>

//             <select
//               className={styles.levelSelect}
//               value={level}
//               onChange={(e) => setLevel(e.target.value)}
//             >
//               {LEVELS.map((l) => (
//                 <option key={l} value={l}>
//                   {l === 'All' ? 'All Levels' : l}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* ─── Results Count ─── */}
//           <p className={styles.resultsCount}>
//             {filtered.length} course{filtered.length !== 1 ? 's' : ''} available
//           </p>

//           {/* ─── Courses Grid ─── */}
//           {filtered.length > 0 ? (
//             <div className={styles.coursesGrid}>
//               {filtered.map((course) => {
//                 const isEnrolled = enrolledIds.includes(course.id)
//                 return (
//                   <div key={course.id} className={styles.courseCard}>

//                     {/* Thumbnail */}
//                     <div className={styles.thumbnailWrap}>
//                       <img
//                         src={course.image}
//                         alt={course.title}
//                         className={styles.thumbnail}
//                         onError={(e) => {
//                           e.target.src = `https://placehold.co/400x240/1a1a1a/cc0000?text=${encodeURIComponent(course.category)}`
//                         }}
//                       />
//                       {/* Level Badge */}
//                       <span
//                         className={`${styles.levelBadge} ${
//                           course.level === 'Beginner'
//                             ? styles.beginner
//                             : course.level === 'Intermediate'
//                             ? styles.intermediate
//                             : styles.advanced
//                         }`}
//                       >
//                         {course.level}
//                       </span>
//                     </div>

//                     {/* Course Info */}
//                     <div className={styles.courseInfo}>
//                       <span className={styles.courseCategory}>
//                         {course.category}
//                       </span>
//                       <h3 className={styles.courseTitle}>{course.title}</h3>

//                       <div className={styles.courseMeta}>
//                         <span className={styles.metaItem}>
//                           🎬 {course.lessons} lessons
//                         </span>
//                         <span className={styles.metaItem}>
//                           ⏱ {course.duration}
//                         </span>
//                         <span className={styles.metaItem}>
//                           ⬇ {course.downloads.toLocaleString()}
//                         </span>
//                       </div>

//                       <p className={styles.instructor}>
//                         by {course.instructor}
//                       </p>

//                       <button
//                         className={`${styles.enrollBtn} ${isEnrolled ? styles.enrolledBtn : ''}`}
//                         onClick={(e) => handleEnroll(e, course.id)}
//                       >
//                         {isEnrolled ? '✓ Enrolled' : 'Enroll Now'}
//                       </button>
//                     </div>

//                   </div>
//                 )
//               })}
//             </div>
//           ) : (
//             <div className={styles.noResults}>
//               <p>No courses found for the selected filters.</p>
//               <button
//                 className={styles.resetBtn}
//                 onClick={() => { setCategory('All'); setLevel('All') }}
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

// export default Education
