import React, { useEffect, useState } from 'react';

const AdminDashboard = ({ onBack }) => {
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState(1);

    const handleAddStudent = async () => {
        if (!newStudentName) return;
        try {
            await fetch('http://localhost:8000/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newStudentName, grade: newStudentGrade, avatar: '🎓' })
            });
            // Refresh list
            const res = await fetch('http://localhost:8000/api/students');
            const data = await res.json();
            setStudents(data);
            setNewStudentName('');
            setNewStudentGrade(1);
        } catch (err) {
            console.error("Error adding student:", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Students
            try {
                console.log("Fetching students...");
                const res = await fetch('http://localhost:8000/api/students');
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
                const res = await fetch('http://localhost:8000/api/results');
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
            const res = await fetch('http://localhost:8000/api/admin/change-pin', {
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

    const handleEditClick = (student) => {
        setEditingStudent({ ...student });
    };

    const handleUpdateStudent = async () => {
        if (!editingStudent) return;
        try {
            await fetch(`http://localhost:8000/api/students/${editingStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingStudent.name,
                    grade: editingStudent.grade,
                    avatar: editingStudent.avatar,
                    is_public: editingStudent.is_public_profile
                })
            });

            // Refresh list
            const res = await fetch('http://localhost:8000/api/students');
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
            await fetch(`http://localhost:8000/api/students/${studentToDelete.id}`, {
                method: 'DELETE',
            });
            // Refresh list
            const res = await fetch('http://localhost:8000/api/students');
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
                    <button
                        onClick={handleAddStudent}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
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
                                        <span className="font-bold text-gray-700">{student.name}</span>
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
        </div>
    );
};

export default AdminDashboard;
