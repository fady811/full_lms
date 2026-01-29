// src/pages/teacher/ExamList.jsx
import React, { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import TeacherExamsTable from '../components/TeacherExamsTable'
import StudentExamsTable from '../components/StudentExamsTable'
import FilterModal from '../components/FilterModal'
import DeleteExamModal from '../components/DeleteExamModal'
import Pagination from '../components/Pagination'
import {
  teacherExamsData,
  studentExamsData,
  gradeOptions,
  courseOptions
} from '../utils/ExamList.js'
import { FaPlus, FaFilter, FaFileAlt, FaChartLine, FaUsers, FaGraduationCap } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import '../styles/exams.css'
import '../styles/modals.css'
import quizApi from '../api/quiz.service.js'

const ExamList = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [teacherExams, setTeacherExams] = useState(teacherExamsData)
  const [studentExams, setStudentExams] = useState(studentExamsData)
  const [filteredStudentExams, setFilteredStudentExams] = useState(studentExamsData)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [quizzes, setQuizzes] = useState([])
  const [quizzesCount, setQuizzesCount] = useState(0)
  const [filters, setFilters] = useState({
    studentName: '',
    grade: '',
    course: ''
  })

  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    lecture: '',
    lecture_title: '',
    title: '',
    description: '',
    is_mandatory: false,
    passing_grade: '',
    max_attempts: '',
    grading_method: 'highest',
    time_limit_minutes: '',
    is_published: false
  })

  useEffect(() => {
    async function getQuizes() {
      try {
        const res = await quizApi.listStudentQuizzes({ page: 5 })
        const quizzes = res.results
        setQuizzes(quizzes)
        setQuizzesCount(res.count)
      } catch (error) {}
    }
    getQuizes()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = {
      lecture: Number(formData.lecture),
      title: formData.title,
      description: formData.description,
      is_mandatory: formData.is_mandatory,
      passing_grade: formData.passing_grade,
      max_attempts: Number(formData.max_attempts),
      grading_method: formData.grading_method,
      time_limit_minutes:
        formData.time_limit_minutes === '' ? null : Number(formData.time_limit_minutes),
      is_published: formData.is_published
    }

    // مثال إرسال
    // await axios.post("/api/quizzes", body)
    try {
      const res = await quizApi.createStudentQuiz(body)
      setQuizzes((prev) => {
        return [res.data, ...prev]
      })
    } catch (error) {
      console.log(error)
    }

    setShowModal(false)
    setFormData([
      {
        lecture: '',
        title: '',
        description: '',
        is_mandatory: false,
        passing_grade: '',
        max_attempts: '',
        grading_method: 'highest',
        time_limit_minutes: '',
        is_published: false
      }
    ])
  }

  const [examToDelete, setExamToDelete] = useState(null)

  const itemsPerPage = 5

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    })

    // تحميل الامتحانات من localStorage إن وجدت
    const savedExams = localStorage.getItem('teacherExams')
    if (savedExams) {
      setTeacherExams(JSON.parse(savedExams))
    }
  }, [])

  useEffect(() => {
    // تصفية امتحانات الطلاب
    let filtered = studentExams

    if (filters.studentName) {
      filtered = filtered.filter((exam) =>
        exam.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
      )
    }

    if (filters.grade) {
      filtered = filtered.filter((exam) => exam.grade === filters.grade)
    }

    if (filters.course) {
      filtered = filtered.filter((exam) => exam.course === filters.course)
    }

    setFilteredStudentExams(filtered)
    setCurrentPage(1)
  }, [filters, studentExams])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleEditExam = (exam) => {
    // سيتم توجيه المستخدم لصفحة إضافة/تعديل الامتحان
  }

  const handleDeleteExam = (exam) => {
    setExamToDelete(exam)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (examToDelete) {
      setTeacherExams((prev) => prev.filter((exam) => exam.id !== examToDelete.id))

      // حفظ في localStorage
      const updatedExams = teacherExams.filter((exam) => exam.id !== examToDelete.id)
      localStorage.setItem('teacherExams', JSON.stringify(updatedExams))

      setShowDeleteModal(false)
      setExamToDelete(null)
    }
  }

  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters)
  }

  const totalPages = Math.ceil(filteredStudentExams.length / itemsPerPage)
  const indexOfLastExam = currentPage * itemsPerPage
  const indexOfFirstExam = indexOfLastExam - itemsPerPage
  const currentStudentExams = filteredStudentExams.slice(indexOfFirstExam, indexOfLastExam)

  // إحصائيات
  const totalExamsCreated = teacherExams.length
  const publishedExams = teacherExams.filter((exam) => exam.status === 'منشور').length
  const averageScore =
    studentExams.length > 0
      ? Math.round(
          studentExams.reduce((sum, exam) => sum + exam.percentage, 0) / studentExams.length
        )
      : 0
  const totalStudents = new Set(studentExams.map((exam) => exam.studentName)).size

  return (
    <>
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal fade show d-block overflow-scroll" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable ">
              <div className="modal-content shadow-lg rounded-4 overflow-y-scroll ">
                {/* Header */}
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">إضافة امتحان</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="modal-body overflow-y-scroll">
                    {/* Lecture */}
                    <div className="mb-3 ">
                      <label className="form-label">رقم المحاضرة</label>
                      <input
                        type="number"
                        className="form-control"
                        name="lecture"
                        value={formData.lecture}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Quiz Title */}
                    <div className="mb-3">
                      <label className="form-label">اسم الامتحان</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <label className="form-label">وصف الامتحان</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Passing Grade */}
                    <div className="mb-3">
                      <label className="form-label">درجة النجاح</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="passing_grade"
                        value={formData.passing_grade}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Attempts + Grading */}
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">عدد المحاولات</label>
                        <input
                          type="number"
                          className="form-control"
                          name="max_attempts"
                          value={formData.max_attempts}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">طريقة التقييم</label>
                        <select
                          className="form-select"
                          name="grading_method"
                          value={formData.grading_method}
                          onChange={handleChange}
                        >
                          <option value="highest">أعلى درجة</option>
                          <option value="latest">آخر محاولة</option>
                        </select>
                      </div>
                    </div>

                    {/* Time Limit */}
                    <div className="mb-3">
                      <label className="form-label">الوقت المحدد (بالدقائق)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="time_limit_minutes"
                        value={formData.time_limit_minutes}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Switches */}
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_mandatory"
                        checked={formData.is_mandatory}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">امتحان إجباري</label>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">نشر الامتحان</label>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      إلغاء
                    </button>
                    <button type="submit" className="btn btn-success">
                      حفظ الامتحان
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={`exams-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}
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
          activePage="exams"
          darkMode={darkMode}
        />

        <div className="main-content">
          <div className="container mt-5 pt-4">
            {/* الإحصائيات */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card border-0 bg-light">
                  <div className="card-body text-center">
                    <FaFileAlt className="text-primary mb-2" style={{ fontSize: '1.5rem' }} />
                    <h4 className="text-primary">{quizzesCount}</h4>
                    <p className="text-muted mb-0">إجمالي الامتحانات</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 bg-light">
                  <div className="card-body text-center">
                    <FaFileAlt className="text-success mb-2" style={{ fontSize: '1.5rem' }} />
                    <h4 className="text-success">{publishedExams}</h4>
                    <p className="text-muted mb-0">امتحانات منشورة</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 bg-light">
                  <div className="card-body text-center">
                    <FaChartLine className="text-warning mb-2" style={{ fontSize: '1.5rem' }} />
                    <h4 className="text-warning">{averageScore}%</h4>
                    <p className="text-muted mb-0">متوسط الدرجات</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 bg-light">
                  <div className="card-body text-center">
                    <FaUsers className="text-info mb-2" style={{ fontSize: '1.5rem' }} />
                    <h4 className="text-info">{totalStudents}</h4>
                    <p className="text-muted mb-0">عدد الطلاب</p>
                  </div>
                </div>
              </div>
            </div>

            {/* قسم الامتحانات المنشأة */}
            <div className="exams-section mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="exam-section-title fw-bold">الإمتحانات المُنشأة</h5>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <FaPlus className="me-2" />
                  إضافة إمتحان
                </button>
              </div>

              {quizzes.length > 0 ? (
                <TeacherExamsTable
                  exams={quizzes}
                  onEdit={handleEditExam}
                  onDelete={handleDeleteExam}
                  darkMode={darkMode}
                  quizzes={quizzes}
                  setQuizzes={setQuizzes}
                  setQuizzesCount={setQuizzesCount}
                  quizzesCount={quizzesCount}
                />
              ) : (
                <div className="text-center py-4">
                  <FaGraduationCap className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                  <h5 className="text-muted">لا توجد امتحانات منشأة</h5>
                  <p className="text-muted mb-4">ابدأ بإضافة امتحان جديد</p>
                  <Link
                    to="/teacher/exams/add"
                    className="btn btn-primary d-flex align-items-center mx-auto"
                  >
                    <FaPlus className="me-2" />
                    إضافة أول امتحان
                  </Link>
                </div>
              )}
            </div>

     
          </div>
        </div>

        <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />
      </div>
    </>
  )
}

export default ExamList
