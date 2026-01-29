// src/components/common/Header.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  FaBell,
  FaUserCircle,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaUser,
  FaWallet,
  FaHome,
  FaUsers,
  FaUserShield,
  FaBook,
  FaFileAlt,
  FaChartBar,
  FaCode,
  FaEdit,
  FaBars
} from 'react-icons/fa'
import { Navbar, Container, Nav, Dropdown, Offcanvas } from 'react-bootstrap'
import '../styles/header.css'
import authService from '../api/auth.service'
import useAuthStore from '../store/authStore'

// دالة مساعدة لتطبيق/إزالة Dark Mode على مستوى التطبيق
const applyDarkMode = (isDark) => {
  if (isDark) {
    document.body.classList.add('dark-mode')
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.body.classList.remove('dark-mode')
    document.documentElement.setAttribute('data-theme', 'light')
  }
  // حفظ التفضيل في localStorage
  localStorage.setItem('darkMode', JSON.stringify(isDark))
}

// دالة مساعدة لقراءة حالة Dark Mode من localStorage
const getDarkModeFromStorage = () => {
  const saved = localStorage.getItem('darkMode')
  return saved ? JSON.parse(saved) : false
}

const Header = ({ sidebarCollapsed, toggleSidebar }) => {
  const { refreshToken, logout, user } = useAuthStore()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // قراءة الحالة الأولية من localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return getDarkModeFromStorage()
  })

  // تطبيق Dark Mode عند تحميل المكون أو تغييره
  useEffect(() => {
    applyDarkMode(darkMode)
  }, [darkMode])

  const handleLogout = () => {
    authService.logout(refreshToken)
    logout()
    navigate('/login')
  }

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
  }

  const menuItems = [
    { path: `/${user.role}/dashboard`, icon: <FaHome />, label: 'الرئيسية', key: 'dashboard' },
    { path: `/admin/users`, icon: <FaUsers />, label: 'إدارة المستخدمين', key: 'users' },
    { path: `/${user.role}/courses`, icon: <FaBook />, label: 'إدارة الكورسات', key: 'courses' },
    { path: `/${user.role}/lectures`, icon: <FaBook />, label: 'إدارة المحاضرات', key: 'lectures' },
    { path: `/${user.role}/exams`, icon: <FaFileAlt />, label: 'الإمتحانات', key: 'exams' },
    { path: `/admin/reports`, icon: <FaChartBar />, label: 'التقارير', key: 'reports' },
    { path: `/admin/codes`, icon: <FaCode />, label: 'الأكواد', key: 'codes' },
    { path: `/admin/requests`, icon: <FaEdit />, label: 'طلبات الكورسات', key: 'requests' },
    { path: `/${user.role}/profile`, icon: <FaUser />, label: 'الملف الشخصي', key: 'profile' },
    {
      path: `/${user.role}/notifications`,
      icon: <FaBell />,
      label: 'الإشعارات',
      key: 'notifications'
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleCloseMobileMenu = () => setShowMobileMenu(false)
  const handleShowMobileMenu = () => setShowMobileMenu(true)

  return (
    <>
      <Navbar expand="lg" fixed="top" className="custom-navbar" dir="rtl">
        <Container fluid>
          {/* Logo */}
          <Navbar.Brand as={Link} to="/teacher/dashboard">
            <img src="/images/logo.png" className="navbar-img" alt="Logo" />
          </Navbar.Brand>

          {/* Dark Mode Toggle للشاشات الكبيرة */}
          <div className="d-lg-flex d-none align-items-center dark-mode-container me-3">
            <div className="theme-switch">
              <input
                type="checkbox"
                id="darkModeToggle"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
              <label htmlFor="darkModeToggle" className="switch-label">
                <span className="icon sun">
                  <FaSun />
                </span>
                <span className="icon moon">
                  <FaMoon />
                </span>
              </label>
            </div>
          </div>

          {/* Dark Mode للشاشات الصغيرة */}
          <div className="d-lg-none d-flex align-items-center me-3 mobile-theme-switch">
            <div className="theme-switch">
              <input
                type="checkbox"
                id="darkModeToggleMobile"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
              <label htmlFor="darkModeToggleMobile" className="switch-label">
                <span className="icon sun">
                  <FaSun />
                </span>
                <span className="icon moon">
                  <FaMoon />
                </span>
              </label>
            </div>
          </div>

          {/* العناصر اليمنى للشاشات الكبيرة */}
          <div className="d-lg-flex d-none align-items-center ms-auto">
            {/* Wallet */}
            <Link to="/teacher/profile" className="text-decoration-none me-3">
              <div className="custom-badge d-flex align-items-center">
                <span className="ms-2">0 جنيه</span>
                <div className="icon-circle">
                  <FaWallet className="wallet-icon" />
                </div>
              </div>
            </Link>

            {/* Notifications Dropdown */}
            <Dropdown align="end" className="me-3">
              <Dropdown.Toggle
                as="a"
                className="nav-link position-relative p-0"
                id="notifications-dropdown"
              >
                <FaBell className="fs-3 notification-icon" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {menuItems.filter((item) => item.path === '/teacher/notifications').length}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown">
                <Dropdown.Header>الإشعارات</Dropdown.Header>
                <Dropdown.Item href="#">طلب كورس جديد</Dropdown.Item>
                <Dropdown.Item href="#">تم الاشتراك في كورسك</Dropdown.Item>
                <Dropdown.Item href="#">تذكير بدفع المحفظة</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/teacher/notifications" className="text-center">
                  عرض كل الإشعارات
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Profile Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle as="a" className="nav-link p-0" id="profile-dropdown">
                <FaUserCircle className="fs-3 profile-icon" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown">
                <Dropdown.Item as={Link} to="/teacher/profile">
                  <FaUser className="me-2" />
                  الملف الشخصي
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as="button" className="text-danger" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  تسجيل الخروج
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* زر القائمة المدمجة للشاشات الصغيرة */}
          <button
            className="navbar-toggler d-lg-none ms-3 mobile-menu-btn"
            onClick={handleShowMobileMenu}
          >
            <FaBars className="text-white fs-4" />
          </button>
        </Container>
      </Navbar>

      {/* قائمة الموبايل المدمجة */}
      <Offcanvas
        show={showMobileMenu}
        onHide={handleCloseMobileMenu}
        placement="start"
        className={`mobile-menu-offcanvas ${darkMode ? 'dark-mode' : ''}`}
        dir="rtl"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white">القائمة</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* زر المحفظة في الموبايل */}
          <div className="mobile-wallet-section p-3 border-bottom border-secondary">
            <Link
              to="/teacher/profile"
              className="text-decoration-none d-flex align-items-center"
              onClick={handleCloseMobileMenu}
            >
              <div className="custom-badge d-flex align-items-center w-100">
                <span className="ms-2">0 جنيه</span>
                <div className="icon-circle">
                  <FaWallet className="wallet-icon" />
                </div>
              </div>
            </Link>
          </div>

          {/* Notifications في الموبايل */}
          <div className="mobile-notifications p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="text-white mb-0">الإشعارات</h6>
              <Link
                to="/teacher/notifications"
                className="text-decoration-none text-info small"
                onClick={handleCloseMobileMenu}
              >
                عرض الكل
              </Link>
            </div>
            <div className="mobile-notification-items">
              <Link
                to="#"
                className="d-block text-white p-2 text-decoration-none hover-mobile-item"
              >
                طلب كورس جديد
              </Link>
              <Link
                to="#"
                className="d-block text-white p-2 text-decoration-none hover-mobile-item"
              >
                تم الاشتراك في كورسك
              </Link>
              <Link
                to="#"
                className="d-block text-white p-2 text-decoration-none hover-mobile-item"
              >
                تذكير بدفع المحفظة
              </Link>
            </div>
          </div>

          {/* menuItems في الموبايل */}
          <div className="mobile-menu-items">
            <div className="p-3 border-bottom border-secondary">
              <h6 className="text-white mb-3">الصفحات</h6>
              <div className="mobile-menu-links">
                {menuItems.map((item) =>
                  item.path.includes(user.role) ? (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`d-flex align-items-center p-2 text-decoration-none mb-1 mobile-menu-link ${isActive(item.path) ? 'active-mobile-link' : ''}`}
                      onClick={handleCloseMobileMenu}
                    >
                      <span className="me-2 mobile-menu-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <></>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Profile في الموبايل */}
          <div className="mobile-profile-section p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center mb-3">
              <FaUserCircle className="fs-3 text-white me-2" />
              <span className="text-white">الملف الشخصي</span>
            </div>
            <div className="mobile-profile-links">
              <Link
                to="/teacher/profile"
                className="d-block text-white p-2 text-decoration-none hover-mobile-item"
                onClick={handleCloseMobileMenu}
              >
                <FaUser className="me-2" />
                الملف الشخصي
              </Link>
              <button
                className="d-block text-white p-2 text-decoration-none hover-mobile-item w-100 text-start border-0 bg-transparent"
                onClick={() => {
                  handleCloseMobileMenu()
                  handleLogout()
                }}
              >
                <FaSignOutAlt className="me-2" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

export default Header
