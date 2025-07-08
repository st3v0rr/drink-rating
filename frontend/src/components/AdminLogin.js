import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Logo from './Logo';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/login', {
        username,
        password
      });

      login(response.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="mobile-container">
        <div className="header">
          <div className="header-with-logo">
            <Logo />
            <div className="header-content">
              <h1>Admin Login</h1>
              <p>Anmeldung für Administratoren</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <Link to="/" className="btn btn-secondary mb-3">← Zurück zur Startseite</Link>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Benutzername</label>
              <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Passwort</label>
              <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
              />
            </div>

            {error && (
                <div className="message error">{error}</div>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
            >
              {loading ? 'Wird eingeloggt...' : 'Anmelden'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <small className="text-muted">
              Standard Login: admin / admin123
            </small>
          </div>
        </div>
      </div>
  );
};

export default AdminLogin;
