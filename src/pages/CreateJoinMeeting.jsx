import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Plus, LogIn, Copy, Check, User } from 'lucide-react';
import { authFetch, getCurrentUser } from '../services/authService';

/**
 * Create or Join Meeting Page with Display Name prompt
 */
export function CreateJoinMeeting() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [mode, setMode] = useState('create'); // 'create' | 'join'
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingName, setMeetingName] = useState('');
    const [displayName, setDisplayName] = useState(currentUser?.username || localStorage.getItem('username') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdRoom, setCreatedRoom] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            setError('Please enter a display name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await authFetch('/rooms', {
                method: 'POST',
                body: JSON.stringify({ name: meetingName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to create room');
            }

            // Store display name for socket connection
            localStorage.setItem('displayName', displayName.trim());

            // Show the room code, then navigate
            setCreatedRoom(data.room || data);
        } catch (err) {
            setError(err.message || 'Failed to create room');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            setError('Please enter a display name');
            return;
        }

        setIsLoading(true);
        setError('');

        const roomCode = meetingCode.toLowerCase().trim();

        try {
            // Use correct endpoint: /rooms/:roomId/join
            const response = await authFetch(`/rooms/${roomCode}/join`, {
                method: 'POST'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to join room');
            }

            // Store display name for socket connection
            localStorage.setItem('displayName', displayName.trim());

            // Navigate directly to the workspace
            navigate(`/room/${roomCode}`);
        } catch (err) {
            setError(err.message || 'Failed to join room. Check if the room code is correct.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnterRoom = () => {
        if (createdRoom) {
            const roomId = createdRoom.roomId || createdRoom._id;
            navigate(`/room/${roomId.toLowerCase()}`);
        }
    };

    const handleCopyCode = async () => {
        if (createdRoom) {
            await navigator.clipboard.writeText(createdRoom.roomId || createdRoom._id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Room Created Success View
    if (createdRoom) {
        return (
            <div className="p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-semibold text-gray-200 mb-2">Workspace Created!</h2>
                        <p className="text-gray-500 mb-8">Share this code with your teammates</p>

                        <div className="bg-black/40 border border-zinc-800 rounded-xl p-6 mb-6">
                            <p className="text-sm text-gray-500 mb-2">Room Code</p>
                            <div className="flex items-center justify-center gap-4">
                                <code className="text-3xl font-mono font-bold text-indigo-300 tracking-widest">
                                    {(createdRoom.roomId || createdRoom._id || '').toUpperCase()}
                                </code>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50 rounded-lg transition-all"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-500">You'll join as</p>
                            <p className="text-lg font-medium text-indigo-300">{displayName}</p>
                        </div>

                        <button
                            onClick={handleEnterRoom}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-500 transition-all"
                        >
                            Enter Workspace
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-semibold text-indigo-300 mb-3">
                        Create or Join a Session
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Start a new collaborative session or join an existing one
                    </p>
                </div>

                {/* Toggle between Create and Join */}
                <div className="flex gap-2 mb-8 bg-black/30 p-1 rounded-xl border border-zinc-800/60 w-fit">
                    <button
                        onClick={() => { setMode('create'); setError(''); }}
                        className={`flex items-center gap-2 py-2.5 px-6 rounded-lg font-medium transition-all text-sm ${mode === 'create'
                                ? 'bg-zinc-800 text-gray-200'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Create Session
                    </button>
                    <button
                        onClick={() => { setMode('join'); setError(''); }}
                        className={`flex items-center gap-2 py-2.5 px-6 rounded-lg font-medium transition-all text-sm ${mode === 'join'
                                ? 'bg-zinc-800 text-gray-200'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <LogIn className="w-4 h-4" />
                        Join Session
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Create Meeting Form */}
                {mode === 'create' && (
                    <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                <Code2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-200">Create New Workspace</h2>
                                <p className="text-gray-500">Set up a collaborative coding environment</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            {/* Display Name Field */}
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Your Display Name *
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="How others will see you"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="meetingName" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Workspace Name
                                </label>
                                <input
                                    id="meetingName"
                                    type="text"
                                    value={meetingName}
                                    onChange={(e) => setMeetingName(e.target.value)}
                                    placeholder="Enter workspace name (optional)"
                                    className="w-full px-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                />
                            </div>

                            <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Workspace Features</h3>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        <span>Real-time code collaboration</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        <span>Integrated voice chat</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        <span>Shared terminal access</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                        <span>Collaborative canvas</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !displayName.trim()}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Creating...' : 'Create Workspace'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Join Meeting Form */}
                {mode === 'join' && (
                    <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                                <LogIn className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-200">Join Workspace</h2>
                                <p className="text-gray-500">Enter a workspace code to collaborate</p>
                            </div>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-6">
                            {/* Display Name Field */}
                            <div>
                                <label htmlFor="joinDisplayName" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Your Display Name *
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="joinDisplayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="How others will see you"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="meetingCode" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Workspace Code *
                                </label>
                                <input
                                    id="meetingCode"
                                    type="text"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                                    placeholder="Enter room code"
                                    required
                                    className="w-full px-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-center text-2xl font-mono tracking-widest"
                                />
                            </div>

                            <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">How to join?</h3>
                                <p className="text-sm text-gray-500">
                                    Ask your teammate for the workspace code and enter it above. You'll be able to see and edit code together in real-time.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !meetingCode.trim() || !displayName.trim()}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Joining...' : 'Join Workspace'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateJoinMeeting;
