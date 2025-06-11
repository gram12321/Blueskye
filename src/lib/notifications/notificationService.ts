// NOTE FOR AI AGENTS: 
// - Notification system is reserved for in-game messages to the player
// - Console warnings and errors should use the default browser console.log/console.warn/console.error
// - Only use 'info' and 'success' message types for game notifications
export type MessageType = 'info' | 'success';

export interface NotificationMessage {
  id: string;
  timestamp: Date;
  text: string;
  type: MessageType;
  category?: string;
  isStructured?: boolean;
}

interface MessageOptions {
  category?: string;
  isStructured?: boolean;
  messageType?: string;
}

import { toast } from '../../components/ui/ShadCN/use-toast';
import { storageService } from '../localStorage/storageService';
import { getGameState } from '../gamemechanics/gameState';

let notificationMessages: NotificationMessage[] = [];
let messageListeners: ((messages: NotificationMessage[]) => void)[] = [];

function getCurrentCompanyName(): string | null {
  const gameState = getGameState();
  return gameState.player?.companyName ?? null;
}

function notifyListeners() {
  messageListeners.forEach(listener => listener(notificationMessages));
  
  const companyName = getCurrentCompanyName();
  if (companyName) {
    const allCompanies = storageService.getAllCompanies();
    if (allCompanies[companyName]) {
      saveMessagesToStorage(companyName, notificationMessages);
    }
  }
}

function saveMessagesToStorage(companyName: string, messages: NotificationMessage[]) {
  try {
    const messageData = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }));
    localStorage.setItem(`Blueskye_Messages_${companyName}`, JSON.stringify(messageData));
  } catch (error) {
    console.error('Failed to save notification messages:', error);
  }
}

function loadMessagesFromStorage(companyName: string): NotificationMessage[] {
  try {
    const stored = localStorage.getItem(`Blueskye_Messages_${companyName}`);
    if (!stored) return [];
    
    const messageData = JSON.parse(stored);
    return messageData.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load notification messages:', error);
    return [];
  }
}

function loadNotificationMessages() {
  const companyName = getCurrentCompanyName();
  if (!companyName) {
    notificationMessages = [];
    return;
  }

  notificationMessages = loadMessagesFromStorage(companyName);
  notifyListeners();
}

const notificationService = {
  getMessages(): NotificationMessage[] {
    return [...notificationMessages];
  },

  addMessage(text: string, type: MessageType = 'info', options?: MessageOptions): NotificationMessage {
    const message: NotificationMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(),
      text,
      type,
      category: options?.category,
      isStructured: options?.isStructured
    };
    
    notificationMessages = [message, ...notificationMessages];
    
    // Keep only the last 500 messages to prevent memory issues
    if (notificationMessages.length > 500) {
      notificationMessages = notificationMessages.slice(0, 500);
    }
    
    notifyListeners();
    
    const companyName = getCurrentCompanyName();
    if (!companyName) return message;

    // Check if toasts are enabled for this user
    const settings = storageService.loadPlayerSettings(companyName);
    if (settings.showToastNotification) {
      // Show toast notification
      toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: text,
        variant: 'default',
        duration: type === 'success' ? 4000 : 3000,
      });
    }
    
    return message;
  },

  clearMessages(): void {
    notificationMessages = [];
    
    const companyName = getCurrentCompanyName();
    if (companyName) {
      saveMessagesToStorage(companyName, []);
    }
    
    notifyListeners();
  },

  loadMessages(): void {
    loadNotificationMessages();
  },

  info(text: string, options?: MessageOptions): NotificationMessage {
    return this.addMessage(text, 'info', options);
  },

  success(text: string, options?: MessageOptions): NotificationMessage {
    return this.addMessage(text, 'success', options);
  },

  // Hook for components to subscribe to message updates
  useMessages(): {
    messages: NotificationMessage[];
    subscribe: (listener: (messages: NotificationMessage[]) => void) => () => void;
  } {
    const subscribe = (listener: (messages: NotificationMessage[]) => void) => {
      messageListeners.push(listener);
      listener(notificationMessages); // Send current messages immediately
      
      return () => {
        messageListeners = messageListeners.filter(l => l !== listener);
      };
    };

    return {
      messages: notificationMessages,
      subscribe
    };
  }
};

export { notificationService }; 