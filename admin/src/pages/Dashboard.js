// src/pages/teacher/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import StatCard from '../components/StatCard'
import ChartComponent from '../components/ChartComponent'
import CourseCard from '../components/CourseCard'
import '../styles/dashboard.css'
import useAuthStore from '../store/authStore'
import teacherDashboardService from '../api/teacher/dashboard.service'
import adminReportsService from '../api/admin/reports.service'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [statCards, setStatCards] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState(null)

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    })
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (user?.role === 'teacher') {
        // Fetch teacher dashboard data
        const dashboardData = await teacherDashboardService.getDashboard('month')
        // const topCoursesData = await teacherDashboardService.getTopCourses(5)

        // Build stat cards for teacher
        const cards = [
          {
            icon: 'book',
            title: 'كورسات تم إنشاؤها',
            value: dashboardData.overview?.total_courses || 0,
            color: 'primary'
          },
          {
            icon: 'users',
            title: 'إجمالي الطلاب',
            value: dashboardData.overview?.total_students || 0,
            color: 'success'
          },
          {
            icon: 'dollar',
            title: 'الإيرادات',
            value: `$${dashboardData.overview?.total_revenue || 0}`,
            color: 'warning'
          },
          {
            icon: 'star',
            title: 'كورسات نشطة',
            value: dashboardData.overview?.active_courses || 0,
            color: 'danger'
          }
        ]
        setStatCards(cards)

        // Set courses data
        if (dashboardData.courses && dashboardData.courses.length > 0) {
          setCourses(
            dashboardData.courses.map((course) => ({
              id: course.id,
              title: course.title,
              date: new Date(course.created_at).toLocaleDateString('ar-EG'),
              price: course.price,
              description: course.description
            }))
          )
        } else {
          setCourses([])
        }
      } else if (user?.role === 'admin') {
        // Fetch admin dashboard data
        const dashboardData = await teacherDashboardService.getDashboard('month')
        // const topCoursesData = await adminReportsService.getTopCourses(5)
        setUsers(dashboardData.user_stats.by_role)
        // Build stat cards for admin
        const cards = [
          {
            icon: 'book',
            title: 'إجمالي الكورسات',
            value: dashboardData.overview?.total_courses || 0,
            color: 'primary'
          },
          {
            icon: 'users',
            title: 'إجمالي الطلاب',
            value: dashboardData.overview?.total_students || 0,
            color: 'success'
          },
          {
            icon: 'dollar',
            title: 'إجمالي الإيرادات',
            value: `$${dashboardData.overview?.total_revenue || 0}`,
            color: 'warning'
          },
          {
            icon: 'shopping-cart',
            title: 'إجمالي المشتريات',
            value: dashboardData.overview?.total_purchases || 0,
            color: 'danger'
          }
        ]
        setStatCards(cards)

        // Set top courses
        // if (topCoursesData.results && topCoursesData.results.length > 0) {
        //   setCourses(
        //     topCoursesData.results.map((course) => ({
        //       id: course.course_id,
        //       title: course.course_title,
        //       date: new Date().toLocaleDateString('ar-EG'),
        //       price: course.price,
        //       description: `${course.total_purchases} مشتريات - ${course.total_revenue} إيرادات`
        //     }))
        //   )
        // } else {
        //   setCourses([])
        // }
      } else {
        // Default stat cards for student or other roles
        const defaultCards = [
          { icon: 'book', title: 'كورسات تم إنشاؤها', value: 0, color: 'primary' },
          { icon: 'users', title: 'إجمالي الطلاب', value: 0, color: 'success' },
          { icon: 'dollar', title: 'الإيرادات', value: 0, color: 'warning' },
          { icon: 'star', title: 'تقييمات', value: 0, color: 'danger' }
        ]
        setStatCards(defaultCards)
        setCourses([])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err.message)
      setStatCards([
        { icon: 'book', title: 'كورسات تم إنشاؤها', value: 0, color: 'primary' },
        { icon: 'users', title: 'إجمالي الطلاب', value: 0, color: 'success' },
        { icon: 'dollar', title: 'الإيرادات', value: 0, color: 'warning' },
        { icon: 'star', title: 'تقييمات', value: 0, color: 'danger' }
      ])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div
      className={`dashboard-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}
    >
      <Header
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} darkMode={darkMode} />

      <div className="main-content">
        <div className="container mt-5 pt-4">
          {/* Loading State */}
          {loading && (
            <div className="alert alert-info" role="alert">
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></div>
              جاري تحميل بيانات لوحة التحكم...
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>خطأ:</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Stat Cards */}
          {!loading && (
            <div className="row g-4">
              {statCards.map((card, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-3">
                  <StatCard {...card} darkMode={darkMode} />
                </div>
              ))}
            </div>
          )}

          {/* Chart Section */}
          {!loading && (
            <div className="row">
              <div className="col-12 pt-4">
                <h5 className="mb-4 fw-bold">المستخدمين</h5>
                <ChartComponent darkMode={darkMode} users={users} />
              </div>
            </div>
          )}

          {/* Courses Section */}
          {!loading && (
            <div className="courses pt-2">
              {courses.length > 0 ? (
                <div className="row text-start">
                  {courses.map((course) => (
                    <CourseCard key={course.id} {...course} darkMode={darkMode} />
                  ))}
                </div>
              ) : (
                <div className="alert alert-warning">لا توجد كورسات حالياً</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />
    </div>
  )
}

export default Dashboard
