// Route management service for Blueskye Air Management Game

import { Route, RouteStats } from './routeTypes';
import { getGameState, updateGameState, updatePlayerMoney } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAircraft, updateAircraftStatus, addFlightHours } from '../aircraft/fleetService';
import { getAircraftType } from '../aircraft/aircraftData';
import { calculateCityDistance, calculateTravelTime, calculateFuelConsumption } from '../geography/distanceService';
import { getCity } from '../geography/cityData';

// Generate unique route ID
function generateRouteId(): string {
  return 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Calculate passenger demand for a route
function calculatePassengerDemand(originCityId: string, destinationCityId: string): number {
  const originCity = getCity(originCityId);
  const destinationCity = getCity(destinationCityId);
  
  if (!originCity || !destinationCity) {
    return 0;
  }
  
  const distance = calculateCityDistance(originCityId, destinationCityId);
  const isDomestic = originCity.country === destinationCity.country;
  
  // Base demand calculation
  const populationFactor = Math.sqrt(originCity.population / 1000000); // Scale by population
  const demandMultiplier = originCity.passengerDemandMultiplier;
  const domesticBonus = isDomestic ? (1 + originCity.domesticPreference) : 1;
  
  // Distance affects demand (diminishing returns for very long routes)
  const distanceMultiplier = Math.max(0.2, 1 - (distance / 15000));
  
  const baseDemand = populationFactor * demandMultiplier * domesticBonus * distanceMultiplier * 80;
  
  // Add some randomness (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4;
  
  return Math.max(10, Math.round(baseDemand * randomFactor));
}

// Calculate optimal pricing based on distance and demand
function calculateOptimalPricing(distance: number, isDomestic: boolean): number {
  const basePrice = isDomestic ? 0.12 : 0.15; // euros per km
  const distancePrice = distance * basePrice;
  
  // Add base fee
  const baseFee = isDomestic ? 50 : 80;
  
  return Math.round(distancePrice + baseFee);
}

// Create a new route
export const createRoute = displayManager.createActionHandler((
  originCityId: string,
  destinationCityId: string,
  aircraftId: string,
  pricePerPassenger?: number
): Route | null => {
  const aircraft = getAircraft(aircraftId);
  const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
  const originCity = getCity(originCityId);
  const destinationCity = getCity(destinationCityId);
  
  if (!aircraft || !aircraftType || !originCity || !destinationCity) {
    return null;
  }
  
  // Check if aircraft is available
  if (aircraft.status !== 'available') {
    return null;
  }
  
  const distance = calculateCityDistance(originCityId, destinationCityId);
  
  // Check if route is within aircraft range
  if (distance > aircraftType.range) {
    return null;
  }
  
  const flightTime = calculateTravelTime(originCityId, destinationCityId, aircraftType.speed);
  const passengerDemand = calculatePassengerDemand(originCityId, destinationCityId);
  const passengers = Math.min(passengerDemand, aircraftType.maxPassengers);
  
  // Use provided pricing or calculate optimal pricing
  const pricing = pricePerPassenger || calculateOptimalPricing(distance, originCity.country === destinationCity.country);
  
  const fuelCost = calculateFuelConsumption(originCityId, destinationCityId, aircraftType.fuelConsumption) * 1.2; // 1.2 euros per liter
  const totalRevenue = passengers * pricing;
  const profit = totalRevenue - fuelCost;
  
  const now = new Date();
  const estimatedArrival = new Date(now.getTime() + (flightTime * 60 * 60 * 1000));
  
  const newRoute: Route = {
    id: generateRouteId(),
    originCityId,
    destinationCityId,
    aircraftId,
    status: 'scheduled',
    departureTime: now,
    estimatedArrival,
    distance,
    flightTime,
    passengers,
    maxPassengers: aircraftType.maxPassengers,
    pricePerPassenger: pricing,
    totalRevenue,
    fuelCost,
    profit,
    currentProgress: 0,
    remainingTime: flightTime
  };
  
  // Add to routes and update aircraft status
  const gameState = getGameState();
  const currentRoutes = gameState.activeRoutes || [];
  updateGameState({ activeRoutes: [...currentRoutes, newRoute] });
  updateAircraftStatus(aircraftId, 'in-flight', newRoute.id);
  
  return newRoute;
});

// Get all active routes
export function getActiveRoutes(): Route[] {
  const gameState = getGameState();
  return gameState.activeRoutes || [];
}

// Get route by ID
export function getRoute(routeId: string): Route | undefined {
  const routes = getActiveRoutes();
  return routes.find(route => route.id === routeId);
}

// Update route progress (called during game tick)
export const updateRouteProgress = displayManager.createActionHandler((routeId: string, progressIncrement: number): void => {
  const gameState = getGameState();
  const currentRoutes = gameState.activeRoutes || [];
  
  const updatedRoutes = currentRoutes.map(route => {
    if (route.id === routeId && route.status === 'in-progress') {
      const newProgress = Math.min(100, route.currentProgress + progressIncrement);
      const newRemainingTime = Math.max(0, route.remainingTime - (progressIncrement / 100 * route.flightTime));
      
      return {
        ...route,
        currentProgress: newProgress,
        remainingTime: newRemainingTime
      };
    }
    return route;
  });
  
  updateGameState({ activeRoutes: updatedRoutes });
});

// Start a scheduled route
export const startRoute = displayManager.createActionHandler((routeId: string): boolean => {
  const gameState = getGameState();
  const currentRoutes = gameState.activeRoutes || [];
  
  const routeIndex = currentRoutes.findIndex(route => route.id === routeId);
  if (routeIndex === -1) {
    return false;
  }
  
  const route = currentRoutes[routeIndex];
  if (route.status !== 'scheduled') {
    return false;
  }
  
  // Update route status
  const updatedRoutes = [...currentRoutes];
  updatedRoutes[routeIndex] = {
    ...route,
    status: 'in-progress',
    departureTime: new Date()
  };
  
  updateGameState({ activeRoutes: updatedRoutes });
  return true;
});

// Complete a route and add income
export const completeRoute = displayManager.createActionHandler((routeId: string): boolean => {
  const gameState = getGameState();
  const currentRoutes = gameState.activeRoutes || [];
  
  const routeIndex = currentRoutes.findIndex(route => route.id === routeId);
  if (routeIndex === -1) {
    return false;
  }
  
  const route = currentRoutes[routeIndex];
  const aircraft = getAircraft(route.aircraftId);
  
  if (!aircraft) {
    return false;
  }
  
  // Add income to player
  updatePlayerMoney(route.totalRevenue);
  
  // Update total income tracking
  const newTotalIncome = (gameState.totalIncome || 0) + route.totalRevenue;
  updateGameState({ totalIncome: newTotalIncome });
  
  // Mark route as completed and remove from active routes
  const completedRoute = {
    ...route,
    status: 'completed' as const,
    actualArrival: new Date(),
    currentProgress: 100,
    remainingTime: 0
  };
  
  // Add to completed routes history
  const completedRoutes = gameState.completedRoutes || [];
  const updatedCompletedRoutes = [...completedRoutes, completedRoute];
  
  // Remove from active routes
  const remainingActiveRoutes = currentRoutes.filter(r => r.id !== routeId);
  
  updateGameState({ 
    activeRoutes: remainingActiveRoutes,
    completedRoutes: updatedCompletedRoutes
  });
  
  // Free up aircraft
  updateAircraftStatus(route.aircraftId, 'available');
  
  return true;
});

// Cancel a route
export const cancelRoute = displayManager.createActionHandler((routeId: string): boolean => {
  const gameState = getGameState();
  const currentRoutes = gameState.activeRoutes || [];
  
  const routeIndex = currentRoutes.findIndex(route => route.id === routeId);
  if (routeIndex === -1) {
    return false;
  }
  
  const route = currentRoutes[routeIndex];
  
  // Can only cancel scheduled routes or routes in early progress
  if (route.status === 'completed' || (route.status === 'in-progress' && route.currentProgress > 50)) {
    return false;
  }
  
  // Remove route and free aircraft
  const remainingRoutes = currentRoutes.filter(r => r.id !== routeId);
  updateGameState({ activeRoutes: remainingRoutes });
  updateAircraftStatus(route.aircraftId, 'available');
  
  return true;
});

// Get route statistics
export function getRouteStats(): RouteStats {
  const gameState = getGameState();
  const activeRoutes = gameState.activeRoutes || [];
  const completedRoutes = gameState.completedRoutes || [];
  
  const totalRoutes = activeRoutes.length + completedRoutes.length;
  const activeRoutesCount = activeRoutes.filter(r => r.status === 'in-progress').length;
  const completedRoutesCount = completedRoutes.length;
  
  const totalRevenue = completedRoutes.reduce((sum, route) => sum + route.totalRevenue, 0);
  const totalProfit = completedRoutes.reduce((sum, route) => sum + route.profit, 0);
  
  // Calculate average load factor
  const totalCapacity = completedRoutes.reduce((sum, route) => sum + route.maxPassengers, 0);
  const totalPassengers = completedRoutes.reduce((sum, route) => sum + route.passengers, 0);
  const averageLoadFactor = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  
  return {
    totalRoutes,
    activeRoutes: activeRoutesCount,
    completedRoutes: completedRoutesCount,
    totalRevenue,
    totalProfit,
    averageLoadFactor: Math.round(averageLoadFactor * 10) / 10
  };
}

// Process all active flight routes, updating progress and completing flights
export const processFlightRoutes = displayManager.createActionHandler((): void => {
  const activeRoutes = getActiveRoutes();
  
  activeRoutes.forEach(route => {
    if (route.status === 'scheduled') {
      // Start scheduled routes
      startRoute(route.id);
    } else if (route.status === 'in-progress') {
      // Calculate progress based on actual flight time
      // Each week represents 1/4 of the flight time (flights complete in ~4 weeks)
      const progressPerWeek = (1 / 4) * 100; // 25% per week base
      
      // Get aircraft to calculate actual progress based on speed
      const aircraft = getAircraft(route.aircraftId);
      const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
      
      if (aircraftType) {
        // Use actual travel time for more realistic progress
        const actualProgressPerWeek = (168 / route.flightTime) * 100; // 168 hours in a week
        const adjustedProgress = Math.min(progressPerWeek, actualProgressPerWeek);
        
        updateRouteProgress(route.id, adjustedProgress);
        
        // Check if route is complete
        if (route.currentProgress + adjustedProgress >= 100) {
          completeRoute(route.id);
          
          // Add flight hours to aircraft
          addFlightHours(route.aircraftId, route.flightTime);
        }
      } else {
        // Fallback to basic progress if aircraft type not found
        updateRouteProgress(route.id, progressPerWeek);
        
        if (route.currentProgress + progressPerWeek >= 100) {
          completeRoute(route.id);
          addFlightHours(route.aircraftId, route.flightTime);
        }
      }
    }
  });
}); 