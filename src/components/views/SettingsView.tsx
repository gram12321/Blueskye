import { useState, useEffect } from 'react';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { storageService } from '../../lib/localStorage/storageService';
import { tutorialService } from '../../lib/tutorial/tutorialService';
import { Switch, Label, Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from '../ui/ShadCN';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { ViewHeader } from '../ui/ViewHeader';
import { uiEmojis } from '../ui/resources/emojiMap';
import type { View } from '../../App';

interface SettingsViewProps {
  setView: (view: View) => void;
}

export function SettingsView({ setView }: SettingsViewProps) {
  const gameState = getGameState();
  const companyName = gameState.player?.companyName;
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  
  // Subscribe to display updates
  useDisplayUpdate();

  // Load settings on mount and when company changes
  useEffect(() => {
    if (companyName) {
      const settings = storageService.loadPlayerSettings(companyName);
      setShowToastNotification(settings.showToastNotification);
      
      // Load tutorial state
      const tutorialState = storageService.loadTutorialState(companyName);
      setTutorialEnabled(tutorialState.isTutorialEnabled);
    }
  }, [companyName]);

  // If no company name, return null
  if (!companyName) {
    return (
      <div className="h-screen flex flex-col">
        <ViewHeader 
          title="Settings" 
          icon={uiEmojis.settings}
          description="Configure your game preferences"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-medium mb-4">No Company Loaded</h3>
            <p className="text-muted-foreground mb-6">
              Please log in to a company to access settings.
            </p>
            <Button onClick={() => setView('Login')} variant="outline">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleToastToggle = (checked: boolean) => {
    setShowToastNotification(checked);
    const currentSettings = storageService.loadPlayerSettings(companyName);
    storageService.savePlayerSettings(companyName, { 
      ...currentSettings,
      showToastNotification: checked 
    });
  };

  const handleTutorialToggle = (checked: boolean) => {
    setTutorialEnabled(checked);
    tutorialService.setTutorialEnabled(checked);
  };
  
  const handleResetTutorials = () => {
    tutorialService.resetTutorials();
    setTutorialEnabled(true);
  };

  return (
    <div className="h-screen flex flex-col">
      <ViewHeader 
        title="Settings" 
        icon={uiEmojis.settings}
        description="Configure your game preferences"
      />
      
      <Card className="flex-1 overflow-hidden m-4">
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
          <CardDescription>Customize your gameplay experience</CardDescription>
        </CardHeader>
        <CardContent className="p-6 h-[calc(100%-5rem)] overflow-auto">
          <div className="space-y-6">
            {/* Global Toast Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-toast">Show Toast Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle visibility of all toast notifications
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-toast"
                  checked={showToastNotification}
                  onCheckedChange={handleToastToggle}
                />
                <span className="text-sm font-medium">
                  {showToastNotification ? 'On' : 'Off'}
                </span>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <CardTitle className="mb-4">Tutorial Settings</CardTitle>
              
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="tutorial-mode">Tutorial Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable guidance through game features
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tutorial-mode"
                    checked={tutorialEnabled}
                    onCheckedChange={handleTutorialToggle}
                  />
                  <span className="text-sm font-medium">
                    {tutorialEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetTutorials}
              >
                Reset All Tutorials
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will reset all tutorial progress and restart guidance from the beginning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 