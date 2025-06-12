// Passenger demand generation service for Blueskye Air Management Game
// Handles realistic passenger generation and distribution to airports (aggregate version)

import { getCity, getAllCities } from './cityData';
import { getAirport, getAllAirports } from './airportData';
import { calculateDistance } from './distanceService';
import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';

// Aggregate passenger map type
export type AirportPairKey = `${string}->${string}`;
export interface PassengerAggregate {
  count: number;
  lastUpdated: number; // game tick (day)
}
export type PassengerMap = { [key: string]: PassengerAggregate };

// Remove DOMESTIC_PREFERENCES and use a constant factor
const DOMESTIC_FACTOR = 1.3;
const INTERNATIONAL_FACTOR = 0.7;

// Calculate destination probability for a passenger from origin city
function calculateDestinationProbability(originCityId: string, destinationCityId: string): number {
  const originCity = getCity(originCityId);
  const destinationCity = getCity(destinationCityId);
  if (!originCity || !destinationCity || originCityId === destinationCityId) return 0;
  const distance = calculateDistance(originCity.coordinates, destinationCity.coordinates);
  const isDomestic = originCity.country === destinationCity.country;
  const populationFactor = Math.sqrt(destinationCity.population / 1000000);
  const distanceFactor = Math.exp(-distance / 2000);
  const domesticFactor = isDomestic ? DOMESTIC_FACTOR : INTERNATIONAL_FACTOR;
  const probability = populationFactor * distanceFactor * domesticFactor;
  return Math.max(0, probability);
}

// Calculate airport probability for a passenger from their origin city
function calculateAirportProbability(originCityId: string, airportId: string): number {
  const originCity = getCity(originCityId);
  const airport = getAirport(airportId);
  if (!originCity || !airport) return 0;
  const distance = calculateDistance(originCity.coordinates, airport.coordinates);
  const distanceFactor = Math.exp(-distance / 100);
  const isDomestic = originCity.country === getCity(airport.cityId)?.country;
  const domesticFactor = isDomestic ? DOMESTIC_FACTOR : INTERNATIONAL_FACTOR;
  return distanceFactor * domesticFactor;
}

// Generate passengers for all cities this game tick (aggregate version)
export const generateAllPassengers = displayManager.createActionHandler((gameDay: number): void => {
  const gameState = getGameState();
  const allCities = getAllCities();
  const allAirports = getAllAirports();
  let passengerMap: PassengerMap = gameState.waitingPassengerMap || {};

  for (const city of allCities) {
    // Calculate total passengers generated this day
    const basePassengerRate = 0.001 / 7; // 0.1% per week, so ~0.014% per day
    const totalPassengers = Math.floor(city.population * basePassengerRate);
    if (totalPassengers === 0) continue;
    // Get all possible destinations
    const destinations = allCities.filter(c => c.id !== city.id);
    // Calculate destination probabilities
    const destinationProbabilities = destinations.map(dest => ({
      cityId: dest.id,
      probability: calculateDestinationProbability(city.id, dest.id)
    }));
    const totalProbability = destinationProbabilities.reduce((sum, dest) => sum + dest.probability, 0);
    if (totalProbability === 0) continue;
    const normalizedDestinations = destinationProbabilities.map(dest => ({
      cityId: dest.cityId,
      probability: dest.probability / totalProbability
    }));
    // Get all airports for origin city distribution
    const airportProbabilities = allAirports.map(airport => ({
      airportId: airport.id,
      probability: calculateAirportProbability(city.id, airport.id)
    }));
    const totalAirportProbability = airportProbabilities.reduce((sum, airport) => sum + airport.probability, 0);
    if (totalAirportProbability === 0) continue;
    const normalizedAirports = airportProbabilities.map(airport => ({
      airportId: airport.airportId,
      probability: airport.probability / totalAirportProbability
    }));
    // Generate passengers as aggregate increments
    for (let i = 0; i < totalPassengers; i++) {
      // Select destination
      const destRandom = Math.random();
      let destCumulativeProbability = 0;
      let selectedDestination = destinations[0].id;
      for (const dest of normalizedDestinations) {
        destCumulativeProbability += dest.probability;
        if (destRandom <= destCumulativeProbability) {
          selectedDestination = dest.cityId;
          break;
        }
      }
      // Select origin airport
      const airportRandom = Math.random();
      let airportCumulativeProbability = 0;
      let selectedAirport = allAirports[0].id;
      for (const airport of normalizedAirports) {
        airportCumulativeProbability += airport.probability;
        if (airportRandom <= airportCumulativeProbability) {
          selectedAirport = airport.airportId;
          break;
        }
      }
      // Aggregate key
      const pairKey: AirportPairKey = `${selectedAirport}->${selectedDestination}`;
      if (!passengerMap[pairKey]) {
        passengerMap[pairKey] = { count: 0, lastUpdated: gameDay };
      }
      passengerMap[pairKey].count += 1;
      passengerMap[pairKey].lastUpdated = gameDay;
    }
  }
  updateGameState({ waitingPassengerMap: passengerMap });
});

// Decay all passenger aggregates by 10% per tick
export function decayPassengerMap(gameDay: number): void {
  const gameState = getGameState();
  let passengerMap: PassengerMap = gameState.waitingPassengerMap || {};
  for (const pair in passengerMap) {
    const aggregate = passengerMap[pair]!;
    aggregate.count = Math.floor(aggregate.count * 0.9);
    aggregate.lastUpdated = gameDay;
    if (aggregate.count <= 0) {
      delete passengerMap[pair];
    }
  }
  updateGameState({ waitingPassengerMap: passengerMap });
}

// Deliver passengers for a given airport pair
export function deliverPassengers(originAirportId: string, destinationCityId: string, amount: number): number {
  const gameState = getGameState();
  let passengerMap: PassengerMap = gameState.waitingPassengerMap || {};
  const pairKey: AirportPairKey = `${originAirportId}->${destinationCityId}`;
  const available = passengerMap[pairKey]?.count || 0;
  const delivered = Math.min(available, amount);
  if (delivered > 0) {
    passengerMap[pairKey].count -= delivered;
    if (passengerMap[pairKey].count <= 0) {
      delete passengerMap[pairKey];
    }
    updateGameState({ waitingPassengerMap: passengerMap });
  }
  return delivered;
}

// Prune old passenger pairs (older than 28 days)
export function pruneOldPassengerPairs(currentDay: number): void {
  const gameState = getGameState();
  let passengerMap: PassengerMap = gameState.waitingPassengerMap || {};
  for (const pair in passengerMap) {
    const aggregate = passengerMap[pair]!;
    if (currentDay - aggregate.lastUpdated > 28) {
      delete passengerMap[pair];
    }
  }
  updateGameState({ waitingPassengerMap: passengerMap });
}

// Get waiting passengers for a specific airport pair
export function getWaitingPassengersForPair(originAirportId: string, destinationCityId: string): number {
  const gameState = getGameState();
  const passengerMap: PassengerMap = gameState.waitingPassengerMap || {};
  const pairKey: AirportPairKey = `${originAirportId}->${destinationCityId}`;
  return passengerMap[pairKey]?.count || 0;
}

// Get total waiting passengers at an airport
export function getWaitingPassengersAtAirport(airportId: string): number {
  const gameState = getGameState();
  const passengerMap: PassengerMap = gameState.waitingPassengerMap || {};
  let total = 0;
  for (const pair in passengerMap) {
    const aggregate = passengerMap[pair]!;
    if (pair.startsWith(`${airportId}->`)) {
      total += aggregate.count;
    }
  }
  return total;
}

// Get passenger stats for UI
export function getPassengerStats() {
  let totalWaiting = 0;
  const byAirport: { airportId: string; airportName: string; waitingCount: number }[] = [];
  const allAirports = getAllAirports();
  for (const airport of allAirports) {
    const waitingCount = getWaitingPassengersAtAirport(airport.id);
    byAirport.push({ airportId: airport.id, airportName: airport.name, waitingCount });
    totalWaiting += waitingCount;
  }
  return {
    totalWaiting,
    byAirport
  };
} 