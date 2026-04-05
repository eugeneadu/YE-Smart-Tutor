import React, { useEffect, useState } from 'react';

const AdminDashboard = ({ onBack }) => {
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState(1);
    const [newStudentPin, setNewStudentPin] = useState('');

    const handleAddStudent = async () => {
        if (!newStudentName) return;
        try {
            await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newStudentName, 
                    grade: newStudentGrade, 
                    avatar: '🎓',
                    pin: newStudentPin
                })
            });
            // Refresh list
            const res = await fetch('/api/students');
            const data = await res.json();
            setStudents(data);
            setNewStudentName('');
            setNewStudentGrade(1);
            setNewStudentPin('');
        } catch (err) {
            console.error("Error adding student:", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Students
            try {
                console.log("Fetching students...");
                const res = await fetch('/api/students');
                if (res.ok) {
                    const data = await res.json();
                    console.log("Students loaded:", data);
                    setStudents(data);
                } else {
                    console.error("Failed to fetch students");
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            }

            // Fetch Results
            try {
                console.log("Fetching results...");
                const res = await fetch('/api/results');
                if (res.ok) {
                    const data = await res.json();
                    console.log("Results loaded:", data);
                    setResults(data);
                }
            } catch (err) {
                console.error("Error fetching results:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const [showChangePin, setShowChangePin] = useState(false);
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinMessage, setPinMessage] = useState('');

    const handleChangePin = async () => {
        try {
            const res = await fetch('/api/admin/change-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_pin: oldPin, new_pin: newPin })
            });

            if (res.ok) {
                setPinMessage('PIN updated successfully! ✅');
                setOldPin('');
                setNewPin('');
                setTimeout(() => {
                    setShowChangePin(false);
                    setPinMessage('');
                }, 2000);
            } else {
                setPinMessage('Incorrect Old PIN ❌');
            }
        } catch (err) {
            console.error("Error changing PIN:", err);
            setPinMessage('Error updating PIN');
        }
    };

    const [editingStudent, setEditingStudent] = useState(null);

    const [recoveryQuestion, setRecoveryQuestion] = useState('');
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [recoveryMessage, setRecoveryMessage] = useState('');

    const handleSetRecovery = async () => {
        if (!recoveryQuestion || !recoveryAnswer) {
            setRecoveryMessage('Please fill in both fields ❌');
            return;
        }
        try {
            const res = await fetch('/api/admin/setup-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: recoveryQuestion, answer: recoveryAnswer })
            });

            if (res.ok) {
                setRecoveryMessage('Recovery question saved successfully! ✅');
                setRecoveryQuestion('');
                setRecoveryAnswer('');
                setTimeout(() => setRecoveryMessage(''), 3000);
            } else {
                setRecoveryMessage('Error saving recovery info ❌');
            }
        } catch (err) {
            console.error("Error setting recovery:", err);
            setRecoveryMessage('Server error ❌');
        }
    };

    const handleEditClick = (student) => {
        setEditingStudent({ ...student });
    };

    const handleUpdateStudent = async () => {
        if (!editingStudent) return;
        try {
            await fetch(`/api/students/${editingStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingStudent.name,
                    grade: editingStudent.grade,
                    avatar: editingStudent.avatar,
                    is_public: editingStudent.is_public_profile,
                    pin: editingStudent.pin
                })
            });

            // Refresh list
            const res = await fetch('/api/students');
            const data = await res.json();
            setStudents(data);
            setEditingStudent(null);
        } catch (err) {
            console.error("Error updating student:", err);
        }
    };

    const [studentToDelete, setStudentToDelete] = useState(null);

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;
        try {
            await fetch(`/api/students/${studentToDelete.id}`, {
                method: 'DELETE',
            });
            // Refresh list
            const res = await fetch('/api/students');
            const data = await res.json();
            setStudents(data);
            setStudentToDelete(null);
        } catch (err) {
            console.error("Error deleting student:", err);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard 🔒</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowChangePin(true)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                    >
                        Change PIN 🔑
                    </button>
                    <button onClick={onBack} className="text-blue-500 hover:underline">Back to App</button>
                </div>
            </div>

            {/* Add Student Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Add New Student ➕</h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Enter student name"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm text-gray-600 mb-1">Grade</label>
                        <select
                            value={newStudentGrade}
                            onChange={(e) => setNewStudentGrade(parseInt(e.target.value))}
                            className="w-full p-3 border rounded-lg"
                        >
                            {[...Array(12).keys()].map(i => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="block text-sm text-gray-600 mb-1">6-Digit PIN</label>
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="Optional"
                            value={newStudentPin}
                            onChange={(e) => setNewStudentPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full p-3 border rounded-lg"
                        />
                    </div>
                    <button
                        onClick={handleAddStudent}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Account Recovery Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-purple-100">
                <h2 className="text-xl font-bold text-gray-700 mb-2">Account Recovery Setup 🔐</h2>
                <p className="text-sm text-gray-500 mb-4">Set a security question so you can recover your Admin Dashboard access if you ever forget your Parent PIN.</p>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Security Question</label>
                        <input
                            type="text"
                            value={recoveryQuestion}
                            onChange={(e) => setRecoveryQuestion(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:border-purple-500"
                            placeholder="e.g., What is the name of my first pet?"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Answer</label>
                        <input
                            type="text"
                            value={recoveryAnswer}
                            onChange={(e) => setRecoveryAnswer(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:border-purple-500"
                            placeholder="e.g., Fluffy"
                        />
                    </div>
                    <button
                        onClick={handleSetRecovery}
                        className="px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600"
                    >
                        Save
                    </button>
                </div>
                {recoveryMessage && <p className={`mt-4 font-bold text-sm ${recoveryMessage.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>{recoveryMessage}</p>}
            </div>

            {/* Student Progress Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Student Progress 🏆</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-sm uppercase">
                                <th className="pb-3">Student</th>
                                <th className="pb-3">Level</th>
                                <th className="pb-3">XP</th>
                                <th className="pb-3">Grade</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="py-4 flex items-center gap-3">
                                        <span className="text-2xl">{student.avatar}</span>
                                        <span className="font-bold text-gray-700">
                                            {student.name}
                                            {student.has_pin && <span className="ml-2" title="Profile Locked">🔒</span>}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">
                                            Lvl {student.level}
                                        </span>
                                    </td>
                                    <td className="py-4 font-mono text-gray-600">{student.xp} XP</td>
                                    <td className="py-4 text-gray-500">Grade {student.grade}</td>
                                    <td className="py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEditClick(student)}
                                            className="text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(student)}
                                            className="text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Recent Activity 📝</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-sm uppercase">
                                <th className="pb-3">Time</th>
                                <th className="pb-3">Student</th>
                                <th className="pb-3">Subject</th>
                                <th className="pb-3">Topic</th>
                                <th className="pb-3">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result) => {
                                const percentage = (result.score / result.total_questions) * 100;
                                let scoreColor = 'text-red-500';
                                if (percentage >= 80) scoreColor = 'text-green-500';
                                else if (percentage >= 60) scoreColor = 'text-yellow-500';

                                return (
                                    <tr key={result.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="py-4 text-gray-500 text-sm">
                                            {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 font-medium text-gray-700">{result.student_name}</td>
                                        <td className="py-4 capitalize text-gray-600">{result.subject}</td>
                                        <td className="py-4 text-gray-600">{result.topic}</td>
                                        <td className={`py-4 font-bold ${scoreColor}`}>
                                            {result.score}/{result.total_questions} ({Math.round(percentage)}%)
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Student</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingStudent.name}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Grade</label>
                                <select
                                    value={editingStudent.grade}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, grade: parseInt(e.target.value) })}
                                    className="w-full p-3 border rounded-lg"
                                >
                                    {[...Array(12).keys()].map(i => (
                                        <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Avatar</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {['🎓', '🚀', '⭐', '🦁', '🦄', '🤖', '🌍', '🎨', '⚽', '🎵'].map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setEditingStudent({ ...editingStudent, avatar: emoji })}
                                            className={`text-2xl p-2 rounded-lg border ${editingStudent.avatar === emoji ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                                <input
                                    type="checkbox"
                                    id="publicProfile"
                                    checked={editingStudent.is_public_profile || false}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, is_public_profile: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="publicProfile" className="text-sm text-gray-700 font-medium cursor-pointer select-none">
                                    Show on Public Leaderboard 🏆
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm text-gray-600 mb-1">Set 6-Digit PIN (Optional)</label>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Leave blank to remove PIN"
                                value={editingStudent.pin || ''}
                                onChange={(e) => setEditingStudent({ ...editingStudent, pin: e.target.value.replace(/[^0-9]/g, '') })}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">If set, the profile will require this PIN to access.</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setEditingStudent(null)}
                                className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStudent}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {studentToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Student?</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete <strong>{studentToDelete.name}</strong>?
                            This will also delete all their progress and quiz results.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStudentToDelete(null)}
                                className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Change PIN Modal */}
            {showChangePin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Change Parent PIN</h3>

                        <div className="space-y-4 mb-6">
                            <input
                                type="password"
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                className="w-full p-3 border rounded-lg text-center tracking-widest"
                                placeholder="Old PIN"
                                maxLength={4}
                            />
                            <input
                                type="password"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-full p-3 border rounded-lg text-center tracking-widest"
                                placeholder="New PIN"
                                maxLength={4}
                            />
                        </div>

                        {pinMessage && <p className={`mb-4 font-bold ${pinMessage.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>{pinMessage}</p>}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowChangePin(false)}
                                className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePin}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson History Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span>📚</span> Lesson History
                </h2>
                <div className="space-y-4">
                    {students.map(student => (
                        <StudentLessonHistory key={student.id} student={student} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const StudentLessonHistory = ({ student }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isExpanded && logs.length === 0) {
            fetchLogs();
        }
    }, [isExpanded]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/students/${student.id}/lesson-logs`);
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-all"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{student.avatar}</span>
                        <h3 className="font-bold text-lg text-gray-800">{student.name}'s Lessons</h3>
                        {logs.length > 0 && (
                            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                                {logs.length}
                            </span>
                        )}
                    </div>
                    <div className="text-gray-400 text-xl">
                        {isExpanded ? '▲' : '▼'}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 bg-gray-50">
                    {loading ? (
                        <div className="text-center text-gray-400 py-4">Loading lessons...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-gray-400 text-sm italic text-center py-4">No lessons recorded yet.</div>
                    ) : (
                        <LessonHistoryList logs={logs} />
                    )}
                </div>
            )}
        </div>
    );
};

const LessonHistoryList = ({ logs }) => {
    const [expandedLogId, setExpandedLogId] = useState(null);

    return (
        <div className="space-y-2">
            {logs.map(log => (
                <div key={log.id} className="bg-gray-50 rounded-xl p-4 transition-all">
                    <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    >
                        <div>
                            <div className="font-bold text-gray-800">{log.topic}</div>
                            <div className="text-xs text-gray-500">{log.subject} • {new Date(log.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="text-gray-400">{expandedLogId === log.id ? '▲' : '▼'}</div>
                    </div>

                    {expandedLogId === log.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 prose max-w-none">
                            {/* Simple markdown rendering or just text */}
                            <div className="whitespace-pre-wrap">{log.content}</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AdminDashboard;
