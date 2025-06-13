// New route management service for Blueskye Air Management Game
// Now supports airport-based routes with passenger demand system

import { Route, Flight, RouteStats, AircraftSchedule } from './routeTypes';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAircraft, updateAircraftStatus } from '../aircraft/fleetService';
import { getAircraftType } from '../aircraft/aircraftData';
import { calculateAirportDistance, calculateAirportTravelTime } from '../geography/distanceService';
import { getCity } from '../geography/cityData';
import { getAirport } from '../geography/airportData';
import { getWaitingPassengersForPair } from '../geography/passengerDemandService';
import { HOURS_PER_DAY } from '../gamemechanics/gameTick';

// Generate unique IDs
function generateRouteId(): string {
  return 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Create a new permanent route between airports
export const createRoute = displayManager.createActionHandler((
  name: string,
  originAirportId: string,
  destinationAirportId: string,
  pricePerPassenger?: number
): Route | null => {
  const originAirport = getAirport(originAirportId);
  const destinationAirport = getAirport(destinationAirportId);
  
  if (!originAirport || !destinationAirport) {
    return null;
  }
  
  const originCity = getCity(originAirport.cityId);
  const destinationCity = getCity(destinationAirport.cityId);
  
  if (!originCity || !destinationCity) {
    return null;
  }
  
  const distance = calculateAirportDistance(originAirportId, destinationAirportId);
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
  const flightTime = calculateAirportTravelTime(originAirportId, destinationAirportId, averageSpeed);
  
  const newRoute: Route = {
    id: generateRouteId(),
    name,
    originAirportId,
    destinationAirportId,
    distance,
    flightTime,
    isActive: false,
    assignedAircraftIds: [],
    aircraftSchedules: [],
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

// Calculate maximum possible daily flights for an aircraft on a route
function calculateMaxDailyFlights(flightTime: number, turnTime: number): number {
  const totalRoundTripTime = flightTime * 2 + turnTime; // Outbound + return + turnaround
  return Math.floor(HOURS_PER_DAY / totalRoundTripTime);
}

// Calculate actual turn time for an aircraft at an airport
function calculateTurnTime(aircraftTypeId: string, airportId: string): number {
  const aircraftType = getAircraftType(aircraftTypeId);
  const airport = getAirport(airportId);
  
  if (!aircraftType || !airport) return 1; // Default 1 hour
  
  return aircraftType.turnTime * airport.turnTimeModifier;
}

// Export the flight processing function for use in gameTick
export function processContinuousFlights() {
  const gameState = getGameState();
  const { routes, activeFlights, fleet } = gameState;
  const updatedFlights: Flight[] = [];

  for (const route of routes) {
    if (!route.isActive) continue;
    for (const schedule of route.aircraftSchedules) {
      const aircraft = fleet.find(a => a.id === schedule.aircraftId);
      const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : undefined;
      if (!aircraftType || !aircraft || aircraft.status === 'maintenance') continue;
      
      // Calculate turn times for both airports
      const originTurnTime = calculateTurnTime(schedule.aircraftId, route.originAirportId);
      const destinationTurnTime = calculateTurnTime(schedule.aircraftId, route.destinationAirportId);
      const avgTurnTime = (originTurnTime + destinationTurnTime) / 2; // Use average for simplicity
      
      // Find or create a flight for this aircraft/route
      let flight = activeFlights.find(f => f.routeId === route.id && f.aircraftId === schedule.aircraftId);
      const totalRoundTripTime = route.flightTime * 2 + avgTurnTime;
      
      if (!flight) {
        flight = {
          id: 'flight-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
          routeId: route.id,
          aircraftId: schedule.aircraftId,
          status: 'in-progress',
          direction: 'outbound',
          departureTime: new Date(),
          estimatedArrival: new Date(Date.now() + totalRoundTripTime * 60 * 60 * 1000),
          passengers: Math.floor(aircraftType.maxPassengers * 0.7), // 70% load factor for now
          maxPassengers: aircraftType.maxPassengers,
          totalRevenue: 0,
          operationalCosts: 0,
          profit: 0,
          currentProgress: 0,
          remainingTime: totalRoundTripTime,
          flightTime: route.flightTime,
          turnTime: avgTurnTime,
          totalRoundTripTime: totalRoundTripTime,
          currentPhase: 'outbound'
        };
      } else {
        // Advance progress by 1 hour
        const progressIncrement = 100 / totalRoundTripTime; // Progress per hour
        let newProgress = (flight.currentProgress || 0) + progressIncrement;
        let newRemainingTime = Math.max(0, (flight.remainingTime || totalRoundTripTime) - 1);
        
        // Determine current phase based on progress
        let newPhase: 'outbound' | 'turnaround' | 'return' = 'outbound';
        const outboundProgress = (route.flightTime / totalRoundTripTime) * 100;
        const turnProgress = outboundProgress + (avgTurnTime / totalRoundTripTime) * 100;
        
        if (newProgress <= outboundProgress) {
          newPhase = 'outbound';
        } else if (newProgress <= turnProgress) {
          newPhase = 'turnaround';
        } else {
          newPhase = 'return';
        }
        
        if (newProgress >= 100) {
          // Flight completed, start new one immediately
          newProgress = progressIncrement; // Start next flight with 1 hour progress
          newRemainingTime = totalRoundTripTime - 1;
          newPhase = 'outbound';
        }
        
        flight = {
          ...flight,
          currentProgress: newProgress,
          remainingTime: newRemainingTime,
          currentPhase: newPhase,
          flightTime: route.flightTime,
          turnTime: avgTurnTime,
          totalRoundTripTime: totalRoundTripTime
        };
      }
      updatedFlights.push(flight);
    }
  }
  updateGameState({ activeFlights: updatedFlights });
}

// Update aircraft schedule calculation to use new turn time logic
export const assignAircraftToRoute = displayManager.createActionHandler((
  routeId: string,
  aircraftId: string,
  dailyFlights?: number // Optional: specify number of daily flights
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
  
  // Calculate flight time for this specific aircraft
  const flightTime = calculateAirportTravelTime(route.originAirportId, route.destinationAirportId, aircraftType.speed);
  
  // Calculate turn times
  const originTurnTime = calculateTurnTime(aircraftId, route.originAirportId);
  const destinationTurnTime = calculateTurnTime(aircraftId, route.destinationAirportId);
  const avgTurnTime = (originTurnTime + destinationTurnTime) / 2;
  
  // Calculate maximum possible daily flights
  const maxDailyFlights = calculateMaxDailyFlights(flightTime, avgTurnTime);
  
  // Use provided daily flights or default to maximum
  const scheduledFlights = dailyFlights ? Math.min(dailyFlights, maxDailyFlights) : maxDailyFlights;
  
  // Calculate total hours per day
  const totalHoursPerDay = (flightTime * 2 + avgTurnTime) * scheduledFlights;
  
  // Create new schedule
  const newSchedule: AircraftSchedule = {
    aircraftId,
    dailyFlights: scheduledFlights,
    totalHoursPerDay
  };
  
  // Update route with assigned aircraft and schedule
  const updatedRoutes = [...routes];
  updatedRoutes[routeIndex] = {
    ...route,
    assignedAircraftIds: [...route.assignedAircraftIds, aircraftId],
    aircraftSchedules: [...(route.aircraftSchedules || []), newSchedule],
    isActive: true,
    flightTime
  };
  
  updateGameState({ routes: updatedRoutes });
  
  // Update aircraft status to show it's assigned to route
  updateAircraftStatus(aircraftId, 'available', routeId);
  
  return true;
});

// Update aircraft schedule for a route
export const updateAircraftSchedule = displayManager.createActionHandler((
  routeId: string,
  aircraftId: string,
  dailyFlights: number
): boolean => {
  const gameState = getGameState();
  const routes = gameState.routes || [];
  const route = routes.find(r => r.id === routeId);
  
  if (!route) return false;
  
  const aircraft = getAircraft(aircraftId);
  const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
  
  if (!aircraft || !aircraftType) return false;
  
  // Calculate flight time for this specific aircraft
  const flightTime = calculateAirportTravelTime(route.originAirportId, route.destinationAirportId, aircraftType.speed);
  
  // Calculate maximum possible daily flights
  const maxDailyFlights = calculateMaxDailyFlights(flightTime, 0);
  
  // Ensure daily flights doesn't exceed maximum
  const scheduledFlights = Math.min(dailyFlights, maxDailyFlights);
  
  // Calculate total hours per day
  const totalHoursPerDay = (flightTime * 2) * scheduledFlights;
  
  // Update the schedule
  const updatedRoutes = routes.map(r => {
    if (r.id === routeId) {
      return {
        ...r,
        aircraftSchedules: r.aircraftSchedules.map(schedule => 
          schedule.aircraftId === aircraftId
            ? { ...schedule, dailyFlights: scheduledFlights, totalHoursPerDay }
            : schedule
        )
      };
    }
    return r;
  });
  
  updateGameState({ routes: updatedRoutes });
  return true;
});

// Get aircraft schedule for a route
export function getAircraftSchedule(routeId: string, aircraftId: string): AircraftSchedule | undefined {
  const route = getRoute(routeId);
  return route?.aircraftSchedules?.find(schedule => schedule.aircraftId === aircraftId);
}

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

// Get waiting passengers for a specific route
export function getRoutePassengerDemand(routeId: string): number {
  const route = getRoute(routeId);
  if (!route) return 0;
  const originAirport = getAirport(route.originAirportId);
  const destinationAirport = getAirport(route.destinationAirportId);
  if (!originAirport || !destinationAirport) return 0;
  const destinationCity = getCity(destinationAirport.cityId);
  if (!destinationCity) return 0;
  return getWaitingPassengersForPair(route.originAirportId, destinationCity.id);
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
  _originCity: unknown,
  _destinationCity: unknown
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