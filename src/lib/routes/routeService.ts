// Route management service for Blueskye Air Management Game

import { Route, RouteStats } from './routeTypes';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAircraft, updateAircraftStatus, addFlightHours } from '../aircraft/fleetService';
import { getAircraftType } from '../aircraft/aircraftData';
import { calculateCityDistance, calculateTravelTime, calculateFuelConsumption } from '../geography/distanceService';
import { getCity } from '../geography/cityData';
import { addMoney } from '../finance/financeService';

// Generate unique route ID
function generateRouteId(): string {
  return 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Calculate passenger demand for a route with enhanced logic
function calculatePassengerDemand(originCityId: string, destinationCityId: string): number {
  const originCity = getCity(originCityId);
  const destinationCity = getCity(destinationCityId);
  
  if (!originCity || !destinationCity) {
    return 0;
  }
  
  const distance = calculateCityDistance(originCityId, destinationCityId);
  const isDomestic = originCity.country === destinationCity.country;
  
  // Base demand from origin city population and demand multiplier
  const originPopulationFactor = Math.sqrt(originCity.population / 1000000);
  const destinationPopulationFactor = Math.sqrt(destinationCity.population / 1000000);
  const averagePopulationFactor = (originPopulationFactor + destinationPopulationFactor) / 2;
  
  // Apply demand multipliers from both cities
  const averageDemandMultiplier = (originCity.passengerDemandMultiplier + destinationCity.passengerDemandMultiplier) / 2;
  
  // Domestic preference bonus (higher for domestic routes)
  const domesticBonus = isDomestic ? 
    (1 + (originCity.domesticPreference + destinationCity.domesticPreference) / 2) : 
    (1 - (originCity.domesticPreference + destinationCity.domesticPreference) / 4); // Penalty for international when domestic preference is high
  
  // Distance affects demand (sweet spot around 1000-3000km)
  let distanceMultiplier;
  if (distance < 500) {
    distanceMultiplier = 0.6; // Too short, people prefer other transport
  } else if (distance < 1500) {
    distanceMultiplier = 1.0; // Ideal short-haul distance
  } else if (distance < 3000) {
    distanceMultiplier = 0.9; // Good medium-haul distance
  } else if (distance < 8000) {
    distanceMultiplier = 0.7; // Long-haul, lower frequency
  } else {
    distanceMultiplier = 0.4; // Very long routes, niche market
  }
  
  // Base demand calculation with enhanced factors
  const baseDemand = averagePopulationFactor * averageDemandMultiplier * domesticBonus * distanceMultiplier * 90;
  
  // Add seasonal and random variation (±25%)
  const seasonalFactor = 0.85 + Math.random() * 0.3;
  
  // Business vs leisure travel split affects demand stability
  const businessTravelFactor = isDomestic ? 1.1 : 1.3; // International routes have more business travel
  
  const finalDemand = baseDemand * seasonalFactor * businessTravelFactor;
  
  return Math.max(15, Math.round(finalDemand));
}

// Calculate dynamic pricing based on distance, demand, and market factors
function calculateOptimalPricing(
  distance: number, 
  isDomestic: boolean, 
  passengerDemand: number, 
  aircraftCapacity: number,
  originCity: any,
  destinationCity: any
): number {
  // Base pricing per kilometer
  const basePrice = isDomestic ? 0.10 : 0.13; // euros per km
  let distancePrice = distance * basePrice;
  
  // Distance-based pricing adjustments
  if (distance < 500) {
    distancePrice *= 1.3; // Higher per-km rate for short flights
  } else if (distance > 5000) {
    distancePrice *= 0.85; // Discount for long-haul
  }
  
  // Base fees
  const baseFee = isDomestic ? 45 : 75;
  
  // Demand-based pricing adjustment
  const loadFactor = Math.min(passengerDemand / aircraftCapacity, 1.0);
  let demandMultiplier = 1.0;
  
  if (loadFactor > 0.9) {
    demandMultiplier = 1.4; // High demand premium
  } else if (loadFactor > 0.7) {
    demandMultiplier = 1.2; // Good demand
  } else if (loadFactor > 0.5) {
    demandMultiplier = 1.0; // Normal pricing
  } else if (loadFactor > 0.3) {
    demandMultiplier = 0.85; // Discount for low demand
  } else {
    demandMultiplier = 0.7; // Significant discount for very low demand
  }
  
  // Market factors
  const avgPopulation = (originCity.population + destinationCity.population) / 2;
  const marketSizeFactor = avgPopulation > 5000000 ? 1.15 : 
                          avgPopulation > 2000000 ? 1.05 : 
                          avgPopulation > 500000 ? 1.0 : 0.9;
  
  // Competition factor (simplified - fewer routes = higher prices)
  const competitionFactor = 1.0; // TODO: Implement based on existing routes
  
  // Calculate final price
  const baseTotal = distancePrice + baseFee;
  const finalPrice = baseTotal * demandMultiplier * marketSizeFactor * competitionFactor;
  
  // Ensure minimum viable pricing
  const minimumPrice = isDomestic ? 60 : 90;
  
  return Math.max(minimumPrice, Math.round(finalPrice));
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
  const pricing = pricePerPassenger || calculateOptimalPricing(
    distance, 
    originCity.country === destinationCity.country,
    passengerDemand,
    aircraftType.maxPassengers,
    originCity,
    destinationCity
  );
  
  // Calculate comprehensive operational costs
  const fuelCost = calculateFuelConsumption(originCityId, destinationCityId, aircraftType.fuelConsumption) * 1.2; // 1.2 euros per liter
  
  // Additional operational costs
  const isDomestic = originCity.country === destinationCity.country;
  const airportFees = isDomestic ? 800 : 1200; // Landing and takeoff fees
  const crewCosts = flightTime * 150; // Crew wages per hour
  const maintenanceCost = (flightTime / 100) * aircraftType.maintenanceCost; // Prorated maintenance
  const handlingCosts = passengers * 8; // Ground handling per passenger
  
  const totalOperationalCosts = fuelCost + airportFees + crewCosts + maintenanceCost + handlingCosts;
  const totalRevenue = passengers * pricing;
  const profit = totalRevenue - totalOperationalCosts;
  
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
    fuelCost: totalOperationalCosts, // Store total operational costs in fuelCost field for now
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
  const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
  
  if (!aircraft || !aircraftType) {
    return false;
  }
  
  // Record revenue transaction
  addMoney(
    route.totalRevenue,
    'Flight Revenue',
    `Flight completed: ${getCity(route.originCityId)?.name} to ${getCity(route.destinationCityId)?.name}`
  );
  
  // Record operational cost transaction
  addMoney(
    -route.fuelCost, // This now contains total operational costs
    'Flight Expenses',
    `Operational costs for flight: ${getCity(route.originCityId)?.name} to ${getCity(route.destinationCityId)?.name}`
  );
  
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
  
  // Free up aircraft and add flight hours
  updateAircraftStatus(route.aircraftId, 'available');
  addFlightHours(route.aircraftId, route.flightTime);
  
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
export const processFlightRoutes = displayManager.createActionHandler((hoursPerDay: number = 24): void => {
  const activeRoutes = getActiveRoutes();
  
  activeRoutes.forEach(route => {
    if (route.status === 'scheduled') {
      // Start scheduled routes
      startRoute(route.id);
    } else if (route.status === 'in-progress') {
      const aircraft = getAircraft(route.aircraftId);
      const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
      
      if (!aircraftType) return;
      
      // Calculate progress based on actual flight time
      const progressPerDay = (hoursPerDay / route.flightTime) * 100;
      
      // Update route progress
      updateRouteProgress(route.id, progressPerDay);
      
      // Check if route is complete
      const updatedRoute = getRoute(route.id);
      if (updatedRoute && updatedRoute.currentProgress >= 100) {
        completeRoute(route.id);
      }
    }
  });
}); 