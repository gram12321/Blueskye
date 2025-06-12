// Basic game state for Blueskye Air Management Game
// This is a minimal implementation to support the frontend components

import { storageService } from '../localStorage/storageService';
import { Aircraft } from '../aircraft/aircraftTypes';
import { Route, Flight } from '../routes/routeTypes';
import { City } from '../geography/cityTypes';

export interface Player {
  companyName: string;
  money: number; // Changed from 'gold' to 'money' (euros)
  createdAt?: Date;
  lastPlayed?: Date;
}

export interface GameState {
  player: Player | null;
  day: number;
  week: number;
  month: number;
  year: number;
  
  // Aircraft and route management
  fleet: Aircraft[];
  routes: Route[]; // Permanent routes
  activeFlights: Flight[]; // Current flights
  completedFlights: Flight[]; // Flight history
  cities: City[];
  totalIncome: number;
}

// Initialize with default values
let gameState: GameState = {
  player: null,
  day: 1,
  week: 1,
  month: 1,
  year: 2024,
  fleet: [],
  routes: [],
  activeFlights: [],
  completedFlights: [],
  cities: [],
  totalIncome: 0
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
    day: 1,
    week: 1,
    month: 1,
    year: 2024,
    fleet: [],
    routes: [],
    activeFlights: [],
    completedFlights: [],
    cities: [],
    totalIncome: 0
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
    money: 100000000, // Starting money in euros (100 million)
    createdAt: now,
    lastPlayed: now
  };
  
  // Reset to default state and set new player
  resetGameState();
  setPlayer(newPlayer);
  
  // Initialize with default values for new company
  updateGameState({
    day: 1,
    week: 1,
    month: 1,
    year: 2024,
    fleet: [],
    routes: [],
    activeFlights: [],
    completedFlights: [],
    cities: [],
    totalIncome: 0
  });
  
  // Initialize cities
  initializeCities();
}

// Initialize cities data
export function initializeCities(): void {
  import('../geography/cityData').then(({ getAllCities }) => {
    const cities = getAllCities();
    updateGameState({ cities });
  });
}

