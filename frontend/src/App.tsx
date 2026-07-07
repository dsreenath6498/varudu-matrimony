import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Discover from './pages/Discover';
import MyInterests from './pages/MyInterests';
import Chat from './pages/Chat';
import RoseBoutique from './pages/RoseBoutique';
import Profile from './pages/Profile';
import FloatingRose from './components/FloatingRose';
import FloralOverlay from './components/FloralOverlay';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import CallOverlay from './components/CallOverlay';
import ChatbotWidget from './components/ChatbotWidget';


// A simple protected route wrapper
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <SocketProvider>
        <CallProvider>
          <div className="font-sans antialiased min-h-screen relative bg-[var(--bg-base)] text-[var(--text-primary)]">
            <FloralOverlay />
            <CallOverlay />
            <ChatbotWidget />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/discover" element={<ProtectedRoute><><FloatingRose /><Discover /></></ProtectedRoute>} />
              <Route path="/interests" element={<ProtectedRoute><><FloatingRose /><MyInterests /></></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/store" element={<ProtectedRoute><RoseBoutique /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </div>
        </CallProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
