
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
                    setProfiles([
                        { id: 1, name: 'Yudelle', grade: 4, avatar: '👧' },
                        { id: 2, name: 'Emmalyn', grade: 2, avatar: '🧒' }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
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
            onSelectProfile(profile);
        }
    };

    const getAvatarImg = (name, emojiAvatar) => {
        if (name.toLowerCase() === 'yudelle') return <img src="/avatars/yudelle.png" alt="Yudelle" className="w-full h-full object-cover rounded-full" />;
        if (name.toLowerCase() === 'emmalyn') return <img src="/avatars/emmalyn.png" alt="Emmalyn" className="w-full h-full object-cover rounded-full" />;
        return <div className="flex items-center justify-center w-full h-full text-7xl">{emojiAvatar}</div>;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-10 md:p-16 rounded-[3rem] w-full max-w-5xl text-center relative overflow-hidden animate-fade-in group">
                <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
                <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow font-delay-1000"></div>
                
                <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-4 animate-float">
                    Welcome to Smart Tutor
                </h1>
                <p className="text-slate-300 text-xl font-light tracking-wide mb-16">
                    Choose your profile to begin today's adventure!
                </p>

                <div className="flex flex-wrap justify-center gap-12">
                    {profiles.map((profile, i) => (
                        <div
                            key={profile.id}
                            onClick={() => handleSelect(profile)}
                            className={`glass-card p-6 w-56 flex flex-col items-center justify-center cursor-pointer group hover:-translate-y-4`}
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className="w-40 h-40 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 shadow-2xl border-4 border-slate-700/50 group-hover:border-indigo-400 transition-colors duration-500 relative overflow-hidden">
                                {getAvatarImg(profile.name, profile.avatar)}
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-pink-400 transition-all">
                                {profile.name}
                            </h3>
                            <div className="mt-2 text-sm font-medium text-slate-400 uppercase tracking-widest bg-slate-800/50 px-4 py-1 rounded-full border border-slate-700">
                                Grade {profile.grade}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileSelection;

