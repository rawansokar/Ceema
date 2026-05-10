import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsTicketPerforated } from 'react-icons/bs'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChair } from 'react-icons/fa'

import Layout from '../../components/Layout/Layout'
import { getTicketHistory } from '../../services/bookingService'
import { getCurrentUser } from '../../services/authService'
import styles from './TicketsHistory.module.css'

const TicketsHistory = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTickets = async () => {
      if (!getCurrentUser()) {
        navigate('/login')
        return
      }

      setLoading(true)
      const data = await getTicketHistory()
      setBookings(data)
      setLoading(false)
    }

    loadTickets()
  }, [navigate])

  return (
    <Layout showBack>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1>Tickets History</h1>
          <p>View your bookings and history</p>
        </header>

        {loading ? (
          <p className={styles.empty}>Loading tickets...</p>
        ) : bookings.length ? (
          <section className={styles.list}>
            {bookings.map((booking) => (
              <article key={booking.id} className={styles.ticketCard}>
                <img
                  src={booking.movie_poster || 'https://placehold.co/180x260/141414/e00000?text=CEEMA'}
                  alt={booking.movie_title}
                  className={styles.poster}
                />

                <div className={styles.details}>
                  <h2>{booking.movie_title}</h2>
                  <p><FaCalendarAlt /> {booking.showtime_detail?.date || 'Date not set'}</p>
                  <p><FaClock /> {booking.showtime_detail?.time || 'Time not set'}</p>
                  <p><FaMapMarkerAlt /> {booking.cinema}{booking.city ? `, ${booking.city}` : ''}</p>
                  <p><FaChair /> {booking.seats.length ? booking.seats.join(', ') : 'Seats pending'}</p>
                </div>

                <aside className={styles.meta}>
                  <span>Booking ID</span>
                  <strong>CEEMA-{String(booking.id).padStart(6, '0')}</strong>
                  <span>Amount Paid</span>
                  <strong>{booking.total_price} EGP</strong>
                  <button type="button">
                    <BsTicketPerforated />
                    View Ticket
                  </button>
                </aside>
              </article>
            ))}
          </section>
        ) : (
          <p className={styles.empty}>No ticket history yet.</p>
        )}
      </main>
    </Layout>
  )
}

export default TicketsHistory
