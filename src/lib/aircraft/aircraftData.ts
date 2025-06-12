// Aircraft specifications data for Blueskye Air Management Game

import { AircraftType } from './aircraftTypes';

export const AIRCRAFT_TYPES: AircraftType[] = [
  {
    id: 'boeing-737',
    name: 'Boeing 737-800',
    manufacturer: 'Boeing',
    speed: 850, // km/h
    range: 5665, // km
    maxPassengers: 189,
    cost: 89000000, // 89 million euros
    fuelConsumption: 2.5, // liters per km
    maintenanceCost: 15000 // euros per week
  },
  {
    id: 'airbus-a320',
    name: 'Airbus A320',
    manufacturer: 'Airbus',
    speed: 840, // km/h
    range: 6150, // km
    maxPassengers: 180,
    cost: 98000000, // 98 million euros
    fuelConsumption: 2.4, // liters per km
    maintenanceCost: 14000 // euros per week
  }
];

export function getAircraftType(id: string): AircraftType | undefined {
  return AIRCRAFT_TYPES.find(type => type.id === id);
}

export function getAvailableAircraftTypes(): AircraftType[] {
  return AIRCRAFT_TYPES;
} 