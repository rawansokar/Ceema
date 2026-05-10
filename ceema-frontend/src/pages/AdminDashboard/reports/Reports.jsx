import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import {
  getReports,
  reviewReport,
  deleteReport,
} from '../../../services/adminService'

import styles from '../AdminDashboard.module.css'

const Reports = () => {
  const [reports, setReports] = useState([])

  const fetchReports = async () => {
    try {
      const data = await getReports()
      setReports(data)
    } catch (error) {
      toast.error('Failed to load reports')
      console.error(error)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleReview = async (report) => {
    try {
      await reviewReport(report.id, {
        ...report,
        status: 'reviewed',
      })

      toast.success('Report reviewed')

      fetchReports()
    } catch (error) {
      toast.error('Review failed')
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteReport(id)

      toast.success('Report deleted')

      setReports(
        reports.filter((report) => report.id !== id)
      )
    } catch (error) {
      toast.error('Delete failed')
      console.error(error)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Reports</h1>

      <div className={styles.cardsContainer}>
        {reports.map((report) => (
          <div
            key={report.id}
            className={styles.card}
          >
            <h3>Report #{report.id}</h3>

            <p>Reason: {report.reason}</p>

            <p>Status: {report.status}</p>

            <p>
              Content Type:{' '}
              {report.content_type}
            </p>

            <p>
              Content ID: {report.content_id}
            </p>

            <div className={styles.actions}>
              <button
                onClick={() =>
                  handleReview(report)
                }
              >
                Review
              </button>

              <button
                onClick={() =>
                  handleDelete(report.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports
