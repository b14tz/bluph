import { useEffect, useState, type ChangeEvent } from "react";
import { useSocket } from "../hooks/useSocket";
import type { GameState } from "../../../shared/types";
import { Link } from "react-router-dom";

export default function JoinGamePage() {
    const { socket } = useSocket(`http://localhost:${import.meta.env.VITE_SERVER_PORT || 8003}`);
    const [name, setName] = useState<string>("");
    const [gameCode, setGameCode] = useState<string>("");
    const [gameState, setGameState] = useState<GameState>();

    useEffect(() => {
        if (!socket) return;

        socket.on("player-joined", (data) => {
            setGameState(gameState);
            console.log(`player joined - ${data}`);
        });

        return () => {
            socket.off("player-joined");
        };
    }, [socket]);

    const joinGame = () => {
        if (!socket || !name || !gameCode) return;
        socket.emit(
            "join-game",
            { playerName: name, gameCode: gameCode },
            (response: { success: boolean; gameCode: string; gameState: GameState }) => {
                if (response.success) {
                    setGameState(response.gameState);
                } else {
                    setGameCode("");
                    console.log("Failed to join game");
                }

                console.log("Join game response:", response);
            }
        );
    };

    const readyUp = () => {
        console.log("handle ready up here!");
    };

    return gameState?.code ? (
        <div className="mt-40 flex flex-col items-center space-y-4 w-60 m-auto">
            <Link to="/" className="text-[100px]">
                bluph
            </Link>

            <div className="flex space-x-2 items-center">
                <p>game code:</p>
                <input type="text" value={gameCode} disabled className="border-1 w-24 text-center p-2 rounded-md" />
            </div>

            <hr className="w-full" />

            {gameState?.players && (
                <div className="flex flex-col space-y-2 w-full">
                    {gameState.players.map((player, index) => (
                        <div key={player.id || index} className="border-1 p-2 rounded-md">
                            {player.name} {gameState.hostPlayerId == player.id && "(host)"}
                        </div>
                    ))}
                </div>
            )}

            <button onClick={readyUp} className="bg-black text-white w-full p-2 rounded-md">
                ready
            </button>
        </div>
    ) : (
        <div className="mt-40 flex flex-col items-center space-y-2">
            <Link to="/" className="text-[100px]">
                bluph
            </Link>
            <div className="flex flex-col space-y-4">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        placeholder="username"
                        className="border-1 rounded-md p-2"
                    />
                    <input
                        type="text"
                        value={gameCode}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setGameCode(e.target.value)}
                        placeholder="game code"
                        className="border-1 rounded-md p-2"
                    />
                </div>
                <button onClick={joinGame} className="border-1 p-2 rounded-md">
                    Join Game
                </button>
            </div>
        </div>
    );
}
