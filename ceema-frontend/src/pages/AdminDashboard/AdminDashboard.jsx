import { useNavigate } from 'react-router-dom'
import styles from './AdminDashboard.module.css'

const AdminDashboard = () => {
  const navigate = useNavigate() // ✅ MUST be inside component

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      <div className={styles.cardsContainer}>
        
        {/* USERS SECTION */}
        <div className={styles.card}>
          <h2>Users Management</h2>
          <p>Manage all users, ban/unban, edit details.</p>

          <button
            onClick={() => navigate('/admin/users')}
            className={styles.button}
          >
            Go to Users
          </button>
        </div>

        {/* REPORTS SECTION */}
        <div className={styles.card}>
          <h2>Reports Management</h2>
          <p>Review, approve, or delete reports.</p>

          <button
            onClick={() => navigate('/admin/reports')}
            className={styles.button}
          >
            Go to Reports
          </button>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard


// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { getReports, getUsers, getUserStats } from '../../services/adminService'


// const navigate = useNavigate()
// const AdminDashboard = () => {
  
//   const [reports, setReports] = useState([])
//   const [users, setUsers] = useState([])
//   const [stats, setStats] = useState(null)
  

//   useEffect(() => {
//     const fetchData = async () => {
//       const r = await getReports()
//       const u = await getUsers()
//       const s = await getUserStats()

//       setReports(r)
//       setUsers(u)
//       setStats(s)
//     }

//     fetchData()
//   }, [])

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Admin Dashboard</h1>

//       <h3>Users: {users.length}</h3>
//       <h3>Reports: {reports.length}</h3>

//       {stats && (
//         <pre>{JSON.stringify(stats, null, 2)}</pre>
//       )}
//     </div>
//   )
// }


// export default AdminDashboard

















// // const AdminDashboard = () => <div>AdminDashboard</div>; export default AdminDashboard;
// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import Layout from '../../components/Layout/Layout'
// import styles from './AdminDashboard.module.css'

// // ─── Dummy Admin Data ───
// const STATS = [
//   { icon: '🎟', label: 'Bookings Today', value: '1,256', color: '#cc0000' },
//   { icon: '⚠️', label: 'Reports', value: '43', color: '#f59e0b' },
//   { icon: '👤', label: 'Active Users', value: '5,679', color: '#3b82f6' },
// ]

// const INITIAL_REPORTS = [
//   { id: 1, type: 'Inappropriate Content', reportedBy: 'user138', status: 'Pending' },
//   { id: 2, type: 'Harassment Report', reportedBy: 'Movies456', status: 'Solved' },
// ]

// const INITIAL_USERS = [
//   { id: 1, username: 'Johndoe', content: 'Offensive Post', type: 'Post', banned: false },
//   { id: 2, username: 'cinemaLover', content: 'Spam Review', type: 'Review', banned: false },
//   { id: 3, username: 'Zeeyadaaamr', content: 'Abusive Comment', type: 'Post', banned: false },
// ]

// const TABS = ['Overview', 'Users', 'Movies', 'Bookings', 'Reports']

// const AdminDashboard = () => {
//   const navigate = useNavigate()
//   const [activeTab, setActiveTab] = useState('Overview')
//   const [reports, setReports] = useState(INITIAL_REPORTS)
//   const [users, setUsers] = useState(INITIAL_USERS)
//   const [searchQuery, setSearchQuery] = useState('')

//   // ─── Auth check — admin only ───
//   useEffect(() => {
//     const stored = localStorage.getItem('ceema_user')
//     if (!stored) {
//       toast.error('Please login first')
//       navigate('/login')
//       return
//     }
//     const user = JSON.parse(stored)
//     if (user.role !== 'admin') {
//       toast.error('Access denied. Admins only.')
//       navigate('/')
//     }
//   }, [navigate])

//   // ─── Handle Ban User ───
//   const handleBan = (userId) => {
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === userId ? { ...u, banned: !u.banned } : u
//       )
//     )
//     const user = users.find((u) => u.id === userId)
//     toast.success(
//       user?.banned
//         ? `${user.username} has been unbanned`
//         : `${user?.username} has been banned`
//     )
//   }

//   // ─── Handle Remove Content ───
//   const handleRemove = (userId) => {
//     setUsers((prev) => prev.filter((u) => u.id !== userId))
//     toast.success('Content removed successfully')
//   }

//   // ─── Handle Report Review ───
//   const handleReview = (reportId) => {
//     setReports((prev) =>
//       prev.map((r) =>
//         r.id === reportId ? { ...r, status: 'Solved' } : r
//       )
//     )
//     toast.success('Report marked as solved')
//   }

//   // ─── Filtered Users ───
//   const filteredUsers = users.filter(
//     (u) =>
//       u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       u.content.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   return (
//     <Layout>
//       <div className={styles.adminPage}>

//         {/* ─── Hero Banner ─── */}
//         <div className={styles.heroBanner}>
//           <div className={styles.heroOverlay} />
//           <div className={styles.heroContent}>
//             <h1 className={styles.heroTitle}>Admin Dashboard</h1>
//           </div>
//         </div>

//         <div className={styles.inner}>

//           {/* ─── Stats Cards ─── */}
//           <div className={styles.statsGrid}>
//             {STATS.map((stat) => (
//               <div key={stat.label} className={styles.statCard}>
//                 <div className={styles.statIcon} style={{ color: stat.color }}>
//                   {stat.icon}
//                 </div>
//                 <div className={styles.statInfo}>
//                   <span className={styles.statLabel}>{stat.label}</span>
//                   <span className={styles.statValue}>{stat.value}</span>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* ─── Tabs ─── */}
//           <div className={styles.tabs}>
//             {TABS.map((tab) => (
//               <button
//                 key={tab}
//                 className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
//                 onClick={() => setActiveTab(tab)}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           {/* ─── Overview Tab ─── */}
//           {activeTab === 'Overview' && (
//             <div className={styles.tabContent}>

//               {/* Reports Overview */}
//               <h2 className={styles.sectionTitle}>Reports Overview</h2>
//               <div className={styles.reportsGrid}>
//                 {reports.map((report) => (
//                   <div key={report.id} className={styles.reportCard}>
//                     <div className={styles.reportHeader}>
//                       <h3 className={styles.reportType}>{report.type}</h3>
//                       <span
//                         className={`${styles.reportStatus} ${
//                           report.status === 'Solved'
//                             ? styles.statusSolved
//                             : styles.statusPending
//                         }`}
//                       >
//                         {report.status}
//                       </span>
//                     </div>
//                     <p className={styles.reportBy}>
//                       Reported by: <span>{report.reportedBy}</span>
//                     </p>
//                     <button
//                       className={styles.reviewBtn}
//                       onClick={() => handleReview(report.id)}
//                       disabled={report.status === 'Solved'}
//                     >
//                       {report.status === 'Solved' ? '✓ Solved' : 'Review'}
//                     </button>
//                   </div>
//                 ))}
//               </div>

//               {/* Users Table */}
//               <h2 className={styles.sectionTitle}>Flagged Users</h2>
//               <div className={styles.searchBar}>
//                 <input
//                   type="text"
//                   placeholder="Search users or content..."
//                   className={styles.searchInput}
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>
//               <div className={styles.tableWrap}>
//                 <table className={styles.table}>
//                   <thead>
//                     <tr>
//                       <th>User</th>
//                       <th>Content</th>
//                       <th>Type</th>
//                       <th>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredUsers.map((user) => (
//                       <tr key={user.id} className={user.banned ? styles.bannedRow : ''}>
//                         <td className={styles.usernameCell}>{user.username}</td>
//                         <td className={styles.contentCell}>{user.content}</td>
//                         <td>
//                           <span className={styles.typeBadge}>{user.type}</span>
//                         </td>
//                         <td>
//                           <div className={styles.actionBtns}>
//                             <button
//                               className={styles.removeBtn}
//                               onClick={() => handleRemove(user.id)}
//                             >
//                               Remove
//                             </button>
//                             <button
//                               className={`${styles.banBtn} ${
//                                 user.banned ? styles.unbanBtn : ''
//                               }`}
//                               onClick={() => handleBan(user.id)}
//                             >
//                               {user.banned ? 'Unban' : 'Ban User'}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                     {filteredUsers.length === 0 && (
//                       <tr>
//                         <td colSpan={4} className={styles.emptyRow}>
//                           No users found
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* ─── Users Tab ─── */}
//           {activeTab === 'Users' && (
//             <div className={styles.tabContent}>
//               <h2 className={styles.sectionTitle}>All Users</h2>
//               <p className={styles.comingSoon}>
//                 Full user management coming when backend API is connected. 🔌
//               </p>
//             </div>
//           )}

//           {/* ─── Movies Tab ─── */}
//           {activeTab === 'Movies' && (
//             <div className={styles.tabContent}>
//               <h2 className={styles.sectionTitle}>Movie Management</h2>
//               <p className={styles.comingSoon}>
//                 Add, edit, and remove movies when backend API is connected. 🔌
//               </p>
//             </div>
//           )}

//           {/* ─── Bookings Tab ─── */}
//           {activeTab === 'Bookings' && (
//             <div className={styles.tabContent}>
//               <h2 className={styles.sectionTitle}>Bookings Management</h2>
//               <p className={styles.comingSoon}>
//                 View and manage all bookings when backend API is connected. 🔌
//               </p>
//             </div>
//           )}

//           {/* ─── Reports Tab ─── */}
//           {activeTab === 'Reports' && (
//             <div className={styles.tabContent}>
//               <h2 className={styles.sectionTitle}>All Reports</h2>
//               <div className={styles.reportsGrid}>
//                 {reports.map((report) => (
//                   <div key={report.id} className={styles.reportCard}>
//                     <div className={styles.reportHeader}>
//                       <h3 className={styles.reportType}>{report.type}</h3>
//                       <span
//                         className={`${styles.reportStatus} ${
//                           report.status === 'Solved'
//                             ? styles.statusSolved
//                             : styles.statusPending
//                         }`}
//                       >
//                         {report.status}
//                       </span>
//                     </div>
//                     <p className={styles.reportBy}>
//                       Reported by: <span>{report.reportedBy}</span>
//                     </p>
//                     <button
//                       className={styles.reviewBtn}
//                       onClick={() => handleReview(report.id)}
//                       disabled={report.status === 'Solved'}
//                     >
//                       {report.status === 'Solved' ? '✓ Solved' : 'Review'}
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default AdminDashboard
