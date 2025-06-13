// Airport data for Blueskye Air Management Game

import { Airport } from './cityTypes';

export const AIRPORTS: Airport[] = [
  // London airports
  {
    id: 'lhr',
    name: 'London Heathrow Airport',
    code: 'LHR',
    cityId: 'london',
    coordinates: {
      latitude: 51.4700,
      longitude: -0.4543
    },
    gates: 1,
    turnTimeModifier: 1.0 // Normal turn time
  },
  {
    id: 'lgw',
    name: 'London Gatwick Airport',
    code: 'LGW',
    cityId: 'london',
    coordinates: {
      latitude: 51.1481,
      longitude: -0.1903
    },
    gates: 1,
    turnTimeModifier: 1.0 // Normal turn time
  },

  // Paris airports
  {
    id: 'cdg',
    name: 'Charles de Gaulle Airport',
    code: 'CDG',
    cityId: 'paris',
    coordinates: {
      latitude: 49.0097,
      longitude: 2.5479
    },
    gates: 1,
    turnTimeModifier: 1.0 // Normal turn time
  },

  // Lyon airport
  {
    id: 'lys',
    name: 'Lyon-Saint Exupéry Airport',
    code: 'LYS',
    cityId: 'lyon',
    coordinates: {
      latitude: 48.7194,
      longitude: 4.9755
    },
    gates: 1,
    turnTimeModifier: 1.0 // Normal turn time
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