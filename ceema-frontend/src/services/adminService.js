// src/services/adminService.js

import api from '../api/api'

// =========================
// MOVIES APIs
// =========================

export const createMovie = async (data) => {
  const response = await api.post('/api/movies/', data)
  return response.data
}

export const patchMovie = async (id, data) => {
  const response = await api.patch(`/api/movies/${id}/`, data)
  return response.data
}

export const deleteMovie = async (id) => {
  const response = await api.delete(`/api/movies/${id}/`)
  return response.data
}

// =========================
// SHOWTIMES APIs
// =========================

export const createShowtime = async (data) => {
  const response = await api.post('/api/showtimes/', data)
  return response.data
}

export const patchShowtime = async (id, data) => {
  const response = await api.patch(`/api/showtimes/${id}/`, data)
  return response.data
}

export const deleteShowtime = async (id) => {
  const response = await api.delete(`/api/showtimes/${id}/`)
  return response.data
}

// =========================
// POSTS APIs
// =========================

export const deleteAdminPost = async (id) => {
  const response = await api.delete(`/api/posts/${id}/`)
  return response.data
}

// =========================
// USERS APIs
// =========================

// Get all users
export const getAdminUsers = async () => {
  const response = await api.get('/api/admin/users/')
  return response.data
}

// Get single user
export const getAdminUserById = async (id) => {
  const response = await api.get(`/api/admin/users/${id}/`)
  return response.data
}

// Create user
export const createAdminUser = async (data) => {
  const response = await api.post('/api/admin/users/', data)
  return response.data
}

// Update user
export const updateAdminUser = async (id, data) => {
  const response = await api.put(`/api/admin/users/${id}/`, data)
  return response.data
}

// Patch user
export const patchAdminUser = async (id, data) => {
  const response = await api.patch(`/api/admin/users/${id}/`, data)
  return response.data
}

// Delete user
export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/api/admin/users/${id}/`)
  return response.data
}

// Ban user
export const banUser = async (id) => {
  const response = await api.post(`/api/admin/users/${id}/ban/`)
  return response.data
}

// Unban user
export const unbanUser = async (id) => {
  const response = await api.post(`/api/admin/users/${id}/unban/`)
  return response.data
}

// User statistics
export const getUsersStatistics = async () => {
  const response = await api.get('/api/admin/users/statistics/')
  return response.data
}

// =========================
// REPORTS APIs
// =========================

// Get all reports
export const getReports = async () => {
  const response = await api.get('/api/admin/reports/')
  return response.data
}

// Get report by id
export const getReportById = async (id) => {
  const response = await api.get(`/api/admin/reports/${id}/`)
  return response.data
}

// Create report
export const createReport = async (data) => {
  const response = await api.post('/api/admin/reports/', data)
  return response.data
}

// Update report
export const updateReport = async (id, data) => {
  const response = await api.put(`/api/admin/reports/${id}/`, data)
  return response.data
}

// Patch report
export const patchReport = async (id, data) => {
  const response = await api.patch(`/api/admin/reports/${id}/`, data)
  return response.data
}

// Delete report
export const deleteReport = async (id) => {
  const response = await api.delete(`/api/admin/reports/${id}/`)
  return response.data
}

// Review report
export const reviewReport = async (id, data) => {
  const response = await api.post(
    `/api/admin/reports/${id}/review/`,
    data
  )
  return response.data
}





// import axios from 'axios'

// const API = '/api/admin'

// // ───── REPORTS ─────
// export const getReports = async () => {
//   const res = await axios.get(`${API}/reports/`)
//   return res.data
// }

// export const getReportById = async (id) => {
//   const res = await axios.get(`${API}/reports/${id}/`)
//   return res.data
// }

// export const createReport = async (data) => {
//   const res = await axios.post(`${API}/reports/`, data)
//   return res.data
// }

// export const updateReport = async (id, data) => {
//   const res = await axios.put(`${API}/reports/${id}/`, data)
//   return res.data
// }

// export const patchReport = async (id, data) => {
//   const res = await axios.patch(`${API}/reports/${id}/`, data)
//   return res.data
// }

// export const deleteReport = async (id) => {
//   const res = await axios.delete(`${API}/reports/${id}/`)
//   return res.data
// }

// export const reviewReport = async (id, data) => {
//   const res = await axios.post(`${API}/reports/${id}/review/`, data)
//   return res.data
// }

// // ───── USERS ─────
// export const getUsers = async () => {
//   const res = await axios.get(`${API}/users/`)
//   return res.data
// }

// export const getUserById = async (id) => {
//   const res = await axios.get(`${API}/users/${id}/`)
//   return res.data
// }

// export const createUser = async (data) => {
//   const res = await axios.post(`${API}/users/`, data)
//   return res.data
// }

// export const updateUser = async (id, data) => {
//   const res = await axios.put(`${API}/users/${id}/`, data)
//   return res.data
// }

// export const patchUser = async (id, data) => {
//   const res = await axios.patch(`${API}/users/${id}/`, data)
//   return res.data
// }

// export const deleteUser = async (id) => {
//   const res = await axios.delete(`${API}/users/${id}/`)
//   return res.data
// }

// export const banUser = async (id, data) => {
//   const res = await axios.post(`${API}/users/${id}/ban/`, data)
//   return res.data
// }

// export const unbanUser = async (id, data) => {
//   const res = await axios.post(`${API}/users/${id}/unban/`, data)
//   return res.data
// }

// export const getUserStats = async () => {
//   const res = await axios.get(`${API}/users/statistics/`)
//   return res.data
// }
