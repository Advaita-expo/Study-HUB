require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection Pool (without database initially)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456789',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS status_focus`);
    
    // Now switch to the database
    await connection.query(`USE status_focus`);

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,
        duration INT NOT NULL,
        focus_level FLOAT DEFAULT 0,
        break_duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_focus_time INT DEFAULT 0,
        total_break_time INT DEFAULT 0,
        sessions_completed INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date (date)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS subject_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,
        total_time INT DEFAULT 0,
        sessions_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_subject (subject)
      )
    `);

    connection.release();
    console.log('✓ Database initialized successfully');
    
    // Update pool to use the database
    pool.releaseConnection = pool.releaseConnection;
  } catch (error) {
    console.error('✗ Database initialization error:', error.message);
    process.exit(1);
  }
}

// Routes

// Helper function to execute queries with database context
async function executeQuery(query, params = []) {
  const connection = await pool.getConnection();
  try {
    await connection.query('USE status_focus');
    const [result] = await connection.query(query, params);
    return result;
  } finally {
    connection.release();
  }
}

// Save study session
app.post('/api/sessions', async (req, res) => {
  try {
    const { subject, duration, focus_level, break_duration } = req.body;

    await executeQuery(
      'INSERT INTO study_sessions (subject, duration, focus_level, break_duration) VALUES (?, ?, ?, ?)',
      [subject, duration, focus_level || 0, break_duration || 0]
    );

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    await executeQuery(
      `INSERT INTO daily_stats (date, total_focus_time, sessions_completed) 
       VALUES (?, ?, 1) 
       ON DUPLICATE KEY UPDATE 
       total_focus_time = total_focus_time + ?,
       sessions_completed = sessions_completed + 1`,
      [today, duration, duration]
    );

    // Update subject stats
    await executeQuery(
      `INSERT INTO subject_stats (subject, total_time, sessions_count) 
       VALUES (?, ?, 1) 
       ON DUPLICATE KEY UPDATE 
       total_time = total_time + ?,
       sessions_count = sessions_count + 1`,
      [subject, duration, duration]
    );

    res.json({ success: true, message: 'Session saved' });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subject statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await executeQuery('SELECT * FROM subject_stats');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily statistics
app.get('/api/daily-stats', async (req, res) => {
  try {
    const stats = await executeQuery(
      'SELECT * FROM daily_stats WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ORDER BY date DESC'
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await executeQuery(
      'SELECT * FROM study_sessions ORDER BY created_at DESC LIMIT 100'
    );
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export data as CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const sessions = await executeQuery(
      'SELECT * FROM study_sessions ORDER BY created_at DESC'
    );

    // Create CSV content
    let csv = 'Date,Subject,Duration (mins),Focus Level,Break Time (mins)\n';
    sessions.forEach((session) => {
      const date = new Date(session.created_at).toLocaleString();
      csv += `"${date}","${session.subject}",${session.duration},${session.focus_level},${session.break_duration}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="study-data.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weekly summary
app.get('/api/weekly-summary', async (req, res) => {
  try {
    const summary = await executeQuery(`
      SELECT 
        subject,
        COUNT(*) as sessions,
        SUM(duration) as total_duration,
        AVG(focus_level) as avg_focus,
        DATE(created_at) as date
      FROM study_sessions
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY subject, DATE(created_at)
      ORDER BY date DESC, subject
    `);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Socket.IO Video Call Handling
io.on('connection', (socket) => {
  console.log('📱 New user connected:', socket.id);

  // Join a study video room
  socket.on('join-video-room', (roomId, userName) => {
    socket.join(roomId);
    socket.data.userName = userName;
    socket.data.roomId = roomId;
    console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName: userName
    });
  });

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    console.log(`Offer from ${data.from} to ${data.to}`);
    socket.to(data.to).emit('offer', {
      offer: data.offer,
      from: data.from,
      fromName: data.fromName
    });
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    console.log(`Answer from ${data.from} to ${data.to}`);
    socket.to(data.to).emit('answer', {
      answer: data.answer,
      from: data.from
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: data.from
    });
  });

  // Get users in room
  socket.on('get-users', (roomId, callback) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const users = [];
    if (room) {
      for (let socketId of room) {
        if (socketId !== socket.id) {
          const otherSocket = io.sockets.sockets.get(socketId);
          users.push({
            userId: socketId,
            userName: otherSocket?.data?.userName || 'User ' + socketId.substring(0, 8)
          });
        }
      }
    }
    callback(users);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    socket.broadcast.emit('user-disconnected', {
      userId: socket.id
    });
  });

  // Handle call ended
  socket.on('call-ended', (data) => {
    socket.to(data.to).emit('call-ended', {
      from: data.from
    });
  });
});

startServer();

module.exports = app;
