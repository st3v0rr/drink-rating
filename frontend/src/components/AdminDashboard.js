import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Logo from './Logo';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError('Fehler beim Laden der Dashboard-Daten');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="star active">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="star active">☆</span>);
      } else {
        stars.push(<span key={i} className="star">☆</span>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
        <div className="container">
          <div className="spinner"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="container">
          <div className="message error">{error}</div>
        </div>
    );
  }

  return (
      <div className="container">
        <div className="header">
          <div className="admin-header-content">
            <div className="admin-header-top">
              <Logo />
              <h1>Admin Dashboard</h1>
            </div>
            <div className="nav">
              <ul className="nav-links">
                <li><Link to="/admin/dashboard">Dashboard</Link></li>
                <li><Link to="/admin/drinks">Getränke verwalten</Link></li>
                <li><button onClick={logout} className="btn-logout">Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{dashboardData?.stats?.total_drinks || 0}</div>
            <div className="stat-label">Getränke</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{dashboardData?.stats?.total_ratings || 0}</div>
            <div className="stat-label">Bewertungen</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {dashboardData?.drinks?.length ?
                  (dashboardData.drinks.reduce((acc, drink) => acc + (drink.average_rating || 0), 0) / dashboardData.drinks.length).toFixed(1)
                  : '0.0'
              }
            </div>
            <div className="stat-label">Durchschnittsbewertung</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Getränke-Übersicht</h2>
          </div>

          {dashboardData?.drinks?.length === 0 ? (
              <div className="text-center">
                <p>Noch keine Getränke vorhanden.</p>
                <Link to="/admin/drinks" className="btn btn-primary">Erstes Getränk hinzufügen</Link>
              </div>
          ) : (
              <div className="drinks-grid">
                {dashboardData?.drinks?.map(drink => (
                    <div key={drink.id} className="drink-card">
                      {drink.image_url && (
                          <img
                              src={drink.image_url}
                              alt={drink.name}
                              className="drink-image"
                          />
                      )}
                      <div className="drink-info">
                        <h3 className="drink-name">{drink.name}</h3>
                        <div className="drink-stats">
                          <div>
                            <div className="rating-stars">
                              {drink.average_rating ? renderStars(drink.average_rating) : renderStars(0)}
                            </div>
                            <small>
                              {drink.average_rating ? drink.average_rating : '0.0'} von 5
                              ({drink.rating_count} Bewertung{drink.rating_count !== 1 ? 'en' : ''})
                            </small>
                          </div>
                          <Link to={`/admin/drink/${drink.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                            Ansehen
                          </Link>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
};

export default AdminDashboard;
