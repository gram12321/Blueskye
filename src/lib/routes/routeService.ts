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
import { checkGateAvailability, bookGateSlot, cancelGateBooking, getGateStats } from '../geography/gateService';
import { GateBookingRequest } from '../geography/gateTypes';
import { HOURS_PER_DAY } from '../gamemechanics/gameTick';
import { addMoney } from '../finance/financeService';
import { calculateAbsoluteDays } from '../gamemechanics/utils';
import { notificationService } from '../notifications/notificationService';

// Daily revenue tracking for summary transactions
interface DailyRouteRevenue {
  routeId: string;
  originAirportId: string;
  destinationCityId: string; // This is the passenger destination city, not airport
  aircraftIds: Set<string>;
  totalPassengers: number;
  totalRevenue: number;
  flightCount: number;
}

// Generate unique IDs
function generateRouteId(): string {
  return 'route-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Calculate static ticket price based on distance
function calculateTicketPrice(distance: number, originAirportId: string, destinationAirportId: string): number {
  const originAirport = getAirport(originAirportId);
  const destinationAirport = getAirport(destinationAirportId);
  
  if (!originAirport || !destinationAirport) return 100; // Default price
  
  const originCity = getCity(originAirport.cityId);
  const destinationCity = getCity(destinationAirport.cityId);
  
  if (!originCity || !destinationCity) return 100; // Default price
  
  const isDomestic = originCity.country === destinationCity.country;
  
  // Static pricing based on distance and domestic/international
  const basePrice = isDomestic ? 0.12 : 0.15; // euros per km
  let distancePrice = distance * basePrice;
  
  // Distance-based adjustments
  if (distance < 500) {
    distancePrice *= 1.2; // Short flights are more expensive per km
  } else if (distance > 3000) {
    distancePrice *= 0.9; // Long flights get discount per km
  }
  
  const baseFee = isDomestic ? 40 : 65; // Base airport fees
  const finalPrice = distancePrice + baseFee;
  const minimumPrice = isDomestic ? 55 : 85;
  
  return Math.max(minimumPrice, Math.round(finalPrice));
}

// Create a new permanent route between airports
export const createRoute = displayManager.createActionHandler((
  name: string,
  originAirportId: string,
  destinationAirportId: string,
  pricePerPassenger?: number,
  aircraftId?: string // Optional aircraft to assign immediately
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
  
  // Calculate pricing if not provided
  const pricing = pricePerPassenger || calculateTicketPrice(distance, originAirportId, destinationAirportId);
  
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
    // Gate management - initially empty, gates will be booked when aircraft assigned
    originGateBookingIds: [],
    destinationGateBookingIds: [],
    totalGateCosts: 0,
    hasRequiredGates: false,
    totalFlights: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageLoadFactor: 0
  };
  
  const gameState = getGameState();
  const currentRoutes = gameState.routes || [];
  updateGameState({ routes: [...currentRoutes, newRoute] });
  
  // If aircraft is provided, assign it immediately
  if (aircraftId) {
    // Use a small delay to ensure the route is saved before assignment
    setTimeout(() => {
      assignAircraftToRoute(newRoute.id, aircraftId);
    }, 10);
  }
  
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

// Process passenger pickup and revenue collection
function pickupPassengersAndCollectRevenue(
  route: Route, 
  passengerInfo: { originAirportId: string; destinationCityId: string }, 
  maxCapacity: number,
  flight?: Flight
): { passengers: number; revenue: number } {
  // Pick up passengers
  const actualPassengers = deliverPassengers(passengerInfo.originAirportId, passengerInfo.destinationCityId, maxCapacity);
  
  // Calculate revenue - use route's price per passenger
  const revenue = actualPassengers * route.pricePerPassenger;
  
  // Update route statistics
  const gameState = getGameState();
  const routes = gameState.routes || [];
  const routeIndex = routes.findIndex(r => r.id === route.id);
  
  if (routeIndex !== -1) {
    const updatedRoutes = [...routes];
    updatedRoutes[routeIndex] = {
      ...route,
      totalRevenue: route.totalRevenue + revenue,
      totalFlights: route.totalFlights + (actualPassengers > 0 ? 1 : 0)
    };
    updateGameState({ routes: updatedRoutes });
  }
  
  // Money will be added in daily summary, not immediately
  
  // Track daily revenue summary
  if (actualPassengers > 0 && flight) {
    trackDailyRevenue(route, passengerInfo, flight.aircraftId, actualPassengers, revenue);
  }
  
  return { passengers: actualPassengers, revenue };
}

// Track daily revenue for summary transactions
function trackDailyRevenue(
  route: Route,
  passengerInfo: { originAirportId: string; destinationCityId: string },
  aircraftId: string,
  passengers: number,
  revenue: number
): void {
  const gameState = getGameState();
  const dailyRevenue = (gameState as any).dailyRouteRevenue || {};
  
  // Create a key for this route direction
  const routeKey = `${route.id}-${passengerInfo.originAirportId}-${passengerInfo.destinationCityId}`;
  
  if (!dailyRevenue[routeKey]) {
    dailyRevenue[routeKey] = {
      routeId: route.id,
      originAirportId: passengerInfo.originAirportId,
      destinationCityId: passengerInfo.destinationCityId,
      aircraftIds: new Set<string>(),
      totalPassengers: 0,
      totalRevenue: 0,
      flightCount: 0
    };
  }
  
  const summary = dailyRevenue[routeKey];
  summary.aircraftIds.add(aircraftId);
  summary.totalPassengers += passengers;
  summary.totalRevenue += revenue;
  summary.flightCount += 1;
  
  updateGameState({ dailyRouteRevenue: dailyRevenue } as any);
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
        let flightRevenue = 0;
        if (passengerInfo) {
          const maxCapacity = aircraftType.maxPassengers;
          // Create a temporary flight object for tracking
          const tempFlight = { aircraftId: schedule.aircraftId } as Flight;
          const result = pickupPassengersAndCollectRevenue(route, passengerInfo, maxCapacity, tempFlight);
          actualPassengers = result.passengers;
          flightRevenue = result.revenue;
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
          totalRevenue: flightRevenue,
          operationalCosts: 0,
          profit: flightRevenue,
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
            const result = pickupPassengersAndCollectRevenue(route, passengerInfo, maxCapacity, flight);
            flight.passengers = result.passengers; // Replace with return passengers
            flight.totalRevenue += result.revenue; // Add return revenue to flight
            flight.profit = flight.totalRevenue - flight.operationalCosts; // Update profit
          }
        }
        
        if (newProgress >= 100) {
          // Flight completed, start new one immediately
          // Add flight hours to aircraft
          if (aircraft) {
            // Add total round trip time to flight hours
            addFlightHours(aircraft.id, totalRoundTripTime);
          }
          
          // Store completed flight for load factor calculation
          const gameStateForCompletion = getGameState();
          const completedFlight: Flight = {
            ...flight,
            status: 'completed',
            actualArrival: new Date(), // Keep for compatibility, but we'll use game time for calculations
            currentProgress: 100,
            remainingTime: 0
          };
          
          // Add game time tracking as additional properties
          (completedFlight as any).completedGameDay = gameStateForCompletion.day;
          (completedFlight as any).completedGameWeek = gameStateForCompletion.week;
          (completedFlight as any).completedGameMonth = gameStateForCompletion.month;
          (completedFlight as any).completedGameYear = gameStateForCompletion.year;
          
          // Add to completed flights history
          const currentState = getGameState();
          const completedFlights = currentState.completedFlights || [];
          updateGameState({ 
            completedFlights: [...completedFlights, completedFlight]
          });
          
          // Pick up new outbound passengers for the next flight cycle
          const passengerInfo = getPassengersForDirection(route, 'origin-turn');
          let newPassengers = 0;
          let newRevenue = 0;
          if (passengerInfo) {
            const result = pickupPassengersAndCollectRevenue(route, passengerInfo, aircraftType.maxPassengers, flight);
            newPassengers = result.passengers;
            newRevenue = result.revenue;
          }
          
          newProgress = progressIncrement; // Start next flight with 1 hour progress
          newRemainingTime = totalRoundTripTime - 1;
          newPhase = 'origin-turn';
          
          // Update the flight with new passengers for the next cycle
          flight = {
            ...flight,
            passengers: newPassengers,
            totalRevenue: newRevenue, // Reset revenue for new flight cycle
            profit: newRevenue, // Reset profit for new flight cycle
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
  
  // Clean up old completed flights (keep only last 30 days)
  cleanupOldCompletedFlights();
}

// Clean up completed flights older than specified days to prevent memory bloat
function cleanupOldCompletedFlights(daysToKeep: number = 30): void {
  const gameState = getGameState();
  const completedFlights = gameState.completedFlights || [];
  
  if (completedFlights.length === 0) return;
  
  const currentAbsoluteDays = calculateAbsoluteDays(gameState.year, gameState.month, gameState.week, gameState.day);
  const cutoffDays = currentAbsoluteDays - daysToKeep;
  
  const recentFlights = completedFlights.filter(flight => {
    // Check if flight has game time data
    const flightData = flight as any;
    if (flightData.completedGameYear && flightData.completedGameMonth && 
        flightData.completedGameWeek && flightData.completedGameDay) {
      const flightAbsoluteDays = calculateAbsoluteDays(
        flightData.completedGameYear,
        flightData.completedGameMonth,
        flightData.completedGameWeek,
        flightData.completedGameDay
      );
      return flightAbsoluteDays >= cutoffDays;
    }
    return true; // Keep flights without game time data for now
  });
  
  // Only update if we actually removed some flights
  if (recentFlights.length < completedFlights.length) {
    updateGameState({ completedFlights: recentFlights });
  }
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
  
  // Check for stored roundtrips information from route creation
  const routeAssignmentData = (gameState as any).routeAssignmentData || {};
  const assignmentInfo = routeAssignmentData[routeId];
  let scheduledFlights = dailyFlights || maxDailyFlights;
  
  if (assignmentInfo && assignmentInfo.aircraftId === aircraftId && assignmentInfo.roundtripsPerDay) {
    scheduledFlights = Math.min(assignmentInfo.roundtripsPerDay, maxDailyFlights);
    // Clean up the temporary data
    delete routeAssignmentData[routeId];
    updateGameState({ routeAssignmentData } as any);
  } else {
  // Use provided daily flights or default to maximum
    scheduledFlights = dailyFlights ? Math.min(dailyFlights, maxDailyFlights) : maxDailyFlights;
  }
  
  // Calculate total hours per day
  const totalHoursPerDay = (originTurnTime + flightTime + destinationTurnTime + flightTime) * scheduledFlights;
  
  // Check gate availability and book gates for the route
  const originCity = getCity(getAirport(route.originAirportId)?.cityId || '');
  const destinationCity = getCity(getAirport(route.destinationAirportId)?.cityId || '');
  const isDomestic = originCity?.country === destinationCity?.country;
  
  // Enhanced gate booking system
  let totalGateCosts = 0;
  const originGateBookingIds: string[] = [];
  const destinationGateBookingIds: string[] = [];
  
  // Calculate slot requirements
  const originSlotDuration = Math.ceil((originTurnTime * 60) + 30); // Turn time + 30min buffer
  const destinationSlotDuration = Math.ceil((destinationTurnTime * 60) + 30);
  
  // Try to book gate slots for each scheduled flight
  for (let i = 0; i < scheduledFlights; i++) {
    const baseHour = 8 + (i * 4); // Space flights 4 hours apart starting at 8 AM
    
    // Book origin slot
    const originBookingRequest: GateBookingRequest = {
      routeId: route.id,
      aircraftId: aircraftId,
      airportId: route.originAirportId,
      preferredGateType: 'common',
      requiredSlots: [{
        startTime: { hour: baseHour, minute: 0 },
        durationMinutes: originSlotDuration
      }]
    };

    const originBookingResponse = bookGateSlot(originBookingRequest);
    if (originBookingResponse.success && originBookingResponse.bookingId) {
      originGateBookingIds.push(originBookingResponse.bookingId);
      totalGateCosts += originBookingResponse.totalCost || 0;
    }

    // Book destination slot (arrival time + turn time)
    const destinationArrivalHour = baseHour + Math.ceil(flightTime);
    
    const destinationBookingRequest: GateBookingRequest = {
      routeId: route.id,
      aircraftId: aircraftId,
      airportId: route.destinationAirportId,
      preferredGateType: 'common',
      requiredSlots: [{
        startTime: { hour: destinationArrivalHour, minute: 0 },
        durationMinutes: destinationSlotDuration
      }]
    };

    const destinationBookingResponse = bookGateSlot(destinationBookingRequest);
    if (destinationBookingResponse.success && destinationBookingResponse.bookingId) {
      destinationGateBookingIds.push(destinationBookingResponse.bookingId);
      totalGateCosts += destinationBookingResponse.totalCost || 0;
    }
  }
  
  // Check if we have the required gates
  const currentGameState = getGameState();
  const originGates = currentGameState.airportGateStates?.[route.originAirportId] || [];
  const destinationGates = currentGameState.airportGateStates?.[route.destinationAirportId] || [];
  
  const hasRequiredGates = originGateBookingIds.length > 0 && destinationGateBookingIds.length > 0;
  
  if (!hasRequiredGates && (originGates.length === 0 || destinationGates.length === 0)) {
    notificationService.info(
      `Note: Gates need to be purchased at airports before full gate management is available. Route will operate with basic airport access.`,
      { category: 'Routes' }
    );
  }
  
  // Create new schedule
  const newSchedule: AircraftSchedule = {
    aircraftId,
    dailyFlights: scheduledFlights,
    totalHoursPerDay
  };
  
  // Update route with assigned aircraft, schedule, and gate bookings
  const updatedRoutes = [...routes];
  updatedRoutes[routeIndex] = {
    ...route,
    assignedAircraftIds: [...route.assignedAircraftIds, aircraftId],
    aircraftSchedules: [...route.aircraftSchedules, newSchedule],
    originGateBookingIds: [...route.originGateBookingIds, ...originGateBookingIds],
    destinationGateBookingIds: [...route.destinationGateBookingIds, ...destinationGateBookingIds],
    totalGateCosts: route.totalGateCosts + totalGateCosts,
    hasRequiredGates: hasRequiredGates,
    isActive: true
  };
  
  updateGameState({ routes: updatedRoutes });
  updateAircraftStatus(aircraftId, 'in-flight');
  
  // Notify user of successful assignment
  if (totalGateCosts > 0) {
    const formattedCost = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(totalGateCosts);
    
    notificationService.success(
      `Aircraft assigned to route with ${originGateBookingIds.length + destinationGateBookingIds.length} gate bookings (Daily gate cost: ${formattedCost})`,
      { category: 'Routes' }
    );
  } else {
    notificationService.success(
      `Aircraft assigned to route successfully`,
      { category: 'Routes' }
    );
  }
  
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
  
  // Cancel any gate bookings for this aircraft on this route
  const gateBookings = gameState.gateBookings || [];
  const aircraftBookings = gateBookings.filter(
    booking => booking.routeId === routeId && booking.aircraftId === aircraftId && booking.isActive
  );
  
  for (const booking of aircraftBookings) {
    cancelGateBooking(booking.id);
  }
  
  // Remove aircraft from route and update gate booking IDs
  const remainingAircraftIds = route.assignedAircraftIds.filter(id => id !== aircraftId);
  const remainingSchedules = route.aircraftSchedules.filter(schedule => schedule.aircraftId !== aircraftId);
  
  // Recalculate gate costs for remaining aircraft
  const remainingBookings = gateBookings.filter(
    booking => booking.routeId === routeId && remainingAircraftIds.includes(booking.aircraftId) && booking.isActive
  );
  const newTotalGateCosts = remainingBookings.reduce((sum, booking) => sum + booking.totalCost, 0);
  
  const updatedRoutes = [...routes];
  updatedRoutes[routeIndex] = {
    ...route,
    assignedAircraftIds: remainingAircraftIds,
    aircraftSchedules: remainingSchedules,
    totalGateCosts: newTotalGateCosts,
    hasRequiredGates: remainingAircraftIds.length === 0 ? false : route.hasRequiredGates,
    isActive: remainingAircraftIds.length > 0
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

// Calculate load factor for recent flights (last week) using in-game time
function calculateRecentLoadFactor(flights: Flight[], daysBack: number = 7): number {
  const gameState = getGameState();
  const currentAbsoluteDays = calculateAbsoluteDays(gameState.year, gameState.month, gameState.week, gameState.day);
  const cutoffDays = currentAbsoluteDays - daysBack;
  
  const recentFlights = flights.filter(flight => {
    // Check if flight has game time data
    const flightData = flight as any;
    if (flightData.completedGameYear && flightData.completedGameMonth && 
        flightData.completedGameWeek && flightData.completedGameDay) {
      const flightAbsoluteDays = calculateAbsoluteDays(
        flightData.completedGameYear,
        flightData.completedGameMonth,
        flightData.completedGameWeek,
        flightData.completedGameDay
      );
      return flightAbsoluteDays >= cutoffDays;
    }
    return false; // Exclude flights without game time data
  });
  
  if (recentFlights.length === 0) return 0;
  
  const totalCapacity = recentFlights.reduce((sum, flight) => sum + flight.maxPassengers, 0);
  const totalPassengers = recentFlights.reduce((sum, flight) => sum + flight.passengers, 0);
  
  return totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
}

// Get load factor for a specific route (last week)
export function getRouteLoadFactor(routeId: string, daysBack: number = 7): number {
  const gameState = getGameState();
  const completedFlights = gameState.completedFlights || [];
  const routeFlights = completedFlights.filter(flight => flight.routeId === routeId);
  
  return calculateRecentLoadFactor(routeFlights, daysBack);
}

// Get load factor for a specific aircraft on a route (last week)
export function getAircraftRouteLoadFactor(routeId: string, aircraftId: string, daysBack: number = 7): number {
  const gameState = getGameState();
  const completedFlights = gameState.completedFlights || [];
  const aircraftFlights = completedFlights.filter(flight => 
    flight.routeId === routeId && flight.aircraftId === aircraftId
  );
  
  return calculateRecentLoadFactor(aircraftFlights, daysBack);
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
  
  // Calculate average load factor for last week across all routes
  const averageLoadFactor = calculateRecentLoadFactor(completedFlights, 7);
  
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

// Process daily revenue summaries and create consolidated transactions
export function processDailyRevenueSummaries(): void {
  const gameState = getGameState();
  const dailyRevenue = (gameState as any).dailyRouteRevenue || {};
  
  let totalDailyRevenue = 0;
  let totalFlights = 0;
  let totalPassengers = 0;
  let routeCount = 0;
  
  // Process each route's daily summary
  Object.values(dailyRevenue as Record<string, DailyRouteRevenue>).forEach((summary) => {
    if (summary.totalRevenue > 0) {
      const originAirport = getAirport(summary.originAirportId);
      const destinationCity = getCity(summary.destinationCityId);
      
      // Get the route to find the destination airport
      const route = getRoute(summary.routeId);
      const destinationAirport = route ? getAirport(route.destinationAirportId) : null;
      
      // Convert Set to Array for aircraft IDs
      const aircraftList = Array.from(summary.aircraftIds);
      const aircraftCount = aircraftList.length;
      
      // Create descriptive summary - show airport to airport route, with city destination
      const routeDescription = `${originAirport?.code || 'Unknown'} → ${destinationAirport?.code || 'Unknown'} (${destinationCity?.name || 'Unknown'})`;
      const aircraftDescription = aircraftCount === 1 
        ? `Aircraft ${aircraftList[0].slice(-8)}`
        : `${aircraftCount} aircraft`;
      
      const description = `${routeDescription}: ${aircraftDescription}, ${summary.flightCount} flights, ${summary.totalPassengers} passengers`;
       
      // Add money and create transaction summary
      addMoney(summary.totalRevenue, 'Flight Revenue', description, { silent: true });
      
      // Accumulate totals for notification
      totalDailyRevenue += summary.totalRevenue;
      totalFlights += summary.flightCount;
      totalPassengers += summary.totalPassengers;
      routeCount++;
    }
  });
  
  // Send notification summary if there was any revenue
  if (totalDailyRevenue > 0) {
    const formattedRevenue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(totalDailyRevenue);
    
    const routeText = routeCount === 1 ? 'route' : 'routes';
    const flightText = totalFlights === 1 ? 'flight' : 'flights';
    
    const notificationText = `Daily Revenue: ${formattedRevenue} from ${totalFlights} ${flightText} across ${routeCount} ${routeText} (${totalPassengers.toLocaleString()} passengers)`;
    
    notificationService.success(notificationText, { category: 'Finance' });
  }
  
  // Clear daily revenue tracking for next day
  updateGameState({ dailyRouteRevenue: {} } as any);
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