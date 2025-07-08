import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Logo from './Logo';

const Home = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrinks();
  }, []);

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

  if (loading) {
    return (
        <div className="mobile-container">
          <div className="spinner"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="mobile-container">
          <div className="message error">{error}</div>
        </div>
    );
  }

  return (
      <div className="mobile-container">
        <div className="header">
          <div className="header-with-logo">
            <Logo />
            <div className="header-content">
              <h1>🍹 Getränke Bewertung</h1>
              <p>Wähle ein Getränk aus und bewerte es!</p>
            </div>
          </div>
        </div>

        <div className="drinks-grid">
          {drinks.length === 0 ? (
              <div className="text-center">
                <h3>Keine Getränke verfügbar</h3>
                <p>Momentan sind keine Getränke zur Bewertung verfügbar.</p>
              </div>
          ) : (
              drinks.map(drink => (
                  <Link key={drink.id} to={`/drink/${drink.id}`} className="drink-card">
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
                        <span>Jetzt bewerten →</span>
                      </div>
                    </div>
                  </Link>
              ))
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/admin/login" className="btn btn-secondary">
            Admin Login
          </Link>
        </div>
      </div>
  );
};

export default Home;
