import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, Github, Users, Wifi, WifiOff, LogOut, MessageSquareOff, MessageSquare, Power, Crown } from 'lucide-react';
import WorkspaceLayout from './components/Layout/WorkspaceLayout';
import ChatPanel from './components/Chat/ChatPanel';
import VoiceRoom from './components/VoiceCall/VoiceCall';
import ParticipantsPanel from './components/Participants/ParticipantsPanel';
import codeExecutionService from './services/codeExecutionService';
import {
  initSocket,
  isConnected,
  joinRoom,
  leaveRoom,
  disconnect,
  getSocketId,
  onRoomState,
  onUserJoined,
  onUserLeft,
  onConnect,
  onDisconnect,
  sendTerminalOutput,
  onTerminalOutput,
  onHostChanged,
  onYouWereKicked,
  onSessionEnded,
  onChatToggled,
  toggleChat,
  endSession
} from './services/socket';
import './App.css';

function App() {
  // Room state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Host control state
  const [hostSocketId, setHostSocketId] = useState(null);
  const [chatDisabled, setChatDisabled] = useState(false);

  // Room state from server (for late joiners)
  const [initialRoomState, setInitialRoomState] = useState(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [currentFilename, setCurrentFilename] = useState('main.py');
  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('python');
  const [stdin, setStdin] = useState('');

  // Initialize socket on mount
  useEffect(() => {
    // Initialize socket immediately so event listeners work
    console.log('🚀 Initializing socket on app mount...');
    const socketInstance = initSocket();

    // Room state received (for joining/late joiners)
    const handleRoomState = (data) => {
      console.log('📥 Room state received in App:', data);
      setCurrentRoom({ roomId: data.roomId });
      setRoomUsers(data.users || []);
      setInitialRoomState(data.state);
      setIsConnecting(false);

      // Set host info
      if (data.hostSocketId) {
        setHostSocketId(data.hostSocketId);
      }
      if (data.chatDisabled !== undefined) {
        setChatDisabled(data.chatDisabled);
      }

      // Load terminal history from state
      if (data.state?.terminalHistory) {
        setTerminalHistory(data.state.terminalHistory);
      }
    };

    // User joined
    const handleUserJoined = (data) => {
      console.log('User joined:', data.user.username);
      setRoomUsers(data.users || []);
      if (data.hostSocketId) {
        setHostSocketId(data.hostSocketId);
      }
    };

    // User left
    const handleUserLeft = (data) => {
      console.log('User left:', data.user.username);
      setRoomUsers(data.users || []);
      if (data.hostSocketId) {
        setHostSocketId(data.hostSocketId);
      }
    };

    // Host changed
    const handleHostChanged = (data) => {
      console.log('👑 Host changed to:', data.hostSocketId);
      setHostSocketId(data.hostSocketId);
    };

    // You were kicked
    const handleKicked = (data) => {
      alert(`You were kicked from the room by ${data.by}`);
      setCurrentRoom(null);
      setRoomUsers([]);
      setHostSocketId(null);
      navigate('/');
    };

    // Session ended
    const handleSessionEnded = (data) => {
      alert(`Session ended by host (${data.by})`);
      setCurrentRoom(null);
      setRoomUsers([]);
      setHostSocketId(null);
      navigate('/');
    };

    // Chat toggled
    const handleChatToggled = (data) => {
      console.log(`💬 Chat ${data.disabled ? 'disabled' : 'enabled'} by ${data.by}`);
      setChatDisabled(data.disabled);
    };

    // Socket connection events
    const handleConnect = () => {
      console.log('✅ Socket connected in App');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    };

    // Handle terminal output from other users
    const handleRemoteTerminalOutput = (data) => {
      console.log('📥 Received remote terminal output:', data.entry?.id);
      if (data.entry) {
        setTerminalHistory(prev => {
          // Avoid duplicates
          if (prev.some(e => e.id === data.entry.id)) return prev;
          return [...prev, data.entry].slice(-50);
        });
      }
    };

    // Register listeners
    const unsubRoomState = onRoomState(handleRoomState);
    const unsubUserJoined = onUserJoined(handleUserJoined);
    const unsubUserLeft = onUserLeft(handleUserLeft);
    const unsubConnect = onConnect(handleConnect);
    const unsubDisconnect = onDisconnect(handleDisconnect);
    const unsubTerminalOutput = onTerminalOutput(handleRemoteTerminalOutput);
    const unsubHostChanged = onHostChanged(handleHostChanged);
    const unsubKicked = onYouWereKicked(handleKicked);
    const unsubSessionEnded = onSessionEnded(handleSessionEnded);
    const unsubChatToggled = onChatToggled(handleChatToggled);

    return () => {
      unsubRoomState();
      unsubUserJoined();
      unsubUserLeft();
      unsubConnect();
      unsubDisconnect();
      unsubTerminalOutput();
      unsubHostChanged();
      unsubKicked();
      unsubSessionEnded();
      unsubChatToggled();
    };
  }, []);

  // Auto-join room from URL parameter
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlRoomId && !currentRoom && !isConnecting) {
      console.log('🔗 Auto-joining room from URL:', urlRoomId);
      handleJoinRoom(urlRoomId);
    }
  }, [urlRoomId, currentRoom, isConnecting]);

  // Handle joining a room
  const handleJoinRoom = useCallback((roomId) => {
    setIsConnecting(true);

    // Initialize socket if not connected
    initSocket();

    // Wait a bit for connection then join room
    setTimeout(() => {
      if (isConnected()) {
        joinRoom(roomId);
      } else {
        // Wait for connection
        const checkInterval = setInterval(() => {
          if (isConnected()) {
            clearInterval(checkInterval);
            joinRoom(roomId);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!isConnected()) {
            setIsConnecting(false);
            alert('Failed to connect to server. Please try again.');
          }
        }, 10000);
      }
    }, 500);
  }, []);

  // Handle leaving room
  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    setCurrentRoom(null);
    setRoomUsers([]);
    setInitialRoomState(null);
    setTerminalHistory([]);
    navigate('/');
  }, [navigate]);

  // Handle code changes
  const handleCodeChange = (code, language) => {
    setCurrentCode(code);
    setCurrentLanguage(language);
  };

  // Handle code execution with REAL Piston API
  const handleExecute = async (code, language) => {
    setIsExecuting(true);
    setCurrentCode(code);
    setCurrentLanguage(language);

    const extensions = { python: '.py', javascript: '.js', cpp: '.cpp', java: '.java', c: '.c' };
    const filename = `main${extensions[language] || '.txt'}`;
    setCurrentFilename(filename);

    try {
      const result = await codeExecutionService.executeCode(code, language, stdin);

      const newEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
        filename: filename,
        language: language,
        output: result.output || '',
        error: result.error || '',
        exitCode: result.exitCode ?? (result.success ? 0 : 1),
        executionTime: result.executionTime || 0,
        success: result.success
      };

      setTerminalHistory(prev => [...prev, newEntry].slice(-50));

      // Broadcast terminal output to room
      if (currentRoom) {
        sendTerminalOutput(newEntry);
      }

    } catch (error) {
      const errorEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
        filename: filename,
        language: language,
        output: '',
        error: `Error: ${error.message}`,
        exitCode: 1,
        executionTime: 0,
        success: false
      };

      setTerminalHistory(prev => [...prev, errorEntry].slice(-50));

      if (currentRoom) {
        sendTerminalOutput(errorEntry);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteWithStdin = () => {
    if (currentCode) {
      handleExecute(currentCode, currentLanguage);
    }
  };

  const handleClearTerminal = () => {
    setTerminalHistory([]);
  };

  // Show loading state while joining room (no more old RoomManager flash)
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">
            {isConnecting ? 'Joining workspace...' : 'Connecting...'}
          </h2>
          <p className="text-gray-500">Setting up your collaborative environment</p>
        </div>
      </div>
    );
  }

  // Main app when in a room
  const localUser = roomUsers.find(u => u.socketId === getSocketId());
  const currentUserName = localUser ? localUser.username : 'You';

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-container">
            <Code2 className="logo-icon" />
          </div>
          <h1 className="app-title">CodeBuddy</h1>
          <span className="beta-badge">Beta</span>
        </div>

        <div className="header-right">
          {/* Participants Dropdown */}
          <ParticipantsPanel
            roomUsers={roomUsers}
            hostSocketId={hostSocketId}
            isHost={hostSocketId === getSocketId()}
          />

          {/* Room Info */}
          {/* Room Info */}
          <div className="room-info">
            <span className="room-info-code">{currentRoom.roomId}</span>
            <div className="room-info-users">
              <Users size={14} />
              <span>{roomUsers.length}</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
            {socketConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{socketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          {/* Host Controls - Only visible to host */}
          {hostSocketId === getSocketId() && (
            <>
              <button
                className={`host-control-btn ${chatDisabled ? 'active' : ''}`}
                onClick={() => toggleChat(!chatDisabled)}
                title={chatDisabled ? 'Enable Chat' : 'Disable Chat'}
              >
                {chatDisabled ? <MessageSquareOff size={16} /> : <MessageSquare size={16} />}
              </button>
              <button
                className="host-control-btn end-session"
                onClick={() => {
                  if (confirm('Are you sure you want to end the session for everyone?')) {
                    endSession();
                  }
                }}
                title="End Session"
              >
                <Power size={16} />
              </button>
            </>
          )}

          {/* Leave Room */}
          <button className="leave-room-btn" onClick={handleLeaveRoom}>
            <LogOut size={14} />
            Leave
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="header-icon-btn"
          >
            <Github size={20} />
          </a>
        </div>
      </header>

      {/* Main Workspace */}
      <WorkspaceLayout
        isExecuting={isExecuting}
        terminalHistory={terminalHistory}
        currentFilename={currentFilename}
        stdin={stdin}
        onStdinChange={setStdin}
        onExecuteWithStdin={handleExecuteWithStdin}
        onClearTerminal={handleClearTerminal}
        onCodeChange={handleCodeChange}
        onExecute={handleExecute}
        roomId={currentRoom.roomId}
        roomUsers={roomUsers}
        initialState={initialRoomState}
      />



      {/* Voice Room (Floating) */}
      <VoiceRoom roomId={currentRoom.roomId} userName={currentUserName} />

      {/* Chat Panel (Floating) */}
      <ChatPanel roomId={currentRoom.roomId} disabled={chatDisabled} />
    </div>
  );
}

export default App;
