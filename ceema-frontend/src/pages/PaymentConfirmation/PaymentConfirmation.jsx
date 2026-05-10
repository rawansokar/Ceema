import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import styles from './PaymentConfirmation.module.css'

const PaymentConfirmation = () => {
  const location = useLocation()

  const [copied, setCopied] = useState(false)

  // ─── Real payment data from Payment page ───
  const booking = location.state || {
    id: Date.now(),
    cinema: 'Scene Cinema',
    movie: 'No Movie Selected',
    seats: [],
    showtime: 'Not Selected',
    total: 0,
    paymentMethod: 'cashier',
    paymentStatus: 'pending'
  }

  // ─── Generate Booking ID ───
  const bookingId = `BK${booking.id}`

  // ─── Copy Booking ID ───
  const handleCopy = () => {
    navigator.clipboard.writeText(bookingId)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // ─── Payment Message ───
  const paymentMessage =
    booking.paymentMethod === 'credit'
      ? 'Your payment was completed successfully. Please present this ticket at the cinema entrance.'
      : 'Your booking has been reserved successfully. Please pay at the cashier before the movie starts.'

  // ─── QR Data ───
  const qrData = `
CEEMA TICKET
Booking ID: ${bookingId}
Movie: ${booking.movie}
Cinema: ${booking.cinema}
Seats: ${booking.seats.join(', ')}
Showtime: ${booking.showtime}
Total: ${booking.total} EGP
Payment Method: ${booking.paymentMethod}
Payment Status: ${booking.paymentStatus}
`

  return (
    <Layout>
      <div className={styles.confirmPage}>
        <div className={styles.inner}>

          {/* ─── Main Content ─── */}
          <div className={styles.contentGrid}>

            {/* ─── Left Side ─── */}
            <div className={styles.infoBlock}>

              <div className={styles.cinemaName}>
                {booking.cinema}
              </div>

              <div className={styles.movieName}>
                {booking.movie}
              </div>

              <div className={styles.seats}>
                {booking.seats.length > 0
                  ? booking.seats.join(', ')
                  : 'No seats selected'}
              </div>

              <div className={styles.divider} />

              <p className={styles.confirmMessage}>
                {paymentMessage}
              </p>

              <div className={styles.detailsTable}>

                {/* Showtime */}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>
                    Showtime
                  </span>

                  <span className={styles.detailVal}>
                    {booking.showtime}
                  </span>
                </div>

                {/* Total */}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>
                    Total Paid
                  </span>

                  <span className={styles.detailVal}>
                    {booking.total} EGP
                  </span>
                </div>

                {/* Payment Method */}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>
                    Payment Method
                  </span>

                  <span className={styles.detailVal}>
                    {booking.paymentMethod === 'credit'
                      ? 'Credit Card'
                      : 'Cashier'}
                  </span>
                </div>

                {/* Payment Status */}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>
                    Status
                  </span>

                  <span className={styles.detailVal}>
                    {booking.paymentStatus || 'pending'}
                  </span>
                </div>

                {/* Booking ID */}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>
                    Booking ID
                  </span>

                  <span
                    className={styles.bookingId}
                    onClick={handleCopy}
                    title="Click to copy"
                  >
                    {bookingId}

                    <span className={styles.copyHint}>
                      {copied ? '✓ Copied!' : 'Copy'}
                    </span>
                  </span>
                </div>

              </div>
            </div>

            {/* ─── Right Side QR ─── */}
            <div className={styles.qrBlock}>

              <div className={styles.qrWrapper}>

                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=cc0000&bgcolor=111111&data=${encodeURIComponent(
                    qrData
                  )}`}
                  alt="QR Code"
                  className={styles.qrImage}
                />

              </div>

              <p className={styles.qrHint}>
                Scan at the cinema entrance
              </p>

            </div>

          </div>

          {/* ─── Actions ─── */}
          <div className={styles.actions}>

            <Link
              to="/movies"
              className={styles.browseBtn}
            >
              Browse More Movies
            </Link>

            <Link
              to="/"
              className={styles.homeBtn}
            >
              Back to Home
            </Link>

          </div>

        </div>
      </div>
    </Layout>
  )
}

export default PaymentConfirmation






















// import { useEffect, useState } from 'react'
// import { useLocation, useNavigate, Link } from 'react-router-dom'
// import Layout from '../../components/Layout/Layout'
// import styles from './PaymentConfirmation.module.css'

// const PaymentConfirmation = () => {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const [copied, setCopied] = useState(false)

//   // ─── Booking result passed from Payment page ───
//   const booking = location.state || {
//     success: true,
//     bookingId: 'BK00000',
//     cinema: 'Scene Cinema',
//     movie: 'Bershama',
//     seats: ['C4', 'C5', 'C6'],
//     showtime: '8:00 pm',
//     total: 630,
//     qrCode:
//       'https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=cc0000&bgcolor=111111&data=CEEMA-BK00000'
//   }

//   // ─── If no booking data redirect to home ───
//   useEffect(() => {
//     if (!location.state) {
//       // allow dummy data for testing, don't redirect
//     }
//   }, [location.state])

//   // ─── Copy booking ID ───
//   const handleCopy = () => {
//     navigator.clipboard.writeText(booking.bookingId)
//     setCopied(true)
//     setTimeout(() => setCopied(false), 2000)
//   }

//   return (
//     <Layout>
//       <div className={styles.confirmPage}>
//         <div className={styles.inner}>

//           {/* ─── Success Icon ─── */}
//           {/* <div className={styles.successIcon}>✓</div> */}

//           {/* ─── Main Content ─── */}
//           <div className={styles.contentGrid}>

//             {/* ─── Left: Booking Info ─── */}
//             <div className={styles.infoBlock}>

//               <div className={styles.cinemaName}>{booking.cinema}</div>
//               <div className={styles.movieName}>{booking.movie}</div>
//               <div className={styles.seats}>
//                 {booking.seats.join(', ')}
//               </div>

//               <div className={styles.divider} />

//               <p className={styles.confirmMessage}>
//                 Your payment is complete, please take a screenshot
//                 from the following data for the cinema entrance.
//               </p>

//               <div className={styles.detailsTable}>
//                 <div className={styles.detailRow}>
//                   <span className={styles.detailKey}>Showtime</span>
//                   <span className={styles.detailVal}>{booking.showtime}</span>
//                 </div>
//                 <div className={styles.detailRow}>
//                   <span className={styles.detailKey}>Total Paid</span>
//                   <span className={styles.detailVal}>{booking.total} EGP</span>
//                 </div>
//                 <div className={styles.detailRow}>
//                   <span className={styles.detailKey}>Booking ID</span>
//                   <span
//                     className={styles.bookingId}
//                     onClick={handleCopy}
//                     title="Click to copy"
//                   >
//                     {booking.bookingId}
//                     <span className={styles.copyHint}>
//                       {copied ? '✓ Copied!' : 'Copy'}
//                     </span>
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* ─── Right: QR Code ─── */}
//             <div className={styles.qrBlock}>
//               <div className={styles.qrWrapper}>
//                 <img
//                   src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=cc0000&bgcolor=111111&data=${encodeURIComponent(
//                     `CEEMA | ${booking.cinema} | ${booking.movie} | ${booking.seats.join(',')} | ${booking.showtime} | ${booking.bookingId}`
//                   )}`}
//                   alt="QR Code"
//                   className={styles.qrImage}
//                 />
//               </div>
//               <p className={styles.qrHint}>Scan at the cinema entrance</p>
//             </div>

//           </div>

//           {/* ─── Actions ─── */}
//           <div className={styles.actions}>
//             <Link to="/movies" className={styles.browseBtn}>
//               Browse More Movies
//             </Link>
//             <Link to="/" className={styles.homeBtn}>
//               Back to Home
//             </Link>
//           </div>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default PaymentConfirmation
