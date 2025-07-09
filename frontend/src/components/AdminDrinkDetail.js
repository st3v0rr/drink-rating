import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Logo from './Logo';

const AdminDrinkDetail = () => {
  const { id } = useParams();
  const [drink, setDrink] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingRating, setDeletingRating] = useState(null);
  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();

  const fetchDrinkDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/drinks/${id}`);
      setDrink(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError('Getränk nicht gefunden');
      }
    } finally {
      setLoading(false);
    }
  }, [id, logout, navigate]);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await axios.get(`/api/ratings/${id}`);
      setRatings(response.data);
    } catch (err) {
      console.error('Fehler beim Laden der Bewertungen:', err);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchDrinkDetails();
    fetchRatings();
  }, [isAuthenticated, navigate, fetchDrinkDetails, fetchRatings]);

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

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Möchtest du diese Bewertung wirklich löschen?')) {
      return;
    }

    setDeletingRating(ratingId);
    setError(null);
    setSuccess(null);

    try {
      await axios.delete(`/api/ratings/${ratingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Bewertung erfolgreich gelöscht');
      fetchRatings(); // Bewertungen neu laden
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError('Fehler beim Löschen der Bewertung');
      }
    } finally {
      setDeletingRating(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      distribution[rating.rating]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();
  const totalRatings = ratings.length;

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
        <Link to="/admin/dashboard" className="btn btn-secondary mb-3">Zurück zum Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="admin-header-content">
          <div className="admin-header-top">
            <Logo />
            <h1>Admin - Getränke Details</h1>
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

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {/* Getränke-Information */}
      <div className="card">
        <Link to="/admin/dashboard" className="btn btn-secondary mb-3">← Zurück zum Dashboard</Link>
        <div className="card-header">
          <h2 className="card-title">{drink.name}</h2>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {drink.image_url && (
            <div style={{ flex: '0 0 auto' }}>
              <img
                src={drink.image_url}
                alt={drink.name}
                style={{
                  maxWidth: '300px',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
          )}

          <div style={{ flex: '1' }}>
            <div className="drink-stats">
              <div className="mb-3">
                <div className="rating-stars" style={{ fontSize: '1.5rem' }}>
                  {renderStars(parseFloat(getAverageRating()))}
                </div>
                <div style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>
                  <strong>{getAverageRating()} von 5</strong>
                </div>
                <p className="text-muted">
                  basierend auf {totalRatings} Bewertung{totalRatings !== 1 ? 'en' : ''}
                </p>
              </div>

              {/* Bewertungsverteilung */}
              {totalRatings > 0 && (
                <div className="rating-distribution">
                  <div style={{ fontSize: '1.2rem', margin: '0.5rem 0', marginBottom: '20px' }}>
                    <strong>Bewertungsverteilung</strong>
                  </div>
                  {[5, 4, 3, 2, 1].map(stars => (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ width: '20px' }}>{stars}★</span>
                      <div style={{
                        flex: 1,
                        height: '20px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '10px',
                        marginLeft: '10px',
                        marginRight: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${totalRatings > 0 ? (distribution[stars] / totalRatings) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: '#007bff',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <span style={{ width: '30px', textAlign: 'right' }}>{distribution[stars]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Einzelne Bewertungen */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Alle Bewertungen ({totalRatings})</h3>
        </div>

        {totalRatings === 0 ? (
          <div className="text-center">
            <p>Noch keine Bewertungen vorhanden.</p>
          </div>
        ) : (
          <div>
            {ratings.map((rating, index) => (
              <div key={rating.id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div className="rating-stars">
                  {renderStars(rating.rating)}
                </div>
                <small className="text-muted">
                  {formatDate(rating.created_at)}
                </small>
                
                {rating.comment && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.75rem',
                    borderRadius: '5px',
                    marginTop: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <p style={{ margin: 0 }}>{rating.comment}</p>
                  </div>
                )}

                <div className="d-flex gap-2 mt-2">
                  <button
                    onClick={() => handleDeleteRating(rating.id)}
                    disabled={deletingRating === rating.id}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    {deletingRating === rating.id ? 'Wird gelöscht...' : 'Löschen'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDrinkDetail;
