import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";

export default function Chat() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const { socket } = useSocket(`http://localhost:${import.meta.env.VITE_SERVER_PORT || 8003}`);

    useEffect(() => {
        if (!socket) return;

        socket.on("message", (data) => {
            setMessages((prev) => [...prev, data.message]);
        });

        return () => {
            socket.off("message");
        };
    }, [socket]);

    const sendMessage = () => {
        if (!socket || !message.trim()) return;

        socket.emit("message", { message });
        setMessage("");
    };

    return (
        <div>
            <h2>Socket Chat</h2>
            <div>
                {messages.map((msg, index) => (
                    <p key={index}>{msg}</p>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
}
