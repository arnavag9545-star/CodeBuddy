import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Code2, LayoutDashboard, Video, History, User, Settings, LogOut } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { logout, getCurrentUser } from '../services/authService';
import { disconnect as disconnectSocket } from '../services/socket';

/**
 * Dashboard Layout - Sidebar + Header wrapper
 */
export function DashboardLayout() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const username = user?.username || localStorage.getItem('username') || 'User';

    const handleLogout = () => {
        disconnectSocket(); // Disconnect socket first to clear auth state
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            <AnimatedBackground />

            <div className="relative z-10 flex min-h-screen">
                {/* Sidebar Navigation */}
                <aside className="w-64 border-r border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
                    <div className="p-6 h-full flex flex-col">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-lg">
                                <Code2 className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-xl font-semibold text-indigo-300">CodeBuddy</span>
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-2 flex-1">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50'
                                    }`
                                }
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="font-medium">Dashboard</span>
                            </NavLink>

                            <NavLink
                                to="/create-join"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50'
                                    }`
                                }
                            >
                                <Video className="w-5 h-5" />
                                <span className="font-medium">Create/Join</span>
                            </NavLink>

                            <NavLink
                                to="/history"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50'
                                    }`
                                }
                            >
                                <History className="w-5 h-5" />
                                <span className="font-medium">History</span>
                            </NavLink>
                        </nav>

                        {/* Logout Button */}
                        <div className="mt-auto">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Top Bar */}
                    <header className="h-16 border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-end px-6 gap-4">
                        <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50 rounded-lg transition-all">
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">{username}</span>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;
