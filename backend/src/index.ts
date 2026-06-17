import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDb } from './db';

dotenv.config();

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import interactionRoutes from './routes/interactions';
import verificationRoutes from './routes/verification';

import { createServer } from 'http';
import { Server } from 'socket.io';
import chatRoutes from './routes/chat';
import rosesRoutes from './routes/roses';
import chatbotRoutes from './routes/chatbot';


const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/roses', rosesRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/chatbot', chatbotRoutes);


app.get('/', (req, res) => {
  res.send('Varudu API is running!');
});

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their own personal room to receive global notifications
  socket.on('register_user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} registered for global notifications`);
  });

  socket.on('join_room', (matchId) => {
    socket.join(matchId);
    console.log(`User joined room: ${matchId}`);
  });

  socket.on('send_message', async (data) => {
    // data should have { matchId, senderId, receiverId, message }
    const { matchId, senderId, receiverId, message } = data;

    // Broadcast to the chat room
    io.to(matchId).emit('receive_message', data);

    // Also emit a notification to the receiver's global room
    io.to(receiverId).emit('new_notification', data);

    // Save to database
    try {
      const { getDb } = require('./db');
      const db = getDb();
      const id = require('crypto').randomUUID();
      await db.run(
        'INSERT INTO chats (id, sender_id, receiver_id, message) VALUES ($1, $2, $3, $4)',
        [id, senderId, receiverId, message]
      );
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // --- WebRTC Signaling Events ---
  socket.on('call_user', (data) => {
    const { userToCall, signalData, from, name, photo } = data;
    // userToCall is the receiverId. We emit to their personal room.
    io.to(userToCall).emit('incoming_call', { signal: signalData, from, name, photo });
  });

  socket.on('answer_call', (data) => {
    const { to, signal } = data;
    io.to(to).emit('call_accepted', { signal });
  });

  socket.on('ice_candidate', (data) => {
    const { to, candidate } = data;
    io.to(to).emit('ice_candidate', { candidate });
  });

  socket.on('end_call', (data) => {
    const { to } = data;
    io.to(to).emit('call_ended');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

import { startCronJobs } from './cron';

// Initialize DB then start server
initDb().then(() => {
  startCronJobs();
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error("Failed to initialize database", err);
});
