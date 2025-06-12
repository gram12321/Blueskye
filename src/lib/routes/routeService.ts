// New route management service for Blueskye Air Management Game
// Supports permanent routes with aircraft assignment

import { Route, Flight, RouteStats } from './routeTypes';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAircraft, updateAircraftStatus } from '../aircraft/fleetService';
import { getAircraftType } from '../aircraft/aircraftData';
import { calculateCityDistance, calculateTravelTime } from '../geography/distanceService';
import { getCity } from '../geography/cityData';


// Generate unique IDs
function generateRouteId(): string {
  return 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}



// Create a new permanent route
export const createRoute = displayManager.createActionHandler((
  name: string,
  originCityId: string,
  destinationCityId: string,
  pricePerPassenger?: number
): Route | null => {
  const originCity = getCity(originCityId);
  const destinationCity = getCity(destinationCityId);
  
  if (!originCity || !destinationCity) {
    return null;
  }
  
  const distance = calculateCityDistance(originCityId, destinationCityId);
  const isDomestic = originCity.country === destinationCity.country;
  
  // Calculate optimal pricing if not provided
  const pricing = pricePerPassenger || calculateOptimalPricing(
    distance,
    isDomestic,
    originCity,
    destinationCity
  );
  
  // Use aircraft speed for flight time calculation (will be recalculated when aircraft assigned)
  const averageSpeed = 800; // km/h - average commercial aircraft speed
  const flightTime = calculateTravelTime(originCityId, destinationCityId, averageSpeed);
  
  const newRoute: Route = {
    id: generateRouteId(),
    name,
    originCityId,
    destinationCityId,
    distance,
    flightTime,
    isActive: false,
    assignedAircraftIds: [],
    pricePerPassenger: pricing,
    totalFlights: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageLoadFactor: 0
  };
  
  const gameState = getGameState();
  const currentRoutes = gameState.routes || [];
  updateGameState({ routes: [...currentRoutes, newRoute] });
  
  return newRoute;
});

// Assign aircraft to a route
export const assignAircraftToRoute = displayManager.createActionHandler((
  routeId: string,
  aircraftId: string
): boolean => {
  const gameState = getGameState();
  const routes = gameState.routes || [];
  const aircraft = getAircraft(aircraftId);
  const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
  
  if (!aircraft || !aircraftType || aircraft.status !== 'available') {
    return false;
  }
  
  const routeIndex = routes.findIndex(r => r.id === routeId);
  if (routeIndex === -1) {
    return false;
  }
  
  const route = routes[routeIndex];
  
  // Check if route is within aircraft range
  if (route.distance > aircraftType.range) {
    return false;
  }
  
  // Update route with assigned aircraft
  const updatedRoutes = [...routes];
  updatedRoutes[routeIndex] = {
    ...route,
    assignedAircraftIds: [...route.assignedAircraftIds, aircraftId],
    isActive: true,
    flightTime: calculateTravelTime(route.originCityId, route.destinationCityId, aircraftType.speed)
  };
  
  updateGameState({ routes: updatedRoutes });
  
  // Update aircraft status to show it's assigned to route
  updateAircraftStatus(aircraftId, 'available', routeId);
  
  return true;
});

// Remove aircraft from a route
export const removeAircraftFromRoute = displayManager.createActionHandler((
  routeId: string,
  aircraftId: string
): boolean => {
  const gameState = getGameState();
  const routes = gameState.routes || [];
  
  const routeIndex = routes.findIndex(r => r.id === routeId);
  if (routeIndex === -1) {
    return false;
  }
  
  const route = routes[routeIndex];
  
  // Remove aircraft from route
  const updatedRoutes = [...routes];
  updatedRoutes[routeIndex] = {
    ...route,
    assignedAircraftIds: route.assignedAircraftIds.filter(id => id !== aircraftId),
    isActive: route.assignedAircraftIds.filter(id => id !== aircraftId).length > 0
  };
  
  updateGameState({ routes: updatedRoutes });
  
  // Update aircraft status
  updateAircraftStatus(aircraftId, 'available');
  
  return true;
});

// Get all routes
export function getAllRoutes(): Route[] {
  const gameState = getGameState();
  return gameState.routes || [];
}

// Get route by ID
export function getRoute(routeId: string): Route | undefined {
  const routes = getAllRoutes();
  return routes.find(route => route.id === routeId);
}

// Get active flights
export function getActiveFlights(): Flight[] {
  const gameState = getGameState();
  return gameState.activeFlights || [];
}

// Get route statistics
export function getRouteStats(): RouteStats {
  const gameState = getGameState();
  const routes = gameState.routes || [];

  const completedFlights = gameState.completedFlights || [];
  
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.isActive).length;
  const inactiveRoutes = routes.filter(r => !r.isActive).length;
  const assignedAircraft = routes.reduce((sum, route) => sum + route.assignedAircraftIds.length, 0);
  
  const totalFlights = completedFlights.length;
  const totalRevenue = routes.reduce((sum, route) => sum + route.totalRevenue, 0);
  const totalProfit = routes.reduce((sum, route) => sum + route.totalProfit, 0);
  
  // Calculate average load factor across all routes
  const totalCapacity = completedFlights.reduce((sum, flight) => sum + flight.maxPassengers, 0);
  const totalPassengers = completedFlights.reduce((sum, flight) => sum + flight.passengers, 0);
  const averageLoadFactor = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  
  return {
    totalRoutes,
    activeRoutes,
    inactiveRoutes,
    assignedAircraft,
    totalFlights,
    totalRevenue,
    totalProfit,
    averageLoadFactor: Math.round(averageLoadFactor * 10) / 10
  };
}

// Calculate optimal pricing (simplified version)
function calculateOptimalPricing(
  distance: number,
  isDomestic: boolean,
  _originCity: any,
  _destinationCity: any
): number {
  const basePrice = isDomestic ? 0.10 : 0.13; // euros per km
  let distancePrice = distance * basePrice;
  
  // Distance-based pricing adjustments
  if (distance < 500) {
    distancePrice *= 1.3;
  } else if (distance > 5000) {
    distancePrice *= 0.85;
  }
  
  const baseFee = isDomestic ? 45 : 75;
  const finalPrice = distancePrice + baseFee;
  const minimumPrice = isDomestic ? 60 : 90;
  
  return Math.max(minimumPrice, Math.round(finalPrice));
}

// Delete a route (only if no aircraft assigned)
export const deleteRoute = displayManager.createActionHandler((routeId: string): boolean => {
  const gameState = getGameState();
  const routes = gameState.routes || [];
  
  const route = routes.find(r => r.id === routeId);
  if (!route || route.assignedAircraftIds.length > 0) {
    return false; // Cannot delete route with assigned aircraft
  }
  
  const updatedRoutes = routes.filter(r => r.id !== routeId);
  updateGameState({ routes: updatedRoutes });
  
  return true;
}); 