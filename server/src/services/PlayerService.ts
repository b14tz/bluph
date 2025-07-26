/*
map player to game
map player to socket
reconnect player to existing game
remove player properly
*/

export interface PlayerProfile {
    id: string;
    name: string;
    gamesPlayed: number;
    wins: number;
    currentGameId: string | null;
    socketId: string | null;
}

export class PlayerService {
    private playerProfiles = new Map<string, PlayerProfile>();
    private playerSockets = new Map<string, string>(); // playerId -> socketId
    private socketPlayers = new Map<string, string>(); // socketId -> playerId

    /**
     * Register a new player or update existing player's socket
     */
    registerPlayer(playerId: string, playerName: string, socketId: string): PlayerProfile {
        let profile = this.playerProfiles.get(playerId);

        if (!profile) {
            profile = {
                id: playerId,
                name: playerName,
                gamesPlayed: 0,
                wins: 0,
                currentGameId: null,
                socketId: socketId,
            };
            this.playerProfiles.set(playerId, profile);
        } else {
            // Update socket info for returning player
            profile.socketId = socketId;
        }

        this.playerSockets.set(playerId, socketId);
        this.socketPlayers.set(socketId, playerId);

        return profile;
    }

    /**
     * Get player profile by ID
     */
    getPlayer(playerId: string): PlayerProfile | null {
        return this.playerProfiles.get(playerId) || null;
    }

    /**
     * Get player ID by socket ID
     */
    getPlayerBySocket(socketId: string): string | null {
        return this.socketPlayers.get(socketId) || null;
    }

    /**
     * Get socket ID by player ID
     */
    getPlayerSocket(playerId: string): string | null {
        return this.playerSockets.get(playerId) || null;
    }

    /**
     * Add player to a game
     */
    addPlayerToGame(playerId: string, gameId: string): boolean {
        const player = this.playerProfiles.get(playerId);
        if (!player) return false;

        if (player.currentGameId && player.currentGameId !== gameId) {
            // Player is already in another game
            return false;
        }

        player.currentGameId = gameId;
        return true;
    }

    /**
     * Remove player from their current game
     */
    removePlayerFromGame(playerId: string): void {
        const player = this.playerProfiles.get(playerId);
        if (player) {
            player.currentGameId = null;
        }
    }

    /**
     * Get all players in a specific game
     */
    getPlayersInGame(gameId: string): PlayerProfile[] {
        const playersInGame: PlayerProfile[] = [];

        for (const player of this.playerProfiles.values()) {
            if (player.currentGameId === gameId) {
                playersInGame.push(player);
            }
        }

        return playersInGame;
    }

    /**
     * Update player stats after game completion
     */
    updatePlayerStats(playerId: string, won: boolean): void {
        const player = this.playerProfiles.get(playerId);
        if (player) {
            player.gamesPlayed++;
            if (won) {
                player.wins++;
            }
            player.currentGameId = null;
        }
    }

    /**
     * Clean up player on disconnect
     */
    disconnectPlayer(socketId: string): string | undefined {
        const playerId = this.socketPlayers.get(socketId);

        if (playerId) {
            const player = this.playerProfiles.get(playerId);
            if (player) {
                player.socketId = null;
            }

            this.playerSockets.delete(playerId);
            this.socketPlayers.delete(socketId);
        }

        return playerId;
    }
}
