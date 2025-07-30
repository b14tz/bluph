import { Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { PlayerService } from "../services/PlayerService";

function handleCreateGame(socket: Socket, gameService: GameService, playerService: PlayerService) {
    return async (data: any, callback: Function) => {
        try {
            const { playerName } = data;

            if (!playerName || typeof playerName !== "string") {
                return callback({ success: false, error: "Invalid player name" });
            }

            const player = playerService.createPlayer(playerName, socket.id);
            const gameCode = gameService.createGame(player.id);
            const game = gameService.getGame(gameCode);

            if (game && game.addPlayer(player)) {
                playerService.setPlayerGame(player.id, gameCode);
                socket.join(gameCode);
                callback({
                    success: true,
                    gameCode,
                    gameState: game.getGameState(player.id),
                });
            } else {
                callback({ success: false, error: "Failed to create game" });
            }
        } catch (error) {
            console.error("Error creating game:", error);
            callback({ success: false, error: "Server error" });
        }
    };
}

function handleJoinGame(socket: Socket, gameService: GameService, playerService: PlayerService) {
    return async (data: any, callback: Function) => {
        try {
            const { gameCode, playerName } = data;

            if (!gameCode || !playerName) {
                return callback({ success: false, error: "Missing required fields" });
            }

            const game = gameService.getGame(gameCode);
            if (!game) {
                return callback({ success: false, error: "Game not found" });
            }

            const player = playerService.createPlayer(playerName, socket.id);

            if (game.addPlayer(player)) {
                playerService.setPlayerGame(player.id, gameCode);
                socket.join(gameCode);
                socket.to(gameCode).emit("player-joined", player.getPublicState());

                callback({
                    success: true,
                    gameState: game.getGameState(player.id),
                });
            } else {
                callback({ success: false, error: "Cannot join game" });
            }
        } catch (error) {
            console.error("Error joining game:", error);
            callback({ success: false, error: "Server error" });
        }
    };
}

function handleStartGame(socket: Socket, gameService: GameService, playerService: PlayerService) {
    return async (data: any, callback: Function) => {
        try {
            const { gameCode } = data;
            const player = playerService.getPlayerBySocket(socket.id);

            if (!player) {
                return callback({ success: false, error: "Player not found" });
            }

            const game = gameService.getGame(gameCode);
            if (!game) {
                return callback({ success: false, error: "Game not found" });
            }

            if (game.hostPlayerId !== player.id) {
                return callback({ success: false, error: "Only host can start game" });
            }

            if (game.startGame()) {
                socket.to(gameCode).emit("game-started", game.getGameState());
                socket.emit("game-started", game.getGameState(player.id));

                callback({ success: true });
            } else {
                callback({ success: false, error: "Cannot start game" });
            }
        } catch (error) {
            console.error("Error starting game:", error);
            callback({ success: false, error: "Server error" });
        }
    };
}

function handleDisconnect(socket: Socket, gameService: GameService, playerService: PlayerService) {
    return () => {
        try {
            const player = playerService.getPlayerBySocket(socket.id);
            if (player) {
                player.setConnectionStatus(false);
                player.updateLastSeen();

                const gameCode = playerService.getPlayerGameCode(player.id);
                if (gameCode) {
                    socket.to(gameCode).emit("player-disconnected", player.name);
                }
                console.log(`Player ${player.name} disconnected`);
            }
        } catch (error) {
            console.error("Error handling disconnect:", error);
        }
    };
}

function handleReconnect(socket: Socket, gameService: GameService, playerService: PlayerService) {
    return async (data: any, callback: Function) => {
        try {
            const { playerId, gameCode } = data;

            if (!playerId || !gameCode) {
                return callback({ success: false, error: "Missing reconnection data" });
            }

            const game = gameService.getGame(gameCode);
            if (!game) {
                return callback({ success: false, error: "Game not found" });
            }

            if (game.reconnectPlayer(playerId, socket.id)) {
                playerService.updatePlayerSocket(playerId, socket.id);
                socket.join(gameCode);
                socket.to(gameCode).emit("player-reconnected", { playerId });

                callback({
                    success: true,
                    gameState: game.getGameState(playerId),
                });
            } else {
                callback({ success: false, error: "Cannot reconnect" });
            }
        } catch (error) {
            console.error("Error handling reconnect:", error);
            callback({ success: false, error: "Server error" });
        }
    };
}

export function registerGameHandlers(socket: Socket, gameService: GameService, playerService: PlayerService) {
    // Lobby events
    socket.on("create-game", handleCreateGame(socket, gameService, playerService));
    socket.on("join-game", handleJoinGame(socket, gameService, playerService));
    socket.on("start-game", handleStartGame(socket, gameService, playerService));

    // Game action events (to be added later)
    // socket.on("challenge", handleChallenge(socket, gameService, playerService));
    // socket.on("block", handleBlock(socket, gameService, playerService));

    // Connection events
    socket.on("disconnect", handleDisconnect(socket, gameService, playerService));
    socket.on("reconnect-to-game", handleReconnect(socket, gameService, playerService));

    console.log(`Registered game handlers for socket ${socket.id}`);
}
