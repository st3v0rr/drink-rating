const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin-Konfiguration über Umgebungsvariablen
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DB_PATH = process.env.DB_PATH || './drink_rating.db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer für Datei-Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 // 1MB Limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Nur Bilder sind erlaubt'));
    }
  }
});

// Datenbank initialisieren
const db = new sqlite3.Database(DB_PATH);

// Tabellen erstellen
db.serialize(() => {
  // Admin Benutzer Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Getränke Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS drinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bewertungen Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drink_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT CHECK (length(comment) <= 200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drink_id) REFERENCES drinks (id)
  )`);

  // Standard Admin erstellen falls nicht vorhanden
  db.get("SELECT * FROM admins WHERE username = ?", [ADMIN_USERNAME], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      db.run("INSERT INTO admins (username, password) VALUES (?, ?)", [ADMIN_USERNAME, hashedPassword]);
      console.log(`Standard Admin erstellt: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
    }
  });
});

// Middleware für Admin-Authentifizierung
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Kein Token gefunden' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token ungültig' });
  }
};

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login erfolgreich' });
  });
});

// Getränke Routes
app.get('/api/drinks', (req, res) => {
  db.all("SELECT * FROM drinks ORDER BY created_at DESC", (err, drinks) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }
    res.json(drinks);
  });
});

app.get('/api/drinks/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM drinks WHERE id = ?", [id], (err, drink) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }
    if (!drink) {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }
    res.json(drink);
  });
});

app.post('/api/drinks', authenticateAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Datei ist zu groß. Maximum: 1MB' });
      }
      return res.status(400).json({ message: err.message });
    }

    const { name } = req.body;
    const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : null;

    db.run("INSERT INTO drinks (name, image_url) VALUES (?, ?)", [name, imageUrl], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Datenbankfehler' });
      }
      res.json({ id: this.lastID, name, image_url: imageUrl, message: 'Getränk erstellt' });
    });
  });
});

app.put('/api/drinks/:id', authenticateAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Datei ist zu groß. Maximum: 1MB' });
      }
      return res.status(400).json({ message: err.message });
    }

    const { id } = req.params;
    const { name } = req.body;

    // Erst das aktuelle Getränk holen
    db.get("SELECT * FROM drinks WHERE id = ?", [id], (err, drink) => {
      if (err) {
        return res.status(500).json({ message: 'Datenbankfehler' });
      }
      if (!drink) {
        return res.status(404).json({ message: 'Getränk nicht gefunden' });
      }

      const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : drink.image_url;

      db.run("UPDATE drinks SET name = ?, image_url = ? WHERE id = ?", [name, imageUrl, id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Altes Bild löschen wenn neues hochgeladen wurde
        if (req.file && drink.image_url) {
          const oldImagePath = path.join(__dirname, drink.image_url.replace('/api', ''));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        res.json({ id, name, image_url: imageUrl, message: 'Getränk aktualisiert' });
      });
    });
  });
});

app.delete('/api/drinks/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;

  // Erst das Getränk holen um das Bild zu löschen
  db.get("SELECT * FROM drinks WHERE id = ?", [id], (err, drink) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }
    if (!drink) {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }

    // Getränk und Bewertungen löschen
    db.run("DELETE FROM ratings WHERE drink_id = ?", [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Datenbankfehler' });
      }

      db.run("DELETE FROM drinks WHERE id = ?", [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Bild löschen
        if (drink.image_url) {
          const imagePath = path.join(__dirname, drink.image_url.replace('/api', ''));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }

        res.json({ message: 'Getränk gelöscht' });
      });
    });
  });
});

// Bewertungen Routes
app.post('/api/ratings', (req, res) => {
  const { drink_id, rating, comment } = req.body;

  if (!drink_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Ungültige Bewertungsdaten' });
  }

  // Kommentar-Längen-Validierung
  if (comment && comment.length > 200) {
    return res.status(400).json({ message: 'Kommentar darf maximal 200 Zeichen lang sein' });
  }

  db.run("INSERT INTO ratings (drink_id, rating, comment) VALUES (?, ?, ?)",
      [drink_id, rating, comment], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Datenbankfehler' });
        }
        res.json({ id: this.lastID, message: 'Bewertung gespeichert' });
      });
});

app.get('/api/ratings/:drinkId', (req, res) => {
  const { drinkId } = req.params;

  db.all("SELECT * FROM ratings WHERE drink_id = ? ORDER BY created_at DESC", [drinkId], (err, ratings) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }
    res.json(ratings);
  });
});

// Dashboard Route
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  const query = `
    SELECT 
      d.id,
      d.name,
      d.image_url,
      COUNT(r.id) as rating_count,
      ROUND(AVG(r.rating * 1.0), 2) as average_rating
    FROM drinks d
    LEFT JOIN ratings r ON d.id = r.drink_id
    GROUP BY d.id, d.name, d.image_url
    ORDER BY d.created_at DESC
  `;

  db.all(query, (err, drinks) => {
    if (err) {
      return res.status(500).json({ message: 'Datenbankfehler' });
    }

    // Gesamtstatistiken
    db.get("SELECT COUNT(*) as total_drinks FROM drinks", (err, drinkCount) => {
      if (err) {
        return res.status(500).json({ message: 'Datenbankfehler' });
      }

      db.get("SELECT COUNT(*) as total_ratings FROM ratings", (err, ratingCount) => {
        if (err) {
          return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({
          drinks,
          stats: {
            total_drinks: drinkCount.total_drinks,
            total_ratings: ratingCount.total_ratings
          }
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// Catch-all handler: Alle anderen Routen an die React App weiterleiten
// WICHTIG: Diese Route muss nach allen API-Routen stehen!
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
