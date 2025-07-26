import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const app = express();
const server = createServer(app);

const CLIENT_PORT = process.env.VITE_CLIENT_PORT || 8002;
const SERVER_PORT = process.env.VITE_SERVER_PORT || 8003;

const io = new Server(server, {
    cors: {
        origin: `http://localhost:${CLIENT_PORT}`,
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get("/health", (req, res) => {
    res.json({ status: "Server is running!" });
});

// Socket.io handling
io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    socket.on("message", (data) => {
        console.log("Received message:", data);
        socket.emit("message", { message: `Server received: ${data.message}` });
    });

    socket.on("join-room", (roomId) => {
        console.log(`user ${socket.id} is joining room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(SERVER_PORT, () => {
    console.log(`Bluph game server running on port ${SERVER_PORT}`);
    console.log(`Health check: http://localhost:${SERVER_PORT}/health`);
});
