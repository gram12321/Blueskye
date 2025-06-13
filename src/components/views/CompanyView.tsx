import { useState, useEffect } from 'react';
import { getGameState } from '@/lib/gamemechanics/gameState';
import { useDisplayUpdate } from '@/lib/gamemechanics/displayManager';
import { formatNumber, formatCurrency, formatGameDate } from '@/lib/gamemechanics/utils';
import { uiEmojis, formatEuro } from '@/components/ui/resources/emojiMap';
import { ViewHeader } from '@/components/ui/ViewHeader';
import { Card, CardContent } from '@/components/ui/ShadCN';
import { calculateCompanyValue } from '@/lib/finance/financeService';
import { getHighscores, ScoreType } from '@/lib/highscore/highscoreService';

/**
 * Comprehensive company information interface
 * Used for displaying company details in various parts of the app
 */
export interface CompanyInfo {
  // Basic info
  name: string;
  hour: number;
  day: number;
  week: number;
  month: number;
  year: number;
  
  // Financial data
  money: number;
  companyValue: number;
  fleetValue: number;
  buildingValue: number;
  
  // Time info
  createdAt: Date;
  lastPlayed: Date;
  
  // Ranking information (optional)
  rankings?: {
    money?: { position: number; total: number };
    companyValue?: { position: number; total: number };
    moneyPerDay?: { position: number; total: number };
    companyValuePerDay?: { position: number; total: number };
  };
  
  // Player ownership
  isOwnedByCurrentPlayer: boolean;
}

/**
 * Rankings map type used internally for state
 */
type RankingsMap = {
  gold: { position: number; total: number };
  companyValue: { position: number; total: number };
  goldPerWeek: { position: number; total: number };
  companyValuePerWeek: { position: number; total: number };
};

export function CompanyView(): React.ReactElement | null {
  // Use the display manager to update when the game state changes
  useDisplayUpdate();
  
  const gameState = getGameState();
  const [rankings, setRankings] = useState<RankingsMap>({
    gold: { position: 0, total: 0 },
    companyValue: { position: 0, total: 0 },
    goldPerWeek: { position: 0, total: 0 },
    companyValuePerWeek: { position: 0, total: 0 }
  });
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);

  // Get company value using the centralized function
  const companyValue = calculateCompanyValue();
  
  // Format the game date
  const formattedDate = formatGameDate({
    hour: gameState.hour || 0,
    day: gameState.day,
    week: gameState.week,
    month: gameState.month,
    year: gameState.year
  });
  
  // Fetch the company's rankings
  useEffect(() => {
    if (!gameState.player?.companyName) return;
    
    async function fetchRankings() {
      setIsLoadingRankings(true);
      
      try {
        const companyName = gameState.player!.companyName;
        const scoreTypes: ScoreType[] = ['gold', 'companyValue', 'goldPerWeek', 'companyValuePerWeek'];
        const newRankings = { ...rankings };
        
        for (const scoreType of scoreTypes) {
          const scores = await getHighscores(100, scoreType);
          const total = scores.length;
          
          // Find player position in the leaderboard
          const position = scores.findIndex(score => score.companyName === companyName) + 1;
          
          newRankings[scoreType] = { position, total };
        }
        
        setRankings(newRankings);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setIsLoadingRankings(false);
      }
    }
    
    fetchRankings();
  }, [gameState.player?.companyName]);
  
  if (!gameState.player) return null;
  
  // Helper function to format ranking
  const formatRanking = (ranking: { position: number; total: number }): string => {
    if (ranking.position === 0) return "Not ranked";
    return `${ranking.position} / ${ranking.total}`;
  };
  
  // Helper to trigger view changes - will be replaced with proper navigation
  const handleViewChange = (view: string) => {
    console.log(`Navigate to ${view}`); // Placeholder
  };
  
  return (
    <div className="min-h-screen pb-16">
      <ViewHeader 
        title="Company Overview" 
        icon={uiEmojis.company}
        description="Manage your airline company and view key statistics"
      />
      
      <div className="space-y-4 md:space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <p>{uiEmojis.company} Company Name: {gameState.player.companyName}</p>
              <p>{uiEmojis.euro} Money: {formatCurrency(gameState.player.money)}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <p>{uiEmojis.day} Date: {formattedDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-3 md:mb-4">{uiEmojis.euroCoin} Financial Overview</h2>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cash Balance:</span>
                <span>{formatEuro(formatNumber(gameState.player.money, { decimals: 2 }))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fleet Value:</span>
                <span>{formatEuro(formatNumber(companyValue.fleetValue, { decimals: 2 }))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Assets Value:</span>
                <span>{formatEuro(formatNumber(companyValue.buildingValue, { decimals: 2 }))}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-medium">
                <span>Total Company Value:</span>
                <span className="text-lg text-blue-700">{formatEuro(formatNumber(companyValue.companyValue, { decimals: 2 }))}</span>
              </div>
              <button 
                className="mt-2 md:mt-3 text-sm text-primary hover:underline w-full text-left"
                onClick={() => handleViewChange('Finance')}
              >
                View detailed finance report
              </button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg font-semibold">{uiEmojis.trophy} Rankings</h2>
              <button 
                className="text-sm text-primary hover:underline"
                onClick={() => handleViewChange('Highscores')}
              >
                View all
              </button>
            </div>
            
            {isLoadingRankings ? (
              <p className="text-sm text-muted-foreground">Loading company rankings...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Money Ranking</div>
                  <div className="font-medium">{formatRanking(rankings.gold)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Company Value</div>
                  <div className="font-medium">{formatRanking(rankings.companyValue)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Money Per Week</div>
                  <div className="font-medium">{formatRanking(rankings.goldPerWeek)}</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Value Growth Per Week</div>
                  <div className="font-medium">{formatRanking(rankings.companyValuePerWeek)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 