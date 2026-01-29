// src/components/profile/ProfileSidebar.jsx
import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { 
    FaChartBar, 
    FaDollarSign, 
    FaGraduationCap, 
    FaUsers, 
    FaUserShield 
} from 'react-icons/fa';

const ProfileSidebar = () => {
    const teacherData = {
        name: "محمد غانم",
        experience: "معلم منذ 30 يوم",
        phone: "0123456789",
        email: "ahmed@example.com"
    };

    const tabs = [
        { id: "overview", label: "الملف الشخصي", icon: <FaChartBar /> },
        { id: "earnings", label: "الإيرادات والمحفظة", icon: <FaDollarSign /> },
        { id: "courses", label: "إدارة الكورسات", icon: <FaGraduationCap /> },
        { id: "students", label: "إدارة الطلاب", icon: <FaUsers /> },
        { id: "settings", label: "الأمان وتسجيل الدخول", icon: <FaUserShield /> }
    ];

    const handleTabClick = (tabId) => {
        // إظهار المحتوى المناسب للتبويب
        const tabContents = document.querySelectorAll('.tab-pane');
        tabContents.forEach(content => {
            content.classList.remove('show', 'active');
        });
        
        const tabButtons = document.querySelectorAll('.profile-tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedContent = document.getElementById(tabId);
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (selectedContent) {
            selectedContent.classList.add('show', 'active');
        }
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    };

    return (
        <>
            <style jsx="true">{`
                /* تأثير hover على أزرار التبويب */
                .profile-tab-btn {
                    background-color: #EBF7F6;
                    border: none;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .profile-tab-btn:hover {
                    background-color: #d4f0ed !important;
                    transform: translateX(-5px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* تأثير hover على الأيقونة داخل الزر */
                .profile-tab-btn:hover span:first-child {
                    color: #007bff !important;
                    transform: scale(1.1);
                    transition: all 0.2s ease;
                }
                
                /* تأثير hover على النص داخل الزر */
                .profile-tab-btn:hover .fs-14.fw-medium {
                    color: #007bff !important;
                    font-weight: 600;
                }
                
                /* تأثير hover على السهم */
                .profile-tab-btn:hover .fa-chevron-left {
                    color: #007bff !important;
                    transform: translateX(-3px);
                    transition: transform 0.2s ease;
                }
                
                /* تأثير active محسن */
                .profile-tab-btn.active {
                    background-color: #08345B !important;
                }
                
                .profile-tab-btn.active span:first-child,
                .profile-tab-btn.active .fs-14.fw-medium,
                .profile-tab-btn.active .fa-chevron-left {
                    color: white !important;
                }
                
                /* تأثير hover على أيقونة المستخدم */
                .fa-4x.text-primary {
                    transition: transform 0.3s ease, color 0.3s ease;
                    cursor: pointer;
                }
                
                .fa-4x.text-primary:hover {
                    transform: scale(1.05);
                    color: #08345B !important;
                }
                
                /* تأثير hover على اسم المعلم */
                .card-title.fw-bold {
                    transition: color 0.2s ease;
                    cursor: pointer;
                }
                
                .card-title.fw-bold:hover {
                    color: #08345B !important;
                }
                
                /* تأثير hover على النصوص الإضافية */
                .card-text.fs-14 {
                    transition: color 0.2s ease;
                }
                
                .card-text.fs-14:hover {
                    color: #08345B !important;
                    cursor: pointer;
                }
                
                /* تأثير hover على النصوص الفرعية */
                .card-text.fs-14:hover .text-secondary {
                    color: #08345B !important;
                }
                
                .card-text.fs-14:hover .fw-bold {
                    color: #08345B !important;
                }
                
                /* تأثير hover على خط الفصل */
                .border-bottom:hover {
                    border-color: #08345B !important;
                }
            `}</style>
            
            <div className="card card-profile mb-4">
                <div className="card-body text-center p-4">
                    <p className="text-center">
                        <FaUserCircle className="fa-4x text-primary" />
                    </p>
                    <h6 className="card-title fw-bold mb-2">{teacherData.name}</h6>
                    <p className="card-text fs-14 text-secondary mb-3">{teacherData.experience}</p>
                    <p className="card-text fs-14 mb-2">
                        <span className="text-secondary">رقم الهاتف:</span>
                        <span className="fw-bold"> {teacherData.phone}</span>
                    </p>
                    <p className="card-text fs-14 border-bottom pb-3 mb-3">
                        <span className="text-secondary">البريد الإلكتروني:</span>
                        <span className="fw-bold"> {teacherData.email}</span>
                    </p>
                    
                    <div className="nav flex-column gap-2 border-0 mt-4" role="tablist">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                className={`nav-link w-100 text-start align-items-center d-flex profile-tab-btn py-3 px-3 ${index === 0 ? 'active' : ''}`}
                                id={`${tab.id}-tab`}
                                type="button"
                                role="tab"
                                data-tab={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                            >
                                <span className="me-3" style={{ color: '#333' }}>
                                    {tab.icon}
                                </span>
                                <span className="fs-14 fw-medium" style={{ color: '#000' }}>
                                    {tab.label}
                                </span>
                                <i className="fas fa-chevron-left ms-auto" style={{ color: '#333' }}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileSidebar;