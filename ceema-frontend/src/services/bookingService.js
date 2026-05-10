import API from '../api/api'
import cinemasData from '../data/cinemas.json'

// ─────────────────────────────────────────
// BOOKING SERVICE
// All endpoints from the seats API
// ─────────────────────────────────────────

// GET /api/seats/ — get all seats
export const getAllSeats = async () => {
  try {
    const { data } = await API.get('/api/seats/')
    return data
  } catch (error) {
    console.error('getAllSeats error:', error)
    return []
  }
}

// GET /api/seats/{id}/ — get single seat by id
export const getSeatById = async (id) => {
  try {
    const { data } = await API.get(`/api/seats/${id}/`)
    return data
  } catch (error) {
    console.error('getSeatById error:', error)
    return null
  }
}

// POST /api/seats/{id}/reserve/ — reserve a seat
export const reserveSeat = async (id) => {
  try {
    const { data } = await API.post(`/api/seats/${id}/reserve/`)
    return { success: true, data }
  } catch (error) {
    console.error('reserveSeat error:', error)
    return { success: false, message: error.response?.data?.detail || 'Failed to reserve seat' }
  }
}

// POST /api/seats/{id}/release/ — release a seat
export const releaseSeat = async (id) => {
  try {
    const { data } = await API.post(`/api/seats/${id}/release/`)
    return { success: true, data }
  } catch (error) {
    console.error('releaseSeat error:', error)
    return { success: false, message: error.response?.data?.detail || 'Failed to release seat' }
  }
}

// PATCH /api/seats/{id}/ — partial update a seat
export const patchSeat = async (id, seatData) => {
  try {
    const { data } = await API.patch(`/api/seats/${id}/`, seatData)
    return { success: true, data }
  } catch (error) {
    console.error('patchSeat error:', error)
    return { success: false, message: error.response?.data?.detail || 'Failed to update seat' }
  }
}

// DELETE /api/seats/{id}/ — delete a seat
export const deleteSeat = async (id) => {
  try {
    await API.delete(`/api/seats/${id}/`)
    return { success: true }
  } catch (error) {
    console.error('deleteSeat error:', error)
    return { success: false }
  }
}

// ─────────────────────────────────────────
// Helper: build seat map from API response
// Groups flat seat list into rows for rendering
// ─────────────────────────────────────────
export const buildSeatMap = (seats) => {
  // Group seats by row number
  const rowMap = {}
  seats.forEach((seat) => {
    const rowKey = seat.row
    if (!rowMap[rowKey]) rowMap[rowKey] = []
    rowMap[rowKey].push(seat)
  })

  // Sort each row by column
  const rows = Object.keys(rowMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((rowKey) => ({
      rowId: String.fromCharCode(64 + Number(rowKey)), // 1→A, 2→B etc
      rowNumber: Number(rowKey),
      seats: rowMap[rowKey].sort((a, b) => a.column - b.column)
    }))

  return rows
}

export const getAllShowtimes = async (params = {}) => {
  try {
    const { data } = await API.get('/api/showtimes/', { params })
    return data
  } catch (error) {
    console.error('getAllShowtimes error:', error)
    return []
  }
}

export const getShowtimes = async (movieId) => {
  const params = movieId ? { movie: movieId } : {}
  return getAllShowtimes(params)
}

export const getShowtimeById = async (id) => {
  try {
    const { data } = await API.get(`/api/showtimes/${id}/`)
    return data
  } catch (error) {
    console.error('getShowtimeById error:', error)
    return null
  }
}

export const getSeats = async (showtimeId) => {
  try {
    const { data } = await API.get(`/api/showtimes/${showtimeId}/seats/`)
    return data
  } catch (error) {
    console.error('getSeats error:', error)
    return []
  }
}

export const getCinemas = async () => {
  try {
    const showtimes = await getAllShowtimes()
    const seen = new Map()

    showtimes.forEach((showtime) => {
      const name = showtime.cinema_name || showtime.cinema || showtime.hall
      if (!name) return
      const key = `${name}-${showtime.city || ''}`
      if (!seen.has(key)) {
        seen.set(key, {
          id: key,
          name,
          city: showtime.city || '',
          location: showtime.location || '',
        })
      }
    })

    return seen.size ? Array.from(seen.values()) : cinemasData
  } catch {
    return cinemasData
  }
}

export const createBooking = async ({ showtimeId, seatIds, pricePerSeat, totalPrice }) => {
  try {
    const { data } = await API.post('/api/bookings/', {
      showtime_id: showtimeId,
      seat_ids: seatIds,
      price_per_seat: pricePerSeat,
      total_price: totalPrice,
    })
    return { success: true, booking: data }
  } catch (error) {
    console.error('createBooking error:', error)
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Booking failed',
    }
  }
}

export const getBookings = async () => {
  try {
    const { data } = await API.get('/api/bookings/')
    return data
  } catch (error) {
    console.error('getBookings error:', error)
    return []
  }
}

export const getBookingTickets = async (bookingId) => {
  try {
    const { data } = await API.get(`/api/bookings/${bookingId}/tickets/`)
    return data
  } catch (error) {
    console.error('getBookingTickets error:', error)
    return []
  }
}

export const getTicketHistory = async () => {
  const bookings = await getBookings()
  const detailed = await Promise.all(
    bookings.map(async (booking) => {
      const [showtime, tickets] = await Promise.all([
        getShowtimeById(booking.showtime),
        getBookingTickets(booking.id),
      ])

      return {
        ...booking,
        showtime_detail: showtime,
        tickets,
        movie_title: showtime?.movie_title || `Movie #${showtime?.movie || ''}`,
        movie_poster: showtime?.movie_poster,
        cinema: showtime?.cinema_name || showtime?.hall || 'Cinema',
        city: showtime?.city || '',
        seats: tickets.map((ticket) => ticket.seat_number || ticket.seat).filter(Boolean),
      }
    })
  )

  return detailed
}












// import API from "../api/api";

// // ─────────────────────────────────────────
// // SHOWTIMES
// // ─────────────────────────────────────────

// export const getAllShowtimes = async () => {
//   try {
//     const { data } = await API.get("/api/showtimes/");
//     return data;
//   } catch {
//     return [];
//   }
// };

// export const getShowtimes = async (movieId) => {
//   try {
//     const { data } = await API.get("/api/showtimes/", {
//       params: movieId ? { movie: movieId } : {},
//     });

//     if (movieId) {
//       return data.filter((s) => s.movie === Number(movieId));
//     }

//     return data;
//   } catch {
//     return [];
//   }
// };

// export const getShowtimeById = async (id) => {
//   try {
//     const { data } = await API.get(`/api/showtimes/${id}/`);
//     return data;
//   } catch {
//     return null;
//   }
// };

// // ─────────────────────────────────────────
// // CINEMAS (from halls)
// // ─────────────────────────────────────────

// export const getCinemas = async () => {
//   try {
//     const { data } = await API.get("/api/showtimes/");
//     const halls = [...new Set(data.map((s) => s.hall).filter(Boolean))];

//     return halls.map((hall, i) => ({
//       id: i + 1,
//       name: hall,
//     }));
//   } catch {
//     return [];
//   }
// };

// // ─────────────────────────────────────────
// // SEATS
// // ─────────────────────────────────────────

// // GET /api/showtimes/{id}/seats/
// export const getSeats = async (showtimeId) => {
//   try {
//     const { data } = await API.get(`/api/showtimes/${showtimeId}/seats/`);
//     return data;
//   } catch {
//     return [];
//   }
// };

// // GET /api/seats/ (formatted for UI)
// export const getAllSeats = async () => {
//   try {
//     const { data } = await API.get("/api/seats/");

//     const groupedRows = {};

//     data.forEach((seat) => {
//       const rowLetter = String.fromCharCode(64 + seat.row);

//       if (!groupedRows[rowLetter]) {
//         groupedRows[rowLetter] = [];
//       }

//       groupedRows[rowLetter].push({
//         // id: seat.seat_number,
//         // seatId: seat.id,
//         id: `${seat.row}-${seat.column}`,
//         seatId: seat.id,
//         type: seat.row <= 2 ? "vip" : "standard",
//         status: seat.is_available ? "available" : "occupied",
//         row: seat.row,
//         column: seat.column,
//       });
//     });

//     const rows = Object.entries(groupedRows).map(([rowId, seats]) => ({
//       rowId,
//       seats: seats.sort((a, b) => a.column - b.column),
//     }));

//     return {
//       rows,
//       pricing: {
//         standard: 120,
//         vip: 220,
//         serviceFee: 15,
//       },
//       legend: [
//         { type: "available", label: "Available" },
//         { type: "selected", label: "Selected" },
//         { type: "occupied", label: "Occupied" },
//         { type: "vip", label: "VIP" },
//       ],
//     };
//   } catch (error) {
//     console.error("Get seats error:", error);

//     return {
//       rows: [],
//       pricing: {
//         standard: 120,
//         vip: 220,
//         serviceFee: 15,
//       },
//       legend: [],
//     };
//   }
// };

// // ─────────────────────────────────────────
// // RESERVE SEAT
// // POST /api/seats/{id}/reserve/
// // ─────────────────────────────────────────

// export const reserveSeat = async (seat) => {
//   try {
//     const { data } = await API.post(
//       `/api/seats/${seat.seatId}/reserve/`
//     );

//     return { success: true, seat: data };
//   } catch (error) {
//     return {
//       success: false,
//       message:
//         error.response?.data?.detail || "Could not reserve seat",
//     };
//   }
// };

// // ─────────────────────────────────────────
// // RELEASE SEAT
// // POST /api/seats/{id}/release/
// // ─────────────────────────────────────────

// export const releaseSeat = async (seat) => {
//   try {
//     const { data } = await API.post(
//       `/api/seats/${seat.seatId}/release/`
//     );

//     return { success: true, seat: data };
//   } catch (error) {
//     return {
//       success: false,
//       message:
//         error.response?.data?.detail || "Could not release seat",
//     };
//   }
// };

// // ─────────────────────────────────────────
// // BOOKINGS
// // ─────────────────────────────────────────

// export const createBooking = async (
//   showtimeId,
//   seatIds,
//   pricePerSeat = "50.00"
// ) => {
//   try {
//     const { data } = await API.post("/api/bookings/", {
//       showtime_id: showtimeId,
//       seat_ids: seatIds,
//       price_per_seat: pricePerSeat,
//     });

//     return { success: true, booking: data };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.detail || "Booking failed",
//     };
//   }
// };

// export const getBookingById = async (id) => {
//   try {
//     const { data } = await API.get(`/api/bookings/${id}/`);
//     return data;
//   } catch {
//     return null;
//   }
// };

// export const cancelBooking = async (bookingId) => {
//   try {
//     const { data } = await API.post(
//       `/api/bookings/${bookingId}/cancel/`
//     );

//     return { success: true, booking: data };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.detail || "Cancellation failed",
//     };
//   }
// };

// // ─────────────────────────────────────────
// // PAYMENT
// // ─────────────────────────────────────────

// export const processPayment = async (bookingId, method = "card") => {
//   try {
//     const { data } = await API.post(
//       "/api/payments/mock-process/",
//       {
//         booking_id: bookingId,
//         provider: "mock",
//         method: method === "cashier" ? "pay-at-cashier" : "mock-card",
//         mark_paid: method !== "cashier",
//       }
//     );

//     return { success: true, payment: data };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.detail || "Payment failed",
//     };
//   }
// };




















// import cinemas from '../data/cinemas.json'
// import seatsData from '../data/seats.json'

// // ─────────────────────────────────────────
// // BOOKING SERVICE
// // Currently using dummy data from cinemas.json
// // and seats.json
// // ─────────────────────────────────────────
// // LATER — replace each function body with:
// // import axios from 'axios'
// // const BASE = import.meta.env.VITE_API_BASE_URL
// // ─────────────────────────────────────────

// // Get all cinemas
// export const getCinemas = () => {
//   return cinemas

//   // LATER:
//   // return axios.get(`${BASE}/cinemas`)
// }

// // Get a single cinema by id
// export const getCinemaById = (id) => {
//   const cinema = cinemas.find((c) => c.id === Number(id))
//   return cinema || null

//   // LATER:
//   // return axios.get(`${BASE}/cinemas/${id}`)
// }

// // Get showtimes for a specific movie at a specific cinema
// export const getShowtimes = (cinemaId, movieId) => {
//   const cinema = cinemas.find((c) => c.id === Number(cinemaId))
//   if (!cinema) return []
//   return cinema.screens

//   // LATER:
//   // return axios.get(`${BASE}/showtimes?cinema=${cinemaId}&movie=${movieId}`)
// }

// // Get seat map for a specific showtime
// export const getSeats = (cinemaId, movieId, showtime) => {
//   return seatsData

//   // LATER:
//   // return axios.get(`${BASE}/seats?cinema=${cinemaId}&movie=${movieId}&showtime=${showtime}`)
// }

// // Confirm a booking
// export const confirmBooking = (bookingDetails) => {
//   // Dummy: just return a fake booking confirmation
//   const confirmation = {
//     success: true,
//     bookingId: `BK${Math.floor(Math.random() * 100000)}`,
//     cinema: bookingDetails.cinema,
//     movie: bookingDetails.movie,
//     seats: bookingDetails.seats,
//     showtime: bookingDetails.showtime,
//     total: bookingDetails.total,
//     qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(JSON.stringify(bookingDetails))
//   }
//   return confirmation

//   // LATER:
//   // return axios.post(`${BASE}/bookings`, bookingDetails)
// }
