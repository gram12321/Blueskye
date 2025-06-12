// City and geography type definitions for Blueskye Air Management Game

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  population: number;
  coordinates: Coordinates;
  passengerDemandMultiplier: number; // 0.5-2.0, affects passenger generation
  domesticPreference: number; // 0-1, preference for domestic routes
}

// CityPair and PassengerDemand interfaces moved to routeService.ts for better organization 