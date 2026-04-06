import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB } from './db.js';
import { setupAuth } from './auth.js';
import { renderRSC } from './rsc-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

await connectDB();

const passport = setupAuth();

// ── Middleware ──
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ── Sessions stored in MongoDB ──
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI!,
    dbName: 'copycutsave-dev',
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    httpOnly: true,
    sameSite: 'lax',
    secure: false,     // 👈 false for localhost (true in production with HTTPS)
  },
}));

// ── Passport ──
app.use(passport.initialize());
app.use(passport.session());

// ── Auth Routes ──

// 1. Start GitHub login
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
);

// 2. GitHub redirects back here
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:3001?error=auth_failed' }),
  (_req, res) => {
    res.redirect('http://localhost:3001');  // success → back to app
  },
);

// 3. Get current session
app.get('/auth/session', (req, res) => {
  console.log('session id:', req.sessionID);
  console.log('session data:', req.session);
  console.log('req.user:', req.user);
  console.log('passport:', (req.session as any).passport);

  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// 4. Logout
app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

// ── Static + RSC ──
app.use(express.static(path.join(__dirname, '../../public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/rsc', (_req, res) => renderRSC(res));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../../public/index.html')));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(__dirname, '../../public/index.html')));

app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`));
