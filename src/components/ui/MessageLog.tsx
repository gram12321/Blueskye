import { useState } from 'react';
import { Bell, Info, CheckCircle, X } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  Button,
  Badge,
  ScrollArea
} from './ShadCN';
import { useNotifications } from '../../lib/notifications/useNotifications';
import { cn } from '../../lib/gamemechanics/tailwindUtils';
import type { MessageType } from '../../lib/notifications/notificationService';

export function MessageLog() {
  const { messages, clearMessages } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  // Show only the last 10 messages
  const recentMessages = messages.slice(0, 10);
  const unreadCount = recentMessages.length;

  const getIconForType = (type: MessageType) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getColorForType = (type: MessageType) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'success': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleClearMessages = () => {
    clearMessages();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative text-primary-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Messages</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {messages.length} total
              </Badge>
              {messages.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClearMessages}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {recentMessages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No messages yet
            </div>
          ) : (
            <div className="p-2">
              {recentMessages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors",
                    index < recentMessages.length - 1 && "border-b border-border/30"
                  )}
                >
                  <div className={cn("mt-0.5", getColorForType(message.type))}>
                    {getIconForType(message.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-relaxed">
                      {message.text}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTime(message.timestamp)}</span>
                      {message.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                            {message.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {messages.length > 10 && (
          <div className="px-4 py-2 border-t bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">
              Showing last 10 messages of {messages.length} total
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 