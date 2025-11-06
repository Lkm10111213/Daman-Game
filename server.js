import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from "http";
import { nanoid } from "nanoid";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// Database setup
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { users: [], colors: [] });
await db.read();

// Secret key for JWT
const JWT_SECRET = "supersecretkey123"; // change in production

// ======= ROUTES =======

// ✅ Home route
app.get("/", (req, res) => {
  res.send("🎨 Daman Game Backend Running Successfully ✅");
});

// ✅ Register User
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  const existing = db.data.users.find(u => u.email === email);
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const newUser = { id: nanoid(), username, email, password: hash };
  db.data.users.push(newUser);
  await db.write();

  res.json({ message: "Registration successful ✅" });
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ message: "Login success ✅", token });
});

// ✅ Get all color predictions
app.get("/api/colors", async (req, res) => {
  res.json(db.data.colors);
});

// ✅ Post a new color
app.post("/api/colors", async (req, res) => {
  const { color, user } = req.body;
  if (!color || !user) return res.status(400).json({ error: "Missing data" });

  const newColor = { id: nanoid(), color, user, time: new Date().toISOString() };
  db.data.colors.push(newColor);
  await db.write();

  // Broadcast to all clients
  io.emit("color:posted", newColor);

  res.json({ message: "Color added successfully ✅", color: newColor });
});

// ✅ Socket.io live connections
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Server start
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
