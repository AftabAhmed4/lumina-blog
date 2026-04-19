import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import cors from 'cors';
import fetch from 'node-fetch';

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
  
  // Middleware
  expressApp.use(cors());
  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const PORT = parseInt(process.env.PORT || '3000');

  // --- API Routes ---
  
  // Health check
  expressApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Configure Multer for memory storage
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // Ensure local uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve local uploads
  expressApp.use('/uploads', express.static(uploadsDir));

  // API Route for file upload (Proxy via REST API using User's Token with Local Fallback)
  expressApp.post('/api/upload', (req, res, next) => {
    console.log('Upload request received:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
    next();
  }, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        console.warn('Upload failed: No file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Processing file:', {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const idToken = req.body.idToken;
      const folder = req.body.folder || 'misc';
      const fileName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = `${folder}/${fileName}`;

      try {
        // Try Firebase Storage first using Admin SDK
        if (firebaseConfig.storageBucket) {
          console.log('Attempting Firebase Admin upload...');
          // Remove gs:// if present
          const bucketName = firebaseConfig.storageBucket.replace('gs://', '');
          const bucket = admin.storage().bucket(bucketName);
          const file = bucket.file(fullPath);

          await file.save(req.file.buffer, {
            metadata: {
              contentType: req.file.mimetype,
            },
            public: true // Make it public so we can use the direct link
          });

          // The standard Firebase Storage direct URL
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${fullPath}`;
          console.log('Successfully uploaded to Firebase via Admin:', publicUrl);
          return res.json({ url: publicUrl });
        }
      } catch (fbError: any) {
        console.error('Firebase Admin Upload Failed:', fbError.message);
      }

      // Local Storage Fallback
      const localFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(localFilePath, req.file.buffer);
      
      const localUrl = `/uploads/${fileName}`;
      console.log('File saved locally:', localUrl);
      res.json({ url: localUrl });

    } catch (error: any) {
      console.error('Final Upload Error Handler:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error during upload'
      });
    }
  });

  // Admin: Delete User account from Auth
  expressApp.post('/api/admin/delete-user', async (req, res) => {
    try {
      const { targetUid, idToken } = req.body;
      const ADMIN_EMAIL = 'aftabahmedcbspakistan@gmail.com';

      if (!idToken) return res.status(401).json({ error: 'Auth token required' });

      // Verify the requester is the admin
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized: Admin access only' });
      }

      // Delete the user from Firebase Auth
      await admin.auth().deleteUser(targetUid);
      
      console.log(`Admin deleted user account: ${targetUid}`);
      res.json({ success: true, message: 'User deleted successfully' });
      
    } catch (error: any) {
      console.error('Admin Delete Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Global Error Handler for API routes
  expressApp.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('Global API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
