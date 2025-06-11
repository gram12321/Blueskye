import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Label } from '../ui/ShadCN';
import { uiEmojis } from '../ui/resources/emojiMap';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { playerService, getCurrentPlayer, createPlayer } from '../../lib/player/playerService';
import type { View } from '../../App';

interface LoginViewProps {
  setView: (view: View) => void;
  skipAutoLogin?: boolean;
  onManualLogin?: () => void;
}

export function LoginView({ setView, skipAutoLogin = false, onManualLogin }: LoginViewProps) {
  const [companyName, setCompanyName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(getCurrentPlayer());

  // Subscribe to display updates
  useDisplayUpdate();

  useEffect(() => {
    // Auto-login if there's an existing company (but only if not skipping auto-login)
    const attemptAutoLogin = async () => {
      if (skipAutoLogin) {
        return; // Skip auto-login if explicitly requested
      }
      
      try {
        const result = await playerService.autoLogin();
        if (result.success) {
          setView('Company');
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      }
    };

    attemptAutoLogin();
    setCurrentPlayer(getCurrentPlayer());
  }, [setView, skipAutoLogin]);

  const handleLogin = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await playerService.loginOrCreateCompany(companyName.trim());
      
      if (result.success) {
        onManualLogin?.(); // Reset skipAutoLogin flag
        setView('Company');
      } else {
        setError(result.errorMessage || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newPlayer = createPlayer(playerName.trim());
      setCurrentPlayer(newPlayer);
      setPlayerName('');
      setError('');
    } catch (error) {
      console.error('Player creation error:', error);
      setError('Failed to create player profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'login' | 'createPlayer') => {
    if (e.key === 'Enter' && !isLoading) {
      if (action === 'login') {
        handleLogin();
      } else {
        handleCreatePlayer();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{uiEmojis.company}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blueskye</h1>
          <p className="text-gray-600">Air Management Simulation</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Blueskye</CardTitle>
            <CardDescription>
              {currentPlayer 
                ? `Welcome back, ${currentPlayer.name}!` 
                : 'Create a player profile to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={currentPlayer ? "company" : "player"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player" disabled={isLoading}>
                  Player Profile
                </TabsTrigger>
                <TabsTrigger value="company" disabled={isLoading || !currentPlayer}>
                  Company
                </TabsTrigger>
              </TabsList>

              <TabsContent value="player" className="space-y-4">
                {currentPlayer ? (
                  <div className="text-center space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-green-800 font-medium">Player Profile Active</p>
                      <p className="text-green-600 text-sm">
                        {currentPlayer.name} • {currentPlayer.companies.length} companies
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setView('Profile')}
                      className="w-full"
                    >
                      View Profile & Companies
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerName">Player Name</Label>
                      <Input
                        id="playerName"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'createPlayer')}
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      onClick={handleCreatePlayer} 
                      disabled={isLoading || !playerName.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Creating...' : 'Create Player Profile'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="company" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your airline name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'login')}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <Button 
                    onClick={handleLogin} 
                    disabled={isLoading || !companyName.trim()}
                    className="w-full"
                  >
                    {isLoading ? 'Loading...' : 'Start Flying'}
                  </Button>

                  <div className="text-center text-sm text-gray-500">
                    Starting capital: €10,000
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Build your aviation empire • Manage routes • Expand your fleet
          </p>
        </div>
      </div>
    </div>
  );
} 