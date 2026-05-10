import API from '../api/api'

export const getAllChatbots = async () => {
  const { data } = await API.get('/api/chatbot/')
  return data
}

export const createChatbot = async (mood = '', lastQuestion = '') => {
  const { data } = await API.post('/api/chatbot/', {
    current_mood: mood,
    last_question: lastQuestion,
  })
  return data
}

export const getChatbotById = async (id) => {
  const { data } = await API.get(`/api/chatbot/${id}/`)
  return data
}

export const updateChatbot = async (id, mood, lastQuestion) => {
  const { data } = await API.put(`/api/chatbot/${id}/`, {
    current_mood: mood,
    last_question: lastQuestion,
  })
  return data
}

export const patchChatbot = async (id, payload) => {
  const { data } = await API.patch(`/api/chatbot/${id}/`, payload)
  return data
}

export const deleteChatbot = async (id) => {
  await API.delete(`/api/chatbot/${id}/`)
}

export const askMoodQuestion = async (id, mood = '', lastQuestion = '') => {
  const { data } = await API.post(`/api/chatbot/${id}/ask-mood-question/`, {
    current_mood: mood,
    last_question: lastQuestion,
  })
  return data
}

export const receiveAnswer = async (id, answer) => {
  const { data } = await API.post(`/api/chatbot/${id}/receive-answer/`, {
    answer,
  })
  return data
}

export const recommendMovies = async (id) => {
  const { data } = await API.get(`/api/chatbot/${id}/recommend-movies/`)
  return data
}
