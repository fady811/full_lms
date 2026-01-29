import apiClient from '../axiosConfig'

const adminCoursesService = {
  getAllCourses: async (page = 1, search = '', status = '', category = '') => {
    const response = await apiClient.get('/api/courses/courses/', {
      params: { page, search, status, category }
    })
    return response.data
  },

  getCourseDetail: async (courseId) => {
    const response = await apiClient.get(`/api/courses/courses/${courseId}/`)
    return response.data
  },

  updateCourse: async (courseId, data) => {
    const response = await apiClient.patch(`/api/courses/courses/${courseId}/`, data)
    return response.data
  },
  createCourse:async(data)=>{
 const response = await apiClient.post(`/api/courses/courses/`, data)
    return response.data
  },
  approveCourse: async (courseId) => {
    const response = await apiClient.post(`/api/courses/courses/${courseId}/approve/`)
    return response.data
  },

  rejectCourse: async (courseId, reason) => {
    const response = await apiClient.post(`/api/courses/courses/${courseId}/reject/`, { reason })
    return response.data
  },

  deleteCourse: async (courseId) => {
    const response = await apiClient.delete(`/api/courses/courses/${courseId}/`)
    return response.data
  },

  getCourseContent: async (courseId) => {
    const response = await apiClient.get(`/api/courses/courses/${courseId}/content/`)
    return response.data
  },

  lockCoursePrice: async (courseId) => {
    const response = await apiClient.post(`/api/courses/courses/${courseId}/lock_price/`)
    return response.data
  },

  unlockCoursePrice: async (courseId) => {
    const response = await apiClient.post(`/api/courses/courses/${courseId}/unlock_price/`)
    return response.data
  },

  getPendingCourses: async (page = 1) => {
    const response = await apiClient.get('/api/courses/courses/', {
      params: { page, status: 'pending' }
    })
    return response.data
  },

  // List all lectures (paginated)
  listLectures: async (page = 1) => {
    const response = await apiClient.get('/api/courses/lectures/', {
      params: { page }
    })
    return response.data
  },

  createLecture: async (data) => {
    const response = await apiClient.post('/api/courses/lectures/', data)
    return response.data
  },

  updateLecture: async (lectureId, data) => {
    const response = await apiClient.patch(`/api/courses/lectures/${lectureId}/`, data)
    return response.data
  }
}

export default adminCoursesService
