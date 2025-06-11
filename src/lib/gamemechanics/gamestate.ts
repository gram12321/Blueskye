// Basic game state for Blueskye Air Management Game
// This is a minimal implementation to support the frontend components

export interface Player {
  companyName: string;
  money: number; // Changed from 'gold' to 'money' (euros)
  createdAt?: Date;
  lastPlayed?: Date;
}

export interface GameState {
  player: Player | null;
  week: number;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: number;
  politicalPower: number;
  population: any[]; // Placeholder array
  populationLimit: number;
}

// Initialize with default values
let gameState: GameState = {
  player: null,
  week: 1,
  season: 'Spring',
  year: 2024,
  politicalPower: 0,
  population: [],
  populationLimit: 100
};

export function getGameState(): GameState {
  return gameState;
}

export function updateGameState(updates: Partial<GameState>): void {
  gameState = { ...gameState, ...updates };
}

export function setPlayer(player: Player): void {
  gameState.player = player;
}

export function updatePlayerMoney(amount: number): void {
  if (gameState.player) {
    gameState.player.money += amount;
  }
}

// Placeholder function for advancing the week
export function advanceWeek(): void {
  gameState.week += 1;
  if (gameState.week > 12) {
    gameState.week = 1;
    const seasons: Array<'Spring' | 'Summer' | 'Fall' | 'Winter'> = ['Spring', 'Summer', 'Fall', 'Winter'];
    const currentSeasonIndex = seasons.indexOf(gameState.season);
    if (currentSeasonIndex === 3) {
      gameState.season = 'Spring';
      gameState.year += 1;
    } else {
      gameState.season = seasons[currentSeasonIndex + 1];
    }
  }
}
