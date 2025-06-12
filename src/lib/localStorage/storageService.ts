// Storage keys
const STORAGE_KEYS = {
  COMPANIES: 'Blueskye_Companies',
  ADMIN_SETTINGS: 'blueskye_AdminSettings',
  PLAYER: 'Blueskye_Player'
};

// Player Settings interface
export interface NotificationSettings {
  categories: Record<string, boolean>;
  specificMessages: Record<string, boolean>;
}

export interface PlayerSettings {
  showToastNotification: boolean;
  showDetailedInputSection: boolean;
  notifications?: NotificationSettings;
  tutorialState?: SavedTutorialState;
}

// Default player settings
const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  showToastNotification: true,
  showDetailedInputSection: true
};

// Player data structure
export interface PlayerData {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  companies: string[]; // List of company names owned by this player
  avatar?: string; // Avatar identifier
  avatarColor?: string; // Avatar background color
}

// Default player data
const DEFAULT_PLAYER_DATA: PlayerData = {
  id: '',
  name: '',
  createdAt: new Date().toISOString(),
  companies: [],
  avatar: 'default',
  avatarColor: 'blue'
};

// Tutorial state interface
export interface SavedTutorialState {
  seenTutorials: string[];
  isTutorialEnabled: boolean;
}

// Default tutorial state
const DEFAULT_TUTORIAL_STATE: SavedTutorialState = {
  seenTutorials: [],
  isTutorialEnabled: true
};

// Admin Settings interface
export interface AdminSettings {
  isTutorialGloballyDisabled: boolean;
}

// Default Admin Settings
const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  isTutorialGloballyDisabled: false
};

// Company data structure
interface CompanyData {
  name: string;
  gameState?: any;
  playerSettings?: PlayerSettings;
  tutorialState?: SavedTutorialState;
}

/**
 * Helper function to prepare game state for serialization
 */
function prepareGameStateForStorage(gameState: any): any {
  if (!gameState) return gameState;

  // Convert Date objects to strings for serialization
  const prepared = { ...gameState };
  
  if (prepared.player && prepared.player.createdAt instanceof Date) {
    prepared.player.createdAt = prepared.player.createdAt.toISOString();
  }
  if (prepared.player && prepared.player.lastPlayed instanceof Date) {
    prepared.player.lastPlayed = prepared.player.lastPlayed.toISOString();
  }

  // Cap waitingPassengers to last 5000 to avoid quota issues
  if (Array.isArray(prepared.waitingPassengers) && prepared.waitingPassengers.length > 5000) {
    prepared.waitingPassengers = prepared.waitingPassengers.slice(-5000);
  }

  return prepared;
}

/**
 * Helper function to restore game state after loading from storage
 */
function restoreGameStateAfterStorage(gameState: any): any {
  if (!gameState) return gameState;
  
  // Convert player dates from strings back to Date objects
  if (gameState.player) {
    if (gameState.player.createdAt && typeof gameState.player.createdAt === 'string') {
      gameState.player.createdAt = new Date(gameState.player.createdAt);
    }
    if (gameState.player.lastPlayed && typeof gameState.player.lastPlayed === 'string') {
      gameState.player.lastPlayed = new Date(gameState.player.lastPlayed);
    }
  }
  
  return gameState;
}

// Helper function to get all companies
export function getAllCompanies(): Record<string, CompanyData> {
  const companiesJson = localStorage.getItem(STORAGE_KEYS.COMPANIES);
  return companiesJson ? JSON.parse(companiesJson) : {};
}

// Helper function to save all companies
export function saveAllCompanies(companies: Record<string, CompanyData>): void {
  const preparedCompanies = Object.entries(companies).reduce((acc, [name, company]) => ({
    ...acc,
    [name]: {
      ...company,
      gameState: company.gameState ? prepareGameStateForStorage(company.gameState) : undefined
    }
  }), {});

  localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(preparedCompanies));
}

// Basic company operations
function saveCompanyData(companyName: string, data: Partial<Omit<CompanyData, 'name'>>): void {
  const companies = getAllCompanies();
  const existingData = companies[companyName] || { name: companyName };
  companies[companyName] = { ...existingData, ...data };
  saveAllCompanies(companies);
}

function loadCompanyData(companyName: string): CompanyData | null {
  return getAllCompanies()[companyName] || null;
}

// Game state operations
export function saveGameState(gameState: any): void {
  if (!gameState.player?.companyName) return;
  saveCompanyData(gameState.player.companyName, {
    gameState: prepareGameStateForStorage(gameState)
  });
}

export function loadGameState(companyName: string): any | null {
  const data = loadCompanyData(companyName)?.gameState || null;
  return data ? restoreGameStateAfterStorage(data) : null;
}

// Player settings operations
export function savePlayerSettings(companyName: string, settings: Partial<PlayerSettings>): void {
  if (!companyName) return;
  const current = loadPlayerSettings(companyName);
  saveCompanyData(companyName, { 
    playerSettings: { ...current, ...settings } 
  });
}

export function loadPlayerSettings(companyName: string): PlayerSettings {
  if (!companyName) return DEFAULT_PLAYER_SETTINGS;
  return loadCompanyData(companyName)?.playerSettings || DEFAULT_PLAYER_SETTINGS;
}

// Tutorial state operations
export function saveTutorialState(companyName: string, state: Partial<SavedTutorialState>): void {
  if (!companyName) return;
  const current = loadTutorialState(companyName);
  saveCompanyData(companyName, { 
    tutorialState: { ...current, ...state } 
  });
}

export function loadTutorialState(companyName: string): SavedTutorialState {
  if (!companyName) return DEFAULT_TUTORIAL_STATE;
  return loadCompanyData(companyName)?.tutorialState || DEFAULT_TUTORIAL_STATE;
}

// Notification settings
export function setToastNotifications(companyName: string, show: boolean): void {
  savePlayerSettings(companyName, { showToastNotification: show });
}

export function getToastNotifications(companyName: string): boolean {
  return loadPlayerSettings(companyName).showToastNotification;
}

// Company management
export function clearCompanyData(companyName: string): void {
  const companies = getAllCompanies();
  delete companies[companyName];
  saveAllCompanies(companies);
}

export function clearAllCompanies(): void {
  localStorage.removeItem(STORAGE_KEYS.COMPANIES);
}

export function getCompanyList(): string[] {
  return Object.keys(getAllCompanies());
}

// Global data operations
export function saveGlobalData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadGlobalData<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

// Admin settings operations
export function saveAdminSettings(settings: Partial<AdminSettings>): void {
  const current = loadAdminSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(updated));
}

export function loadAdminSettings(): AdminSettings {
  const item = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
  return item ? { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(item) } : DEFAULT_ADMIN_SETTINGS;
}

// Player data operations
export function savePlayerData(playerData: Partial<PlayerData>): void {
  const current = loadPlayerData();
  const updated = { ...current, ...playerData };
  localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(updated));
}

export function loadPlayerData(): PlayerData {
  const item = localStorage.getItem(STORAGE_KEYS.PLAYER);
  return item ? { ...DEFAULT_PLAYER_DATA, ...JSON.parse(item) } : DEFAULT_PLAYER_DATA;
}

export function addCompanyToPlayer(companyName: string): void {
  const playerData = loadPlayerData();
  if (!playerData.companies.includes(companyName)) {
    playerData.companies.push(companyName);
    savePlayerData(playerData);
  }
}

export function removeCompanyFromPlayer(companyName: string): void {
  const playerData = loadPlayerData();
  playerData.companies = playerData.companies.filter(name => name !== companyName);
  savePlayerData(playerData);
}

export function isPlayerSet(): boolean {
  const playerData = loadPlayerData();
  return Boolean(playerData.name);
}

export function clearPlayerData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLAYER);
}

// Default notification settings
export function getDefaultNotificationSettings(): NotificationSettings {
  return {
    categories: {
      'Finance': true,
      'Fleet': true,
      'Routes': true,
      'Admin': true
    },
    specificMessages: {
      'finance:income': true,
      'finance:expense': true,
      'fleet:maintenance': true,
      'fleet:purchase': true,
      'routes:complete': true,
      'admin:cheat': true
    }
  };
}

// Service object
const storageService = {
  getAllCompanies,
  saveAllCompanies,
  saveGameState,
  loadGameState,
  savePlayerSettings,
  loadPlayerSettings,
  saveTutorialState,
  loadTutorialState,
  setToastNotifications,
  getToastNotifications,
  clearCompanyData,
  clearAllCompanies,
  getCompanyList,
  saveGlobalData,
  loadGlobalData,
  saveAdminSettings,
  loadAdminSettings,
  savePlayerData,
  loadPlayerData,
  addCompanyToPlayer,
  removeCompanyFromPlayer,
  isPlayerSet,
  clearPlayerData,
  getDefaultNotificationSettings
};

export { storageService }; 