import API from '../api/api'

// ─────────────────────────────────────────
// PAYMENT SERVICE
// All endpoints from the payments API
// ─────────────────────────────────────────

// GET /api/payments/ — get all payments
export const getAllPayments = async () => {
  try {
    const { data } = await API.get('/api/payments/')
    return data
  } catch (error) {
    console.error('getAllPayments error:', error)
    return []
  }
}

// GET /api/payments/{id}/ — get single payment by id
export const getPaymentById = async (id) => {
  try {
    const { data } = await API.get(`/api/payments/${id}/`)
    return data
  } catch (error) {
    console.error('getPaymentById error:', error)
    return null
  }
}

// POST /api/payments/ — create a new payment
export const createPayment = async (paymentData) => {
  try {
    const { data } = await API.post('/api/payments/', paymentData)
    return { success: true, data }
  } catch (error) {
    console.error('createPayment error:', error)
    return {
      success: false,
      message: error.response?.data?.detail || 'Payment creation failed'
    }
  }
}

// PUT /api/payments/{id}/ — full update payment
export const updatePayment = async (id, paymentData) => {
  try {
    const { data } = await API.put(`/api/payments/${id}/`, paymentData)
    return { success: true, data }
  } catch (error) {
    console.error('updatePayment error:', error)
    return { success: false, message: error.response?.data?.detail || 'Update failed' }
  }
}

// PATCH /api/payments/{id}/ — partial update payment
export const patchPayment = async (id, partialData) => {
  try {
    const { data } = await API.patch(`/api/payments/${id}/`, partialData)
    return { success: true, data }
  } catch (error) {
    console.error('patchPayment error:', error)
    return { success: false, message: error.response?.data?.detail || 'Update failed' }
  }
}

// DELETE /api/payments/{id}/ — delete a payment
export const deletePayment = async (id) => {
  try {
    await API.delete(`/api/payments/${id}/`)
    return { success: true }
  } catch (error) {
    console.error('deletePayment error:', error)
    return { success: false }
  }
}

// POST /api/payments/mock-process/ — process a mock payment (main one used in Payment page)
// This is the key endpoint — it creates + processes the payment in one call
export const mockProcessPayment = async ({ booking_id, method, mark_paid = true }) => {
  try {
    const { data } = await API.post('/api/payments/mock-process/', {
      booking_id,
      provider: 'mock',
      method,         // 'cashier' or 'mock-card'
      mark_paid
    })
    return { success: true, data }
  } catch (error) {
    console.error('mockProcessPayment error:', error)
    return {
      success: false,
      message: error.response?.data?.detail || 'Payment processing failed'
    }
  }
}

// // import api from './api'
// import API from "../api/api";

// // ─── Get User By ID ───
// export const getUserProfile = async (id) => {
//   try {
//     const response = await api.get(`/users/${id}/`)
//     return response.data
//   } catch (error) {
//     console.error('Get profile error:', error)
//     throw error
//   }
// }

// // ─── Update User ───
// export const updateUserProfile = async (id, data) => {
//   try {
//     const response = await api.patch(`/users/${id}/`, data)
//     return response.data
//   } catch (error) {
//     console.error('Update profile error:', error)
//     throw error
//   }
// }

// // ─── Get User Followers ───
// export const getFollowers = async (id) => {
//   try {
//     const response = await api.get(`/users/${id}/followers/`)
//     return response.data
//   } catch (error) {
//     console.error('Followers error:', error)
//     throw error
//   }
// }

// // ─── Get User Following ───
// export const getFollowing = async (id) => {
//   try {
//     const response = await api.get(`/users/${id}/following/`)
//     return response.data
//   } catch (error) {
//     console.error('Following error:', error)
//     throw error
//   }
// }