import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { GoogleLogo } from '../components/GoogleLogo';
import { login, register } from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Login/Signup Page with real authentication
 */
export function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [step, setStep] = useState('auth'); // 'auth' | 'username'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

    // Check server status on mount
    useEffect(() => {
        const checkServer = async () => {
            try {
                const response = await fetch(`${API_URL}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    setServerStatus('online');
                } else {
                    setServerStatus('offline');
                }
            } catch (err) {
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    const handleEmailAuth = async (e) => {
        e.preventDefault();

        if (serverStatus === 'offline') {
            setError('Server is offline. Please start the backend server first.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                // For signup, go to username step
                setStep('username');
            } else {
                // For login, authenticate directly
                await login(email, password);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        // Google OAuth requires API keys setup
        // For hackathon demo, show helpful message
        setError('Google OAuth requires API key setup. Please use email login, or set up Google Cloud Console credentials to enable this feature.');
    };

    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Complete registration with email, password, and username
            await register(email, password, username);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Server Status Indicator
    const ServerStatusBadge = () => (
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-4 ${serverStatus === 'online'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : serverStatus === 'offline'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
            }`}>
            {serverStatus === 'online' ? (
                <><CheckCircle className="w-3 h-3" /> Server Online</>
            ) : serverStatus === 'offline' ? (
                <><AlertCircle className="w-3 h-3" /> Server Offline - Start backend first</>
            ) : (
                <><span className="w-3 h-3 animate-spin">⟳</span> Checking server...</>
            )}
        </div>
    );

    // Username Selection Step
    if (step === 'username') {
        return (
            <div className="min-h-screen relative overflow-hidden bg-black">
                <AnimatedBackground />

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl mb-8 shadow-lg shadow-indigo-500/20">
                                <Code2 className="w-8 h-8 text-white" strokeWidth={2} />
                            </div>
                            <h1 className="text-4xl font-semibold text-indigo-300 mb-3 tracking-tight">
                                Choose a Username
                            </h1>
                            <p className="text-gray-500 text-base">This is how others will see you in CodeBuddy</p>
                        </div>

                        <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8">
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleUsernameSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2.5">
                                        Username
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            required
                                            minLength={3}
                                            maxLength={20}
                                            className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">3-20 characters, letters and numbers only</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !username.trim() || username.length < 3}
                                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? 'Creating account...' : 'Create Account'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('auth'); setError(''); }}
                                    className="w-full text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors"
                                >
                                    ← Back to login
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Auth Step (Login/Signup)
    return (
        <div className="min-h-screen relative overflow-hidden bg-black">
            <AnimatedBackground />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl mb-8 shadow-lg shadow-indigo-500/20">
                            <Code2 className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h1 className="text-4xl font-semibold text-indigo-300 mb-4 tracking-tight">
                            Welcome to CodeBuddy
                        </h1>
                        <p className="text-gray-500 text-base">Real-time collaborative coding platform</p>
                    </div>

                    <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-8">
                        {/* Server Status */}
                        <div className="flex justify-center">
                            <ServerStatusBadge />
                        </div>

                        {/* Login/Signup Toggle */}
                        <div className="flex gap-2 mb-7 bg-black/30 p-1 rounded-xl border border-zinc-800/60">
                            <button
                                onClick={() => { setMode('login'); setError(''); }}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${mode === 'login'
                                        ? 'bg-zinc-800 text-gray-200'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => { setMode('signup'); setError(''); }}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${mode === 'signup'
                                        ? 'bg-zinc-800 text-gray-200'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailAuth} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2.5">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-zinc-800 rounded-xl text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                                {mode === 'signup' && (
                                    <p className="text-xs text-gray-600 mt-2">Minimum 6 characters</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || serverStatus === 'offline'}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Continue'}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-zinc-900/40 text-gray-600">or</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-black/40 border border-zinc-800 text-gray-300 py-3.5 rounded-xl font-medium hover:bg-black/60 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <GoogleLogo className="w-5 h-5" />
                            Continue with Google
                        </button>
                        <p className="text-xs text-gray-600 text-center mt-2">Requires Google Cloud setup</p>

                        {mode === 'login' && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setError('Password reset requires email service setup (SendGrid, etc.)')}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Built for the Hackathon • Collaborative Coding Made Easy
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
