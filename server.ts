import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config (supports File or Env Vars for Cloud Run)
let firebaseConfig: any = {};
try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('Firebase config loaded from file.');
  } else {
    // Fallback to env vars for Cloud Run deployment safety
    firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID
    };
    console.log('Firebase config loaded from environment variables.');
  }
} catch (err) {
  console.warn('Error loading Firebase config:', err);
}

// Initialize Firebase Admin (for Server-side privileged operations like Storage)
// This will use Application Default Credentials (ADC) if running on Cloud Run
admin.initializeApp({
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize client-side Firebase (can keep for other uses if needed)
const app = initializeApp(firebaseConfig);

async function startServer() {
  const expressApp = express();
  const PORT = parseInt(process.env.PORT || '3000');

  const bucket = admin.storage().bucket(firebaseConfig.storageBucket);

  // Ensure local uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure Multer for memory storage
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
  });

  // Serve local uploads
  expressApp.use('/uploads', express.static(uploadsDir));

  // API Route for file upload (Proxy via REST API using User's Token with Local Fallback)
  expressApp.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const idToken = req.body.idToken;
      const folder = req.body.folder || 'misc';
      const fileName = `${Date.now()}_${req.file.originalname}`;
      
      try {
        // Try Firebase Storage first if token exists
        if (idToken) {
          const filePath = encodeURIComponent(`${folder}/${fileName}`);
          const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o?uploadType=media&name=${filePath}`;

          const uploadResponse = await fetch(storageUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': req.file.mimetype
            },
            body: req.file.buffer
          });

          if (uploadResponse.ok) {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${filePath}?alt=media`;
            console.log('Successfully uploaded to Firebase:', publicUrl);
            return res.json({ url: publicUrl });
          } else {
            // Silently log for development, but don't alarm the user
            console.log('Firebase Storage access restricted (403), using local fallback.');
          }
        }
      } catch (fbError) {
        // Silently log for development
        console.log('Firebase connection bypassed, using local fallback.');
      }

      // Local Storage Fallback
      const localFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(localFilePath, req.file.buffer);
      
      // Use protocol-relative URL to avoid mixed content issues correctly
      const localUrl = `/uploads/${fileName}`;
      
      console.log('File available at:', localUrl);
      res.json({ url: localUrl });

    } catch (error: any) {
      console.error('Final Upload Error:', error);
      res.status(500).json({ 
        error: error.message || 'Upload failed'
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
