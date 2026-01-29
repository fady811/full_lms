// src/components/profile/ProfileTabs.jsx
import React from 'react';
import ProfileOverview from './ProfileOverview';
import ProfileEarnings from './ProfileEarnings';
import ProfileCourses from './ProfileCourses';
import ProfileStudents from './ProfileStudents';
import ProfileSettings from './ProfileSettings';

const ProfileTabs = () => {
    return (
        <div className="tab-content" id="profileTabContent">
            <div className="tab-pane fade show active" id="overview" role="tabpanel">
                <ProfileOverview />
            </div>
            
            <div className="tab-pane fade" id="earnings" role="tabpanel">
                <ProfileEarnings />
            </div>
            
            <div className="tab-pane fade" id="courses" role="tabpanel">
                <ProfileCourses />
            </div>
            
            <div className="tab-pane fade" id="students" role="tabpanel">
                <ProfileStudents />
            </div>
            
            <div className="tab-pane fade" id="settings" role="tabpanel">
                <ProfileSettings />
            </div>
        </div>
    );
};

export default ProfileTabs;