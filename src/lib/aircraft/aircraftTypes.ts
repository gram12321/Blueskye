// Aircraft type definitions for Blueskye Air Management Game

export interface AircraftType {
  id: string;
  name: string;
  manufacturer: string;
  speed: number; // km/h
  range: number; // km
  maxPassengers: number;
  cost: number; // euros
  fuelConsumption: number; // liters per km
  maintenanceCost: number; // euros per week
  turnTime: number; // hours - time needed for turnaround at airport
  reliability: number; // 0-1, higher is more reliable
  tonnage: number; // tons, affects maintenance speed
}

export interface Aircraft {
  id: string;
  aircraftTypeId: string;
  purchaseDate: Date;
  totalFlightHours: number;
  currentRoute?: string; // route ID if currently assigned
  status: 'available' | 'in-flight' | 'maintenance';
  condition: number; // 0-100, affects performance and maintenance costs
  maintenancePlan?: number; // hours per week
  maintenanceHoursRemaining?: number; // hours left in current maintenance
  maintenanceLastDone?: number; // hours since purchase when last maintenance was done
}

export interface FleetStats {
  totalAircraft: number;
  availableAircraft: number;
  inFlightAircraft: number;
  maintenanceAircraft: number;
  totalValue: number;
  weeklyMaintenanceCost: number;
} 