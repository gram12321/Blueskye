import { getGameState, resetGameState, updateGameState } from '../../lib/gamemechanics/gameState';
import storageService, { loadAdminSettings, saveAdminSettings } from '../../lib/localStorage/storageService';
import playerService from '../../lib/player/playerService';
import { Button } from '../ui/ShadCN/Button';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/ShadCN/Card';
import { uiEmojis } from '../ui/resources/emojiMap';
import tutorialService from '../../lib/tutorial/tutorialService';
import { Switch } from '../ui/ShadCN/Switch';
import { Label } from '../ui/ShadCN/Label';
import { useState, useEffect } from 'react';
import displayManager from '../../lib/gamemechanics/displayManager';
import type { View } from '../../App';

interface AdminDashboardViewProps {
  setView: (view: View) => void;
}

export function AdminDashboardView({ setView }: AdminDashboardViewProps) {
  const gameState = getGameState();
  const [isTutorialGloballyDisabled, setIsTutorialGloballyDisabled] = useState(tutorialService.isTutorialGloballyDisabledState());

  useEffect(() => {
    setIsTutorialGloballyDisabled(tutorialService.isTutorialGloballyDisabledState());
  }, []);
  
  const handleDeleteActiveCompany = () => {
    if (gameState.player?.companyName) {
      const currentCompany = gameState.player.companyName;
      
      // Step 1: Reset game state (do this before deleting to avoid auto-save)
      resetGameState();
      
      // Step 2: Delete the company completely
      storageService.clearCompanyData(currentCompany);
      
      // Step 3: Double-check company is gone
      const companies = storageService.getAllCompanies();
      if (companies[currentCompany]) {
        delete companies[currentCompany];
        storageService.saveAllCompanies(companies);
      }
      
      // Step 4: Go back to login screen
      setView('Login');
      console.log(`Company '${currentCompany}' completely removed`);
    }
  };
  
  const handleDeleteAllCompanies = () => {
    // Delete all companies
    storageService.clearAllCompanies();
    playerService.logout();
    setView('Login');
    console.log('All companies completely removed');
  };
  
  const handleClearAllData = () => {
    // Preserve admin settings while clearing everything else
    const adminSettings = loadAdminSettings(); // Load admin settings
    localStorage.clear(); // Clear all data
    saveAdminSettings(adminSettings); // Re-save admin settings
    
    playerService.logout();
    setView('Login');
    console.log('All localStorage data cleared, except global admin settings.');
  };
  
  // Handler for the tutorial toggle switch
  const handleTutorialToggle = (checked: boolean) => {
    tutorialService.setTutorialGloballyDisabled(checked);
    setIsTutorialGloballyDisabled(checked);
    console.log(`Tutorials globally ${checked ? 'disabled' : 'enabled'}.`);
  };
  
  // Handler for adding money cheat
  const handleAddMoneyCheat = () => {
    const currentState = getGameState();
    if (currentState.player) {
      const newMoney = currentState.player.money + 10000;
      updateGameState({ player: { ...currentState.player, money: newMoney } });
      console.log(`Added €10,000 (Total: €${newMoney.toLocaleString()})`);
      displayManager.updateDisplays(); // Ensure UI updates
    } else {
      console.log('No active player/company to add money to.');
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <ViewHeader 
        title="Admin Dashboard" 
        icon={uiEmojis.settings}
        description="Advanced game management tools"
      />
      
      <Card className="flex-1 overflow-hidden m-4">
        <CardHeader>
          <CardTitle>Game State Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 h-[calc(100%-5rem)] overflow-auto space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-4">
            <p className="font-medium mb-2">⚠️ Warning</p>
            <p className="text-sm">These actions are irreversible and will permanently delete game data.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="destructive" 
              onClick={handleDeleteActiveCompany}
            >
              Delete Active Company
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllCompanies}
            >
              Delete All Companies
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearAllData}
            >
              Clear All Data
            </Button>
          </div>
          
          {/* Section for Cheat Controls */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Cheat Controls</h3>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="secondary" 
                onClick={handleAddMoneyCheat}
              >
                Add €10,000 {uiEmojis.money}
              </Button>
            </div>
          </div>
          
          {/* Section for Global Settings */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Global Settings</h3>
            <div className="flex items-center space-x-2">
              <Switch 
                id="global-tutorial-toggle"
                checked={isTutorialGloballyDisabled}
                onCheckedChange={handleTutorialToggle}
              />
              <Label htmlFor="global-tutorial-toggle">
                Globally Disable Tutorials (Overrides company setting)
              </Label>
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
} 