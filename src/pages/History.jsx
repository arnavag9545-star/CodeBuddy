import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Clock, Users, Calendar, MoreVertical } from 'lucide-react';
import { authFetch } from '../services/authService';

/**
 * History Page - Shows past meeting sessions
 */
export function History() {
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Placeholder data for demo
    const placeholderMeetings = [
        {
            id: 1,
            name: 'React Component Development',
            date: 'Today, 10:00 AM',
            duration: '2h 15m',
            participants: 5,
            status: 'completed',
            roomId: 'abc123'
        },
        {
            id: 2,
            name: 'Backend API Review',
            date: 'Yesterday, 3:00 PM',
            duration: '1h 30m',
            participants: 3,
            status: 'completed',
            roomId: 'def456'
        },
        {
            id: 3,
            name: 'Project Planning Meeting',
            date: 'Jan 30, 2:00 PM',
            duration: '3h 00m',
            participants: 8,
            status: 'completed',
            roomId: 'ghi789'
        },
        {
            id: 4,
            name: 'Bug Fix Session',
            date: 'Jan 29, 11:00 AM',
            duration: '45m',
            participants: 2,
            status: 'completed',
            roomId: 'jkl012'
        },
        {
            id: 5,
            name: 'Feature Discussion',
            date: 'Jan 28, 4:30 PM',
            duration: '1h 20m',
            participants: 6,
            status: 'completed',
            roomId: 'mno345'
        },
    ];

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await authFetch('/users/rooms');
                if (response.ok) {
                    const data = await response.json();
                    setMeetings(data.rooms || data || []);
                } else {
                    // Use placeholder data if API fails
                    setMeetings(placeholderMeetings);
                }
            } catch (err) {
                // Use placeholder data on error
                setMeetings(placeholderMeetings);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleRejoin = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-semibold text-indigo-300 mb-3">
                        Session History
                    </h1>
                    <p className="text-gray-500 text-lg">
                        View all your past collaborative sessions
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-900/40 border border-zinc-800 text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        All Sessions
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'week'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-900/40 border border-zinc-800 text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setFilter('month')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'month'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-900/40 border border-zinc-800 text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        This Month
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading sessions...</p>
                    </div>
                )}

                {/* Meetings List */}
                {!isLoading && (
                    <div className="space-y-4">
                        {meetings.length === 0 ? (
                            <div className="text-center py-12 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl">
                                <Code2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-400 mb-2">No sessions yet</h3>
                                <p className="text-gray-500">Start your first collaborative coding session!</p>
                            </div>
                        ) : (
                            meetings.map((meeting) => (
                                <div
                                    key={meeting.id || meeting._id}
                                    className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-700 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Code2 className="w-7 h-7 text-white" />
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                                                    {meeting.name}
                                                </h3>

                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{meeting.date || new Date(meeting.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{meeting.duration || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span>{meeting.participants || 1} participants</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50 rounded-lg transition-all">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
                                        <button
                                            onClick={() => handleRejoin(meeting.roomId || meeting._id)}
                                            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                        >
                                            Rejoin Session
                                        </button>
                                        <button className="text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors">
                                            View Details
                                        </button>
                                        <button className="text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors">
                                            Share
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Load More */}
                {!isLoading && meetings.length > 0 && (
                    <div className="mt-8 text-center">
                        <button className="px-6 py-3 bg-zinc-900/40 border border-zinc-800 text-gray-400 hover:text-gray-200 hover:border-zinc-700 rounded-xl font-medium transition-all">
                            Load More Sessions
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default History;
