import { useNavigate } from 'react-router-dom';
import { Code2, Clock, Users, Folder } from 'lucide-react';

/**
 * Dashboard - Main landing page after login
 */
export function Dashboard() {
    const navigate = useNavigate();

    // Placeholder stats - can be fetched from API later
    const stats = [
        { label: 'Total Sessions', value: '24', icon: Video, color: 'from-blue-500 to-indigo-600' },
        { label: 'Hours Coded', value: '156', icon: Clock, color: 'from-purple-500 to-pink-600' },
        { label: 'Collaborators', value: '12', icon: Users, color: 'from-indigo-500 to-purple-600' },
        { label: 'Projects', value: '8', icon: Folder, color: 'from-violet-500 to-indigo-600' },
    ];

    // Placeholder recent meetings
    const recentMeetings = [
        { id: 1, name: 'Team Standup', date: 'Today, 10:00 AM', participants: 5 },
        { id: 2, name: 'Code Review Session', date: 'Yesterday, 3:00 PM', participants: 3 },
        { id: 3, name: 'Project Planning', date: 'Jan 30, 2:00 PM', participants: 8 },
    ];

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-10">
                    <h1 className="text-4xl font-semibold text-indigo-300 mb-3">
                        Welcome to CodeBuddy
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Start collaborating with your team in real-time
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Recent Meetings */}
                <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-6">Recent Sessions</h2>
                    <div className="space-y-4">
                        {recentMeetings.map((meeting) => (
                            <div
                                key={meeting.id}
                                className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <Code2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-200 group-hover:text-indigo-300 transition-colors">
                                            {meeting.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{meeting.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">{meeting.participants}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => navigate('/create-join')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-2xl transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Code2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Start New Session</h3>
                                <p className="text-indigo-200 text-sm">Create a collaborative coding room</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/create-join')}
                        className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 hover:border-zinc-700 text-white p-6 rounded-2xl transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1 text-gray-200">Join Session</h3>
                                <p className="text-gray-500 text-sm">Enter a room code to join</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Video icon component
function Video({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

export default Dashboard;
