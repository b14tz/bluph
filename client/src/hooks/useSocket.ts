import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (serverUrl: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io(serverUrl, {
            transports: ["websocket", "polling"],
        });

        const socket = socketRef.current;

        socket.on("game-started", () => {
            console.log("Game started");
        });

        socket.on("player-joined", () => {
            console.log("Player joined");
        });

        socket.on("player-disconnected", () => {
            console.log("Player disconnected");
        });

        socket.on("player-reconnected", () => {
            console.log("Player reconnected");
        });

        return () => {
            socket.disconnect();
        };
    }, [serverUrl]);

    return {
        socket: socketRef.current,
    };
};
