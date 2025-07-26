import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (serverUrl: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io(serverUrl, {
            transports: ["websocket", "polling"],
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("Connected to server");
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [serverUrl]);

    return {
        socket: socketRef.current,
        isConnected,
    };
};
