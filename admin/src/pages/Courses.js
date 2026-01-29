import React, { useState, useEffect, useCallback, useTransition } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import CoursesGrid from '../components/CoursesGrid'
import CourseFormModal from '../components/CourseFormModal'
import DeleteCourseModal from '../components/DeleteCourseModal'
import Pagination from '../components/Pagination'
import adminCoursesService from '../api/admin/courses.service'
import { gradeOptions, categoryOptions } from '../utils/coursesData'
import { FaPlus, FaBook } from 'react-icons/fa'
import '../styles/courses.css'
import '../styles/modals.css'

const Courses = () => {
  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Data states
  const [courses, setCourses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseToDelete, setCourseToDelete] = useState(null)

  // Filter states
  const [filterCategory, setFilterCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isPending, startTransition] = useTransition()

  // Configuration
  const itemsPerPage = 6

  // Initialize AOS animation
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    })
  }, [])

  // Capitalize first letter utility
  const capitalizeFirst = useCallback((str) => {
    if (!str || typeof str !== 'string') return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }, [])

  // Map API response to component format
  const mapResponseToCourses = useCallback(
    (response) => {
      const results = Array.isArray(response?.results) ? response.results : []
      return results.map((course) => ({
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        grade: course.difficulty_level || '',
        gradeText: capitalizeFirst(course.difficulty_level || ''),
        date: course.published_at
          ? new Date(course.published_at).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : '',
        price: parseFloat(course.price) || 0,
        category: (course.category || '').toLowerCase(),
        categoryText: course.category || '',
        image: course.thumbnail || '/images/home.webp',
        link: '#',
        studentsCount: parseInt(course.student_count) || 0,
        rating: 0,
        status: course.status || '',
        instructor: course.instructor_name || ''
      }))
    },
    [capitalizeFirst]
  )

  // Fetch courses from API
  const fetchCourses = useCallback(
    async (page = 1, search = '', category = '') => {
      try {
        setLoading(true)
        setError(null)

        const response = await adminCoursesService.getAllCourses(page, search, '', category)

        const mappedCourses = mapResponseToCourses(response)
        const count = parseInt(response?.count) || 0

        setCourses(mappedCourses)
        setTotalCount(count)

        // Determine navigation and page size from API
        const nextExists = !!response?.next
        const prevExists = !!response?.previous
        setHasNext(nextExists)
        setHasPrev(prevExists)

        const currentResults = Array.isArray(response?.results) ? response.results.length : 0
        let newPageSize = pageSize

        if (nextExists && currentResults > 0) {
          newPageSize = currentResults
        } else if (!nextExists && currentResults > 0) {
          // On the last page, keep the previously known page size if available
          newPageSize = Math.max(pageSize || 0, currentResults)
        }

        setPageSize(newPageSize)

        let pages = 1
        if (nextExists && currentResults > 0) {
          pages = Math.ceil(count / currentResults)
        } else if (newPageSize > 0) {
          pages = Math.ceil(count / newPageSize)
        }
        pages = Math.max(1, pages)
        setTotalPages(pages)

        // Clamp current page if it exceeds total pages
        if (page > pages && pages >= 1) {
          setCurrentPage(pages)
        }
      } catch (err) {
        // Gracefully handle 404 for out-of-range pages without showing an error
        const status = err?.response?.status
        if (status === 404) {
          // Reset to a safe page and refetch silently
          setCurrentPage(1)
        } else {
          setError(err?.message || 'فشل في تحميل الكورسات')
        }
        console.error('Error fetching courses:', err)
      } finally {
        setLoading(false)
      }
    },
    [itemsPerPage, mapResponseToCourses, pageSize]
  )

  // Fetch courses when page, search, or category changes
  useEffect(() => {
    fetchCourses(currentPage, appliedSearch, filterCategory)
  }, [currentPage, appliedSearch, filterCategory, fetchCourses])

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  // Handle create course modal
  const handleCreateCourse = useCallback(() => {
    setSelectedCourse(null)
    setShowCreateModal(true)
  }, [])

  // Handle edit course modal
  const handleEditCourse = useCallback((course) => {
    setSelectedCourse(course)
    setShowEditModal(true)
  }, [])

  // Handle delete course modal
  const handleDeleteCourse = useCallback((course) => {
    setCourseToDelete(course)
    setShowDeleteModal(true)
  }, [])

  // Save course (create or update)
  const handleSaveCourse = useCallback(
    async (courseData) => {
      try {
        setLoading(true)
        setError(null)

        if (selectedCourse) {
          // Update existing course
          const updateData = {
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            category: courseData.categoryText,
            thumbnail: courseData.imagePreview,
            difficulty_level: courseData.grade
          }
          await adminCoursesService.updateCourse(selectedCourse.id, updateData)
          setSuccessMessage('تم تحديث الكورس بنجاح')
        } else {
          // Create new course
          const newCourseData = {
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            category: courseData.categoryText,
            thumbnail: courseData.imagePreview,
            difficulty_level: courseData.grade
          }
          // Uncomment when API supports create endpoint
          // await adminCoursesService.createCourse(newCourseData)
          setSuccessMessage('تم إنشاء الكورس بنجاح')
        }

        // Refresh courses list
        await fetchCourses(currentPage, searchTerm, filterCategory)

        setShowCreateModal(false)
        setShowEditModal(false)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err) {
        setError(err?.message || 'فشل في حفظ الكورس')
        console.error('Error saving course:', err)
      } finally {
        setLoading(false)
      }
    },
    [selectedCourse, currentPage, searchTerm, filterCategory, fetchCourses]
  )

  // Confirm and delete course
  const handleConfirmDelete = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (courseToDelete) {
        await adminCoursesService.deleteCourse(courseToDelete.id)
        setShowDeleteModal(false)
        setCourseToDelete(null)
        setSuccessMessage('تم حذف الكورس بنجاح')

        // Refresh courses list
        await fetchCourses(currentPage, searchTerm, filterCategory)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      setError(err?.message || 'فشل في حذف الكورس')
      console.error('Error deleting course:', err)
    } finally {
      setLoading(false)
    }
  }, [courseToDelete, currentPage, searchTerm, filterCategory, fetchCourses])

  // Calculate statistics
  const totalCourses = totalCount
  const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount || 0), 0)
  const totalRevenue = courses.reduce((sum, course) => {
    const price = parseFloat(course.price) || 0
    const students = parseInt(course.studentsCount) || 0
    return sum + price * students
  }, 0)

  return (
    <div
      className={`courses-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}
    >
      <Header
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activePage="courses"
        darkMode={darkMode}
      />

      <div className="main-content">
        <div className="container mt-5 pt-4">
          {/* Success Alert */}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuccessMessage(null)}
              ></button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Header Section */}
          <div className="courses-header" data-aos="fade-up">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center">
                <FaBook className="text-primary me-2" style={{ fontSize: '1.5rem' }} />
                <h2 className="mb-0 fw-bold">إدارة الكورسات</h2>
              </div>
              <button
                className="btn btn-primary d-flex align-items-center"
                onClick={handleCreateCourse}
                disabled={loading}
              >
                <FaPlus className="me-2" />
                إنشاء كورس جديد
              </button>
            </div>

            {/* Filters Section */}
            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">البحث عن كورس:</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ابحث باسم الكورس أو المدرس..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCurrentPage(1)
                        setPageSize(0)
                        setAppliedSearch(searchTerm.trim())
                      }
                    }}
                  />
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={() => {
                      setCurrentPage(1)
                      setPageSize(0)
                      setAppliedSearch(searchTerm.trim())
                    }}
                  >
                    بحث
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mt-4">
              <div className="col-md-4 mb-3">
                <div
                  className="card border-0 bg-light shadow-sm"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  <div className="card-body text-center">
                    <h3 className="text-primary fw-bold">{totalCourses}</h3>
                    <p className="text-muted mb-0">إجمالي الكورسات</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div
                  className="card border-0 bg-light shadow-sm"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  <div className="card-body text-center">
                    <h3 className="text-success fw-bold">{totalStudents}</h3>
                    <p className="text-muted mb-0">إجمالي الطلاب</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div
                  className="card border-0 bg-light shadow-sm"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <div className="card-body text-center">
                    <h3 className="text-warning fw-bold">{totalRevenue.toFixed(2)} جنيه</h3>
                    <p className="text-muted mb-0">إجمالي الإيرادات</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {(loading || isPending) && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
              </div>
              <p className="text-muted mt-3">جاري تحميل الكورسات...</p>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && courses.length > 0 ? (
            <>
              <CoursesGrid
                courses={courses}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
                darkMode={darkMode}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-courses mt-5">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                      }
                    }}
                    isPrevDisabled={!hasPrev}
                    isNextDisabled={!hasNext}
                    darkMode={darkMode}
                  />
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-center py-5">
                <div className="mb-3">
                  <FaBook className="text-muted" style={{ fontSize: '3rem' }} />
                </div>
                <h5 className="text-muted fw-bold">لا توجد كورسات</h5>
                <p className="text-muted">
                  {searchTerm || filterCategory
                    ? 'حاول تغيير معايير البحث أو التصفية'
                    : 'انشئ كورس جديد للبدء'}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />

      {/* Create/Edit Course Modal */}
      <CourseFormModal
        show={showCreateModal || showEditModal}
        handleClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedCourse(null)
        }}
        handleSave={handleSaveCourse}
        modalType={showEditModal ? 'edit' : 'create'}
        courseData={selectedCourse}
        gradeOptions={gradeOptions}
        categoryOptions={categoryOptions}
        darkMode={darkMode}
        loading={loading}
      />

      {/* Delete Course Modal */}
      <DeleteCourseModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false)
          setCourseToDelete(null)
        }}
        handleDelete={handleConfirmDelete}
        courseTitle={courseToDelete?.title}
        darkMode={darkMode}
        loading={loading}
      />
    </div>
  )
}

export default Courses
