// src/pages/TeacherProfilePage.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/ProfileSidebar';
import ProfileTabs from '../components/ProfileTabs';
import '../styles/teacher-profile.css';

const TeacherProfilePage = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    
    // تحميل تفضيل Dark Mode من localStorage
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
            setDarkMode(JSON.parse(savedDarkMode));
        }
    }, []);
    
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className={`teacher-profile-page ${darkMode ? 'dark-mode' : ''}`}>
            <Header 
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
            />
            <Sidebar 
                collapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                darkMode={darkMode}
            />
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'dark-mode' : ''}`}>
                <div className="container-fluid pt-5 mt-4">
                    <div className="row">
                        <div className="col-lg-4">
                            <ProfileSidebar darkMode={darkMode} />
                        </div>
                        <div className="col-lg-8">
                            <ProfileTabs darkMode={darkMode} />
                        </div>
                    </div>
                </div>
            </div>
            <Footer sidebarCollapsed={sidebarCollapsed} darkMode={darkMode} />
        </div>
    );
};

export default TeacherProfilePage;