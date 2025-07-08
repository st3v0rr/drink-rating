import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const DrinkRating = () => {
  const { id } = useParams();
  const [drink, setDrink] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    fetchDrink();
    fetchRatings();
  }, [fetchDrink, fetchRatings]);

  const fetchDrink = useCallback(async () => {
    try {
      const response = await axios.get(`/api/drinks/${id}`);
      setDrink(response.data);
    } catch (err) {
      setError('Getränk nicht gefunden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await axios.get(`/api/ratings/${id}`);
      setRatings(response.data);
    } catch (err) {
      console.error('Fehler beim Laden der Bewertungen:', err);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Bitte wähle eine Bewertung aus');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await axios.post('/api/ratings', {
        drink_id: id,
        rating,
        comment
      });

      setSubmitted(true);
      fetchRatings(); // Bewertungen neu laden
    } catch (err) {
      setError('Fehler beim Speichern der Bewertung');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, isInteractive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
          <span
              key={i}
              className={`star ${i <= currentRating ? 'active' : ''}`}
              onClick={isInteractive ? () => setRating(i) : undefined}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
          >
          ★
        </span>
      );
    }
    return stars;
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
        <div className="mobile-container">
          <div className="spinner"></div>
        </div>
    );
  }

  if (error && !drink) {
    return (
        <div className="mobile-container">
          <div className="message error">{error}</div>
          <Link to="/" className="btn btn-primary">Zurück zur Übersicht</Link>
        </div>
    );
  }

  if (submitted) {
    return (
        <div className="mobile-container">
          <div className="rating-container">
            <h2>Vielen Dank! 🎉</h2>
            <p>Deine Bewertung wurde erfolgreich gespeichert.</p>
            <div className="mt-3">
              <Link to="/" className="btn btn-primary">Weitere Getränke bewerten</Link>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="mobile-container">
        {/* Zurück Button ganz oben */}
        <div className="mb-3">
          <Link to="/" className="btn btn-secondary">← Zurück</Link>
        </div>

        {/* Bewertungsformular oben */}
        <div className="card">
          <div className="text-center mb-3">
            {drink.image_url && (
                <img
                    src={drink.image_url}
                    alt={drink.name}
                    className="drink-image"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f8f9fa' }}
                />
            )}
            <h1 className="drink-name mt-3">{drink.name}</h1>
          </div>

          <h3>Bewerte dieses Getränk</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bewertung *</label>
              <div className="rating-stars">
                {renderStars(rating, true)}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Kommentar (optional)</label>
              <textarea
                  id="comment"
                  className="form-control"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Was denkst du über dieses Getränk?"
                  rows="4"
              />
            </div>

            {error && (
                <div className="message error">{error}</div>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || rating === 0}
                style={{ width: '100%' }}
            >
              {submitting ? 'Wird gespeichert...' : 'Bewertung abgeben'}
            </button>
          </form>
        </div>

        {/* Voting-Ergebnisse unten - nur Übersicht */}
        {ratings.length > 0 && (
            <div className="card">
              <h3>Bewertungsübersicht</h3>
              <div className="text-center mt-2">
                <div className="rating-stars">
                  {renderStars(Math.round(getAverageRating()))}
                </div>
                <div className="stat-number" style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
                  {getAverageRating()} von 5
                </div>
                <p className="text-muted">
                  basierend auf {ratings.length} Bewertung{ratings.length !== 1 ? 'en' : ''}
                </p>
              </div>
            </div>
        )}
      </div>
  );
};

export default DrinkRating;
