import apiClient from '../axiosConfig'

const teacherQuizzesService = {
  getMyQuizzes: async (page = 1, courseId = '', status = '') => {
    const response = await apiClient.get('/api/quizzes/quizzes/', {
      params: { page, course: courseId, status }
    })
    return response.data
  },

  getQuizDetail: async (quizId) => {
    const response = await apiClient.get(`/api/quizzes/quizzes/${quizId}/`)
    return response.data
  },

  createQuiz: async (quizData) => {
    const response = await apiClient.post('/api/quizzes/quizzes/', quizData)
    return response.data
  },

  updateQuiz: async (quizId, data) => {
    const response = await apiClient.patch(`/api/quizzes/quizzes/${quizId}/`, data)
    return response.data
  },

  deleteQuiz: async (quizId) => {
    const response = await apiClient.delete(`/api/quizzes/quizzes/${quizId}/`)
    return response.data
  },

  publishQuiz: async (quizId) => {
    const response = await apiClient.post(`/api/quizzes/quizzes/${quizId}/publish/`)
    return response.data
  },

  unpublishQuiz: async (quizId) => {
    const response = await apiClient.post(`/api/quizzes/quizzes/${quizId}/unpublish/`)
    return response.data
  },

  getQuizQuestions: async (quizId, page = 1) => {
    const response = await apiClient.get(`/api/quizzes/quizzes/${quizId}/questions/`, {
      params: { page }
    })
    return response.data
  },

  createQuestion: async (quizId, questionData) => {
    const response = await apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/`, questionData)
    return response.data
  },

  updateQuestion: async (questionId, data) => {
    const response = await apiClient.patch(`/api/quizzes/questions/${questionId}/`, data)
    return response.data
  },

  deleteQuestion: async (questionId) => {
    const response = await apiClient.delete(`/api/quizzes/questions/${questionId}/`)
    return response.data
  },

  getQuizAttempts: async (quizId, page = 1) => {
    const response = await apiClient.get(`/api/quizzes/quizzes/${quizId}/attempts/`, {
      params: { page }
    })
    return response.data
  },

  getAttemptDetail: async (attemptId) => {
    const response = await apiClient.get(`/api/quizzes/attempts/${attemptId}/`)
    return response.data
  },

  gradeAttempt: async (attemptId, score, feedback) => {
    const response = await apiClient.post(`/api/quizzes/attempts/${attemptId}/grade/`, {
      score,
      feedback
    })
    return response.data
  }
}

export default teacherQuizzesService
