// src/pages/teacher/Lectures.jsx
import React, { useState, useEffect, useCallback } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import LecturesTable from '../components/LecturesTable'
import LectureFormModal from '../components/LectureFormModal'
import DeleteLectureModal from '../components/DeleteLectureModal'
import Pagination from '../components/Pagination'
import { gradeOptions, courseOptions } from '../utils/lecturesData'
import { FaPlus, FaBook, FaSadTear, FaFilter } from 'react-icons/fa'
import '../styles/lectures.css'
import '../styles/modals.css'
import adminCoursesService from '../api/admin/courses.service'
import apiClient from '../api/axiosConfig'
import teacherLecturesService from '../api/teacher/lectures.service'

const Lectures = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [lectures, setLectures] = useState([])
  const [countLecture, setCountLecture] = useState(0)
  const [filteredLectures, setFilteredLectures] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedLecture, setSelectedLecture] = useState(null)
  const [lectureToDelete, setLectureToDelete] = useState(null)
  const [filterCourse, setFilterCourse] = useState('')

  const itemsPerPage = 4
  const { courseId: routeCourseId } = useParams()
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [pageSize, setPageSize] = useState(10)

  // Init animations once
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    })
  }, [])

  // Apply filters without resetting page on data updates
  useEffect(() => {
    let filtered = lectures
    if (filterCourse) {
      filtered = filtered.filter((lecture) => lecture.courseId === filterCourse)
    }
    setFilteredLectures(filtered)
  }, [filterCourse, lectures])

  // Reset page only when filter changes
  useEffect(() => {
    if (filterCourse) setCurrentPage(1)
  }, [filterCourse])

  // Fetch paginated lectures list from API
  const loadLectures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminCoursesService.listLectures(currentPage)
      setCountLecture(res.count)
      const results = Array.isArray(res?.results) ? res.results : []
      setTotalCount(parseInt(res?.count) || 0)
      setHasNext(!!res?.next)
      setHasPrev(!!res?.previous)

      if (results?.length > 0 && pageSize !== results?.length) {
        setPageSize(results?.length)
      }

      const mapped = results.map((lec, idx) => ({
        id: lec.id,
        lectureNumber: `Lecture ${lec.order ?? idx + 1}: ${lec.title || ''}`,
        title: lec.title || '',
        description: lec.description || '',
        lecture_type: lec.lecture_type || '',
        isFree: !!lec.is_free,
        durationMinutes: lec.duration_minutes ?? null,
        order: lec.order ?? idx,
        video_url: lec.video_url || null,
        created_at: lec.created_at,
        updated_at: lec.updated_at,
        examScore: 0,
        homeworkScore: 0
      }))
      setLectures(mapped)
      setFilteredLectures(mapped)
    } catch (e) {
      setError(e?.message || 'فشل في تحميل المحاضرات')
      setLectures([])
      setFilteredLectures([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])
  useEffect(() => {
    loadLectures()
  }, [loadLectures])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleAddLecture = () => {
    setSelectedLecture(null)
    setShowAddModal(true)
  }

  const handleEditLecture = (lecture) => {
    setSelectedLecture(lecture)
    setShowEditModal(true)
  }

  const handleDeleteLecture = (lecture) => {
    setLectureToDelete(lecture)
    setShowDeleteModal(true)
  }

  const handleSaveLecture = async (lectureData) => {
    try {
      setLoading(true)
      setError(null)

      if (selectedLecture) {
        await adminCoursesService.updateLecture(selectedLecture.id, lectureData)
      } else {
        await adminCoursesService.createLecture(lectureData)
      }

      // Reload current page from API
      const res = await adminCoursesService.listLectures(currentPage)
      const results = Array.isArray(res?.results) ? res.results : []
      setTotalCount(parseInt(res?.count) || 0)
      setHasNext(!!res?.next)
      setHasPrev(!!res?.previous)
      if (results?.length > 0 && pageSize !== results?.length) {
        setPageSize(results?.length)
      }
      const mapped = results.map((lec, idx) => ({
        id: lec.id,
        lectureNumber: `Lecture ${lec.order ?? idx + 1}: ${lec.title || ''}`,
        title: lec.title || '',
        description: lec.description || '',
        lecture_type: lec.lecture_type || '',
        isFree: !!lec.is_free,
        durationMinutes: lec.duration_minutes ?? null,
        order: lec.order ?? idx,
        video_url: lec.video_url || null,
        created_at: lec.created_at,
        updated_at: lec.updated_at,
        examScore: 0,
        homeworkScore: 0
      }))
      setLectures(mapped)
      setFilteredLectures(mapped)

      // Clear selection after save
      setSelectedLecture(null)
      setShowAddModal(false)
      setShowEditModal(false)
    } catch (e) {
      setError(
        e?.response?.data ? JSON.stringify(e.response.data) : e?.message || 'فشل في حفظ المحاضرة'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (lectureToDelete) {
      setLectures((prevLectures) => {
        prevLectures.filter((lecture) => lecture.id !== lectureToDelete.id)
      })
      try {
        await teacherLecturesService.deleteLecture(lectureToDelete.id)
        loadLectures()
      } catch (error) {
        console.log(error)
      }
      setShowDeleteModal(false)
      setLectureToDelete(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))
  const currentLectures = filteredLectures

  // إحصائيات
  const totalLectures = lectures?.length
  const averageExamScore =
    lectures?.length > 0
      ? Math.round(lectures.reduce((sum, lecture) => sum + lecture.examScore, 0) / lectures?.length)
      : 0
  const averageHomeworkScore =
    lectures?.length > 0
      ? Math.round(
          lectures.reduce((sum, lecture) => sum + lecture.homeworkScore, 0) / lectures?.length
        )
      : 0

  return (
    <div
      className={`lectures-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}
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
        activePage="lectures"
        darkMode={darkMode}
      />

      <div className="main-content">
        <div className="container mt-5 pt-4">
          <div className="card lectures-card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="text-titles mb-0">
                  <FaBook className="me-2" />
                  إدارة المحاضرات
                </h3>
                <button
                  className="btn btn-primary d-flex align-items-center"
                  onClick={handleAddLecture}
                >
                  <FaPlus className="me-2" />
                  إضافة محاضرة
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filters */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaFilter />
                    </span>
                    <select
                      className="form-select"
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                    >
                      <option value="">جميع الكورسات</option>
                      {courseOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <h3 className="text-primary">{countLecture}</h3>
                      <p className="text-muted mb-0">إجمالي المحاضرات</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <h3 className="text-success">{averageExamScore}%</h3>
                      <p className="text-muted mb-0">متوسط درجة الامتحان</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body text-center">
                      <h3 className="text-warning">{averageHomeworkScore}%</h3>
                      <p className="text-muted mb-0">متوسط درجة الواجب</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading/Error states */}
              {loading && <div className="text-center py-4">جاري تحميل المحاضرات...</div>}
              {error && !loading && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Lectures Table or Empty State */}
              {!loading && currentLectures?.length > 0 ? (
                <>
                  <LecturesTable
                    lectures={currentLectures}
                    onEdit={handleEditLecture}
                    onDelete={handleDeleteLecture}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    darkMode={darkMode}
                  />

                  {/* Pagination */}
                  {filteredLectures?.length > itemsPerPage && (
                    <nav aria-label="Lectures pagination" className="lectures-pagination">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => {
                          if (p >= 1 && p <= totalPages) setCurrentPage(p)
                        }}
                        isPrevDisabled={!hasPrev}
                        isNextDisabled={!hasNext}
                        darkMode={darkMode}
                      />
                    </nav>
                  )}
                </>
              ) : (
                !loading && (
                  <div className="no-lectures-container text-center">
                    <FaSadTear className="empty-state-icon" />
                    <h5 className="text-muted">لا يوجد لديك محاضرات حالياً</h5>
                    <p className="text-muted mb-4">ابدأ بإضافة محاضرات جديدة</p>
                    <button
                      className="btn btn-primary px-5 d-flex align-items-center mx-auto"
                      onClick={handleAddLecture}
                    >
                      <FaPlus className="me-2" />
                      إضافة محاضرة
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />

      {/* Modals */}
      <LectureFormModal
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        handleSave={handleSaveLecture}
        modalType="add"
        lectureData={null}
        gradeOptions={gradeOptions}
        courseOptions={courseOptions}
        darkMode={darkMode}
      />

      <LectureFormModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        handleSave={handleSaveLecture}
        modalType="edit"
        lectureData={selectedLecture}
        gradeOptions={gradeOptions}
        courseOptions={courseOptions}
        darkMode={darkMode}
      />

      <DeleteLectureModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false)
          setLectureToDelete(null)
        }}
        handleDelete={handleConfirmDelete}
        lectureNumber={lectureToDelete?.lectureNumber}
        courseName={lectureToDelete?.courseName}
        darkMode={darkMode}
      />
    </div>
  )
}

export default Lectures
