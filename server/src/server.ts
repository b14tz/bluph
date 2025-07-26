import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8000",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get("/health", (req, res) => {
    res.json({ status: "Server is running!" });
});

server.listen(PORT, () => {
    console.log(`🚀 Bluph game server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
