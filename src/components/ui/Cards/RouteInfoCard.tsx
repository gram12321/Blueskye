import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { Badge } from '../ShadCN/Badge';
import { formatNumber } from '../../../lib/gamemechanics/utils';
import BarChart from '../charts/passengerDemandBarChart';
import { getWaitingPassengersForPair } from '../../../lib/geography/passengerDemandService';
import { getAircraft } from '../../../lib/aircraft/fleetService';
import { getAircraftType } from '../../../lib/aircraft/aircraftData';
import { getAirport } from '../../../lib/geography/airportData';
import { getCity } from '../../../lib/geography/cityData';
import { getGateStats } from '../../../lib/geography/gateService';
import { getGameState } from '../../../lib/gamemechanics/gameState';
import RouteMap from '../maps/RouteMap';
import { Building2, AlertTriangle } from 'lucide-react';

interface RouteInfo {
  distance: number;
  isDomestic: boolean;
  travelTimes: {
    aircraft: string;
    time: number;
    inRange: boolean;
  }[];
  originAirportId: string;
  destinationCityId: string;
  assignedAircraftIds?: string[];
  flightTime?: number;
}

interface RouteInfoCardProps {
  routeInfo: RouteInfo;
}

export function RouteInfoCard({ routeInfo }: RouteInfoCardProps) {
  const originAirport = getAirport(routeInfo.originAirportId);
  const destinationCity = getCity(routeInfo.destinationCityId);
  
  // Calculate demand and seats on market (outbound only - return demand depends on destination airport)
  const outboundDemand = getWaitingPassengersForPair(routeInfo.originAirportId, routeInfo.destinationCityId);
  
  // Get gate information for both airports
  const gameState = getGameState();
  const originGates = gameState.airportGateStates?.[routeInfo.originAirportId] || [];
  const originGateStats = getGateStats(routeInfo.originAirportId);
  
  // Find destination airport for gate info
  const destinationAirport = destinationCity ? 
    getAirport(destinationCity.id) || // Try to find airport with same ID as city
    Object.values(gameState.airportGateStates || {}).find(gates => 
      gates.some(gate => getAirport(gate.airportId)?.cityId === destinationCity.id)
    )?.[0] ? getAirport(Object.values(gameState.airportGateStates || {}).find(gates => 
      gates.some(gate => getAirport(gate.airportId)?.cityId === destinationCity.id)
    )?.[0]?.airportId || '') : null
    : null;
  
  const destinationGates = destinationAirport ? 
    gameState.airportGateStates?.[destinationAirport.id] || [] : [];
  const destinationGateStats = destinationAirport ? 
    getGateStats(destinationAirport.id) : null;
  
  let seats = 0;
  if (routeInfo.assignedAircraftIds && routeInfo.flightTime) {
    for (const aircraftId of routeInfo.assignedAircraftIds) {
      const aircraft = getAircraft(aircraftId);
      if (aircraft) {
        const type = getAircraftType(aircraft.aircraftTypeId);
        if (type) {
          const flightsPerDay = Math.max(1, Math.floor(24 / routeInfo.flightTime));
          seats += type.maxPassengers * flightsPerDay;
        }
      }
    }
  }
  const barData = [
    { label: 'Outbound Demand', value: outboundDemand, color: '#3b82f6' },
    { label: 'Seats', value: seats, color: '#ef4444' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Route Information</CardTitle>
            <CardDescription>Distance: {formatNumber(routeInfo.distance)} km</CardDescription>
          </div>
          <Badge variant={routeInfo.isDomestic ? "secondary" : "outline"}>
            {routeInfo.isDomestic ? 'Domestic' : 'International'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Map */}
        {originAirport && destinationCity && (
          <div>
            <h4 className="font-medium mb-2">Route Map</h4>
            <RouteMap 
              originAirport={originAirport}
              destinationCity={destinationCity}
              distance={routeInfo.distance}
            />
          </div>
        )}
        
        {/* Aircraft Compatibility - only show if there are owned aircraft */}
        {routeInfo.travelTimes.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Aircraft Compatibility:</h4>
            <div className="space-y-2">
              {routeInfo.travelTimes.map((aircraft, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={aircraft.inRange ? 'text-foreground' : 'text-muted-foreground line-through'}>
                    {aircraft.aircraft}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {aircraft.time.toFixed(1)}h
                    </span>
                    <Badge 
                      variant={aircraft.inRange ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {aircraft.inRange ? 'In Range' : 'Out of Range'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show message if no owned aircraft */}
        {routeInfo.travelTimes.length === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              No owned aircraft to display compatibility. Purchase aircraft to see route compatibility.
            </div>
          </div>
        )}
        
        {/* Gate Information */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Gate Availability
          </h4>
          <div className="space-y-3">
            {/* Origin Airport Gates */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {originAirport?.name} ({originAirport?.code})
                </span>
                <Badge variant={originGates.length > 0 ? "default" : "secondary"}>
                  {originGates.length} gates
                </Badge>
              </div>
              {originGates.length > 0 ? (
                <div className="text-xs text-gray-600">
                  {originGateStats.utilizationRate.toFixed(1)}% utilization • €{originGateStats.totalDailyRevenue.toLocaleString()} daily revenue
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  No gates owned - routes will use basic airport access
                </div>
              )}
            </div>
            
            {/* Destination Airport Gates */}
            {destinationAirport && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {destinationAirport.name} ({destinationAirport.code})
                  </span>
                  <Badge variant={destinationGates.length > 0 ? "default" : "secondary"}>
                    {destinationGates.length} gates
                  </Badge>
                </div>
                {destinationGates.length > 0 && destinationGateStats ? (
                  <div className="text-xs text-gray-600">
                    {destinationGateStats.utilizationRate.toFixed(1)}% utilization • €{destinationGateStats.totalDailyRevenue.toLocaleString()} daily revenue
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    No gates owned - routes will use basic airport access
                  </div>
                )}
              </div>
            )}
            
            {!destinationAirport && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Destination airport information will be available after route creation
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Route Type:</span>
            <div className="font-medium">
              {routeInfo.isDomestic ? 'Domestic Flight' : 'International Flight'}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Compatible Aircraft:</span>
            <div className="font-medium">
              {routeInfo.travelTimes.filter(a => a.inRange).length} / {routeInfo.travelTimes.length}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <div className="mb-2 text-sm text-muted-foreground">
            Outbound Demand: {formatNumber(outboundDemand)} passengers 
            <br />
            <span className="text-xs">Note: Return demand will be shown after route creation</span>
          </div>
          <BarChart data={barData} height={250} title="Route Demand vs Seats (Outbound)" />
        </div>
      </CardContent>
    </Card>
  );
} 