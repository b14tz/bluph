import { useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import Chat from "./components/Chat";

function App() {
    const { socket } = useSocket(`http://localhost:${import.meta.env.VITE_SERVER_PORT || 8003}`);

    useEffect(() => {
        if (!socket) return;

        socket.on("player-joined", (data) => {
            console.log(`player joined - ${data}`);
        });

        return () => {
            socket.off("player-joined");
        };
    }, [socket]);

    const createGame = () => {
        if (!socket) return;
        console.log("hello");
        socket.emit("create-game", { playerName: "marshall" }, (response: any) => {
            console.log("Create game response:", response);
        });
    };

    const joinGame = () => {};

    return (
        <>
            <div>
                <button onClick={createGame}>Create Game</button>
                <button onClick={joinGame}>Join Game</button>
            </div>
            <Chat />
        </>
    );
}

export default App;
