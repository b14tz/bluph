// socket/handlers/gameHandlers.ts
import { Socket } from "socket.io";
import { GameService } from "../services/GameService";
import { PlayerService } from "../services/PlayerService";
import { SocketService } from "../services/SocketService";
import { ActionType, CardType, GamePhase } from "../types/shared";

// Initialize services (these would be injected in real implementation)
let gameService: GameService;
let playerService: PlayerService;
let socketService: SocketService;

export function initializeGameHandlers(
    gameServiceInstance: GameService,
    playerServiceInstance: PlayerService,
    socketServiceInstance: SocketService
) {
    gameService = gameServiceInstance;
    playerService = playerServiceInstance;
    socketService = socketServiceInstance;
}

// =================== LOBBY HANDLERS ===================

export const handleCreateGame = async (socket: Socket, data: { playerName: string }) => {
    const playerId = socket.id;
    const { playerName } = data;

    try {
        // Register player
        playerService.registerPlayer(playerId, playerName, socket.id);

        // Create game
        const result = gameService.createGame(playerId, playerName);

        if (result.success && result.gameCode && result.game) {
            // Join socket room
            socket.join(result.gameCode);

            // Emit success
            socket.emit("game-created", {
                gameCode: result.gameCode,
                playerCount: result.game.players.length,
                gameState: buildGameStateForPlayer(result.game, playerId),
            });

            console.log(`Game ${result.gameCode} created by ${playerName}`);
        } else {
            socket.emit("game-error", {
                message: result.error || "Failed to create game",
            });
        }
    } catch (error) {
        console.error("Error creating game:", error);
        socket.emit("game-error", { message: "Server error creating game" });
    }
};

export const handleJoinGame = async (socket: Socket, data: { gameCode: string; playerName: string }) => {
    const playerId = socket.id;
    const { gameCode, playerName } = data;

    try {
        // Register player
        playerService.registerPlayer(playerId, playerName, socket.id);

        // Join game
        const result = gameService.joinGame(gameCode, playerId, playerName);

        if (result.success && result.game) {
            // Join socket room
            socket.join(gameCode);

            // Notify others in the game
            socket.to(gameCode).emit("player-joined", {
                playerId,
                playerName,
                playerCount: result.game.players.length,
            });

            // Send game state to the joining player
            socket.emit("game-joined", {
                gameCode,
                gameState: buildGameStateForPlayer(result.game, playerId),
                playerCount: result.game.players.length,
            });

            // Broadcast updated player list to all players
            socketService.broadcastToGame(gameCode, "players-updated", {
                players: result.game.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    isAlive: p.isAlive,
                    cardCount: p.cards.length,
                    coins: p.coins,
                    isConnected: true,
                })),
            });

            console.log(`${playerName} joined game ${gameCode}`);
        } else {
            socket.emit("game-error", {
                message: result.error || "Failed to join game",
            });
        }
    } catch (error) {
        console.error("Error joining game:", error);
        socket.emit("game-error", { message: "Server error joining game" });
    }
};

export const handleStartGame = async (socket: Socket) => {
    const playerId = socket.id;

    try {
        const gameInfo = gameService.findGameByPlayer(playerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // Check if player is the creator (first player)
        if (game.players[0]?.id !== playerId) {
            socket.emit("game-error", { message: "Only the game creator can start the game" });
            return;
        }

        // Start the game
        const started = game.startGame();
        if (!started) {
            socket.emit("game-error", { message: "Cannot start game (need at least 2 players)" });
            return;
        }

        // Broadcast game started to all players
        socketService.broadcastToGame(gameCode, "game-started", {
            currentPlayer: game.getCurrentPlayer()?.id,
            gameState: "Game has started! Each player has 2 cards and 2 coins.",
        });

        // Send individual game states to each player (with their cards)
        game.players.forEach((player) => {
            const playerSocket = playerService.getPlayerSocket(player.id);
            if (playerSocket) {
                socketService.emitToPlayer(playerSocket, "game-state-update", buildGameStateForPlayer(game, player.id));
            }
        });

        console.log(`Game ${gameCode} started`);
    } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("game-error", { message: "Server error starting game" });
    }
};

// =================== GAME ACTION HANDLERS ===================

export const handlePlayerAction = async (
    socket: Socket,
    data: {
        actionType: ActionType;
        targetId?: string;
        cardClaimed?: CardType;
    }
) => {
    const playerId = socket.id;
    const { actionType, targetId, cardClaimed } = data;

    try {
        const gameInfo = gameService.findGameByPlayer(playerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // Validate it's player's turn
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer?.id !== playerId) {
            socket.emit("game-error", { message: "It's not your turn" });
            return;
        }

        // Validate game phase
        if (game.phase !== GamePhase.PLAYING) {
            socket.emit("game-error", { message: "Game is not in playing phase" });
            return;
        }

        // TODO: Implement action validation and execution logic here
        // This would involve checking if the action is valid, processing it,
        // and determining if other players can challenge or block

        // For now, just broadcast the action
        socketService.broadcastToGame(gameCode, "action-declared", {
            playerId,
            playerName: currentPlayer.name,
            actionType,
            targetId,
            cardClaimed,
            canChallenge: isActionChallengeable(actionType),
            canBlock: isActionBlockable(actionType, targetId),
        });

        console.log(`Player ${playerId} declared action: ${actionType}`);
    } catch (error) {
        console.error("Error handling player action:", error);
        socket.emit("game-error", { message: "Server error processing action" });
    }
};

export const handleChallenge = async (
    socket: Socket,
    data: {
        targetPlayerId: string;
        actionId: string;
    }
) => {
    const challengerId = socket.id;
    const { targetPlayerId, actionId } = data;

    try {
        const gameInfo = gameService.findGameByPlayer(challengerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // TODO: Implement challenge logic
        // - Validate challenge is allowed
        // - Reveal target player's cards
        // - Determine if challenge succeeds
        // - Apply consequences (lose card, shuffle deck, etc.)

        socketService.broadcastToGame(gameCode, "challenge-declared", {
            challengerId,
            targetPlayerId,
            actionId,
        });

        console.log(`Player ${challengerId} challenged ${targetPlayerId}`);
    } catch (error) {
        console.error("Error handling challenge:", error);
        socket.emit("game-error", { message: "Server error processing challenge" });
    }
};

export const handleBlock = async (
    socket: Socket,
    data: {
        actionId: string;
        cardClaimed: CardType;
    }
) => {
    const blockerId = socket.id;
    const { actionId, cardClaimed } = data;

    try {
        const gameInfo = gameService.findGameByPlayer(blockerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // TODO: Implement block logic
        // - Validate block is allowed
        // - Check if claimed card can block the action
        // - Allow other players to challenge the block

        socketService.broadcastToGame(gameCode, "block-declared", {
            blockerId,
            actionId,
            cardClaimed,
        });

        console.log(`Player ${blockerId} blocked action ${actionId} with ${cardClaimed}`);
    } catch (error) {
        console.error("Error handling block:", error);
        socket.emit("game-error", { message: "Server error processing block" });
    }
};

export const handleLoseCard = async (
    socket: Socket,
    data: {
        cardId: string;
    }
) => {
    const playerId = socket.id;
    const { cardId } = data;

    try {
        const gameInfo = gameService.findGameByPlayer(playerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // TODO: Implement lose card logic
        // - Validate player must lose a card
        // - Remove the specified card
        // - Check if player is eliminated
        // - Continue game flow

        socketService.broadcastToGame(gameCode, "card-lost", {
            playerId,
            cardCount: game.getPlayerById(playerId)?.cards.length || 0,
        });

        console.log(`Player ${playerId} lost card ${cardId}`);
    } catch (error) {
        console.error("Error handling lose card:", error);
        socket.emit("game-error", { message: "Server error processing card loss" });
    }
};

export const handleAllowAction = async (
    socket: Socket,
    data: {
        actionId: string;
    }
) => {
    const playerId = socket.id;
    const { actionId } = data;

    try {
        const gameInfo = gameService.findGameByPlayer(playerId);
        if (!gameInfo) {
            socket.emit("game-error", { message: "You are not in a game" });
            return;
        }

        const { game, gameCode } = gameInfo;

        // TODO: Record that this player allows the action
        // If all players who can respond have responded, execute the action

        console.log(`Player ${playerId} allowed action ${actionId}`);
    } catch (error) {
        console.error("Error handling allow action:", error);
        socket.emit("game-error", { message: "Server error processing response" });
    }
};

// =================== CONNECTION HANDLERS ===================

export const handleDisconnect = async (socket: Socket) => {
    const playerId = socket.id;

    try {
        // Find player's game
        const gameInfo = gameService.findGameByPlayer(playerId);

        if (gameInfo) {
            const { game, gameCode } = gameInfo;

            // Mark player as disconnected but don't remove from game yet
            const player = game.getPlayerById(playerId);
            if (player) {
                // You might want to add an isConnected property to Player class
                socketService.broadcastToGame(gameCode, "player-disconnected", {
                    playerId,
                    playerName: player.name,
                    message: `${player.name} disconnected`,
                });
            }

            // TODO: Implement reconnection grace period
            // For now, just remove player after disconnect
            setTimeout(() => {
                gameService.removePlayerFromGame(playerId);
            }, 30000); // 30 second grace period
        }

        // Clean up player service
        playerService.disconnectPlayer(socket.id);

        console.log(`Player ${playerId} disconnected`);
    } catch (error) {
        console.error("Error handling disconnect:", error);
    }
};

export const handleReconnect = async (
    socket: Socket,
    data: {
        playerId: string;
        gameCode: string;
    }
) => {
    const { playerId, gameCode } = data;

    try {
        // Verify game and player exist
        const game = gameService.getGame(gameCode);
        if (!game) {
            socket.emit("game-error", { message: "Game not found" });
            return;
        }

        const player = game.getPlayerById(playerId);
        if (!player) {
            socket.emit("game-error", { message: "Player not found in game" });
            return;
        }

        // Update player's socket
        playerService.registerPlayer(playerId, player.name, socket.id);

        // Join socket room
        socket.join(gameCode);

        // Send current game state
        socket.emit("reconnected", {
            gameCode,
            gameState: buildGameStateForPlayer(game, playerId),
        });

        // Notify others
        socketService.broadcastToGame(gameCode, "player-reconnected", {
            playerId,
            playerName: player.name,
        });

        console.log(`Player ${playerId} reconnected to game ${gameCode}`);
    } catch (error) {
        console.error("Error handling reconnect:", error);
        socket.emit("game-error", { message: "Server error during reconnection" });
    }
};

// =================== UTILITY FUNCTIONS ===================

function buildGameStateForPlayer(game: any, playerId: string) {
    return {
        id: game.id,
        phase: game.phase,
        currentPlayerIndex: game.currentPlayerIndex,
        currentPlayer: game.getCurrentPlayer()?.id,
        players: game.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            isAlive: p.isAlive,
            cardCount: p.cards.length,
            coins: p.coins,
            // Only show own cards
            cards: p.id === playerId ? p.cards : undefined,
        })),
        pendingAction: game.pendingAction,
        actionHistory: game.actionHistory.slice(-10), // Last 10 actions
    };
}

function isActionChallengeable(actionType: ActionType): boolean {
    return [ActionType.TAX, ActionType.ASSASSINATE, ActionType.STEAL, ActionType.EXCHANGE].includes(actionType);
}

function isActionBlockable(actionType: ActionType, targetId?: string): boolean {
    if (!targetId) return false;

    return [ActionType.FOREIGN_AID, ActionType.ASSASSINATE, ActionType.STEAL].includes(actionType);
}

// =================== REGISTER ALL HANDLERS ===================

export function registerGameHandlers(socket: Socket) {
    // Lobby events
    socket.on("create-game", handleCreateGame);
    socket.on("join-game", handleJoinGame);
    socket.on("start-game", handleStartGame);

    // Game action events
    socket.on("player-action", handlePlayerAction);
    socket.on("challenge", handleChallenge);
    socket.on("block", handleBlock);
    socket.on("lose-card", handleLoseCard);
    socket.on("allow-action", handleAllowAction);

    // Connection events
    socket.on("disconnect", () => handleDisconnect(socket));
    socket.on("reconnect-to-game", handleReconnect);

    console.log(`Registered game handlers for socket ${socket.id}`);
}
