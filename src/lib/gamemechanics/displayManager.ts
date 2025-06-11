import { useEffect, useReducer } from 'react';

// Types
type Subscriber = {
  id: string;
  update: () => void;
};

// Simple display manager
const subscribers: Subscriber[] = [];

export function subscribe(callback: () => void): string {
  const id = Math.random().toString(36).substring(2);
  subscribers.push({ id, update: callback });
  return id;
}

export function unsubscribe(id: string): void {
  const index = subscribers.findIndex(sub => sub.id === id);
  if (index !== -1) {
    subscribers.splice(index, 1);
  }
}

export function updateDisplays(): void {
  subscribers.forEach(sub => {
    try {
      sub.update();
    } catch (error) {
      console.error('Error updating display:', error);
    }
  });
}

// React hook for components to use
export function useDisplayUpdate(): void {
  const [, forceRender] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const id = subscribe(forceRender);
    return () => unsubscribe(id);
  }, []);
}

// Helper to wrap state-changing functions
export function withDisplayUpdate<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: Parameters<T>) => {
    const result = fn(...args);
    updateDisplays();
    return result;
  }) as T;
}

// Create a simple display manager object for default export
const displayManager = {
  createActionHandler: withDisplayUpdate,
  updateDisplays
};

export default displayManager; 