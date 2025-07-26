import { Server } from "socket.io";
import { Game } from "../game/Game";

export class SocketService {
    constructor(private io: Server) {}

    broadcastToGame(roomCode: string, event: string, data: any): void {
        this.io.to(roomCode).emit(event, data);
    }

    emitToPlayer(socketId: string, event: string, data: any): void {
        this.io.to(socketId).emit(event, data);
    }

    emitToGamePlayers(game: Game, event: string, getDataForPlayer: (playerId: string) => any): void {
        game.players.forEach((player) => {
            const playerData = getDataForPlayer(player.id);
            this.io.to(player.id).emit(event, playerData);
        });
    }
}
