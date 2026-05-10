import API from '../api/api'

// ─── Get All Payments ───
export const getPayments = async () => {
  try {
    const { data } = await API.get('/api/payments/')
    return data
  } catch (error) {
    console.error('Get payments error:', error)
    return []
  }
}

// ─── Create Payment ───
export const createPayment = async (paymentData) => {
  try {
    const { data } = await API.post('/api/payments/', paymentData)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Create payment error:', error)

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        'Payment creation failed'
    }
  }
}

// ─── Mock Process Payment ───
export const processMockPayment = async ({
  booking_id,
  provider = 'mock',
  method = 'mock-card',
  mark_paid = true
}) => {
  try {
    const { data } = await API.post(
      '/api/payments/mock-process/',
      {
        booking_id,
        provider,
        method,
        mark_paid
      }
    )

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Mock payment error:', error)

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        'Payment failed'
    }
  }
}