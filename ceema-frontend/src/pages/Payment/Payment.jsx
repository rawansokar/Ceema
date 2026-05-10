import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

import Layout from '../../components/Layout/Layout'

import { processMockPayment } from '../../services/paymentService'
import { createBooking } from '../../services/bookingService'

import styles from './Payment.module.css'

const Payment = () => {

  const navigate = useNavigate()
  const location = useLocation()

  // ─── Booking Data From Seats Page ───
  const bookingData = location.state || {
    bookingId: 1,
    cinema: 'Scene Cinema',
    showtime: '8:00 pm',
    movie: 'Bershama',
    seats: ['C4', 'C5'],
    seatType: 'Standard',
    pricePerSeat: 200,
    serviceFee: 30
  }

  // ─── Totals ───
  const seats = bookingData.seats || []
  const standardCount = bookingData.standardCount ?? seats.length
  const vipCount = bookingData.vipCount ?? 0
  const standardPrice = Number(bookingData.pricePerSeat || 0)
  const vipPrice = Number(bookingData.vipPrice || standardPrice)
  const serviceFee = Number(bookingData.serviceFee || 0)
  const totalSeatsPrice =
    (standardCount * standardPrice) + (vipCount * vipPrice)
  const totalPrice = Number(bookingData.total || totalSeatsPrice + serviceFee)

  // ─── States ───
  const [paymentMethod, setPaymentMethod] =
    useState('cashier')

  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // ─── Validation ───
  const validate = () => {

    const newErrors = {}

    if (paymentMethod === 'credit') {

      // Card Number
      const rawCard =
        cardData.cardNumber.replace(/\s/g, '')

      if (!rawCard) {
        newErrors.cardNumber =
          'Card number is required'
      }
      else if (!/^\d{16}$/.test(rawCard)) {
        newErrors.cardNumber =
          'Card number must be 16 digits'
      }

      // Expiry
      if (!cardData.expiry.trim()) {
        newErrors.expiry =
          'Expiry date is required'
      }
      else if (
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(
          cardData.expiry
        )
      ) {
        newErrors.expiry =
          'Use MM/YY format'
      }

      // CVV
      if (!cardData.cvv.trim()) {
        newErrors.cvv = 'CVV is required'
      }
      else if (!/^\d{3,4}$/.test(cardData.cvv)) {
        newErrors.cvv =
          'CVV must be 3 or 4 digits'
      }

      // Cardholder Name
      if (!cardData.cardName.trim()) {
        newErrors.cardName =
          'Cardholder name is required'
      }
      else if (
        cardData.cardName.trim().length < 3
      ) {
        newErrors.cardName =
          'Enter full name as on card'
      }
    }

    return newErrors
  }

  // ─── Format Card Number ───
  const formatCardNumber = (value) => {

    const raw =
      value.replace(/\D/g, '').slice(0, 16)

    return raw
      .replace(/(.{4})/g, '$1 ')
      .trim()
  }

  // ─── Format Expiry ───
  const formatExpiry = (value) => {

    const raw =
      value.replace(/\D/g, '').slice(0, 4)

    if (raw.length >= 3) {
      return (
        raw.slice(0, 2) +
        '/' +
        raw.slice(2)
      )
    }

    return raw
  }

  // ─── Handle Input Change ───
  const handleChange = (e) => {

    const { name, value } = e.target

    let formatted = value

    if (name === 'cardNumber') {
      formatted = formatCardNumber(value)
    }

    if (name === 'expiry') {
      formatted = formatExpiry(value)
    }

    if (name === 'cvv') {
      formatted =
        value.replace(/\D/g, '').slice(0, 4)
    }

    setCardData((prev) => ({
      ...prev,
      [name]: formatted
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // ─── Handle Payment Submit ───
  const handleSubmit = async (e) => {

    e.preventDefault()

    const validationErrors = validate()

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {

      let bookingId = bookingData.bookingId

      if (!bookingId && bookingData.showtimeId && bookingData.seatIds?.length) {
        const bookingResult = await createBooking({
          showtimeId: bookingData.showtimeId,
          seatIds: bookingData.seatIds,
          pricePerSeat: standardPrice,
          totalPrice,
        })

        if (!bookingResult.success) {
          setLoading(false)
          toast.error(bookingResult.message)
          return
        }

        bookingId = bookingResult.booking.id
      }

      const result = paymentMethod === 'cashier'
        ? { success: true, data: { booking: bookingId, method: 'cashier', status: 'pending_cashier', amount: totalPrice } }
        : await processMockPayment({

          booking_id:
            bookingId || bookingData.bookingId || 1,

          provider: 'mock',

          method:
            paymentMethod === 'credit'
              ? 'mock-card'
              : 'cashier',

          mark_paid: true
        })

      setLoading(false)

      if (result.success) {

        toast.success(
          'Payment successful! 🎬'
        )

        navigate(
          '/payment-confirmation',
          {
            state: {
              ...bookingData,
              id: bookingId || result.data.booking || Date.now(),
              bookingId,
              total: totalPrice,
              paymentMethod,
              paymentStatus: paymentMethod === 'cashier' ? 'Pay at cashier' : 'Paid',
              payment: result.data,
            }
          }
        )

      } else {

        toast.error(
          result.message ||
          'Payment failed'
        )
      }

    } catch (error) {

      console.error(error)

      setLoading(false)

      toast.error(
        'Payment failed. Please try again.'
      )
    }
  }

  return (
    <Layout showBack={true}>

      <div className={styles.paymentPage}>

        <div className={styles.inner}>

          <h1 className={styles.pageTitle}>
            Payment
          </h1>

          <form
            onSubmit={handleSubmit}
            className={styles.paymentGrid}
            noValidate
          >

            {/* ─── Payment Method ─── */}
            <div className={styles.paymentCard}>

              <h2 className={styles.cardTitle}>
                Payment Method
              </h2>

              {/* Cashier */}
              <label className={styles.radioOption}>

                <input
                  type="radio"
                  name="paymentMethod"
                  value="cashier"
                  checked={
                    paymentMethod === 'cashier'
                  }
                  onChange={() =>
                    setPaymentMethod('cashier')
                  }
                  className={styles.radioInput}
                />

                <span className={styles.radioLabel}>
                  Pay at the Cashier
                </span>

              </label>

              {/* Credit Card */}
              <label className={styles.radioOption}>

                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={
                    paymentMethod === 'credit'
                  }
                  onChange={() =>
                    setPaymentMethod('credit')
                  }
                  className={styles.radioInput}
                />

                <span className={styles.radioLabel}>
                  Credit Card
                </span>

              </label>

              {/* ─── Credit Card Fields ─── */}
              {paymentMethod === 'credit' && (

                <div className={styles.cardFields}>

                  {/* Card Number */}
                  <div className={styles.fieldGroup}>

                    <label className={styles.fieldLabel}>
                      Card Number
                    </label>

                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="1234 5678 9101 1234"
                      value={cardData.cardNumber}
                      onChange={handleChange}
                      className={`${styles.fieldInput} ${
                        errors.cardNumber
                          ? styles.inputError
                          : ''
                      }`}
                    />

                    {errors.cardNumber && (
                      <span className={styles.errorMsg}>
                        {errors.cardNumber}
                      </span>
                    )}

                  </div>

                  {/* Expiry + CVV */}
                  <div className={styles.fieldRow}>

                    <div className={styles.fieldGroup}>

                      <label className={styles.fieldLabel}>
                        Expiration date MM/YY
                      </label>

                      <input
                        type="text"
                        name="expiry"
                        placeholder="12/28"
                        value={cardData.expiry}
                        onChange={handleChange}
                        className={`${styles.fieldInput} ${
                          errors.expiry
                            ? styles.inputError
                            : ''
                        }`}
                      />

                      {errors.expiry && (
                        <span className={styles.errorMsg}>
                          {errors.expiry}
                        </span>
                      )}

                    </div>

                    <div className={styles.fieldGroup}>

                      <label className={styles.fieldLabel}>
                        CVV
                      </label>

                      <input
                        type="text"
                        name="cvv"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={handleChange}
                        className={`${styles.fieldInput} ${
                          errors.cvv
                            ? styles.inputError
                            : ''
                        }`}
                      />

                      {errors.cvv && (
                        <span className={styles.errorMsg}>
                          {errors.cvv}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* Cardholder Name */}
                  <div className={styles.fieldGroup}>

                    <label className={styles.fieldLabel}>
                      Cardholder Name
                    </label>

                    <input
                      type="text"
                      name="cardName"
                      placeholder="Katerina Petrova"
                      value={cardData.cardName}
                      onChange={handleChange}
                      className={`${styles.fieldInput} ${
                        errors.cardName
                          ? styles.inputError
                          : ''
                      }`}
                    />

                    {errors.cardName && (
                      <span className={styles.errorMsg}>
                        {errors.cardName}
                      </span>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* ─── Order Summary ─── */}
            <div className={styles.summaryCard}>

              <h2 className={styles.cardTitle}>
                Order Summary
              </h2>

              <div className={styles.summaryInfo}>

                <p className={styles.summaryLine}>

                  <span className={styles.summaryKey}>
                    Cinema
                  </span>

                  <span className={styles.summaryVal}>
                    {bookingData.cinema}
                    {' — '}
                    {bookingData.showtime}
                  </span>

                </p>

                <p className={styles.summaryMovie}>
                  {bookingData.movie}
                </p>

              </div>

              {/* Seats */}
              <div className={styles.seatsRow}>

                <span className={styles.seatDot} />

                {seats.map((seat) => (
                  <span
                    key={seat}
                    className={styles.seatTag}
                  >
                    {seat}
                  </span>
                ))}

              </div>

              <div className={styles.divider} />

              {/* Price Breakdown */}
              <div className={styles.priceBreakdown}>

                <div className={styles.priceRow}>

                  <span>
                    {seats.length}
                    {' '}
                    {bookingData.seatType}
                    {' '}
                    Seats
                  </span>

                  <span>
                    {totalSeatsPrice} EGP
                  </span>

                </div>

                <div className={styles.priceRow}>

                  <span>Service Fee</span>

                  <span>
                    {serviceFee} EGP
                  </span>

                </div>

              </div>

              <div className={styles.divider} />

              {/* Total */}
              <div className={styles.totalRow}>

                <span className={styles.totalLabel}>
                  Total Price:
                </span>

                <span className={styles.totalPrice}>
                  {totalPrice} EGP
                </span>

              </div>

              {/* Pay Button */}
              <button
                type="submit"
                className={styles.payBtn}
                disabled={loading}
              >

                {loading
                  ? 'Processing...'
                  : 'PAY NOW'}

              </button>

            </div>

          </form>

        </div>

      </div>

    </Layout>
  )
}

export default Payment







// const Payment = () => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   // ─── Booking data passed from Seats page via navigate state ───
//   const bookingData = location.state || {
//     cinema: 'Scene Cinema',
//     showtime: '8:00 pm',
//     movie: 'Bershama',
//     seats: ['C4', 'C5', 'C6'],
//     seatType: 'Standard',
//     pricePerSeat: 200,
//     serviceFee: 30
//   }

//   const totalSeatsPrice = bookingData.seats.length * bookingData.pricePerSeat
//   const totalPrice = totalSeatsPrice + bookingData.serviceFee

//   const [paymentMethod, setPaymentMethod] = useState('cashier')

//   const [cardData, setCardData] = useState({
//     cardNumber: '',
//     expiry: '',
//     cvv: '',
//     cardName: ''
//   })

//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)

//   // ─── Validation ───
//   const validate = () => {
//     const newErrors = {}

//     if (paymentMethod === 'credit') {
//       // Card Number
//       const rawCard = cardData.cardNumber.replace(/\s/g, '')
//       if (!rawCard) {
//         newErrors.cardNumber = 'Card number is required'
//       } else if (!/^\d{16}$/.test(rawCard)) {
//         newErrors.cardNumber = 'Card number must be 16 digits'
//       }

//       // Expiry
//       if (!cardData.expiry.trim()) {
//         newErrors.expiry = 'Expiry date is required'
//       } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
//         newErrors.expiry = 'Use MM/YY format'
//       }

//       // CVV
//       if (!cardData.cvv.trim()) {
//         newErrors.cvv = 'CVV is required'
//       } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
//         newErrors.cvv = 'CVV must be 3 or 4 digits'
//       }

//       // Card Name
//       if (!cardData.cardName.trim()) {
//         newErrors.cardName = 'Cardholder name is required'
//       } else if (cardData.cardName.trim().length < 3) {
//         newErrors.cardName = 'Enter full name as on card'
//       }
//     }

//     return newErrors
//   }

//   // ─── Format card number with spaces ───
//   const formatCardNumber = (value) => {
//     const raw = value.replace(/\D/g, '').slice(0, 16)
//     return raw.replace(/(.{4})/g, '$1 ').trim()
//   }

//   // ─── Format expiry ───
//   const formatExpiry = (value) => {
//     const raw = value.replace(/\D/g, '').slice(0, 4)
//     if (raw.length >= 3) return raw.slice(0, 2) + '/' + raw.slice(2)
//     return raw
//   }

//   // ─── Handle Input Change ───
//   const handleChange = (e) => {
//     const { name, value } = e.target
//     let formatted = value

//     if (name === 'cardNumber') formatted = formatCardNumber(value)
//     if (name === 'expiry') formatted = formatExpiry(value)
//     if (name === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4)

//     setCardData((prev) => ({ ...prev, [name]: formatted }))
//     if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
//   }

//   // ─── Handle Submit ───
//   const handleSubmit = (e) => {
//     e.preventDefault()
//     const validationErrors = validate()
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors)
//       return
//     }

//     setLoading(true)

//     setTimeout(() => {
//       const result = confirmBooking({
//         cinema: bookingData.cinema,
//         movie: bookingData.movie,
//         seats: bookingData.seats,
//         showtime: bookingData.showtime,
//         total: totalPrice,
//         paymentMethod
//       })
//       setLoading(false)

//       if (result.success) {
//         toast.success('Payment successful! 🎬')
//         navigate('/payment-confirmation', { state: result })
//       } else {
//         toast.error('Payment failed. Please try again.')
//       }
//     }, 1000)
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.paymentPage}>
//         <div className={styles.inner}>

//           <h1 className={styles.pageTitle}>Payment</h1>

//           <form onSubmit={handleSubmit} className={styles.paymentGrid} noValidate>

//             {/* ─── Left: Payment Method ─── */}
//             <div className={styles.paymentCard}>
//               <h2 className={styles.cardTitle}>Payment Method</h2>

//               {/* Cashier Option */}
//               <label className={styles.radioOption}>
//                 <input
//                   type="radio"
//                   name="paymentMethod"
//                   value="cashier"
//                   checked={paymentMethod === 'cashier'}
//                   onChange={() => setPaymentMethod('cashier')}
//                   className={styles.radioInput}
//                 />
//                 <span className={styles.radioLabel}>Pay at the Cashier</span>
//               </label>

//               {/* Credit Card Option */}
//               <label className={styles.radioOption}>
//                 <input
//                   type="radio"
//                   name="paymentMethod"
//                   value="credit"
//                   checked={paymentMethod === 'credit'}
//                   onChange={() => setPaymentMethod('credit')}
//                   className={styles.radioInput}
//                 />
//                 <span className={styles.radioLabel}>Credit Card</span>
//               </label>

//               {/* ─── Credit Card Fields ─── */}
//               {paymentMethod === 'credit' && (
//                 <div className={styles.cardFields}>

//                   {/* Card Number */}
//                   <div className={styles.fieldGroup}>
//                     <label className={styles.fieldLabel}>Card Number</label>
//                     <input
//                       type="text"
//                       name="cardNumber"
//                       placeholder="1234 5678 9101 1234"
//                       value={cardData.cardNumber}
//                       onChange={handleChange}
//                       className={`${styles.fieldInput} ${errors.cardNumber ? styles.inputError : ''}`}
//                     />
//                     {errors.cardNumber && (
//                       <span className={styles.errorMsg}>{errors.cardNumber}</span>
//                     )}
//                   </div>

//                   {/* Expiry + CVV */}
//                   <div className={styles.fieldRow}>
//                     <div className={styles.fieldGroup}>
//                       <label className={styles.fieldLabel}>Expiration date MM/YY</label>
//                       <input
//                         type="text"
//                         name="expiry"
//                         placeholder="12/28"
//                         value={cardData.expiry}
//                         onChange={handleChange}
//                         className={`${styles.fieldInput} ${errors.expiry ? styles.inputError : ''}`}
//                       />
//                       {errors.expiry && (
//                         <span className={styles.errorMsg}>{errors.expiry}</span>
//                       )}
//                     </div>
//                     <div className={styles.fieldGroup}>
//                       <label className={styles.fieldLabel}>CVV</label>
//                       <input
//                         type="text"
//                         name="cvv"
//                         placeholder="123"
//                         value={cardData.cvv}
//                         onChange={handleChange}
//                         className={`${styles.fieldInput} ${errors.cvv ? styles.inputError : ''}`}
//                       />
//                       {errors.cvv && (
//                         <span className={styles.errorMsg}>{errors.cvv}</span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Cardholder Name */}
//                   <div className={styles.fieldGroup}>
//                     <label className={styles.fieldLabel}>Cardholder Name</label>
//                     <input
//                       type="text"
//                       name="cardName"
//                       placeholder="Katerina Petrova"
//                       value={cardData.cardName}
//                       onChange={handleChange}
//                       className={`${styles.fieldInput} ${errors.cardName ? styles.inputError : ''}`}
//                     />
//                     {errors.cardName && (
//                       <span className={styles.errorMsg}>{errors.cardName}</span>
//                     )}
//                   </div>

//                 </div>
//               )}
//             </div>

//             {/* ─── Right: Order Summary ─── */}
//             <div className={styles.summaryCard}>
//               <h2 className={styles.cardTitle}>Order Summary</h2>

//               <div className={styles.summaryInfo}>
//                 <p className={styles.summaryLine}>
//                   <span className={styles.summaryKey}>Cinema</span>
//                   <span className={styles.summaryVal}>
//                     {bookingData.cinema} — {bookingData.showtime}
//                   </span>
//                 </p>
//                 <p className={styles.summaryMovie}>{bookingData.movie}</p>
//               </div>

//               {/* Seats */}
//               <div className={styles.seatsRow}>
//                 <span className={styles.seatDot} />
//                 {bookingData.seats.map((seat) => (
//                   <span key={seat} className={styles.seatTag}>{seat}</span>
//                 ))}
//               </div>

//               <div className={styles.divider} />

//               {/* Price Breakdown */}
//               <div className={styles.priceBreakdown}>
//                 <div className={styles.priceRow}>
//                   <span>
//                     {bookingData.seats.length} {bookingData.seatType} Seats
//                   </span>
//                   <span>{bookingData.pricePerSeat}–{bookingData.pricePerSeat * bookingData.seats.length} EGP</span>
//                 </div>
//                 <div className={styles.priceRow}>
//                   <span>Service Fee</span>
//                   <span>{bookingData.serviceFee}–{bookingData.serviceFee * bookingData.seats.length} EGP</span>
//                 </div>
//               </div>

//               <div className={styles.divider} />

//               <div className={styles.totalRow}>
//                 <span className={styles.totalLabel}>Total Price:</span>
//                 <span className={styles.totalPrice}>{totalPrice} EGP</span>
//               </div>

//               {/* Pay Now Button */}
//               <button
//                 type="submit"
//                 className={styles.payBtn}
//                 disabled={loading}
//               >
//                 {loading ? 'Processing...' : 'PAY NOW'}
//               </button>

//             </div>

//           </form>
//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Payment
