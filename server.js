require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MongoDB Connection (non-blocking)
let mongoConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledgehub')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    mongoConnected = true;
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will run without MongoDB (APIs will not work)');
  });

// Session configuration (fallback to memory if MongoDB fails)
const sessionStore = mongoConnected ? MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledgehub',
  collectionName: 'sessions'
}) : undefined;

app.use(session({
  secret: process.env.SESSION_SECRET || 'knowledgehub-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const postRoutes = require('./routes/posts');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);

// Serve static files for all pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pages/blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/blog.html'));
});

app.get('/pages/services.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/services.html'));
});

app.get('/pages/gallery.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/gallery.html'));
});

app.get('/pages/faq.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/faq.html'));
});

app.get('/pages/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/dashboard.html'));
});

app.get('/info/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'info/about.html'));
});

app.get('/info/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'info/contact.html'));
});

app.get('/auth/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth/login.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
