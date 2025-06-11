import { getGameState, resetGameState, loadGame, createNewPlayer, updateGameState } from '../gamemechanics/gameState';
import storageService, { PlayerData } from '../localStorage/storageService';
import { calculateCompanyValue } from '../finance/financeService';
import { CompanyInfo } from '../../components/views/CompanyView';
import tutorialService from '../tutorial/tutorialService';

/**
 * Constants for player initialization
 */
export const PLAYER_INIT_VALUES = {
  STARTING_MONEY: 10000, // Starting money in euros
};

/**
 * Initialize a new player with starting conditions
 */
export function initializePlayer(): void {
  // Initialize with starting money (already set in createNewPlayer)
  // Future: Add any initial setup here (aircraft, licenses, etc.)
  
  console.log(`New company initialized with €${PLAYER_INIT_VALUES.STARTING_MONEY}`);
}

/**
 * Gets detailed information about a list of companies
 * @param companyNames Array of company names to get details for
 * @returns Object mapping company names to their details using CompanyInfo interface
 */
export function getCompanyDetails(companyNames: string[]): Record<string, CompanyInfo> {
  if (!companyNames || companyNames.length === 0) {
    return {};
  }

  const allCompanyData = storageService.getAllCompanies();
  const currentPlayer = getCurrentPlayer();
  const details: Record<string, CompanyInfo> = {};
  
  // Save current game state to restore later
  const currentGameState = getGameState();
  
  companyNames.forEach(name => {
    const data = allCompanyData[name];
    const gameState = data?.gameState ?? {};
    
    // Temporarily load the game state to calculate company value
    resetGameState();
    loadGame(name);
    const companyValue = calculateCompanyValue();
    
    // Get basic info and calculated values
    const createdAt = gameState.player?.createdAt 
      ? new Date(gameState.player.createdAt) 
      : new Date();
    
    details[name] = {
      name,
      week: gameState.week,
      season: gameState.season,
      year: gameState.year,
      money: gameState.player?.money ?? 0,
      companyValue: companyValue.companyValue,
      fleetValue: companyValue.fleetValue,
      buildingValue: companyValue.buildingValue,
      createdAt,
      lastPlayed: gameState.player?.lastPlayed ? new Date(gameState.player.lastPlayed) : createdAt,
      isOwnedByCurrentPlayer: currentPlayer ? currentPlayer.companies.includes(name) : false
    };
  });
  
  // Restore the previous game state
  resetGameState();
  if (currentGameState.player) {
    loadGame(currentGameState.player.companyName);
  }
  
  return details;
}

/**
 * Creates a new player profile
 * @param playerName The name of the player to create
 * @returns The created player data
 */
export function createPlayer(playerName: string): PlayerData {
  if (!playerName.trim()) {
    throw new Error('Player name cannot be empty');
  }
  
  // Generate a unique ID for the player
  const playerId = `player_${Date.now()}`;
  
  const playerData: PlayerData = {
    id: playerId,
    name: playerName,
    createdAt: new Date().toISOString(),
    companies: []
  };
  
  storageService.savePlayerData(playerData);
  console.log(`Welcome, ${playerName}! You can now create companies.`);
  
  return playerData;
}

/**
 * Gets the current player data from storage
 * @returns The player data or undefined if no player exists
 */
export function getCurrentPlayer(): PlayerData | undefined {
  const playerData = storageService.loadPlayerData();
  return playerData.name ? playerData : undefined;
}

/**
 * Logs in a user with an existing company or creates a new company
 * @param companyName The name of the company to login or create
 * @param associateWithCurrentPlayer Whether to associate this company with the current player
 * @returns Object with success status and any error message
 */
export async function loginOrCreateCompany(
  companyName: string,
  associateWithCurrentPlayer: boolean = true
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    if (!companyName.trim()) {
      return { success: false, errorMessage: 'Please enter a company name' };
    }

    const companies = storageService.getCompanyList();
    if (companies.includes(companyName)) {
      // Load existing company
      if (loadGame(companyName)) {
        tutorialService.initializeTutorialState();
        console.log(`Welcome back to ${companyName}!`);
        
        // Associate with current player if needed and not already associated
        if (associateWithCurrentPlayer && storageService.isPlayerSet()) {
          storageService.addCompanyToPlayer(companyName);
        }
        
        return { success: true };
      }
      return { success: false, errorMessage: 'Failed to load company data' };
    }

    // Create new company
    createNewPlayer(companyName);
    initializePlayer();
    
    console.log(`Welcome to your new company, ${companyName}!`);

    tutorialService.initializeTutorialState();
    
    // Associate with current player if needed
    if (associateWithCurrentPlayer && storageService.isPlayerSet()) {
      storageService.addCompanyToPlayer(companyName);
    }
    
    // Future: Start tutorial system here
    setTimeout(() => {
      if (tutorialService.shouldShowTutorial('company-overview')) {
        tutorialService.startTutorial('company-overview');
      }
    }, 1000);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, errorMessage: 'An unexpected error occurred' };
  }
}

/**
 * Logs out the current user/company
 */
export function logout(): void {
  const gameState = getGameState();
  if (gameState.player?.companyName) {
    resetGameState();
    console.log('Logged out successfully');
  }
}

/**
 * Checks if there's an active session and loads it
 * @returns Object with success status and the company name if successful
 */
export async function autoLogin(): Promise<{ success: boolean; companyName?: string }> {
  try {
    const companies = storageService.getCompanyList();
    if (companies.length > 0) {
      if (loadGame(companies[0])) {
        tutorialService.initializeTutorialState();
        return { success: true, companyName: companies[0] };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Auto-login error:', error);
    return { success: false };
  }
}

// Export the required functions
export default {
  loginOrCreateCompany,
  logout,
  autoLogin,
  createPlayer,
  getCurrentPlayer,
  getCompanyDetails
}; 