export enum CardType {
    DUKE = "duke",
    ASSASSIN = "assassin",
    CAPTAIN = "captain",
    AMBASSADOR = "ambassador",
    CONTESSA = "contessa",
}

export enum ActionType {
    INCOME = "income",
    FOREIGN_AID = "foreign_aid",
    COUP = "coup",
    TAX = "tax",
    ASSASSINATE = "assassinate",
    STEAL = "steal",
    EXCHANGE = "exchange",
    BLOCK = "block",
}

export enum GamePhase {
    WAITING = "waiting",
    PLAYING = "playing",
    CHALLENGE_PHASE = "challenge_phase",
    BLOCK_PHASE = "block_phase",
    ENDED = "ended",
}

export enum ResponseType {
    CHALLENGE = "challenge",
    BLOCK = "block",
    ALLOW = "allow",
}

export interface Card {
    type: CardType;
    id: string;
}

export interface GameAction {
    id: string;
    type: ActionType;
    playerId: string;
    targetId?: string;
    cardClaimed?: CardType;
    timestamp: Date;
}

export interface PendingAction {
    action: GameAction;
    challengeableBy: string[];
    blockableBy: string[];
    responses: Map<string, ResponseType>;
    timeoutId?: any; // change later
    timeoutDuration: number;
    canBlock: boolean;
    canChallenge: boolean;
}

export interface ChallengeResult {
    successful: boolean;
    challengerId: string;
    targetId: string;
    cardClaimed: CardType;
    cardRevealed?: Card;
}

export interface BlockAction {
    id: string;
    playerId: string;
    actionToBlock: string;
    cardClaimed: CardType;
    originalActionId: string;
}

export interface PlayerState {
    id: string;
    name: string;
    cards: Card[];
    coins: number;
    isAlive: boolean;
    isConnected: boolean;
}

export type PublicPlayerState = Omit<PlayerState, "cards"> & { cardCount: number };

export interface GameState {
    code: string;
    players: PlayerState[];
    deck: Card[];
    currentPlayerIndex: number;
    currentPlayer: PublicPlayerState | undefined;
    phase: GamePhase;
    pendingAction: PendingAction | null;
    actionHistory: GameAction[];
    createdAt: Date;
    maxPlayers: number;
    winner: PublicPlayerState | undefined;
    hostPlayerId: string;
}
