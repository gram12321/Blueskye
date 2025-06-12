import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getAllCities, getCity } from '../../lib/geography/cityData';
import { calculateCityDistance, calculateTravelTime } from '../../lib/geography/distanceService';
import { getAvailableAircraftTypes } from '../../lib/aircraft/aircraftData';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/ShadCN/Card';
import { Button } from '../ui/ShadCN/Button';
import { Badge } from '../ui/ShadCN/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/ShadCN/Select';
import { formatNumber } from '../../lib/gamemechanics/utils';

export function GeographyView() {
  useDisplayUpdate();
  
  const cities = getAllCities();
  const aircraftTypes = getAvailableAircraftTypes();
  
  // Distance calculator state
  const [originCity, setOriginCity] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('');
  const [selectedAircraftType, setSelectedAircraftType] = useState<string>('');
  
  const calculateDemandLevel = (population: number, demandMultiplier: number): string => {
    const demandScore = population * demandMultiplier;
    if (demandScore > 15000000) return 'Very High';
    if (demandScore > 8000000) return 'High';
    if (demandScore > 3000000) return 'Medium';
    if (demandScore > 1000000) return 'Low';
    return 'Very Low';
  };
  
  const getDemandColor = (level: string): string => {
    switch (level) {
      case 'Very High': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      case 'Very Low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getRouteInfo = () => {
    if (!originCity || !destinationCity) return null;
    
    const origin = getCity(originCity);
    const destination = getCity(destinationCity);
    if (!origin || !destination) return null;
    
    const distance = calculateCityDistance(originCity, destinationCity);
    const isDomestic = origin.country === destination.country;
    
    const routeInfo = {
      distance,
      isDomestic,
      travelTimes: aircraftTypes.map(aircraft => ({
        aircraft: aircraft.name,
        time: calculateTravelTime(originCity, destinationCity, aircraft.speed),
        inRange: distance <= aircraft.range
      }))
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
      
      {/* Distance Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Route Distance Calculator</CardTitle>
          <CardDescription>Calculate distances and flight times between cities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Origin City</label>
              <Select value={originCity} onValueChange={setOriginCity}>
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
              <Select value={destinationCity} onValueChange={setDestinationCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {cities.filter(city => city.id !== originCity).map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}, {city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {routeInfo && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(routeInfo.distance)} km</div>
                  <div className="text-sm text-muted-foreground">Distance</div>
                </div>
                <div className="text-center">
                  <Badge variant={routeInfo.isDomestic ? "default" : "secondary"}>
                    {routeInfo.isDomestic ? 'Domestic' : 'International'}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Route Type</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{routeInfo.travelTimes.filter(t => t.inRange).length}</div>
                  <div className="text-sm text-muted-foreground">Aircraft in Range</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Flight Times by Aircraft:</h4>
                {routeInfo.travelTimes.map((travel, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className={travel.inRange ? '' : 'text-muted-foreground'}>
                      {travel.aircraft}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{travel.time.toFixed(1)}h</span>
                      {!travel.inRange && (
                        <Badge variant="destructive" className="text-xs">Out of Range</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            {cities.map((city) => {
              const demandLevel = calculateDemandLevel(city.population, city.passengerDemandMultiplier);
              const domesticPreferencePercent = Math.round(city.domesticPreference * 100);
              
              return (
                <Card key={city.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{city.name}</CardTitle>
                        <CardDescription>{city.country}</CardDescription>
                      </div>
                      <Badge className={getDemandColor(demandLevel)}>
                        {demandLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Population:</span>
                        <div className="font-medium">{formatNumber(city.population)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Demand Factor:</span>
                        <div className="font-medium">{city.passengerDemandMultiplier}x</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Domestic Preference:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${domesticPreferencePercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{domesticPreferencePercent}%</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Coordinates: {city.coordinates.latitude.toFixed(2)}°, {city.coordinates.longitude.toFixed(2)}°
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                  .sort((a, b) => (b.population * b.passengerDemandMultiplier) - (a.population * a.passengerDemandMultiplier))
                  .map((city) => {
                    const demand = city.population * city.passengerDemandMultiplier;
                    const maxDemand = Math.max(...cities.map(c => c.population * c.passengerDemandMultiplier));
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
                  <div className="font-medium text-green-800">High Demand Routes</div>
                  <div className="text-sm text-green-700 mt-1">
                    Focus on routes between major cities with high demand multipliers
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800">Domestic Preference</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Cities with high domestic preference offer stable passenger volumes
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