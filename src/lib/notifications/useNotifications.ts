import { useState, useEffect } from 'react';
import { notificationService, type NotificationMessage } from './notificationService';

export function useNotifications() {
  const [messages, setMessages] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.useMessages().subscribe(setMessages);
    
    return unsubscribe;
  }, []);

  return {
    messages,
    addMessage: notificationService.addMessage.bind(notificationService),
    clearMessages: notificationService.clearMessages.bind(notificationService),
    info: notificationService.info.bind(notificationService),
    success: notificationService.success.bind(notificationService),
  };
} 