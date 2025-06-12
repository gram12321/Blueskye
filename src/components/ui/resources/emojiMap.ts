// UI Element Emojis for Blueskye Air Management Game
export const uiEmojis = {
  company: '🏢',
  euro: '💰',
  euroCoin: '💶',
  day: '📅',
  time: '⏰',
  settings: '⚙️',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  market: '🏪',
  inventory: '📦',
  production: '🏭',
  upgrade: '⬆️',
  loading: '⏳',
  buildings: '🏗️',
  person: '👤',
  population: '👥',
  book: '📚',
  tradepedia: '📚',
  speed: '⚡',
  trophy: '🏆',
  aircraft: '✈️',
  airport: '🛬',
  flight: '🛫',
  passenger: '👤',
  cargo: '📦',
  fuel: '⛽',
  route: '🗺️',
  map: '🗺️',
  finance: '💼',
  fleet: '🚁',
  message: '💬',
  calendar: '📅',
  menu: '☰',
  navigation: '🧭'
};

// Resource Emojis (basic set for air management)
export const resourceEmojis: { [key: string]: string } = {
  // Currency
  'Euro': '💰',
  'Money': '💰',
  
  // Air Management Resources
  'Fuel': '⛽',
  'Aircraft': '✈️',
  'Passengers': '👥',
  'Cargo': '📦',
  'Maintenance': '🔧',
  'Staff': '👨‍✈️',
  'Airport Slots': '🛬',
  'Licenses': '📜',
  
  // Default
  'default': '❔',
};

// Helper functions
export const getResourceEmoji = (resourceName: string): string => {
  return resourceEmojis[resourceName] || resourceEmojis.default;
};

export const formatResourceWithEmoji = (resourceName: string, amount: number | string): string => {
  const emoji = getResourceEmoji(resourceName);
  return `${emoji} ${amount} ${resourceName}`;
};

export const formatEuro = (amount: number | string): string => {
  return `€${amount}`;
}; 