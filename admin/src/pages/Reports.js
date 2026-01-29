// src/pages/teacher/Reports.jsx
import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ReportsTable from '../components/ReportsTable';
import ReportsFilterModal from '../components/ReportsFilterModal';
import ReportsStats from '../components/ReportsStats';
import Pagination from '../components/Pagination';
import { 
    reportsData, 
    courseOptions, 
    lectureOptions, 
    attendanceOptions 
} from '../utils/reportsData';
import { FaFilter, FaPrint, FaChartBar } from 'react-icons/fa';
import '../styles/reports.css';
import '../styles/modals.css';

const Reports = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [reports, setReports] = useState(reportsData);
    const [filteredReports, setFilteredReports] = useState(reportsData);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        studentName: '',
        course: '',
        lecture: '',
        attendance: ''
    });

    const itemsPerPage = 5;

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
    }, []);

    useEffect(() => {
        // تصفية التقارير
        let filtered = reports;
        
        if (filters.studentName) {
            filtered = filtered.filter(report =>
                report.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
            );
        }
        
        if (filters.course) {
            filtered = filtered.filter(report => report.course === filters.course);
        }
        
        if (filters.lecture) {
            filtered = filtered.filter(report => report.lecture === filters.lecture);
        }
        
        if (filters.attendance) {
            filtered = filtered.filter(report => report.attendance === filters.attendance);
        }
        
        setFilteredReports(filtered);
        setCurrentPage(1);
    }, [filters, reports]);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleApplyFilter = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilter = () => {
        setFilters({
            studentName: '',
            course: '',
            lecture: '',
            attendance: ''
        });
    };

    const handlePrintReports = () => {
        window.print();
    };

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const indexOfLastReport = currentPage * itemsPerPage;
    const indexOfFirstReport = indexOfLastReport - itemsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

    return (
        <div className={`reports-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}>
            <Header 
                sidebarCollapsed={sidebarCollapsed} 
                toggleSidebar={toggleSidebar}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
            />
            
            <Sidebar 
                collapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                activePage="reports"
                darkMode={darkMode}
            />
            
            <div className="main-content">
                <div className="container mt-5 pt-4">
                    <div className="card reports-card">
                        <div className="card-header d-md-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <FaChartBar className="text-primary me-2" style={{ fontSize: '1.5rem' }} />
                                <h3 className="text-titles mb-0">التقارير</h3>
                            </div>
                            <div className="mt-2 mt-md-0">
                                <button 
                                    className="btn btn-secondary me-2 filter-btn"
                                    onClick={() => setShowFilterModal(true)}
                                >
                                    <FaFilter className="me-2" />
                                    تصفية
                                </button>
                                <button 
                                    className="btn btn-primary print-btn"
                                    onClick={handlePrintReports}
                                >
                                    <FaPrint className="me-2" />
                                    طباعة التقارير
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Statistics */}
                            <ReportsStats 
                                reports={filteredReports} 
                                darkMode={darkMode}
                            />

                            {/* Reports Table */}
                            {currentReports.length > 0 ? (
                                <>
                                    <ReportsTable 
                                        reports={currentReports}
                                        currentPage={currentPage}
                                        itemsPerPage={itemsPerPage}
                                        darkMode={darkMode}
                                    />

                                    {/* Pagination */}
                                    {filteredReports.length > itemsPerPage && (
                                        <div className="reports-pagination">
                                            <Pagination 
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={setCurrentPage}
                                                darkMode={darkMode}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="no-reports">
                                    <FaChartBar className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                    <h5 className="text-muted">لا توجد تقارير</h5>
                                    <p className="text-muted mb-4">جرب معايير تصفية مختلفة</p>
                                    <button 
                                        className="btn btn-primary d-flex align-items-center mx-auto"
                                        onClick={() => setShowFilterModal(true)}
                                    >
                                        <FaFilter className="me-2" />
                                        تطبيق تصفية
                                    </button>
                                </div>
                            )}

                            {/* Applied Filters */}
                            {Object.values(filters).some(value => value) && (
                                <div className="mt-3">
                                    <small className="text-muted">
                                        <strong>التصفية المطبقة:</strong>
                                        {filters.studentName && ` اسم الطالب: ${filters.studentName}`}
                                        {filters.course && ` | الكورس: ${filters.course}`}
                                        {filters.lecture && ` | المحاضرة: ${filters.lecture}`}
                                        {filters.attendance && ` | الحضور: ${filters.attendance}`}
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />

            {/* Filter Modal */}
            <ReportsFilterModal 
                show={showFilterModal}
                handleClose={() => setShowFilterModal(false)}
                applyFilter={handleApplyFilter}
                resetFilter={handleResetFilter}
                courseOptions={courseOptions}
                lectureOptions={lectureOptions}
                attendanceOptions={attendanceOptions}
                darkMode={darkMode}
            />
        </div>
    );
};

export default Reports;