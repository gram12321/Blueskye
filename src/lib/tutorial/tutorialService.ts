// Tutorial service for Blueskye Air Management Game
import storageService, { loadAdminSettings } from '../localStorage/storageService';
import { getGameState } from '../gamemechanics/gameState';

interface Tutorial {
  id: string;
  name: string;
  description: string;
}

class TutorialService {
  private tutorials: Map<string, Tutorial> = new Map();

  /**
   * Register a tutorial
   */
  registerTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  /**
   * Check if tutorial system is globally disabled by admin
   */
  isTutorialGloballyDisabledState(): boolean {
    const adminSettings = loadAdminSettings();
    return adminSettings.isTutorialGloballyDisabled;
  }

  /**
   * Set global tutorial disabled state (admin function)
   */
  setTutorialGloballyDisabled(disabled: boolean): void {
    storageService.saveAdminSettings({ isTutorialGloballyDisabled: disabled });
  }

  /**
   * Check if tutorials are enabled for current company
   */
  isTutorialEnabled(): boolean {
    // Check global disable first
    if (this.isTutorialGloballyDisabledState()) {
      return false;
    }

    const gameState = getGameState();
    if (!gameState.player?.companyName) return true;

    const tutorialState = storageService.loadTutorialState(gameState.player.companyName);
    return tutorialState.isTutorialEnabled;
  }

  /**
   * Enable/disable tutorials for current company
   */
  setTutorialEnabled(enabled: boolean): void {
    const gameState = getGameState();
    if (!gameState.player?.companyName) return;

    storageService.saveTutorialState(gameState.player.companyName, {
      isTutorialEnabled: enabled
    });
  }

  /**
   * Check if a specific tutorial has been seen
   */
  hasSeen(tutorialId: string): boolean {
    const gameState = getGameState();
    if (!gameState.player?.companyName) return false;

    const tutorialState = storageService.loadTutorialState(gameState.player.companyName);
    return tutorialState.seenTutorials.includes(tutorialId);
  }

  /**
   * Mark a tutorial as seen
   */
  markAsSeen(tutorialId: string): void {
    const gameState = getGameState();
    if (!gameState.player?.companyName) return;

    const tutorialState = storageService.loadTutorialState(gameState.player.companyName);
    if (!tutorialState.seenTutorials.includes(tutorialId)) {
      tutorialState.seenTutorials.push(tutorialId);
      storageService.saveTutorialState(gameState.player.companyName, tutorialState);
    }
  }

  /**
   * Check if a tutorial should be shown
   */
  shouldShowTutorial(tutorialId: string): boolean {
    return this.isTutorialEnabled() && !this.hasSeen(tutorialId);
  }

  /**
   * Start a tutorial (placeholder)
   */
  startTutorial(tutorialId: string): void {
    console.log(`Starting tutorial: ${tutorialId}`);
    // Tutorial implementation would go here
    this.markAsSeen(tutorialId);
  }

  /**
   * Reset all tutorials for current company
   */
  resetTutorials(): void {
    const gameState = getGameState();
    if (!gameState.player?.companyName) return;

    storageService.saveTutorialState(gameState.player.companyName, {
      seenTutorials: [],
      isTutorialEnabled: true
    });
  }

  /**
   * Initialize tutorial state for a company
   */
  initializeTutorialState(): void {
    const gameState = getGameState();
    if (!gameState.player?.companyName) return;

    // This ensures tutorial state exists in storage
    storageService.loadTutorialState(gameState.player.companyName);
  }
}

// Create and export singleton instance
const tutorialService = new TutorialService();
export default tutorialService; 