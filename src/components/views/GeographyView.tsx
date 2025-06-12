import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getAllCities, getCity } from '../../lib/geography/cityData';
import { getAllAirports, getAirport } from '../../lib/geography/airportData';
import { calculateAirportDistance, calculateAirportTravelTime } from '../../lib/geography/distanceService';
import { getOwnedAircraftTypes } from '../../lib/aircraft/fleetService';
import { getAircraftType } from '../../lib/aircraft/aircraftData';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/ShadCN/Card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/ShadCN/Select';
import { formatNumber } from '../../lib/gamemechanics/utils';
import { CityCard } from '../ui/Cards/CityCard';
import { RouteInfoCard } from '../ui/Cards/RouteInfoCard';

export function GeographyView() {
  useDisplayUpdate();
  
  const cities = getAllCities();
  const airports = getAllAirports();
  const ownedAircraftTypes = getOwnedAircraftTypes();
  
  // Airport-based distance calculator state
  const [originAirport, setOriginAirport] = useState<string>('');
  const [destinationAirport, setDestinationAirport] = useState<string>('');

  const getRouteInfo = () => {
    if (!originAirport || !destinationAirport) return null;
    const origin = getAirport(originAirport);
    const destination = getAirport(destinationAirport);
    if (!origin || !destination) return null;
    const originCity = getCity(origin.cityId);
    const destinationCity = getCity(destination.cityId);
    if (!originCity || !destinationCity) return null;
    const distance = calculateAirportDistance(originAirport, destinationAirport);
    const isDomestic = originCity.country === destinationCity.country;
    
    // Only show owned aircraft types
    const ownedTypes = ownedAircraftTypes.map(typeId => getAircraftType(typeId)).filter(Boolean);
    
    const routeInfo = {
      distance,
      isDomestic,
      travelTimes: ownedTypes.map(aircraft => ({
        aircraft: aircraft!.name,
        time: calculateAirportTravelTime(originAirport, destinationAirport, aircraft!.speed),
        inRange: distance <= aircraft!.range
      })),
      originAirportId: originAirport,
      destinationCityId: destinationCity.id
    };
    return routeInfo;
  };
  
  const routeInfo = getRouteInfo();
  
  return (
    <div className="space-y-6">
      <ViewHeader 
        title="🌍 Geography & Markets" 
        description="Explore cities, analyze passenger demand, and plan routes"
      />
      
      {/* Airport-based Distance Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Route Distance Calculator</CardTitle>
          <CardDescription>Calculate distances and flight times between airports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Origin Airport</label>
              <Select value={originAirport} onValueChange={setOriginAirport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin airport" />
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
              <Select value={destinationAirport} onValueChange={setDestinationAirport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination airport" />
                </SelectTrigger>
                <SelectContent>
                  {airports.filter(a => a.id !== originAirport).map((airport) => {
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
          {routeInfo && (
            <RouteInfoCard routeInfo={routeInfo} />
          )}
        </CardContent>
      </Card>
      
      {/* City Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cities & Markets ({cities.length})</CardTitle>
          <CardDescription>City information and passenger demand analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
          <CardDescription>Passenger demand insights and market opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Demand by City</h4>
              <div className="space-y-2">
                {cities
                  .sort((a, b) => b.population - a.population)
                  .map((city) => {
                    const demand = city.population;
                    const maxDemand = Math.max(...cities.map(c => c.population));
                    const percentage = (demand / maxDemand) * 100;
                    
                    return (
                      <div key={city.id} className="flex items-center gap-3">
                        <div className="w-20 text-sm truncate">{city.name}</div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium w-16 text-right">
                          {formatNumber(Math.round(demand / 1000))}K
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Route Opportunities</h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">High Population Routes</div>
                  <div className="text-sm text-green-700 mt-1">
                    Focus on routes between major cities with large populations
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800">Domestic Routes</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Domestic routes typically have stable passenger volumes
                  </div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="font-medium text-orange-800">International Routes</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Higher pricing potential but more variable demand
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 