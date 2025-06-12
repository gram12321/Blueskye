// Airport data for Blueskye Air Management Game

import { Airport } from './cityTypes';

export const AIRPORTS: Airport[] = [
  // London airports
  {
    id: 'lhr',
    name: 'London Heathrow',
    code: 'LHR',
    cityId: 'london',
    coordinates: {
      latitude: 51.4700,
      longitude: -0.4543
    }
  },
  {
    id: 'lgw',
    name: 'London Gatwick',
    code: 'LGW',
    cityId: 'london',
    coordinates: {
      latitude: 51.1481,
      longitude: -0.1903
    }
  },
  // Paris airports
  {
    id: 'cdg',
    name: 'Paris Charles de Gaulle',
    code: 'CDG',
    cityId: 'paris',
    coordinates: {
      latitude: 49.0097,
      longitude: 2.5479
    }
  },
  // Lyon airport
  {
    id: 'lys',
    name: 'Lyon Saint-Exupéry',
    code: 'LYS',
    cityId: 'lyon',
    coordinates: {
      latitude: 45.7256,
      longitude: 5.0811
    }
  }
];

// Airport management functions
export function getAirport(id: string): Airport | undefined {
  return AIRPORTS.find(airport => airport.id === id);
}

export function getAllAirports(): Airport[] {
  return AIRPORTS;
}

export function getAirportsByCity(cityId: string): Airport[] {
  return AIRPORTS.filter(airport => airport.cityId === cityId);
} 