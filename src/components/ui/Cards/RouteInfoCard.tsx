import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { Badge } from '../ShadCN/Badge';
import { formatNumber } from '../../../lib/gamemechanics/utils';
import BarChart from '../charts/BarChart';
import { getWaitingPassengersForPair } from '../../../lib/geography/passengerDemandService';
import { getAircraft } from '../../../lib/aircraft/fleetService';
import { getAircraftType } from '../../../lib/aircraft/aircraftData';
import { getAirport } from '../../../lib/geography/airportData';
import { getCity } from '../../../lib/geography/cityData';
import RouteMap from '../maps/RouteMap';

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
  
  // Calculate demand and seats on market
  const demand = getWaitingPassengersForPair(routeInfo.originAirportId, routeInfo.destinationCityId);
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
    { label: 'Demand', value: demand, color: '#3b82f6' },
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
          <BarChart data={barData} height={250} title="Route Demand vs Seats" />
        </div>
      </CardContent>
    </Card>
  );
} 