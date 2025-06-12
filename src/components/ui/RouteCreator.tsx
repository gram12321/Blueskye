import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { createRoute } from '../../lib/routes/routeService';
import { getAvailableAircraft } from '../../lib/aircraft/fleetService';
import { getAircraftType, getAvailableAircraftTypes } from '../../lib/aircraft/aircraftData';
import { getAllCities, getCity } from '../../lib/geography/cityData';
import { calculateCityDistance, calculateTravelTime } from '../../lib/geography/distanceService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ShadCN/Card';
import { Button } from './ShadCN/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ShadCN/Select';
import { CityCard } from './Cards/CityCard';
import { RouteInfoCard } from './Cards/RouteInfoCard';
import { formatNumber } from '../../lib/gamemechanics/utils';

export function RouteCreator() {
  useDisplayUpdate();
  
  const cities = getAllCities();
  const availableAircraft = getAvailableAircraft();
  
  // Form state for creating new routes
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  
  const handleCreateRoute = () => {
    if (selectedOrigin && selectedDestination) {
      const originCity = getCity(selectedOrigin);
      const destinationCity = getCity(selectedDestination);
      
      if (originCity && destinationCity) {
        const routeName = `${originCity.name} - ${destinationCity.name}`;
        const route = createRoute(routeName, selectedOrigin, selectedDestination);
        
        if (route) {
          // Reset form
          setSelectedOrigin('');
          setSelectedDestination('');
          setSelectedAircraft('');
        }
      }
    }
  };
  
  // Filter destinations based on selected aircraft range
  const getValidDestinations = () => {
    if (!selectedOrigin || !selectedAircraft) return cities;
    
    const aircraft = availableAircraft.find(a => a.id === selectedAircraft);
    if (!aircraft) return cities;
    
    const aircraftType = getAircraftType(aircraft.aircraftTypeId);
    if (!aircraftType) return cities;
    
    return cities.filter(city => {
      if (city.id === selectedOrigin) return false;
      const distance = calculateCityDistance(selectedOrigin, city.id);
      return distance <= aircraftType.range;
    });
  };
  
  const generateRouteInfo = () => {
    if (!selectedOrigin || !selectedDestination) return null;
    
    const originCity = getCity(selectedOrigin);
    const destinationCity = getCity(selectedDestination);
    if (!originCity || !destinationCity) return null;
    
    const distance = calculateCityDistance(selectedOrigin, selectedDestination);
    const isDomestic = originCity.country === destinationCity.country;
    
    return {
      distance,
      isDomestic,
      travelTimes: getAvailableAircraftTypes().map(aircraft => ({
        aircraft: aircraft.name,
        time: calculateTravelTime(selectedOrigin, selectedDestination, aircraft.speed),
        inRange: distance <= aircraft.range
      }))
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
            <label className="text-sm font-medium mb-2 block">Origin City</label>
            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
              <SelectTrigger>
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Destination City</label>
            <Select 
              value={selectedDestination} 
              onValueChange={setSelectedDestination}
              disabled={!selectedOrigin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {getValidDestinations().map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Aircraft (Optional)</label>
            <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
              <SelectTrigger>
                <SelectValue placeholder="Select aircraft" />
              </SelectTrigger>
              <SelectContent>
                {availableAircraft.map((aircraft) => {
                  const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                  return (
                    <SelectItem key={aircraft.id} value={aircraft.id}>
                      {aircraftType?.name} (ID: {aircraft.id.slice(-8)})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* City Cards Display */}
        {(selectedOrigin || selectedDestination) && (
          <div className="space-y-4">
            {/* Side-by-side City Cards */}
            {(selectedOrigin || selectedDestination) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedOrigin && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Origin City</h4>
                    <CityCard city={getCity(selectedOrigin)!} />
                  </div>
                )}
                {selectedDestination && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Destination City</h4>
                    <CityCard city={getCity(selectedDestination)!} />
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
                Total Distance: {formatNumber(calculateCityDistance(selectedOrigin, selectedDestination))} km
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