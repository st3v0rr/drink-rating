// Hilfsfunktion für Image-URLs
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // Wenn die URL bereits vollständig ist (startet mit http), gebe sie direkt zurück
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Ansonsten verwende die Proxy-Konfiguration vom Frontend
  // Das Frontend läuft auf Port 3000 und proxied zu Port 3001
  return imageUrl;
};
