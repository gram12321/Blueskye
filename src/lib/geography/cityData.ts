// City data for Blueskye Air Management Game

import { City } from './cityTypes';

export const CITIES: City[] = [
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    population: 9500000,
    coordinates: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    passengerDemandMultiplier: 1.5, // High demand due to business hub
    domesticPreference: 0.3 // Low domestic preference (island nation)
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    population: 11000000,
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    passengerDemandMultiplier: 1.4, // High demand due to tourism and business
    domesticPreference: 0.6 // Moderate domestic preference
  },
  {
    id: 'lyon',
    name: 'Lyon',
    country: 'France',
    population: 2300000,
    coordinates: {
      latitude: 45.7640,
      longitude: 4.8357
    },
    passengerDemandMultiplier: 1.0, // Standard demand
    domesticPreference: 0.7 // Higher domestic preference (regional city)
  }
];

export function getCity(id: string): City | undefined {
  return CITIES.find(city => city.id === id);
}

export function getAllCities(): City[] {
  return CITIES;
}

export function getCitiesByCountry(country: string): City[] {
  return CITIES.filter(city => city.country === country);
} 