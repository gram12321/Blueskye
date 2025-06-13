// New route management service for Blueskye Air Management Game
// Now supports airport-based routes with passenger demand system

import { Route, Flight, RouteStats, AircraftSchedule } from './routeTypes';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { getAircraft, updateAircraftStatus } from '../aircraft/fleetService';
import { addFlightHours } from '../aircraft/fleetMaintenance';
import { getAircraftType } from '../aircraft/aircraftData';
import { calculateAirportDistance, calculateAirportTravelTime } from '../geography/distanceService';
import { getCity } from '../geography/cityData';
import { getAirport } from '../geography/airportData';
import { getWaitingPassengersForPair, deliverPassengers } from '../geography/passengerDemandService';
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
function calculateMaxDailyFlights(flightTime: number, originTurnTime: number, destinationTurnTime: number): number {
  const totalRoundTripTime = originTurnTime + flightTime + destinationTurnTime + flightTime; // Origin turn + outbound + destination turn + return
  return Math.floor(HOURS_PER_DAY / totalRoundTripTime);
}

// Calculate actual turn time for an aircraft at an airport
function calculateTurnTime(aircraftTypeId: string, airportId: string): number {
  const aircraftType = getAircraftType(aircraftTypeId);
  const airport = getAirport(airportId);
  
  if (!aircraftType || !airport) return 1; // Default 1 hour
  
  return aircraftType.turnTime * airport.turnTimeModifier;
}

// Get bidirectional passenger demand for a route
export function getBidirectionalRoutePassengerDemand(routeId: string): { outbound: number; return: number; total: number } {
  const route = getRoute(routeId);
  if (!route) return { outbound: 0, return: 0, total: 0 };
  
  const originAirport = getAirport(route.originAirportId);
  const destinationAirport = getAirport(route.destinationAirportId);
  if (!originAirport || !destinationAirport) return { outbound: 0, return: 0, total: 0 };
  
  const originCity = getCity(originAirport.cityId);
  const destinationCity = getCity(destinationAirport.cityId);
  if (!originCity || !destinationCity) return { outbound: 0, return: 0, total: 0 };
  
  // Outbound: from origin airport to destination city
  const outbound = getWaitingPassengersForPair(route.originAirportId, destinationCity.id);
  // Return: from destination airport to origin city  
  const returnDemand = getWaitingPassengersForPair(route.destinationAirportId, originCity.id);
  
  return {
    outbound,
    return: returnDemand,
    total: outbound + returnDemand
  };
}

// Get waiting passengers for a specific route (legacy function - now returns outbound only)
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

// Helper function to determine which passengers to pick up based on flight direction and phase
function getPassengersForDirection(route: Route, currentPhase: string): { originAirportId: string; destinationCityId: string } | null {
  const originAirport = getAirport(route.originAirportId);
  const destinationAirport = getAirport(route.destinationAirportId);
  if (!originAirport || !destinationAirport) return null;
  
  const originCity = getCity(originAirport.cityId);
  const destinationCity = getCity(destinationAirport.cityId);
  if (!originCity || !destinationCity) return null;
  
  // Only pick up passengers during origin-turn phase (when boarding)
  if (currentPhase === 'origin-turn') {
    // Outbound: from origin airport to destination city
    return {
      originAirportId: route.originAirportId,
      destinationCityId: destinationCity.id
    };
  } else if (currentPhase === 'destination-turn') {
    // Return: from destination airport to origin city
    return {
      originAirportId: route.destinationAirportId,
      destinationCityId: originCity.id
    };
  }
  
  return null; // Don't pick up passengers during flight phases
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
      
      // Find or create a flight for this aircraft/route
      let flight = activeFlights.find(f => f.routeId === route.id && f.aircraftId === schedule.aircraftId);
      const totalRoundTripTime = originTurnTime + route.flightTime + destinationTurnTime + route.flightTime;
      
      if (!flight) {
        // New flight - pick up outbound passengers (origin->destination)
        const passengerInfo = getPassengersForDirection(route, 'origin-turn');
        let actualPassengers = 0;
        if (passengerInfo) {
          const maxCapacity = aircraftType.maxPassengers;
          actualPassengers = deliverPassengers(passengerInfo.originAirportId, passengerInfo.destinationCityId, maxCapacity);
        }
        
        flight = {
          id: 'flight-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
          routeId: route.id,
          aircraftId: schedule.aircraftId,
          status: 'in-progress',
          direction: 'outbound',
          departureTime: new Date(),
          estimatedArrival: new Date(Date.now() + totalRoundTripTime * 60 * 60 * 1000),
          passengers: actualPassengers,
          maxPassengers: aircraftType.maxPassengers,
          totalRevenue: 0,
          operationalCosts: 0,
          profit: 0,
          currentProgress: 0,
          remainingTime: totalRoundTripTime,
          flightTime: route.flightTime,
          originTurnTime: originTurnTime,
          destinationTurnTime: destinationTurnTime,
          totalRoundTripTime: totalRoundTripTime,
          currentPhase: 'origin-turn'
        };
      } else {
        // Advance progress by 1 hour
        const progressIncrement = 100 / totalRoundTripTime; // Progress per hour
        let newProgress = (flight.currentProgress || 0) + progressIncrement;
        let newRemainingTime = Math.max(0, (flight.remainingTime || totalRoundTripTime) - 1);
        
        // Determine current phase based on progress - realistic 4-phase cycle
        let newPhase: 'origin-turn' | 'outbound' | 'destination-turn' | 'return' = 'origin-turn';
        const originTurnProgress = (originTurnTime / totalRoundTripTime) * 100;
        const outboundProgress = originTurnProgress + (route.flightTime / totalRoundTripTime) * 100;
        const destinationTurnProgress = outboundProgress + (destinationTurnTime / totalRoundTripTime) * 100;
        
        if (newProgress <= originTurnProgress) {
          newPhase = 'origin-turn';
        } else if (newProgress <= outboundProgress) {
          newPhase = 'outbound';
        } else if (newProgress <= destinationTurnProgress) {
          newPhase = 'destination-turn';
        } else {
          newPhase = 'return';
        }
        
        // Check if we're entering destination-turn phase for the first time to pick up return passengers
        const wasInDestinationTurn = flight.currentPhase === 'destination-turn';
        const nowInDestinationTurn = newPhase === 'destination-turn';
        
        if (nowInDestinationTurn && !wasInDestinationTurn) {
          // Just entered destination turn - pick up return passengers
          const passengerInfo = getPassengersForDirection(route, 'destination-turn');
          if (passengerInfo) {
            const maxCapacity = aircraftType.maxPassengers;
            const returnPassengers = deliverPassengers(passengerInfo.originAirportId, passengerInfo.destinationCityId, maxCapacity);
            flight.passengers = returnPassengers; // Replace with return passengers
          }
        }
        
        if (newProgress >= 100) {
          // Flight completed, start new one immediately
          // Add flight hours to aircraft
          if (aircraft) {
            // Add total round trip time to flight hours
            addFlightHours(aircraft.id, totalRoundTripTime);
          }
          
          // Pick up new outbound passengers for the next flight cycle
          const passengerInfo = getPassengersForDirection(route, 'origin-turn');
          let newPassengers = 0;
          if (passengerInfo) {
            newPassengers = deliverPassengers(passengerInfo.originAirportId, passengerInfo.destinationCityId, aircraftType.maxPassengers);
          }
          
          newProgress = progressIncrement; // Start next flight with 1 hour progress
          newRemainingTime = totalRoundTripTime - 1;
          newPhase = 'origin-turn';
          
          // Update the flight with new passengers for the next cycle
          flight = {
            ...flight,
            passengers: newPassengers,
            currentProgress: newProgress,
            remainingTime: newRemainingTime,
            currentPhase: newPhase
          };
        } else {
          flight = {
            ...flight,
            currentProgress: newProgress,
            remainingTime: newRemainingTime,
            currentPhase: newPhase,
            flightTime: route.flightTime,
            originTurnTime: originTurnTime,
            destinationTurnTime: destinationTurnTime,
            totalRoundTripTime: totalRoundTripTime
          };
        }
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
  
  // Calculate maximum possible daily flights
  const maxDailyFlights = calculateMaxDailyFlights(flightTime, originTurnTime, destinationTurnTime);
  
  // Use provided daily flights or default to maximum
  const scheduledFlights = dailyFlights ? Math.min(dailyFlights, maxDailyFlights) : maxDailyFlights;
  
  // Calculate total hours per day
  const totalHoursPerDay = (originTurnTime + flightTime + destinationTurnTime + flightTime) * scheduledFlights;
  
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
    aircraftSchedules: [...route.aircraftSchedules, newSchedule],
    isActive: true
  };
  
  updateGameState({ routes: updatedRoutes });
  updateAircraftStatus(aircraftId, 'in-flight');
  
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
  const maxDailyFlights = calculateMaxDailyFlights(flightTime, 0, 0);
  
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

// Get current active flight for an aircraft
export function getCurrentFlightForAircraft(aircraftId: string): Flight | undefined {
  const gameState = getGameState();
  const activeFlights = gameState.activeFlights || [];
  return activeFlights.find(flight => flight.aircraftId === aircraftId);
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