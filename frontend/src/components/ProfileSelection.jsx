
import React, { useState } from 'react';

const ProfileSelection = ({ onSelectProfile }) => {
    const [profiles, setProfiles] = useState([]);

    React.useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch('/api/students');
                const data = await res.json();
                if (data && data.length > 0) {
                    setProfiles(data);
                } else {
                    // Fallback defaults if DB is empty
                    setProfiles([
                        { id: 1, name: 'Yudelle', grade: 4, avatar: '👧' },
                        { id: 2, name: 'Emmalyn', grade: 2, avatar: '🧒' }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
                // Fallback defaults on error
                setProfiles([
                    { id: 1, name: 'Yudelle', grade: 4, avatar: '👧' },
                    { id: 2, name: 'Emmalyn', grade: 2, avatar: '🧒' }
                ]);
            }
        };
        fetchStudents();
    }, []);

    const handleSelect = async (profile) => {
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: profile.name, grade: profile.grade, avatar: profile.avatar })
            });
            const studentData = await res.json();
            onSelectProfile(studentData);
        } catch (err) {
            console.error("Error fetching student:", err);
            // Fallback to local profile if offline
            onSelectProfile(profile);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Who is learning today?</h1>
                <p className="text-gray-500 mb-12">Select your profile to start your adventure!</p>

                <div className="flex flex-wrap justify-center gap-8 mb-12">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => handleSelect(profile)}
                            className="group cursor-pointer transform hover:scale-110 transition-all duration-300"
                        >
                            <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-6xl mb-4 group-hover:bg-blue-200 shadow-lg border-4 border-white group-hover:border-blue-300">
                                {profile.avatar}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 group-hover:text-blue-600">{profile.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileSelection;

