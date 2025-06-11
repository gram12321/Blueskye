import { getGameState } from '../../lib/gamemechanics/gameState';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Input, Label, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, RadioGroup, RadioGroupItem } from '../ui/ShadCN';
import { getCurrentPlayer, loginOrCreateCompany, getCompanyDetails } from '../../lib/player/playerService';
import { useEffect, useState } from 'react';
import { storageService, PlayerData } from '../../lib/localStorage/storageService';
import { formatNumber, formatGameDate, STARTING_YEAR, STARTING_SEASON, STARTING_WEEK, calculateAbsoluteWeeks, Season } from '../../lib/gamemechanics/utils';
import { formatEuro } from '../ui/resources/emojiMap';
import { CompanyInfo } from './CompanyView';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import type { View } from '../../App';

// Define a set of avatar options
const AVATAR_OPTIONS = [
  { id: 'default', emoji: '👤', label: 'Default' },
  { id: 'businessman', emoji: '👨‍💼', label: 'Businessman' },
  { id: 'businesswoman', emoji: '👩‍💼', label: 'Businesswoman' },
  { id: 'pilot', emoji: '👨‍✈️', label: 'Pilot' },
  { id: 'aviator', emoji: '🧑‍✈️', label: 'Aviator' },
  { id: 'mechanic', emoji: '🧑‍🔧', label: 'Mechanic' },
  { id: 'office', emoji: '🧑‍💻', label: 'Office Worker' },
  { id: 'manager', emoji: '👔', label: 'Manager' },
  { id: 'engineer', emoji: '👷', label: 'Engineer' },
  { id: 'captain', emoji: '🧑‍✈️', label: 'Captain' }
];

// Define a set of color options
const COLOR_OPTIONS = [
  { id: 'blue', value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { id: 'green', value: 'bg-green-100 text-green-800', label: 'Green' },
  { id: 'red', value: 'bg-red-100 text-red-800', label: 'Red' },
  { id: 'purple', value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { id: 'yellow', value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { id: 'pink', value: 'bg-pink-100 text-pink-800', label: 'Pink' },
  { id: 'indigo', value: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { id: 'gray', value: 'bg-gray-100 text-gray-800', label: 'Gray' },
];

interface ProfileViewProps {
  setView: (view: View) => void;
}

export function ProfileView({ setView }: ProfileViewProps) {
  const gameState = getGameState();
  const currentCompanyName = gameState.player?.companyName;
  const [playerData, setPlayerData] = useState<PlayerData | undefined>(undefined);
  const [companyDetails, setCompanyDetails] = useState<Record<string, CompanyInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'name' | 'money' | 'value' | 'lastPlayed' | 'ageInWeeks'>('name');
  
  // Subscribe to display updates
  useDisplayUpdate();
  
  useEffect(() => {
    const player = getCurrentPlayer();
    setPlayerData(player);
    
    if (player) {
      setEditName(player.name);
      setSelectedAvatar(player.avatar || 'default');
      setSelectedColor(player.avatarColor || 'blue');
      
      if (player.companies.length > 0) {
        loadCompanyDetails(player.companies);
      }
    }
  }, []);
  
  const loadCompanyDetails = (companyNames: string[]) => {
    const details = getCompanyDetails(companyNames);
    setCompanyDetails(details);
  };

  // Helper function to calculate total weeks elapsed for a company
  const calculateWeeksElapsed = (company: CompanyInfo): number => {
    if (company.year == null || company.season == null || company.week == null) {
      return 0; 
    }
    
    // Use the new utility function - cast season string to Season type
    const companyAbsoluteWeeks = calculateAbsoluteWeeks(company.year, company.season as Season, company.week);
    const gameStartAbsoluteWeeks = calculateAbsoluteWeeks(STARTING_YEAR, STARTING_SEASON, STARTING_WEEK);
    
    // Ensure at least 1 week if the company date is valid but somehow same as start date after calculation
    if (companyAbsoluteWeeks === 0 && (company.year >= STARTING_YEAR)) return 1;
    if (companyAbsoluteWeeks === 0) return 0;

    return Math.max(1, companyAbsoluteWeeks - gameStartAbsoluteWeeks + 1);
  };

  // Calculate aggregated stats across all companies
  const calculateTotalStats = () => {
    if (!companyDetails || Object.keys(companyDetails).length === 0) {
      return { totalMoney: 0, totalValue: 0, totalCompanies: 0, avgWeeks: 0 };
    }
    
    const companies = Object.values(companyDetails);
    const totalMoney = companies.reduce((sum, company) => sum + company.money, 0);
    const totalValue = companies.reduce((sum, company) => sum + company.companyValue, 0);
    const totalWeeksSum = companies.reduce((sum, company) => sum + calculateWeeksElapsed(company), 0);
    const avgWeeks = companies.length > 0 ? totalWeeksSum / companies.length : 0;
    
    return {
      totalMoney,
      totalValue,
      totalCompanies: companies.length,
      avgWeeks: Math.round(avgWeeks)
    };
  };

  // Refresh company details
  const handleRefresh = () => {
    if (!playerData || playerData.companies.length === 0) return;
    
    setIsRefreshing(true);
    try {
      loadCompanyDetails(playerData.companies);
      console.log('Company information has been updated.');
    } catch (error) {
      console.error("Error refreshing company details:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Helper function to format the last played date
  const formatLastPlayed = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Handle selecting a company to switch to
  const handleSelectCompany = async (selectedCompany: string) => {
    if (selectedCompany === currentCompanyName) {
      console.log(`Already active: ${selectedCompany}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await loginOrCreateCompany(selectedCompany);
      
      if (result.success) {
        // Switch to Company view
        setView('Company');
        console.log(`Now running ${selectedCompany}.`);
      } else {
        console.error('Failed to switch company:', result.errorMessage);
      }
    } catch (error) {
      console.error("Error switching company:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle updating player name
  const handleUpdatePlayerProfile = () => {
    if (!playerData || !editName.trim()) return;
    
    try {
      const updatedPlayer = { 
        ...playerData, 
        name: editName.trim(),
        avatar: selectedAvatar,
        avatarColor: selectedColor
      };
      storageService.savePlayerData(updatedPlayer);
      setPlayerData(updatedPlayer);
      setIsEditDialogOpen(false);
      
      console.log('Your player profile has been updated successfully.');
    } catch (error) {
      console.error("Error updating player profile:", error);
    }
  };
  
  // Get color class
  const getColorClass = (colorId: string) => {
    return COLOR_OPTIONS.find(c => c.id === colorId)?.value || COLOR_OPTIONS[0].value;
  };
  
  // Sort companies
  const getSortedCompanies = () => {
    if (!playerData || !companyDetails) return [];
    
    return [...playerData.companies].sort((a, b) => {
      const companyA = companyDetails[a];
      const companyB = companyDetails[b];
      
      if (!companyA || !companyB) return 0;
      
      switch (sortOption) {
        case 'name':
          return companyA.name.localeCompare(companyB.name);
        case 'ageInWeeks':
          return calculateWeeksElapsed(companyB) - calculateWeeksElapsed(companyA);
        case 'money':
          return companyB.money - companyA.money;
        case 'value':
          return companyB.companyValue - companyA.companyValue;
        case 'lastPlayed':
          return new Date(companyB.lastPlayed).getTime() - new Date(companyA.lastPlayed).getTime();
        default:
          return 0;
      }
    });
  };

  if (!playerData || !playerData.name) {
    return (
      <div className="h-screen flex flex-col">
        <ViewHeader 
          title="Player Profile" 
          icon="👤"
          description="No player profile found"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-medium mb-4">No Player Profile Set</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created a player profile yet. You can create one from the login screen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateTotalStats();
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === (playerData.avatar || 'default'))?.emoji || '👤';
  const colorClass = getColorClass(playerData.avatarColor || 'blue');

  return (
    <div className="h-screen flex flex-col">
      <ViewHeader 
        title="Player Profile" 
        icon="👤"
        description="View and manage your player profile"
      />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-auto p-4">
        {/* Player Information Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Player Profile</DialogTitle>
                      <DialogDescription>Customize your player appearance and information.</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="basic">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="avatar">Avatar</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic" className="pt-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="playerName">Player Name</Label>
                            <Input
                              id="playerName"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="avatar" className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="block mb-3">Avatar</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {AVATAR_OPTIONS.map((avatar) => (
                                <div 
                                  key={avatar.id}
                                  className={`p-3 border rounded-md flex items-center justify-center cursor-pointer text-2xl transition-all ${
                                    selectedAvatar === avatar.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                                  }`}
                                  onClick={() => setSelectedAvatar(avatar.id)}
                                >
                                  <span>{avatar.emoji}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="block mb-3">Background Color</Label>
                            <RadioGroup 
                              value={selectedColor} 
                              onValueChange={setSelectedColor}
                              className="grid grid-cols-4 gap-2"
                            >
                              {COLOR_OPTIONS.map((color) => (
                                <div 
                                  key={color.id}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem 
                                    value={color.id} 
                                    id={`color-${color.id}`} 
                                    className="peer sr-only" 
                                  />
                                  <Label
                                    htmlFor={`color-${color.id}`}
                                    className={`${color.value} flex-1 h-8 rounded-md border border-muted cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary flex items-center justify-center text-xs font-medium`}
                                  >
                                    {color.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          
                          <div className="pt-4 border-t border-border">
                            <h3 className="text-sm font-medium mb-2">Preview</h3>
                            <div className="flex justify-center">
                              <div className={`w-16 h-16 ${getColorClass(selectedColor)} rounded-full flex items-center justify-center`}>
                                <span className="text-2xl">{AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleUpdatePlayerProfile}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2 pb-4">
              <div className={`w-24 h-24 ${colorClass} rounded-full flex items-center justify-center mb-4`}>
                <span className="text-4xl">
                  {avatarEmoji}
                </span>
              </div>
              <h2 className="text-xl font-semibold">{playerData.name}</h2>
              <p className="text-sm text-muted-foreground">
                Account created {new Date(playerData.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 text-sm text-muted-foreground w-full space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span>Player ID:</span>
                  <span className="font-mono">{playerData.id.substring(0, 10)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Player Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Stats</CardTitle>
              <CardDescription>Combined statistics for all your companies</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Companies</p>
                      <p className="text-xl font-semibold">{stats.totalCompanies}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Avg. Week</p>
                      <p className="text-xl font-semibold">{stats.avgWeeks}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Money</p>
                      <p className="text-xl font-semibold">{formatEuro(formatNumber(stats.totalMoney, { decimals: 0 }))}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                      <p className="text-xl font-semibold">{formatEuro(formatNumber(stats.totalValue, { decimals: 0 }))}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Companies Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Your Companies</CardTitle>
              <CardDescription>Click on a company to switch to it</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortOption}
                onValueChange={(value: any) => setSortOption(value)}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="ageInWeeks">Age (Weeks)</SelectItem>
                  <SelectItem value="money">Money (highest first)</SelectItem>
                  <SelectItem value="value">Value (highest first)</SelectItem>
                  <SelectItem value="lastPlayed">Last played</SelectItem>
                </SelectContent>
              </Select>
              
              {isLoading && <span className="text-xs text-muted-foreground">Switching...</span>}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0" 
                      onClick={handleRefresh}
                      disabled={isRefreshing || isLoading}
                    >
                      <span className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
                        🔄
                      </span>
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh company information</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {playerData.companies.length === 0 ? (
              <div className="text-center p-6 border rounded-lg">
                <p className="text-muted-foreground mb-4">You don't have any companies yet.</p>
                <Button
                  onClick={() => setView('Login')}
                  variant="outline"
                >
                  Create Your First Company
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getSortedCompanies().map(companyName => {
                  const details = companyDetails[companyName];
                  return (
                    <Card 
                      key={companyName} 
                      className={`hover:bg-accent/5 transition-colors cursor-pointer relative ${
                        currentCompanyName === companyName ? 'border-primary border-2' : ''
                      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => handleSelectCompany(companyName)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm truncate">{companyName}</h3>
                              <p className="text-xs text-muted-foreground">
                                {details && details.week != null && details.season != null && details.year != null 
                                  ? formatGameDate({ week: details.week, season: details.season, year: details.year })
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                          {currentCompanyName === companyName && (
                            <Badge className="bg-primary">Current</Badge>
                          )}
                        </div>
                        
                        {details && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Money</span>
                              <span className="font-medium">{formatEuro(formatNumber(details.money, { decimals: 0 }))}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Company Value</span>
                              <span className="font-medium">{formatEuro(formatNumber(details.companyValue, { decimals: 0 }))}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Fleet Value</span>
                              <span className="font-medium">{formatEuro(formatNumber(details.fleetValue || 0, { decimals: 0 }))}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Last Played</span>
                              <span className="font-medium">{formatLastPlayed(details.lastPlayed)}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              onClick={() => setView('Login')}
              variant="outline"
              className="w-full"
            >
              Go to Login Screen
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 