import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { createRoute } from '../../lib/routes/routeService';
import { getOwnedAircraftTypes } from '../../lib/aircraft/fleetService';
import { getAircraftType } from '../../lib/aircraft/aircraftData';
import { getCity } from '../../lib/geography/cityData';
import { getAllAirports, getAirport } from '../../lib/geography/airportData';
import { calculateAirportDistance, calculateAirportTravelTime } from '../../lib/geography/distanceService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ShadCN/Card';
import { Button } from './ShadCN/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ShadCN/Select';
import { AirportCard } from './Cards/AirportCard';
import { RouteInfoCard } from './Cards/RouteInfoCard';
import { formatNumber } from '../../lib/gamemechanics/utils';

export function RouteCreator() {
  useDisplayUpdate();
  
  const airports = getAllAirports();;
  const ownedAircraftTypes = getOwnedAircraftTypes();
  
  // Form state for creating new routes
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  
  const handleCreateRoute = () => {
    if (selectedOrigin && selectedDestination) {
      const originAirport = getAirport(selectedOrigin);
      const destinationAirport = getAirport(selectedDestination);
      
      if (originAirport && destinationAirport) {
        const originCity = getCity(originAirport.cityId);
        const destinationCity = getCity(destinationAirport.cityId);
        
        if (originCity && destinationCity) {
          const routeName = `${originAirport.code} - ${destinationAirport.code}`;
          const route = createRoute(routeName, selectedOrigin, selectedDestination);
          
          if (route) {
            // Reset form
            setSelectedOrigin('');
            setSelectedDestination('');
          }
        }
      }
    }
  };
  
  // Filter destinations based on selected aircraft range
  const getValidDestinations = () => {
    if (!selectedOrigin) return airports;
    return airports.filter(airport => airport.id !== selectedOrigin);
  };
  
  const generateRouteInfo = () => {
    if (!selectedOrigin || !selectedDestination) return null;
    const originAirport = getAirport(selectedOrigin);
    const destinationAirport = getAirport(selectedDestination);
    if (!originAirport || !destinationAirport) return null;
    const originCity = getCity(originAirport.cityId);
    const destinationCity = getCity(destinationAirport.cityId);
    if (!originCity || !destinationCity) return null;
    const distance = calculateAirportDistance(selectedOrigin, selectedDestination);
    const isDomestic = originCity.country === destinationCity.country;
    
    // Only show owned aircraft types
    const ownedTypes = ownedAircraftTypes.map(typeId => getAircraftType(typeId)).filter(Boolean);
    
    return {
      distance,
      isDomestic,
      travelTimes: ownedTypes.map(aircraft => ({
        aircraft: aircraft!.name,
        time: calculateAirportTravelTime(selectedOrigin, selectedDestination, aircraft!.speed),
        inRange: distance <= aircraft!.range
      })),
      originAirportId: selectedOrigin,
      destinationCityId: destinationCity.id
    };
  };
  
  const routeInfo = generateRouteInfo();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Route</CardTitle>
        <CardDescription>Plan a new flight route with available aircraft</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* City Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Origin Airport</label>
            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
              <SelectTrigger>
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {airports.map((airport) => {
                  const city = getCity(airport.cityId);
                  return (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.code} - {airport.name} ({city?.name})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Destination Airport</label>
            <Select 
              value={selectedDestination} 
              onValueChange={setSelectedDestination}
              disabled={!selectedOrigin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {getValidDestinations().map((airport) => {
                  const city = getCity(airport.cityId);
                  return (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.code} - {airport.name} ({city?.name})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Airport Cards Display */}
        {(selectedOrigin || selectedDestination) && (
          <div className="space-y-4">
            {/* Side-by-side Airport Cards */}
            {(selectedOrigin || selectedDestination) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOrigin && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Origin Airport</h4>
                    <AirportCard airport={getAirport(selectedOrigin)!} />
                  </div>
                )}
                {selectedDestination && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Destination Airport</h4>
                    <AirportCard airport={getAirport(selectedDestination)!} />
                  </div>
                )}
              </div>
            )}
            
            {/* Route Information Card */}
            {routeInfo && (
              <div>
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">Route Information</h4>
                <RouteInfoCard routeInfo={routeInfo} />
              </div>
            )}
            
            {/* Distance Info */}
            {selectedOrigin && selectedDestination && (
              <div className="text-sm text-muted-foreground text-center">
                Total Distance: {formatNumber(calculateAirportDistance(selectedOrigin, selectedDestination))} km
              </div>
            )}
          </div>
        )}
        
        {/* Create Route Button */}
        <Button 
          onClick={handleCreateRoute}
          disabled={!selectedOrigin || !selectedDestination}
          className="w-full"
        >
          Create Route
        </Button>
      </CardContent>
    </Card>
  );
} 