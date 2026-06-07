import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import MyInterests from './pages/MyInterests';
import Requests from './pages/Requests';
import Chat from './pages/Chat';
import RoseBoutique from './pages/RoseBoutique';
import FloatingRose from './components/FloatingRose';
import FloralOverlay from './components/FloralOverlay';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import CallOverlay from './components/CallOverlay';

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><><FloatingRose /><Home /></></ProtectedRoute>} />
            <Route path="/interests" element={<ProtectedRoute><><FloatingRose /><MyInterests /></></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><><FloatingRose /><Requests /></></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><><FloatingRose /><Chat /></></ProtectedRoute>} />
            <Route path="/store" element={<ProtectedRoute><RoseBoutique /></ProtectedRoute>} />
          </Routes>
        </div>
        </CallProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
