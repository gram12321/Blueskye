// Distance and travel time calculation service for Blueskye Air Management Game

import { Coordinates } from './cityTypes';
import { getCity } from './cityData';

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate distance between two cities
export function calculateCityDistance(cityId1: string, cityId2: string): number {
  const city1 = getCity(cityId1);
  const city2 = getCity(cityId2);
  
  if (!city1 || !city2) {
    return 0;
  }
  
  return calculateDistance(city1.coordinates, city2.coordinates);
}

// Calculate travel time between cities based on aircraft speed
export function calculateTravelTime(cityId1: string, cityId2: string, aircraftSpeed: number): number {
  const distance = calculateCityDistance(cityId1, cityId2);
  
  if (distance === 0 || aircraftSpeed === 0) {
    return 0;
  }
  
  // Add 30 minutes for takeoff/landing procedures
  const flightTime = (distance / aircraftSpeed) + 0.5;
  
  return Math.round(flightTime * 10) / 10; // Round to 1 decimal place
}


// Get distance between specific cities
export function getCityPairDistance(originId: string, destinationId: string): number {
  return calculateCityDistance(originId, destinationId);
}

// Check if route is within aircraft range
export function isRouteInRange(originId: string, destinationId: string, aircraftRange: number): boolean {
  const distance = calculateCityDistance(originId, destinationId);
  return distance <= aircraftRange;
}

// Calculate fuel consumption for a route
export function calculateFuelConsumption(originId: string, destinationId: string, fuelConsumptionRate: number): number {
  const distance = calculateCityDistance(originId, destinationId);
  return Math.round(distance * fuelConsumptionRate);
} 