// Basic game state for Blueskye Air Management Game
// This is a minimal implementation to support the frontend components

import { storageService } from '../localStorage/storageService';

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
  // Auto-save to localStorage if we have a player
  if (gameState.player?.companyName) {
    storageService.saveGameState(gameState);
  }
}

export function setPlayer(player: Player): void {
  gameState.player = player;
  // Auto-save when player is set
  storageService.saveGameState(gameState);
}

export function updatePlayerMoney(amount: number): void {
  if (gameState.player) {
    gameState.player.money += amount;
    gameState.player.lastPlayed = new Date();
    storageService.saveGameState(gameState);
  }
}

// Reset game state to defaults
export function resetGameState(): void {
  gameState = {
    player: null,
    week: 1,
    season: 'Spring',
    year: 2024,
    politicalPower: 0,
    population: [],
    populationLimit: 100
  };
}

// Load a specific company's game state
export function loadGame(companyName: string): boolean {
  try {
    const savedState = storageService.loadGameState(companyName);
    if (savedState) {
      gameState = { ...gameState, ...savedState };
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to load game:', error);
    return false;
  }
}

// Create a new player/company
export function createNewPlayer(companyName: string): void {
  const now = new Date();
  const newPlayer: Player = {
    companyName,
    money: 10000, // Starting money in euros
    createdAt: now,
    lastPlayed: now
  };
  
  // Reset to default state and set new player
  resetGameState();
  setPlayer(newPlayer);
  
  // Initialize with default values for new company
  updateGameState({
    week: 1,
    season: 'Spring',
    year: 2024,
    politicalPower: 0,
    population: [],
    populationLimit: 100
  });
}

