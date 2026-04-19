/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthChange } from './lib/auth';
import { syncUser } from './lib/firestore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import AIChat from './pages/AIChat';
import ProtectedRoute from './components/ProtectedRoute';

import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log('Auth changed:', user?.email);
      setUser(user);
      if (user) {
        // Automatically sync every user profile upon auth detection
        syncUser(user).catch(console.error);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-primary selection:text-bg transition-colors duration-300">
          <Navbar user={user} />
          
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={<Login user={user} />} />
            <Route path="/post/:id" element={<PostDetail user={user} />} />
            <Route path="/ai-assistant" element={<AIChat user={user} />} />
            
            {/* Protected Routes (Logged In Users) */}
            <Route element={<ProtectedRoute user={user} loading={loading} />}>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/create" element={<CreatePost user={user} />} />
              <Route path="/edit/:id" element={<CreatePost user={user} />} />
            </Route>
          </Routes>

          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}
