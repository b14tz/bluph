import { Card, CardType, PlayerState } from "../types/shared";

export class Player {
    public readonly id: string;
    public name: string;
    public cards: Card[];
    public coins: number;
    public isAlive: boolean;
    public isConnected: boolean;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.cards = [];
        this.coins = 2; // starting coins
        this.isAlive = true;
        this.isConnected = true;
    }

    public addCard(card: Card): void {
        if (this.cards.length >= 2) {
            throw new Error("Player cannot have more than 2 cards");
        }

        this.cards.push(card);
    }

    public removeCard(cardId: string): Card | null {
        const cardIndex = this.cards.findIndex((card) => card.id === cardId);
        if (cardIndex === -1) {
            return null;
        }
        return this.cards.splice(cardIndex, 1)[0];
    }

    public hasCard(cardType: CardType): boolean {
        return this.cards.some((card) => card.type === cardType);
    }

    public getCardsOfType(cardType: CardType): Card[] {
        return this.cards.filter((card) => card.type === cardType);
    }

    public addCoins(amount: number): void {
        this.coins = Math.max(0, this.coins + amount);
    }

    public removeCoins(amount: number): boolean {
        if (this.coins < amount) {
            return false;
        }
        this.coins -= amount;
        return true;
    }

    public canAfford(cost: number): boolean {
        return this.coins >= cost;
    }

    public eliminate(): void {
        this.isAlive = false;
        this.cards = [];
    }

    public mustCoup(): boolean {
        return this.coins >= 10;
    }

    public getPublicState(): Omit<PlayerState, "cards"> & { cardCount: number } {
        return {
            id: this.id,
            name: this.name,
            cardCount: this.cards?.length || 0,
            coins: this.coins,
            isAlive: this.isAlive,
            isConnected: this.isConnected,
        };
    }

    public getPrivateState(): PlayerState {
        return {
            ...this.getPublicState(),
            cards: this.cards,
        };
    }

    public setConnectionStatus(connected: boolean): void {
        this.isConnected = connected;
    }

    public canPerformAction(actionType: string): { canPerform: boolean; reason?: string } {
        if (!this.isAlive) {
            return { canPerform: false, reason: "Player is eliminated" };
        }

        switch (actionType) {
            case "coup":
                if (this.coins < 7) {
                    return { canPerform: false, reason: "Not enough coins to coup" };
                }
                break;
            case "assassinate":
                if (this.coins < 3) {
                    return { canPerform: false, reason: "Not enough coins to assassinate" };
                }
                break;
        }

        return { canPerform: true };
    }
}
