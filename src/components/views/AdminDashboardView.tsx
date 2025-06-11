import { getGameState, resetGameState, updateGameState } from '../../lib/gamemechanics/gameState';
import { storageService, loadAdminSettings, saveAdminSettings } from '../../lib/localStorage/storageService';
import { playerService } from '../../lib/player/playerService';
import { Button, Card, CardContent, CardHeader, CardTitle, Switch, Label } from '../ui/ShadCN';
import { uiEmojis } from '../ui/resources/emojiMap';
import { tutorialService } from '../../lib/tutorial/tutorialService';
import { useState, useEffect } from 'react';
import { displayManager } from '../../lib/gamemechanics/displayManager';
import type { View } from '../../App';
import { ViewHeader } from '../ui/ViewHeader';
import { notificationService } from '../../lib/notifications/notificationService';

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
      
      // Step 4: Go back to company screen
      setView('Company');
      notificationService.info(`Company '${currentCompany}' completely removed`, { category: 'Admin' });
    }
  };
  
  const handleDeleteAllCompanies = () => {
    // Delete all companies
    storageService.clearAllCompanies();
    playerService.logout();
    setView('Company');
    notificationService.info('All companies completely removed', { category: 'Admin' });
  };
  
  const handleClearAllData = () => {
    // Preserve admin settings while clearing everything else
    const adminSettings = loadAdminSettings(); // Load admin settings
    localStorage.clear(); // Clear all data
    saveAdminSettings(adminSettings); // Re-save admin settings
    
    playerService.logout();
    setView('Company');
    notificationService.info('All localStorage data cleared, except global admin settings.', { category: 'Admin' });
  };
  
  // Handler for the tutorial toggle switch
  const handleTutorialToggle = (checked: boolean) => {
    tutorialService.setTutorialGloballyDisabled(checked);
    setIsTutorialGloballyDisabled(checked);
    notificationService.info(`Tutorials globally ${checked ? 'disabled' : 'enabled'}.`, { category: 'Admin' });
  };
  
  // Handler for adding money cheat
  const handleAddMoneyCheat = () => {
    const currentState = getGameState();
    if (currentState.player) {
      const newMoney = currentState.player.money + 10000;
      updateGameState({ player: { ...currentState.player, money: newMoney } });
      notificationService.success(`Added €10,000 (Total: €${newMoney.toLocaleString()})`, { category: 'Admin' });
      displayManager.updateDisplays(); // Ensure UI updates
    } else {
      notificationService.info('No active player/company to add money to.', { category: 'Admin' });
    }
  };

  // Test notification functions
  const handleTestInfo = () => {
    notificationService.info('This is a test info message from the admin panel!', { category: 'Test' });
  };

  const handleTestSuccess = () => {
    notificationService.success('This is a test success message - everything is working!', { category: 'Test' });
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
          
          {/* Section for Testing Notifications */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Test Notification System</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleTestInfo}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                Test Info
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTestSuccess}
                className="bg-green-50 hover:bg-green-100 border-green-200"
              >
                Test Success
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Use these buttons to test the notification system. For debugging errors/warnings, use browser console.
            </p>
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