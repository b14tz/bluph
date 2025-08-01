import { Link } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";
import type { GameState, PublicPlayerState } from "../../../shared/types";
import { useGame } from "../context/GameContext";

export default function GamePage() {
    const { socket } = useSocket(`http://localhost:${import.meta.env.VITE_SERVER_PORT || 8003}`);
    const [gameCode, setGameCode] = useState<string>("");
    const { gameData, playerData, setGameData } = useGame();

    useEffect(() => {
        if (!socket) return;

        console.log("game data - ", gameData);

        socket.on("player-reconnected", (data: { _gamePlayer: PublicPlayerState; gameState: GameState }) => {
            setGameData(data.gameState);
            console.log(`player reconnected - ${data.gameState}`);
        });

        return () => {
            socket.off("player-reconnected");
        };
    }, [socket]);

    const getGameState = () => {
        if (!socket || !playerData) return;
        socket.emit(
            "get-game-state", // we will need to add this to the socketHandlers
            { gameCode: gameCode },
            (response: { success: boolean; gameCode: string; gameState: GameState }) => {
                setGameCode(response.gameCode);
                setGameData(response.gameState);
                console.log("Get game state response:", response);
            }
        );
    };

    const getPlayerPosition = (player: any, index: number, totalPlayers: number) => {
        if (!gameData) return;
        // Find current player's index in the array
        const currentPlayerIndex = gameData.players.findIndex((p) => p.id === playerData?.id);

        // Calculate relative position (current player should always be at bottom)
        let relativeIndex = index - currentPlayerIndex;
        if (relativeIndex < 0) relativeIndex += totalPlayers;

        // Predefined positions for oval table (current player always at position 0)
        const positions = {
            2: [
                { left: "50%", bottom: "10%", transform: "translateX(-50%)" }, // You (bottom center)
                { left: "50%", top: "10%", transform: "translateX(-50%)" }, // Opponent (top center)
            ],
            3: [
                { left: "50%", bottom: "10%", transform: "translateX(-50%)" }, // You (bottom center)
                { right: "15%", top: "30%" }, // Player 2 (top right)
                { left: "15%", top: "30%" }, // Player 3 (top left)
            ],
            4: [
                { left: "50%", bottom: "10%", transform: "translateX(-50%)" }, // You (bottom center)
                { right: "10%", top: "50%", transform: "translateY(-50%)" }, // Player 2 (right)
                { left: "50%", top: "10%", transform: "translateX(-50%)" }, // Player 3 (top center)
                { left: "10%", top: "50%", transform: "translateY(-50%)" }, // Player 4 (left)
            ],
            5: [
                { left: "50%", bottom: "10%", transform: "translateX(-50%)" }, // You (bottom center)
                { right: "20%", bottom: "25%" }, // Player 2 (bottom right)
                { right: "10%", top: "25%" }, // Player 3 (top right)
                { left: "10%", top: "25%" }, // Player 4 (top left)
                { left: "20%", bottom: "25%" }, // Player 5 (bottom left)
            ],
            6: [
                { left: "50%", bottom: "10%", transform: "translateX(-50%)" }, // You (bottom center)
                { right: "15%", bottom: "20%" }, // Player 2 (bottom right)
                { right: "8%", top: "50%", transform: "translateY(-50%)" }, // Player 3 (middle right)
                { right: "15%", top: "20%" }, // Player 4 (top right)
                { left: "15%", top: "20%" }, // Player 5 (top left)
                { left: "8%", top: "50%", transform: "translateY(-50%)" }, // Player 6 (middle left)
                { left: "15%", bottom: "20%" }, // Player 7 (bottom left)
            ],
        };

        const playerPositions = positions[totalPlayers as keyof typeof positions] || positions[6];
        return playerPositions[relativeIndex] || playerPositions[0];
    };

    return gameData?.players ? (
        <div className="flex flex-col border-1 border-green-500 h-screen">
            <div id="nav" className="border-1">
                <Link to="/" className="p-2 ml-5 text-[40px]">
                    bluph
                </Link>
            </div>
            <div className="flex h-full w-full border-1">
                <div id="feed" className="border border-purple-500 w-80"></div>
                <div className="flex flex-col w-full h-full">
                    <div
                        id="table"
                        className="border border-red-500 w-full relative flex items-center justify-center h-full"
                    >
                        {/* Oval Table Surface */}
                        <div className="w-[90%] h-[90%] bg-green-800 rounded-full border-8 border-yellow-600 shadow-2xl relative overflow-visible">
                            {/* Table Center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-lg font-bold">Bluph Table</div>
                            </div>

                            {/* Players positioned around the oval table */}
                            {gameData.players.map((player, index) => {
                                const isCurrentPlayer = player.id === playerData?.id;
                                const position = getPlayerPosition(player, index, gameData.players.length);

                                return (
                                    <div
                                        key={player.id || index}
                                        style={position}
                                        className="absolute flex flex-col items-center z-10"
                                    >
                                        {/* Player Avatar/Circle */}
                                        <div
                                            className={`
                                        w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm
                                        ${isCurrentPlayer ? "bg-blue-500 ring-4 ring-blue-300" : "bg-gray-600"}
                                        shadow-lg
                                    `}
                                        >
                                            {player.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Player Name */}
                                        <div
                                            className={`
                                        mt-1 px-2 py-1 rounded-full text-xs font-medium
                                        ${isCurrentPlayer ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                                        shadow-md whitespace-nowrap
                                    `}
                                        >
                                            {player.name}
                                            {player.id == gameData.hostPlayerId && " 👑"}
                                            {isCurrentPlayer && " (You)"}
                                        </div>

                                        {/* Card Count */}
                                        <div className="mt-1 text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
                                            {(player as any).cardCount || 0} cards
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div id="actions" className="border border-blue-500 h-40 mt-auto">
                        <div className="p-4">
                            <div className="text-center mb-2">
                                <span className="font-semibold">Your turn: </span>
                                <span>{playerData?.name}</span>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded">
                                    Income
                                </button>
                                <button className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded">
                                    Foreign Aid
                                </button>
                                <button className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded">
                                    Coup
                                </button>
                                <div className="border-l" />
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">
                                    Steal
                                </button>
                                <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded">
                                    Assassinate
                                </button>
                                <button className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-2 rounded">
                                    Tax
                                </button>
                                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded">
                                    Exchange
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex text-center items-center h-screen justify-center">game state is not set properly :(</div>
    );
}
