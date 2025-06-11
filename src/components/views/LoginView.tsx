import { useState } from 'react';
import { Button } from '@/components/ui/ShadCN/Button';
import { Input } from '@/components/ui/ShadCN/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/ShadCN/Card';
import { setPlayer } from '@/lib/gamemechanics/gameState';
import { uiEmojis } from '@/components/ui/resources/emojiMap';

interface LoginViewProps {
  setView: (view: string) => void;
}

export function LoginView({ setView }: LoginViewProps) {
  const [companyName, setCompanyName] = useState('');

  const handleLogin = () => {
    if (companyName.trim()) {
      // Create a new player
      setPlayer({
        companyName: companyName.trim(),
        money: 10000, // Starting money in euros
        createdAt: new Date(),
        lastPlayed: new Date()
      });
      
      setView('Company');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">{uiEmojis.aircraft}</div>
          <CardTitle className="text-2xl font-bold">Blueskye Airways</CardTitle>
          <CardDescription>
            Welcome to the ultimate air management simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="company-name" className="text-sm font-medium">
              Company Name
            </label>
            <Input
              id="company-name"
              placeholder="Enter your airline company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full"
            disabled={!companyName.trim()}
          >
            Start Your Aviation Empire
          </Button>
          
          <div className="text-xs text-center text-muted-foreground mt-4">
            <p>Build your fleet • Manage routes • Dominate the skies</p>
            <p className="mt-1">Starting budget: €10,000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 