// Placeholder highscore service for Blueskye Air Management Game

export type ScoreType = 'gold' | 'companyValue' | 'goldPerWeek' | 'companyValuePerWeek';

export interface HighScore {
  companyName: string;
  score: number;
  date: Date;
}

// Placeholder function - will be implemented with proper storage later
export async function getHighscores(_limit: number = 10, _scoreType: ScoreType = 'gold'): Promise<HighScore[]> {
  // Return empty array for now - this will be expanded later
  return [];
} 