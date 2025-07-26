/*
create game
join game
find games by player
clean up empty games
prevent players from joining multiple games
*/

import { Game } from "../game/Game";
import { Player } from "../game/Player";
import { PlayerService } from "./PlayerService";

export interface GameCreationResult {
    success: boolean;
    gameCode?: string;
    game?: Game;
    error?: string;
}

export interface JoinGameResult {
    success: boolean;
    game?: Game;
    error?: string;
}

export class GameService {
    private games = new Map<string, Game>();
    private playerService: PlayerService;

    constructor(playerService: PlayerService) {
        this.playerService = playerService;
    }

    /**
     * Create a new game with a unique code
     */
    createGame(creatorId: string, creatorName: string): GameCreationResult {
        // Check if player is already in a game
        const playerProfile = this.playerService.getPlayer(creatorId);
        if (playerProfile?.currentGameId) {
            return {
                success: false,
                error: "You are already in a game",
            };
        }

        // Generate unique game code
        const gameCode = this.generateGameCode();

        // Create new game instance
        const game = new Game(gameCode);

        // Create player instance
        const player = new Player(creatorId, creatorName);

        // Add creator to the game
        const addResult = game.addPlayer(player);
        if (!addResult) {
            return {
                success: false,
                error: "Failed to add creator to game",
            };
        }

        // Store the game
        this.games.set(gameCode, game);

        // Track player in game
        this.playerService.addPlayerToGame(creatorId, gameCode);

        console.log(`Game created: ${gameCode} by ${creatorName}`);

        return {
            success: true,
            gameCode,
            game,
        };
    }

    /**
     * Join an existing game with a game code
     */
    joinGame(gameCode: string, playerId: string, playerName: string): JoinGameResult {
        // Check if game exists
        const game = this.games.get(gameCode);
        if (!game) {
            return {
                success: false,
                error: "Game not found",
            };
        }

        // Check if player is already in a game
        const playerProfile = this.playerService.getPlayer(playerId);
        if (playerProfile?.currentGameId && playerProfile.currentGameId !== gameCode) {
            return {
                success: false,
                error: "You are already in another game",
            };
        }

        // Check if player is already in this game
        if (playerProfile?.currentGameId === gameCode) {
            return {
                success: true,
                game, // Already in this game, just return it
            };
        }

        // Create player instance
        const player = new Player(playerId, playerName);

        // Try to add player to the game
        const addResult = game.addPlayer(player);
        if (!addResult) {
            return {
                success: false,
                error: "Failed to join game (game may be full or already started)",
            };
        }

        // Track player in game
        this.playerService.addPlayerToGame(playerId, gameCode);

        console.log(`${playerName} joined game: ${gameCode}`);

        return {
            success: true,
            game,
        };
    }

    /**
     * Get a game by code
     */
    getGame(gameCode: string): Game | null {
        return this.games.get(gameCode) || null;
    }

    /**
     * Find game by player ID
     */
    findGameByPlayer(playerId: string): { game: Game; gameCode: string } | null {
        const playerProfile = this.playerService.getPlayer(playerId);
        if (!playerProfile?.currentGameId) return null;

        const game = this.games.get(playerProfile.currentGameId);
        if (!game) return null;

        return {
            game,
            gameCode: playerProfile.currentGameId,
        };
    }

    /**
     * Remove a player from their current game
     */
    removePlayerFromGame(playerId: string): boolean {
        const gameInfo = this.findGameByPlayer(playerId);
        if (!gameInfo) return false;

        const { game, gameCode } = gameInfo;

        // Remove player from game
        game.removePlayer(playerId);

        // Update player service
        this.playerService.removePlayerFromGame(playerId);

        // If game is empty, remove it
        if (game.players.length === 0) {
            this.games.delete(gameCode);
            console.log(`Game ${gameCode} removed - no players remaining`);
        }

        return true;
    }

    /**
     * End a game and clean up
     */
    endGame(gameCode: string): void {
        const game = this.games.get(gameCode);
        if (!game) return;

        // Update player stats
        const players = this.playerService.getPlayersInGame(gameCode);
        const winner = game.getWinner();

        players.forEach((playerProfile) => {
            const won = winner?.id === playerProfile.id;
            this.playerService.updatePlayerStats(playerProfile.id, won);
        });

        // Remove game
        this.games.delete(gameCode);
        console.log(`Game ${gameCode} ended`);
    }

    /**
     * Get all active games (for admin/debugging)
     */
    getActiveGames(): Array<{ code: string; playerCount: number; phase: string }> {
        const activeGames: Array<{ code: string; playerCount: number; phase: string }> = [];

        for (const [code, game] of this.games) {
            activeGames.push({
                code,
                playerCount: game.players.length,
                phase: game.phase,
            });
        }

        return activeGames;
    }

    /**
     * Generate a unique 6-character game code
     */
    private generateGameCode(): string {
        let code: string;
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.games.has(code)); // Ensure uniqueness

        return code;
    }
}
