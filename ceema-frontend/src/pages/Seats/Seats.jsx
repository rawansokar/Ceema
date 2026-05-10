import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getAllSeats, getSeats, buildSeatMap } from '../../services/bookingService'
import Layout from '../../components/Layout/Layout'
import styles from './Seats.module.css'

// ─── Pricing constants (update when backend provides pricing API) ───
const PRICING = {
  standard: 200,
  vip: 350,
  serviceFee: 30
}

// ─── Legend config ───
const LEGEND = [
  { type: 'available', label: 'Standard', color: 'transparent', border: '2px solid #ffffff' },
  { type: 'occupied', label: 'Occupied', color: '#555555', border: 'none' },
  { type: 'selected', label: 'Selected', color: '#cc0000', border: 'none' },
  { type: 'vip', label: 'VIP', color: '#1a6bbf', border: 'none' },
]

// ─── Helper: determine seat type from row number ───
// Based on screenshot: rows 9-13 (bottom section) are VIP (blue)
const getSeatType = (rowNumber) => {
  return rowNumber >= 9 ? 'vip' : 'standard'
}

const Seats = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // ─── Booking context from MovieSlots ───
  const bookingContext = location.state || {
    cinema: 'Scene Cinema',
    movie: 'Bershama',
    showtime: '8:00 pm',
    showtimeId: null,
    ticketPrice: PRICING.standard,
    movieId: 101
  }

  const [rows, setRows] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // ─── Fetch seats from API ───
  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true)
      try {
        const seats = bookingContext.showtimeId
          ? await getSeats(bookingContext.showtimeId)
          : await getAllSeats()
        if (seats && seats.length > 50) {
          const seatMap = buildSeatMap(
            seats.map((seat) => ({
              ...seat,
              type: getSeatType(seat.row),
              status: seat.is_available ? 'available' : 'occupied',
            }))
          )
          setRows(seatMap)
        } else {
          // Fallback: generate seat map matching screenshot layout
          // 13 rows: A-H standard (rows 1-8), I-M VIP (rows 9-13)
          setRows(generateFallbackSeats())
        }
      } catch (err) {
        console.error('Failed to fetch seats:', err)
        setRows(generateFallbackSeats())
      } finally {
        setLoading(false)
      }
    }
    fetchSeats()
  }, [bookingContext.showtimeId])

  // ─── Fallback seat generator matching screenshot exactly ───
  const generateFallbackSeats = () => {
    const layout = [
      { rowNum: 1, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 2, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 3, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 4, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 5, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 6, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 7, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      { rowNum: 8, cols: [1,2,3,4, 6,7,8,9,10,11,12, 14,15,16,17] },
      // VIP rows
      { rowNum: 9,  cols: [4,5,6,7,8,9,10, 12,13,14,15,16] },
      { rowNum: 10, cols: [4,5,6,7,8,9,10, 12,13,14,15,16] },
      { rowNum: 11, cols: [4,5,6,7,8,9,10, 12,13,14,15,16] },
      { rowNum: 12, cols: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
      { rowNum: 13, cols: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
    ]

    // Pre-occupied seats matching screenshot pattern
    const occupiedSet = new Set([
      'A1','A2','A3','B1','B2','B3','C1','C2',
      'E6','E7','E8','E9','F6','F7','F8',
      'G1','G2','G3','H1','H2',
      'I4','I5','I6','I7','J4','J5','J6','J7','K4','K5',
    ])

    return layout.map(({ rowNum, cols }) => {
      const rowLetter = String.fromCharCode(64 + rowNum)
      const type = getSeatType(rowNum)
      return {
        rowId: rowLetter,
        rowNumber: rowNum,
        seats: cols.map((col) => {
          const seatId = `${rowLetter}${col}`
          return {
            id: rowNum * 100 + col, // numeric id for API
            seat_number: seatId,
            row: rowNum,
            column: col,
            status: occupiedSet.has(seatId) ? 'occupied' : 'available',
            is_available: !occupiedSet.has(seatId),
            type
          }
        })
      }
    })
  }

  // ─── Toggle seat selection ───
  const handleSeatClick = async (seat) => {
    if (!seat.is_available && seat.status === 'occupied') return

    const alreadySelected = selectedSeats.find((s) => s.id === seat.id)

    if (alreadySelected) {
      // Deselect — release if reserved via API
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id))
      // releaseSeat(seat.id) — uncomment when API is stable
    } else {
      if (selectedSeats.length >= 6) {
        toast.warning('You can select a maximum of 6 seats')
        return
      }
      setSelectedSeats((prev) => [...prev, seat])
      // reserveSeat(seat.id) — uncomment when API is stable
    }
  }

  // ─── Get seat CSS class ───
  const getSeatClass = (seat) => {
    if (seat.status === 'occupied') return styles.seatOccupied
    if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatSelected
    if (seat.type === 'vip') return styles.seatVip
    return styles.seatAvailable
  }

  // ─── Calculate total price ───
  const calculateTotal = () => {
    const standardPrice = Number(bookingContext.ticketPrice || PRICING.standard)
    const vipPrice = Math.max(PRICING.vip, standardPrice)
    const total = selectedSeats.reduce((sum, seat) => {
      return sum + (seat.type === 'vip' ? vipPrice : standardPrice)
    }, 0)
    return total + PRICING.serviceFee
  }

  // ─── Continue to Payment ───
  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }

    const standardSeats = selectedSeats.filter((s) => s.type === 'standard')
    const vipSeats = selectedSeats.filter((s) => s.type === 'vip')

    navigate('/payment', {
      state: {
        cinema: bookingContext.cinema,
        movie: bookingContext.movie,
        showtime: bookingContext.showtime,
        showtimeId: bookingContext.showtimeId,
        seatIds: selectedSeats.map((s) => s.id),
        seats: selectedSeats.map((s) => s.seat_number),
        seatType: vipSeats.length > 0 ? 'Mixed' : 'Standard',
        pricePerSeat: Number(bookingContext.ticketPrice || PRICING.standard),
        vipPrice: Math.max(PRICING.vip, Number(bookingContext.ticketPrice || PRICING.standard)),
        serviceFee: PRICING.serviceFee,
        standardCount: standardSeats.length,
        vipCount: vipSeats.length,
        total: calculateTotal()
      }
    })
  }

  if (loading) {
    return (
      <Layout showBack={true}>
        <div className={styles.seatsPage}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Loading seat map...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showBack={true}>
      <div className={styles.seatsPage}>
        <div className={styles.inner}>

          {/* ─── Title ─── */}
          <h1 className={styles.pageTitle}>Book Your Seat</h1>
          <p className={styles.cinemaName}>{bookingContext.cinema}</p>

          {/* ─── Legend ─── */}
          <div className={styles.legend}>
            {LEGEND.map((item) => (
              <div key={item.type} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{
                    backgroundColor: item.color,
                    border: item.border
                  }}
                />
                <span className={styles.legendLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* ─── Screen ─── */}
          <div className={styles.screenWrap}>
            <div className={styles.screen}>Screen</div>
          </div>

          {/* ─── Seat Map ─── */}
          <div className={styles.seatMap}>
            {rows.map((row) => (
              <div key={row.rowId} className={styles.seatRow}>
                <span className={styles.rowLabel}>{row.rowId}</span>
                <div className={styles.seats}>
                  {row.seats.map((seat) => (
                    <button
                      key={seat.id}
                      className={`${styles.seat} ${getSeatClass(seat)}`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'occupied'}
                      title={`${seat.seat_number} — ${seat.type}${seat.status === 'occupied' ? ' (Occupied)' : ''}`}
                    />
                  ))}
                </div>
                <span className={styles.rowLabel}>{row.rowId}</span>
              </div>
            ))}
          </div>

          {/* ─── Selected Summary ─── */}
          {selectedSeats.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryLeft}>
                <span className={styles.summaryLabel}>Selected:</span>
                <div className={styles.selectedTags}>
                  {selectedSeats.map((seat) => (
                    <span key={seat.id} className={styles.seatTag}>
                      {seat.seat_number}
                      <button
                        className={styles.removeTag}
                        onClick={() => handleSeatClick(seat)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.summaryRight}>
                <span className={styles.totalLabel}>Total:</span>
                <span className={styles.totalPrice}>{calculateTotal()} EGP</span>
              </div>
            </div>
          )}

          {/* ─── Actions ─── */}
          <div className={styles.actions}>
            <button
              className={styles.previewBtn}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Hide Preview 🎬' : 'Preview your Seat 🎬'}
            </button>
            <button
              className={styles.continueBtn}
              onClick={handleContinue}
              disabled={selectedSeats.length === 0}
            >
              Continue to Payment
            </button>
          </div>

          {/* ─── Preview Card ─── */}
          {previewMode && selectedSeats.length > 0 && (
            <div className={styles.previewCard}>
              <h3 className={styles.previewTitle}>Your Booking Preview</h3>
              <div className={styles.previewDetails}>
                <div className={styles.previewRow}>
                  <span className={styles.previewKey}>Cinema</span>
                  <span className={styles.previewVal}>{bookingContext.cinema}</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewKey}>Movie</span>
                  <span className={styles.previewVal}>{bookingContext.movie}</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewKey}>Showtime</span>
                  <span className={styles.previewVal}>{bookingContext.showtime}</span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewKey}>Seats</span>
                  <span className={styles.previewVal}>
                    {selectedSeats.map((s) => s.seat_number).join(', ')}
                  </span>
                </div>
                <div className={styles.previewRow}>
                  <span className={styles.previewKey}>Total</span>
                  <span className={styles.previewVal}>{calculateTotal()} EGP</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default Seats



// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { getAllSeats, reserveSeat, releaseSeat } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Seats.module.css'

// const Seats = () => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   // ─── Booking context ───
//   const bookingContext = location.state || {
//     cinema: 'Scene Cinema',
//     movie: 'Bershama',
//     showtime: '8:00 pm',
//     showtimeId: 1,
//     movieId: 101
//   }

//   const [seatsData, setSeatsData] = useState(null)
//   const [selectedSeats, setSelectedSeats] = useState([])
//   const [previewMode, setPreviewMode] = useState(false)

//   // ─── Fetch seats ───
//   // useEffect(() => {
//   //   const fetchSeats = async () => {
//   //     try {
//   //       const data = await getAllSeats()

//   //       setSeatsData(data)
//   //     } catch (error) {
//   //       console.error('Seats fetch error:', error)
//   //       toast.error('Failed to load seats')
//   //     }
//   //   }
//   //   fetchSeats()
//   // }, [])

//   useEffect(() => {
//   const fetchSeats = async () => {
//     try {
//       const data = await getAllSeats()
//       setSeatsData(data)
//     } catch (error) {
//       console.error('Seats fetch error:', error)
//       toast.error('Failed to load seats')
//       setSeatsData({ rows: [], legend: [], pricing: {} })
//     }
//   }

//   fetchSeats()
// }, [])

//   // ─── Handle seat click ───
//   const handleSeatClick = async (seat) => {
//     if (seat.status === 'occupied') return

//     const exists = selectedSeats.find((s) => s.id === seat.id)

//     // REMOVE SEAT
//     if (exists) {
//       const result = await releaseSeat(seat)

//       if (!result.success) {
//         toast.error(result.message)
//         return
//       }

//       setSelectedSeats((prev) =>
//         prev.filter((s) => s.id !== seat.id)
//       )

//       return
//     }

//     // LIMIT
//     if (selectedSeats.length >= 6) {
//       toast.warning('You can select a maximum of 6 seats')
//       return
//     }

//     // RESERVE
//     const result = await reserveSeat(seat)

//     if (!result.success) {
//       toast.error(result.message)
//       return
//     }

//     setSelectedSeats((prev) => [...prev, seat])
//   }

//   // ─── Seat styling ───
//   const getSeatClass = (seat) => {
//     if (seat.status === 'occupied') return styles.seatOccupied
//     if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatSelected
//     if (seat.type === 'vip') return styles.seatVip
//     return styles.seatAvailable
//   }

//   // ─── Total calculation ───
//   const calculateTotal = () => {
//     if (!seatsData) return 0

//     const total = selectedSeats.reduce((sum, seat) => {
//       const price =
//         seat.type === 'vip'
//           ? seatsData.pricing.vip
//           : seatsData.pricing.standard

//       return sum + price
//     }, 0)

//     return total + seatsData.pricing.serviceFee
//   }

//   // ─── Continue ───
//   const handleContinue = () => {
//     if (selectedSeats.length === 0) {
//       toast.error('Please select at least one seat')
//       return
//     }

//     const standardSeats = selectedSeats.filter((s) => s.type === 'standard')
//     const vipSeats = selectedSeats.filter((s) => s.type === 'vip')

//     navigate('/payment', {
//       state: {
//         cinema: bookingContext.cinema,
//         movie: bookingContext.movie,
//         showtime: bookingContext.showtime,
//         seats: selectedSeats.map((s) => s.id),
//         seatType: vipSeats.length > 0 ? 'Mixed' : 'Standard',
//         pricePerSeat: seatsData.pricing.standard,
//         serviceFee: seatsData.pricing.serviceFee,
//         standardCount: standardSeats.length,
//         vipCount: vipSeats.length,
//         total: calculateTotal()
//       }
//     })
//   }

//   // ─── SAFE LOADING GUARD (fixes white screen) ───
//   if (!seatsData?.rows || !seatsData?.legend) {
//     return (
//       <Layout showBack={true}>
//         <div style={{ padding: 20, color: '#fff' }}>
//           Loading seats...
//         </div>
//       </Layout>
//     )
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.seatsPage}>
//         <div className={styles.inner}>

//           {/* Title */}
//           <h1 className={styles.pageTitle}>Book Your Seat</h1>
//           <p className={styles.cinemaName}>{bookingContext.cinema}</p>

//           {/* Legend */}
//           <div className={styles.legend}>
//             {seatsData.legend?.map((item) => (
//               <div key={item.type} className={styles.legendItem}>
//                 <span
//                   className={styles.legendDot}
//                   style={{
//                     backgroundColor:
//                       item.type === 'available'
//                         ? 'transparent'
//                         : item.type === 'occupied'
//                         ? '#555'
//                         : item.type === 'selected'
//                         ? 'var(--color-primary)'
//                         : '#1a6bbf',
//                     border:
//                       item.type === 'available'
//                         ? '2px solid #fff'
//                         : 'none'
//                   }}
//                 />
//                 <span className={styles.legendLabel}>
//                   {item.label}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Screen */}
//           <div className={styles.screenWrap}>
//             <div className={styles.screen}>Screen</div>
//           </div>

//           {/* Seats */}
//           <div className={styles.seatMap}>
//             {seatsData.rows?.map((row) => (
//               <div key={row.rowId} className={styles.seatRow}>
//                 <span className={styles.rowLabel}>{row.rowId}</span>

//                 <div className={styles.seats}>
//                   {row.seats.map((seat) => (
//                     <button
//                       key={seat.id}
//                       className={`${styles.seat} ${getSeatClass(seat)}`}
//                       onClick={() => handleSeatClick(seat)}
//                       disabled={seat.status === 'occupied'}
//                       title={`${seat.id} - ${seat.type}`}
//                     />
//                   ))}
//                 </div>

//                 <span className={styles.rowLabel}>{row.rowId}</span>
//               </div>
//             ))}
//           </div>

//           {/* Summary */}
//           {selectedSeats.length > 0 && (
//             <div className={styles.summary}>
//               <div className={styles.summaryLeft}>
//                 <span className={styles.summaryLabel}>Selected:</span>

//                 <div className={styles.selectedTags}>
//                   {selectedSeats.map((seat) => (
//                     <span key={seat.id} className={styles.seatTag}>
//                       {seat.id}
//                       <button
//                         className={styles.removeTag}
//                         onClick={() => handleSeatClick(seat)}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div className={styles.summaryRight}>
//                 <span className={styles.totalLabel}>Total:</span>
//                 <span className={styles.totalPrice}>
//                   {calculateTotal()} EGP
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Actions */}
//           <div className={styles.actions}>
//             <button
//               className={styles.previewBtn}
//               onClick={() => setPreviewMode(!previewMode)}
//             >
//               {previewMode ? 'Hide Preview 🎬' : 'Preview 🎬'}
//             </button>

//             <button
//               className={styles.continueBtn}
//               onClick={handleContinue}
//               disabled={selectedSeats.length === 0}
//             >
//               Continue to Payment
//             </button>
//           </div>

//           {/* Preview */}
//           {previewMode && selectedSeats.length > 0 && (
//             <div className={styles.previewCard}>
//               <h3 className={styles.previewTitle}>
//                 Your Booking Preview
//               </h3>

//               <div className={styles.previewDetails}>
//                 <div className={styles.previewRow}>
//                   <span>Cinema</span>
//                   <span>{bookingContext.cinema}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Movie</span>
//                   <span>{bookingContext.movie}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Showtime</span>
//                   <span>{bookingContext.showtime}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Seats</span>
//                   <span>
//                     {selectedSeats.map((s) => s.id).join(', ')}
//                   </span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Total</span>
//                   <span>{calculateTotal()} EGP</span>
//                 </div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Seats








// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { getAllSeats, reserveSeat, releaseSeat } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Seats.module.css'

// const Seats = () => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   // ─── Booking context ───
//   const bookingContext = location.state || {
//     cinema: 'Scene Cinema',
//     movie: 'Bershama',
//     showtime: '8:00 pm',
//     showtimeId: 1,
//     movieId: 101
//   }

//   const [seatsData, setSeatsData] = useState(null)
//   const [selectedSeats, setSelectedSeats] = useState([])
//   const [previewMode, setPreviewMode] = useState(false)

//   // ─── Fetch seats ───
//   // useEffect(() => {
//   //   const fetchSeats = async () => {
//   //     try {
//   //       const data = await getAllSeats()

//   //       setSeatsData(data)
//   //     } catch (error) {
//   //       console.error('Seats fetch error:', error)
//   //       toast.error('Failed to load seats')
//   //     }
//   //   }
//   //   fetchSeats()
//   // }, [])

//   useEffect(() => {
//   const fetchSeats = async () => {
//     try {
//       const data = await getAllSeats()
//       setSeatsData(data)
//     } catch (error) {
//       console.error('Seats fetch error:', error)
//       toast.error('Failed to load seats')
//       setSeatsData({ rows: [], legend: [], pricing: {} })
//     }
//   }

//   fetchSeats()
// }, [])

//   // ─── Handle seat click ───
//   const handleSeatClick = async (seat) => {
//     if (seat.status === 'occupied') return

//     const exists = selectedSeats.find((s) => s.id === seat.id)

//     // REMOVE SEAT
//     if (exists) {
//       const result = await releaseSeat(seat)

//       if (!result.success) {
//         toast.error(result.message)
//         return
//       }

//       setSelectedSeats((prev) =>
//         prev.filter((s) => s.id !== seat.id)
//       )

//       return
//     }

//     // LIMIT
//     if (selectedSeats.length >= 6) {
//       toast.warning('You can select a maximum of 6 seats')
//       return
//     }

//     // RESERVE
//     const result = await reserveSeat(seat)

//     if (!result.success) {
//       toast.error(result.message)
//       return
//     }

//     setSelectedSeats((prev) => [...prev, seat])
//   }

//   // ─── Seat styling ───
//   const getSeatClass = (seat) => {
//     if (seat.status === 'occupied') return styles.seatOccupied
//     if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatSelected
//     if (seat.type === 'vip') return styles.seatVip
//     return styles.seatAvailable
//   }

//   // ─── Total calculation ───
//   const calculateTotal = () => {
//     if (!seatsData) return 0

//     const total = selectedSeats.reduce((sum, seat) => {
//       const price =
//         seat.type === 'vip'
//           ? seatsData.pricing.vip
//           : seatsData.pricing.standard

//       return sum + price
//     }, 0)

//     return total + seatsData.pricing.serviceFee
//   }

//   // ─── Continue ───
//   const handleContinue = () => {
//     if (selectedSeats.length === 0) {
//       toast.error('Please select at least one seat')
//       return
//     }

//     const standardSeats = selectedSeats.filter((s) => s.type === 'standard')
//     const vipSeats = selectedSeats.filter((s) => s.type === 'vip')

//     navigate('/payment', {
//       state: {
//         cinema: bookingContext.cinema,
//         movie: bookingContext.movie,
//         showtime: bookingContext.showtime,
//         seats: selectedSeats.map((s) => s.id),
//         seatType: vipSeats.length > 0 ? 'Mixed' : 'Standard',
//         pricePerSeat: seatsData.pricing.standard,
//         serviceFee: seatsData.pricing.serviceFee,
//         standardCount: standardSeats.length,
//         vipCount: vipSeats.length,
//         total: calculateTotal()
//       }
//     })
//   }

//   // ─── SAFE LOADING GUARD (fixes white screen) ───
//   if (!seatsData?.rows || !seatsData?.legend) {
//     return (
//       <Layout showBack={true}>
//         <div style={{ padding: 20, color: '#fff' }}>
//           Loading seats...
//         </div>
//       </Layout>
//     )
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.seatsPage}>
//         <div className={styles.inner}>

//           {/* Title */}
//           <h1 className={styles.pageTitle}>Book Your Seat</h1>
//           <p className={styles.cinemaName}>{bookingContext.cinema}</p>

//           {/* Legend */}
//           <div className={styles.legend}>
//             {seatsData.legend?.map((item) => (
//               <div key={item.type} className={styles.legendItem}>
//                 <span
//                   className={styles.legendDot}
//                   style={{
//                     backgroundColor:
//                       item.type === 'available'
//                         ? 'transparent'
//                         : item.type === 'occupied'
//                         ? '#555'
//                         : item.type === 'selected'
//                         ? 'var(--color-primary)'
//                         : '#1a6bbf',
//                     border:
//                       item.type === 'available'
//                         ? '2px solid #fff'
//                         : 'none'
//                   }}
//                 />
//                 <span className={styles.legendLabel}>
//                   {item.label}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Screen */}
//           <div className={styles.screenWrap}>
//             <div className={styles.screen}>Screen</div>
//           </div>

//           {/* Seats */}
//           <div className={styles.seatMap}>
//             {seatsData.rows?.map((row) => (
//               <div key={row.rowId} className={styles.seatRow}>
//                 <span className={styles.rowLabel}>{row.rowId}</span>

//                 <div className={styles.seats}>
//                   {row.seats.map((seat) => (
//                     <button
//                       key={seat.id}
//                       className={`${styles.seat} ${getSeatClass(seat)}`}
//                       onClick={() => handleSeatClick(seat)}
//                       disabled={seat.status === 'occupied'}
//                       title={`${seat.id} - ${seat.type}`}
//                     />
//                   ))}
//                 </div>

//                 <span className={styles.rowLabel}>{row.rowId}</span>
//               </div>
//             ))}
//           </div>

//           {/* Summary */}
//           {selectedSeats.length > 0 && (
//             <div className={styles.summary}>
//               <div className={styles.summaryLeft}>
//                 <span className={styles.summaryLabel}>Selected:</span>

//                 <div className={styles.selectedTags}>
//                   {selectedSeats.map((seat) => (
//                     <span key={seat.id} className={styles.seatTag}>
//                       {seat.id}
//                       <button
//                         className={styles.removeTag}
//                         onClick={() => handleSeatClick(seat)}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div className={styles.summaryRight}>
//                 <span className={styles.totalLabel}>Total:</span>
//                 <span className={styles.totalPrice}>
//                   {calculateTotal()} EGP
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Actions */}
//           <div className={styles.actions}>
//             <button
//               className={styles.previewBtn}
//               onClick={() => setPreviewMode(!previewMode)}
//             >
//               {previewMode ? 'Hide Preview 🎬' : 'Preview 🎬'}
//             </button>

//             <button
//               className={styles.continueBtn}
//               onClick={handleContinue}
//               disabled={selectedSeats.length === 0}
//             >
//               Continue to Payment
//             </button>
//           </div>

//           {/* Preview */}
//           {previewMode && selectedSeats.length > 0 && (
//             <div className={styles.previewCard}>
//               <h3 className={styles.previewTitle}>
//                 Your Booking Preview
//               </h3>

//               <div className={styles.previewDetails}>
//                 <div className={styles.previewRow}>
//                   <span>Cinema</span>
//                   <span>{bookingContext.cinema}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Movie</span>
//                   <span>{bookingContext.movie}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Showtime</span>
//                   <span>{bookingContext.showtime}</span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Seats</span>
//                   <span>
//                     {selectedSeats.map((s) => s.id).join(', ')}
//                   </span>
//                 </div>

//                 <div className={styles.previewRow}>
//                   <span>Total</span>
//                   <span>{calculateTotal()} EGP</span>
//                 </div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Seats




















// // const Seats = () => <div>Seats</div>; export default Seats;
// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { getSeats } from '../../services/bookingService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Seats.module.css'

// const Seats = () => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   // ─── Booking context passed from MovieSlots ───
//   const bookingContext = location.state || {
//     cinema: 'Scene Cinema',
//     movie: 'Bershama',
//     showtime: '8:00 pm',
//     movieId: 101
//   }

//   const [seatsData, setSeatsData] = useState(null)
//   const [selectedSeats, setSelectedSeats] = useState([])
//   const [previewMode, setPreviewMode] = useState(false)

//   useEffect(() => {
//     const data = getSeats()
//     setSeatsData(data)
//   }, [])

//   // ─── Toggle Seat Selection ───
//   const handleSeatClick = (seat) => {
//     if (seat.status === 'occupied') return

//     setSelectedSeats((prev) => {
//       const exists = prev.find((s) => s.id === seat.id)
//       if (exists) {
//         return prev.filter((s) => s.id !== seat.id)
//       }
//       if (prev.length >= 6) {
//         toast.warning('You can select a maximum of 6 seats')
//         return prev
//       }
//       return [...prev, seat]
//     })
//   }

//   // ─── Get seat class ───
//   const getSeatClass = (seat) => {
//     if (seat.status === 'occupied') return styles.seatOccupied
//     if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatSelected
//     if (seat.type === 'vip') return styles.seatVip
//     return styles.seatAvailable
//   }

//   // ─── Calculate total ───
//   const calculateTotal = () => {
//     if (!seatsData) return 0
//     const total = selectedSeats.reduce((sum, seat) => {
//       const price =
//         seat.type === 'vip'
//           ? seatsData.pricing.vip
//           : seatsData.pricing.standard
//       return sum + price
//     }, 0)
//     return total + seatsData.pricing.serviceFee
//   }

//   // ─── Continue to Payment ───
//   const handleContinue = () => {
//     if (selectedSeats.length === 0) {
//       toast.error('Please select at least one seat')
//       return
//     }

//     const standardSeats = selectedSeats.filter((s) => s.type === 'standard')
//     const vipSeats = selectedSeats.filter((s) => s.type === 'vip')

//     navigate('/payment', {
//       state: {
//         cinema: bookingContext.cinema,
//         movie: bookingContext.movie,
//         showtime: bookingContext.showtime,
//         seats: selectedSeats.map((s) => s.id),
//         seatType: vipSeats.length > 0 ? 'Mixed' : 'Standard',
//         pricePerSeat: seatsData.pricing.standard,
//         serviceFee: seatsData.pricing.serviceFee,
//         standardCount: standardSeats.length,
//         vipCount: vipSeats.length,
//         total: calculateTotal()
//       }
//     })
//   }

//   if (!seatsData) return null

//   return (
//     <Layout showBack={true}>
//       <div className={styles.seatsPage}>
//         <div className={styles.inner}>

//           {/* ─── Title ─── */}
//           <h1 className={styles.pageTitle}>Book Your Seat</h1>
//           <p className={styles.cinemaName}>{bookingContext.cinema}</p>

//           {/* ─── Legend ─── */}
//           <div className={styles.legend}>
//             {seatsData.legend.map((item) => (
//               <div key={item.type} className={styles.legendItem}>
//                 <span
//                   className={styles.legendDot}
//                   style={{
//                     backgroundColor:
//                       item.type === 'available'
//                         ? 'transparent'
//                         : item.type === 'occupied'
//                         ? '#555555'
//                         : item.type === 'selected'
//                         ? 'var(--color-primary)'
//                         : '#1a6bbf',
//                     border:
//                       item.type === 'available'
//                         ? '2px solid #ffffff'
//                         : 'none'
//                   }}
//                 />
//                 <span className={styles.legendLabel}>{item.label}</span>
//               </div>
//             ))}
//           </div>

//           {/* ─── Screen ─── */}
//           <div className={styles.screenWrap}>
//             <div className={styles.screen}>Screen</div>
//           </div>

//           {/* ─── Seat Map ─── */}
//           <div className={styles.seatMap}>
//             {seatsData.rows.map((row) => (
//               <div key={row.rowId} className={styles.seatRow}>
//                 <span className={styles.rowLabel}>{row.rowId}</span>
//                 <div className={styles.seats}>
//                   {row.seats.map((seat) => (
//                     <button
//                       key={seat.id}
//                       className={`${styles.seat} ${getSeatClass(seat)}`}
//                       onClick={() => handleSeatClick(seat)}
//                       disabled={seat.status === 'occupied'}
//                       title={`${seat.id} — ${seat.type} ${
//                         seat.status === 'occupied' ? '(Occupied)' : ''
//                       }`}
//                     />
//                   ))}
//                 </div>
//                 <span className={styles.rowLabel}>{row.rowId}</span>
//               </div>
//             ))}
//           </div>

//           {/* ─── Selected Seats Summary ─── */}
//           {selectedSeats.length > 0 && (
//             <div className={styles.summary}>
//               <div className={styles.summaryLeft}>
//                 <span className={styles.summaryLabel}>Selected:</span>
//                 <div className={styles.selectedTags}>
//                   {selectedSeats.map((seat) => (
//                     <span key={seat.id} className={styles.seatTag}>
//                       {seat.id}
//                       <button
//                         className={styles.removeTag}
//                         onClick={() => handleSeatClick(seat)}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>
//               <div className={styles.summaryRight}>
//                 <span className={styles.totalLabel}>Total:</span>
//                 <span className={styles.totalPrice}>
//                   {calculateTotal()} EGP
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* ─── Action Buttons ─── */}
//           <div className={styles.actions}>
//             <button
//               className={styles.previewBtn}
//               onClick={() => setPreviewMode(!previewMode)}
//             >
//               {previewMode ? 'Hide Preview 🎬' : 'Preview your Seat 🎬'}
//             </button>
//             <button
//               className={styles.continueBtn}
//               onClick={handleContinue}
//               disabled={selectedSeats.length === 0}
//             >
//               Continue to Payment
//             </button>
//           </div>

//           {/* ─── Preview Mode ─── */}
//           {previewMode && selectedSeats.length > 0 && (
//             <div className={styles.previewCard}>
//               <h3 className={styles.previewTitle}>Your Booking Preview</h3>
//               <div className={styles.previewDetails}>
//                 <div className={styles.previewRow}>
//                   <span className={styles.previewKey}>Cinema</span>
//                   <span className={styles.previewVal}>{bookingContext.cinema}</span>
//                 </div>
//                 <div className={styles.previewRow}>
//                   <span className={styles.previewKey}>Movie</span>
//                   <span className={styles.previewVal}>{bookingContext.movie}</span>
//                 </div>
//                 <div className={styles.previewRow}>
//                   <span className={styles.previewKey}>Showtime</span>
//                   <span className={styles.previewVal}>{bookingContext.showtime}</span>
//                 </div>
//                 <div className={styles.previewRow}>
//                   <span className={styles.previewKey}>Seats</span>
//                   <span className={styles.previewVal}>
//                     {selectedSeats.map((s) => s.id).join(', ')}
//                   </span>
//                 </div>
//                 <div className={styles.previewRow}>
//                   <span className={styles.previewKey}>Total</span>
//                   <span className={styles.previewVal}>{calculateTotal()} EGP</span>
//                 </div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Seats
