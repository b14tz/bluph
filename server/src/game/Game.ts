import { Card, GameAction, GamePhase, PendingAction } from "../types/shared";
import { createDeck, shuffleDeck } from "../utils/cardUtils";
import { Player } from "./Player";
import { v4 as uuidv4 } from "uuid";

export class Game {
    public readonly id: string;
    public players: Player[];
    public deck: Card[];
    public currentPlayerIndex: number;
    public phase: GamePhase; // <WAITING, PLAYING, CHALLENGE_PHASE, BLOCK_PHASE, ENDED>
    public pendingAction: PendingAction | null;
    public actionHistory: GameAction[];
    public readonly createdAt: Date;
    public readonly maxPlayers: number;
    public playersWhoMustLoseCard: Set<string>;

    constructor(gameId?: string) {
        this.id = gameId || uuidv4();
        this.players = [];
        this.deck = [];
        this.currentPlayerIndex = 0;
        this.phase = GamePhase.WAITING;
        this.pendingAction = null;
        this.actionHistory = [];
        this.createdAt = new Date();
        this.maxPlayers = 6; // maximum for a typical 15-card coup game
        this.playersWhoMustLoseCard = new Set();
    }

    public addPlayer(player: Player): boolean {
        if (this.players.length >= this.maxPlayers) {
            return false;
        }

        if (this.phase !== GamePhase.WAITING) {
            return false;
        }

        if (this.players.some((p) => p.id === player.id)) {
            return false;
        }

        this.players.push(player);
        return true;
    }

    public removePlayer(playerId: string): boolean {
        const playerIndex = this.players.findIndex((p) => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }

        const player = this.players[playerIndex];

        // Return cards to deck if game is in progress
        if (this.phase === GamePhase.PLAYING && player.cards.length > 0) {
            this.deck.push(...player.cards);
            this.deck = shuffleDeck(this.deck);
        }

        this.players.splice(playerIndex, 1);

        // Adjust current player index if necessary
        if (playerIndex <= this.currentPlayerIndex && this.currentPlayerIndex > 0) {
            this.currentPlayerIndex--;
        }

        return true;
    }

    public startGame(): boolean {
        if (this.players.length < 2) {
            return false;
        }

        if (this.phase !== GamePhase.WAITING) {
            return false;
        }

        // Initialize deck
        this.deck = shuffleDeck(createDeck());

        // Deal 2 cards to each player
        for (const player of this.players) {
            for (let i = 0; i < 2; i++) {
                const card = this.deck.pop();
                if (card) {
                    player.addCard(card);
                }
            }
        }

        this.phase = GamePhase.PLAYING;
        this.currentPlayerIndex = 0;

        return true;
    }

    public getCurrentPlayer(): Player | null {
        if (this.players.length === 0) {
            return null;
        }
        return this.players[this.currentPlayerIndex];
    }

    public getPlayerById(playerId: string): Player | null {
        return this.players.find((p) => p.id === playerId) || null;
    }

    public getAlivePlayers(): Player[] {
        return this.players.filter((p) => p.isAlive);
    }

    public nextTurn(): void {
        const alivePlayers = this.getAlivePlayers();
        if (alivePlayers.length <= 1) {
            this.endGame();
            return;
        }

        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (!this.players[this.currentPlayerIndex].isAlive);
    }

    public isGameOver(): boolean {
        return this.getAlivePlayers().length <= 1;
    }

    public endGame(): void {
        this.phase = GamePhase.ENDED;
        this.pendingAction = null;
    }

    public getWinner(): Player | null {
        const alivePlayers = this.getAlivePlayers();
        return alivePlayers.length === 1 ? alivePlayers[0] : null;
    }
}
