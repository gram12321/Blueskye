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
}

// Airport interface for the new airport-based route system
export interface Airport {
  id: string;
  name: string;
  code: string; // IATA/ICAO code
  cityId: string; // Associated city
  coordinates: Coordinates;
  gates: number; // Number of gates - affects capacity and turn time
  turnTimeModifier: number; // Multiplier for aircraft turn times (1.0 = normal, >1.0 = slower)
}

// Individual passenger with destination preference
export interface Passenger {
  id: string;
  originCityId: string;
  destinationCityId: string;
  originAirportId: string; // Which airport they'll use for departure
  createdWeek: number; // Game week when passenger was generated
}

// CityPair and PassengerDemand interfaces moved to routeService.ts for better organization 