import { getGameState } from '../../lib/gamemechanics/gameState';
import { advanceDay } from '../../lib/gamemechanics/gameTick';
import { formatNumber, formatGameDate } from '@/lib/gamemechanics/utils';
import { cn } from '@/lib/gamemechanics/tailwindUtils';
import { displayManager, useDisplayUpdate } from '@/lib/gamemechanics/displayManager';
import { Button, Badge, Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/ShadCN';
import { MenuIcon, User, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { uiEmojis } from '@/components/ui/resources/emojiMap';
import { useState } from 'react';
import { playerService } from '../../lib/player/playerService';
import type { View } from '../../App';
import { MessageLog } from '../ui/MessageLog';

interface TopBarProps {
  readonly currentView: View;
  readonly setView: (view: View) => void;
  readonly onLogout: () => void;
}

interface NavigationItem {
  name: string;
  view: string;
  icon: string;
}

// Simplified navigation items for air management game
const navigation: NavigationItem[] = [
  { name: 'Company', view: 'Company', icon: uiEmojis.company },
  { name: 'Fleet', view: 'Fleet', icon: uiEmojis.aircraft },
  { name: 'Routes', view: 'Routes', icon: uiEmojis.route },
  { name: 'Geography', view: 'Geography', icon: uiEmojis.map },
  { name: 'Finance', view: 'Finance', icon: uiEmojis.finance },
  { name: 'Tradepedia', view: 'Tradepedia', icon: uiEmojis.book },
];

export function TopBar({ currentView, setView, onLogout }: TopBarProps) {
  useDisplayUpdate();
  const gameState = getGameState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdvanceDay = displayManager.createActionHandler(() => {
    advanceDay();
  });

  const handleNavigation = (newView: string) => {
    setView(newView as View);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    playerService.logout();
    onLogout();
  };

  const formattedDate = formatGameDate({
    day: gameState.day || 1,
    week: gameState.week || 1,
    month: gameState.month || 1,
    year: gameState.year || 2024,
  });

  return (
    <>
      <div className="w-full bg-[hsl(var(--primary))] text-primary-foreground p-2 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-xl font-bold p-0"
              onClick={() => handleNavigation('Company')}
            >
              Blueskye Airways
            </Button>
            
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="flex space-x-1">
                {navigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <Button
                      id={`nav-${item.view.toLowerCase()}`}
                      variant="ghost"
                      onClick={() => handleNavigation(item.view)}
                      className={cn(
                        "text-primary-foreground px-2",
                        currentView === item.view ? "bg-[hsl(var(--primary))]/20" : ""
                      )}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Button>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline"
              className="px-2 py-1 hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              <span>{uiEmojis.day}</span>
              <span className="font-medium">
                {formattedDate}
              </span>
            </Badge>
            
            <Badge 
              variant="outline"
              className="px-2 py-1 flex sm:hidden items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              <span>{uiEmojis.day}</span>
              <span className="font-medium">
                Week {gameState.week}
              </span>
            </Badge>
            
            <Button 
              id="end-day-button"
              onClick={handleAdvanceDay}
              variant="secondary" 
              size="sm"
              className="hidden sm:flex items-center gap-1.5 px-2 transition-all hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300 border border-transparent group"
            >
              <span className="group-hover:animate-pulse">{uiEmojis.time}</span>
              <span>End Day</span>
            </Button>
            
            <Button 
              id="end-day-button-mobile"
              onClick={handleAdvanceDay}
              variant="ghost" 
              size="icon"
              className="sm:hidden text-primary-foreground"
            >
              <span className="text-lg">{uiEmojis.time}</span>
            </Button>
            
            <Badge 
              id="money-display"
              variant="secondary" 
              className="px-2 py-1 flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
              onClick={() => handleNavigation('Finance')}
            >
              <span>{uiEmojis.euro}</span>
              <span className="font-medium">
                {gameState.player ? formatNumber(gameState.player.money) : '0'}
              </span>
            </Badge>
            
            {gameState.player && <MessageLog />}
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full text-primary-foreground hidden lg:flex"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="Player" />
                    <AvatarFallback className="bg-[hsl(var(--primary))]/20">
                      {gameState.player?.companyName?.substring(0, 2).toUpperCase() ?? 'P'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {gameState.player?.companyName ?? 'Player'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {[
                  { view: 'Profile', icon: User, label: 'Profile' },
                  { view: 'Settings', icon: Settings, label: 'Settings' },
                  { view: 'Admin', icon: ShieldCheck, label: 'Admin Dashboard' },
                ].map(({ view: viewName, icon: Icon, label }) => (
                  <DropdownMenuItem 
                    key={viewName} 
                    onClick={() => handleNavigation(viewName as View)}
                    id={`nav-${viewName.toLowerCase()}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label ?? viewName}</span>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-[hsl(var(--primary))]/20">
            <div className="flex flex-col space-y-1 mt-4">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.view as View)}
                  className={cn(
                    "justify-start text-primary-foreground",
                    currentView === item.view ? "bg-[hsl(var(--primary))]/20" : ""
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
} 