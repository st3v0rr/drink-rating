import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import DrinkRating from './components/DrinkRating';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDrinkDetail from './components/AdminDrinkDetail';
import DrinkManagement from './components/DrinkManagement';
import './App.css';

function App() {
  return (
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/drink/:id" element={<DrinkRating />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/drinks" element={<DrinkManagement />} />
              <Route path="/admin/drink/:id" element={<AdminDrinkDetail />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
  );
}

export default App;
