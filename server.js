//importing express
const express=require ("express");
//initialising express so that we can use it in our application
const app = express();
const path = require('path');
const authRoutes = require('./routes/auth');



// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
require("dotenv").config();


// Static folders
app.use('/allcss', express.static(path.join(__dirname, 'allcss')));
app.use('/alljs', express.static(path.join(__dirname, 'alljs')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

//port in which application is running
const port=process.env.PORT;


// Routes
app.use('/', authRoutes);

// All mpesa routes will now be under /api
const mpesaRoutes = require("./routes/mpesa");
app.use("/api/mpesa", mpesaRoutes); 
const expertRouter = require('./routes/auth');
app.use('/register-auth', expertRouter);  





//  Chat Messages API Route
app.get("/api/messages/:conversationId", (req, res) => {
  const convId = req.params.conversationId;

  const query = `SELECT * FROM messages WHERE conversation_id = ? ORDER BY time_sent ASC`;
  db.query(query, [convId], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(results);
  });
});

//Create new conversation + initial message
app.post("/api/conversations", (req, res) => {
  const { conversationId, senderId, userId, initialMessage } = req.body;

  if (!conversationId || !senderId || !userId || !initialMessage) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Optional: Insert conversation into a 'conversations' table (if you have one)
  // For now we insert only the initial message
  const insertMessage = `
    INSERT INTO messages (conversation_id, sender_id, text)
    VALUES (?, ?, ?)
  `;
  db.query(insertMessage, [conversationId, senderId, initialMessage], (err, result) => {
    if (err) {
      console.error(" Failed to save new conversation message:", err);
      return res.status(500).json({ error: "DB error" });
    }

    console.log(" New conversation started with message ID:", result.insertId);
    res.status(200).json({ success: true });
  });
});

// ---- SOCKET.IO SETUP ----

// 1. Import the built-in HTTP module (required to run Express + Socket.IO together)
const http = require("http");
// 2. Import Socket.IO library to enable real-time communication
const socketIo = require("socket.io");
// 3. Create an HTTP server using the existing Express app
const server = http.createServer(app); // This wraps your Express app inside a Node HTTP server
const db = require("./database"); // or your db file name


// 4. Initialize Socket.IO and attach it to the HTTP server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow connections from any origin (important if frontend is hosted elsewhere)
    methods: ["GET", "POST"] // Allowed HTTP methods
  }
});

// 5. Handle new WebSocket connections
io.on("connection", (socket) => {
  console.log(" A user connected:", socket.id); // Log when a new user connects

  // Handle new chat messages
  socket.on("chat message", (data) => {
    console.log(" Message received via WebSocket:", data);

    const { conversationId, sender, text } = data;

    const query = `
      INSERT INTO messages (conversation_id, sender_id, text)
      VALUES (?, ?, ?)
    `;
    db.query(query, [conversationId, sender, text], (err, result) => {
      if (err) {
        console.error(" Error saving WebSocket message:", err);
        return;
      }
      console.log(" WebSocket message saved with ID:", result.insertId);

      // Broadcast the message to all other connected clients (except sender)
      socket.broadcast.emit("chat message", data);
    });
  });

  socket.on("disconnect", () => {
    console.log(" A user disconnected:", socket.id);
  });
});


//  Start server using HTTP server (for both Express + Socket.IO)
server.listen(port, () => {
  console.log(` Server and Socket.IO running on port ${port}`);
});


