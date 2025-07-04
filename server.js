require("dotenv").config();
//importing express
const express=require ("express");
const path = require('path');
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessionRoutes');
const session = require("express-session");
const userRoutes = require('./routes/userRoutes');
const skillsRoutes = require('./routes/skills');
const expertsRoutes = require('./routes/experts');

const db = require("./database");

const { v4: uuidv4 } = require('uuid');

// ===================== Express App Setup =====================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://127.0.0.1:3010",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Static folders
app.use('/allcss', express.static(path.join(__dirname, 'allcss')));
app.use('/alljs', express.static(path.join(__dirname, 'alljs')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ CORS Setup (BEFORE session)
app.use(cors({
  origin: 'http://127.0.0.1:3010', // Set exact origin
  credentials: true
}));

//Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },// 1 day
    httpOnly: true,
      secure: false // Set to true if using HTTPS 
  })
);

// Session verification middleware to protected routes
app.use((req, res, next) => {
    // Paths that don't require authentication
    const publicPaths = ['/login', '/session', '/login.html', '/studentsignup.html', '/tutorsignup.html', 
      '/register-student','/register-expert', '/register-admin', '/forgot-password', '/forgotPassword.html', 
      '/reset-password', '/resetPassword.html', '/verify-email'];
    
    if (publicPaths.includes(req.path)) {
        return next();
    }
    
    // Check if session exists and has user data
    if (!req.session || !req.session.user) {
        if (req.accepts('html')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
});

app.use((err, req, res, next) => {
    if (err instanceof TypeError && err.message.includes('session')) {
        console.error('Session error:', err);
        return res.status(500).send('Session configuration error');
    }
    next(err);
});

const adminRoutes = require('./routes/adminRoutes');
const expertRoutes = require('./routes/expertRoutes');




//port in which application is running
const port=process.env.PORT;


// Routes
app.use('/', authRoutes);
app.use(sessionRoutes);
app.use('/admin', adminRoutes);
app.use('/api/expert', expertRoutes);
app.use(userRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/experts', expertsRoutes);



// All mpesa routes will now be under /api
const mpesaRoutes = require("./routes/mpesa");
app.use("/api/mpesa", mpesaRoutes); 

const expertRouter = require('./routes/auth');
app.use('/register-auth', expertRouter);  




// Check if session is active
app.get('/check-session', (req, res) => {
  res.json({ sessionActive: !!req.session.user });
});



//  Current User Session Route
app.get("/api/users/current", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const userId = req.session.user.id;
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [userId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Get User by ID
app.get("/api/users/:userId", async (req, res) => {
  try {
    const [users] = await db.execute(
  `SELECT u.id, u.name, u.email, u.role, uc.online_status 
   FROM users u 
   LEFT JOIN userconnect uc ON u.id = uc.user_id 
   WHERE u.id = ?`,
  [req.params.userId]
);


    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Search Users
app.get("/api/users/search/:query", async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, name, email, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10`,
      [`%${req.params.query}%`, `%${req.params.query}%`]
    );

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get Conversations
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const [conversations] = await db.execute(`
      SELECT c.id, 
             u1.id as user1_id, u1.name as user1_name, u1.role as user1_role,
             u2.id as user2_id, u2.name as user2_name, u2.role as user2_role,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY last_message_time DESC
    `, [req.params.userId, req.params.userId]);

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get Messages
app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const [messages] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.conversationId]);

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Mark messages in a conversation as read
app.post("/api/conversations/:id/read", async (req, res) => {
  const conversationId = req.params.id;
  const { userId } = req.body;

  try {
    console.log(` Marking messages in conversation ${conversationId} as read for user ${userId}`);

    // ✅ Update all messages not sent by the current user as read
    await db.execute(`
      UPDATE messages 
      SET is_read = TRUE 
      WHERE conversation_id = ? AND sender_id != ?
    `, [conversationId, userId]);

    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error(" Error marking conversation as read:", error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Create or Get Conversation
app.post("/api/conversations", async (req, res) => {
  const { user1Id, user2Id } = req.body;

  console.log(" Conversation request received:");
  console.log(" user1Id:", user1Id);
  console.log(" user2Id:", user2Id);

  try {
    // Check if conversation already exists
    const [existing] = await db.execute(`
      SELECT id FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `, [user1Id, user2Id, user2Id, user1Id]);

    if (existing.length > 0) {
      console.log("Conversation already exists:", existing[0].id);
      return res.json({ conversationId: existing[0].id });
    }

    // Generate UUID for new conversation
    const conversationId = uuidv4();
    console.log(" Creating new conversation with ID:", conversationId);

    // Insert new conversation
    await db.execute(
      `INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)`,
      [conversationId, user1Id, user2Id]
    );

    console.log(" New conversation created successfully");

    res.json({ conversationId });
  } catch (error) {
    console.error(" Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ===================== Socket.IO =====================
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("authenticate", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("user-status-changed", { userId, status: "online" });
  });

  socket.on("private-message", async ({ senderId, receiverId, content, conversationId }) => {
    try {
      const messageId = uuidv4(); // 👈 Generate unique message ID
const [result] = await db.execute(
  "INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)",
  [messageId, conversationId, senderId, content]
);


      

      const message = {
  id: messageId, // 👈 Use the UUID here
  senderId,
  content,
  timestamp: new Date(),
  conversationId
};

      if (onlineUsers.has(receiverId)) {
        io.to(onlineUsers.get(receiverId)).emit("new-message", message);
      }

      socket.emit("new-message", message);
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("message-error", { error: "Failed to send message" });
    }
  });

  socket.on("schedule-meeting", async ({ tutorId, studentId, meetingDetails }) => {
    try {
      const [result] = await db.execute(
        "INSERT INTO meetings (tutor_id, student_id, meeting_time, duration, meeting_link) VALUES (?, ?, ?, ?, ?)",
        [tutorId, studentId, meetingDetails.startTime, meetingDetails.duration, meetingDetails.link]
      );

      const meeting = {
        id: result.insertId,
        tutorId,
        studentId,
        ...meetingDetails
      };

      [tutorId, studentId].forEach(userId => {
        if (onlineUsers.has(userId)) {
          io.to(onlineUsers.get(userId)).emit("new-meeting", meeting);
        }
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      socket.emit("meeting-error", { error: "Failed to schedule meeting" });
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user-status-changed", { userId, status: "offline" });
        break;
      }
    }
  });
});


//  Start server using HTTP server (for both Express + Socket.IO)
server.listen(port, () => {
  console.log(` Server and Socket.IO running on port ${port}`);
});


