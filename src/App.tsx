import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ShopPage from '@/pages/ShopPage';
import ForumPage from '@/pages/ForumPage';
import MessagesPage from '@/pages/MessagesPage';
import WorldPage from '@/pages/WorldPage';
import MapPage from '@/pages/MapPage';
import BachPhapPage from '@/pages/BachPhapPage';
import WantedPage from '@/pages/WantedPage';
import KimBangPage from '@/pages/KimBangPage';
import BachQuyAmPage from '@/pages/BachQuyAmPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/world" element={<WorldPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/bach-phap" element={<BachPhapPage />} />
              <Route path="/wanted" element={<WantedPage />} />
              <Route path="/kim-bang" element={<KimBangPage />} />
              <Route path="/bach-quy-am" element={<BachQuyAmPage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
