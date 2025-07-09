import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Logo from './Logo';
import { getImageUrl } from '../utils/imageHelper';

const DrinkManagement = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);
  const [formData, setFormData] = useState({ name: '', image: null });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchDrinks();
  }, [isAuthenticated, navigate]);

  const fetchDrinks = async () => {
    try {
      const response = await axios.get('/api/drinks');
      setDrinks(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Getränke');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (editingDrink) {
        await axios.put(`/api/drinks/${editingDrink.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Getränk erfolgreich aktualisiert');
      } else {
        await axios.post('/api/drinks', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Getränk erfolgreich hinzugefügt');
      }

      setFormData({ name: '', image: null });
      setShowAddForm(false);
      setEditingDrink(null);
      fetchDrinks();
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError(err.response?.data?.message || 'Fehler beim Speichern');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (drink) => {
    setEditingDrink(drink);
    setFormData({ name: drink.name, image: null });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchtest du dieses Getränk wirklich löschen?')) {
      return;
    }

    try {
      await axios.delete(`/api/drinks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Getränk erfolgreich gelöscht');
      fetchDrinks();
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/admin/login');
      } else {
        setError('Fehler beim Löschen');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', image: null });
    setShowAddForm(false);
    setEditingDrink(null);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
        <div className="container">
          <div className="spinner"></div>
        </div>
    );
  }

  return (
      <div className="container">
        <div className="header">
          <div className="admin-header-content">
            <div className="admin-header-top">
              <Logo />
              <h1>Getränke verwalten</h1>
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

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h2 className="card-title">Getränke-Liste</h2>
            <div className="admin-actions">
              <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn btn-primary"
              >
                {showAddForm ? 'Abbrechen' : 'Neues Getränk hinzufügen'}
              </button>
            </div>
          </div>

          {showAddForm && (
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>{editingDrink ? 'Getränk bearbeiten' : 'Neues Getränk hinzufügen'}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name des Getränks *</label>
                    <input
                        type="text"
                        id="name"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="image">Bild {editingDrink ? '(optional - leer lassen für aktuelles Bild)' : ''}</label>
                    <input
                        type="file"
                        id="image"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                        disabled={submitting}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={submitting}
                    >
                      {submitting ? 'Wird gespeichert...' : editingDrink ? 'Aktualisieren' : 'Hinzufügen'}
                    </button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="btn btn-secondary"
                        disabled={submitting}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
          )}

          {drinks.length === 0 ? (
              <div className="text-center">
                <p>Noch keine Getränke vorhanden.</p>
              </div>
          ) : (
              <div className="drinks-grid">
                {drinks.map(drink => (
                    <div key={drink.id} className="drink-card admin-card">
                      {drink.image_url && (
                          <img
                              src={getImageUrl(drink.image_url)}
                              alt={drink.name}
                              className="drink-image"
                          />
                      )}
                      <div className="drink-info">
                        <h3 className="drink-name">{drink.name}</h3>
                        <div className="d-flex gap-2 mt-2">
                          <button
                              onClick={() => handleEdit(drink)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                          >
                            Bearbeiten
                          </button>
                          <button
                              onClick={() => handleDelete(drink.id)}
                              className="btn btn-danger"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                          >
                            Löschen
                          </button>
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

export default DrinkManagement;
