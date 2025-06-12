import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { 
  getAllRoutes, 
  getRouteStats, 
  createRoute, 
  assignAircraftToRoute, 
  removeAircraftFromRoute, 
  deleteRoute 
} from '../../lib/routes/routeService';
import { CityCard } from '../ui/Cards/CityCard';
import { RouteInfoCard } from '../ui/Cards/RouteInfoCard';
import { getAvailableAircraft, getFleet } from '../../lib/aircraft/fleetService';
import { getAircraftType, getAvailableAircraftTypes } from '../../lib/aircraft/aircraftData';
import { getAllCities, getCity } from '../../lib/geography/cityData';
import { calculateCityDistance, calculateTravelTime } from '../../lib/geography/distanceService';

import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/ShadCN/Card';
import { Button } from '../ui/ShadCN/Button';
import { Badge } from '../ui/ShadCN/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/ShadCN/Select';
import { Input } from '../ui/ShadCN/Input';
import { formatNumber } from '../../lib/gamemechanics/utils';

export function RouteView() {
  useDisplayUpdate();
  

  const routes = getAllRoutes();
  const routeStats = getRouteStats();
  const availableAircraft = getAvailableAircraft();
  const fleet = getFleet();
  const cities = getAllCities();
  
  // Form state for creating new routes
  const [routeName, setRouteName] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  
  const handleCreateRoute = () => {
    if (routeName && selectedOrigin && selectedDestination) {
      const price = customPrice ? parseFloat(customPrice) : undefined;
      const route = createRoute(routeName, selectedOrigin, selectedDestination, price);
      if (route) {
        // Reset form
        setRouteName('');
        setSelectedOrigin('');
        setSelectedDestination('');
        setCustomPrice('');
      }
    }
  };
  
  const handleAssignAircraft = (routeId: string, aircraftId: string) => {
    assignAircraftToRoute(routeId, aircraftId);
  };
  
  const handleRemoveAircraft = (routeId: string, aircraftId: string) => {
    if (confirm('Remove this aircraft from the route?')) {
      removeAircraftFromRoute(routeId, aircraftId);
    }
  };
  
  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      deleteRoute(routeId);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Filter destinations based on selected origin
  const getValidDestinations = () => {
    if (!selectedOrigin) return cities;
    return cities.filter(city => city.id !== selectedOrigin);
  };
  

  
  // Auto-generate route name when cities are selected
  const handleOriginChange = (value: string) => {
    setSelectedOrigin(value);
    if (value && selectedDestination && !routeName) {
      const originCity = getCity(value);
      const destinationCity = getCity(selectedDestination);
      if (originCity && destinationCity) {
        setRouteName(`${originCity.name} - ${destinationCity.name}`);
      }
    }
  };
  
  const handleDestinationChange = (value: string) => {
    setSelectedDestination(value);
    if (selectedOrigin && value && !routeName) {
      const originCity = getCity(selectedOrigin);
      const destinationCity = getCity(value);
      if (originCity && destinationCity) {
        setRouteName(`${originCity.name} - ${destinationCity.name}`);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <ViewHeader 
        title="🗺️ Route Management" 
        description="Create permanent routes and assign aircraft for continuous operations"
      />
      
      {/* Route Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Route Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{routeStats.totalRoutes}</div>
            <div className="text-sm text-muted-foreground">Total Routes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{routeStats.activeRoutes}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{routeStats.inactiveRoutes}</div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{routeStats.assignedAircraft}</div>
            <div className="text-sm text-muted-foreground">Aircraft Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(routeStats.totalRevenue)}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{routeStats.averageLoadFactor.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Load Factor</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create New Route */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Route</CardTitle>
          <CardDescription>Establish a permanent route between two cities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Route Name</label>
              <Input
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Enter route name or auto-generate by selecting cities"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Origin City</label>
                <Select value={selectedOrigin} onValueChange={handleOriginChange}>
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
                  onValueChange={handleDestinationChange}
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
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Price per Passenger (Optional)</label>
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Leave empty for automatic pricing"
                min="0"
              />
            </div>
          </div>
          
          {/* City Selection Display */}
          {selectedOrigin && !selectedDestination && (
            <div>
              <h4 className="font-medium mb-2">Selected Origin City:</h4>
              <CityCard city={getCity(selectedOrigin)!} />
            </div>
          )}
          
          {selectedOrigin && selectedDestination && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Route Information:</h4>
                <RouteInfoCard routeInfo={{
                  distance: calculateCityDistance(selectedOrigin, selectedDestination),
                  isDomestic: getCity(selectedOrigin)!.country === getCity(selectedDestination)!.country,
                  travelTimes: getAvailableAircraftTypes().map(aircraft => ({
                    aircraft: aircraft.name,
                    time: calculateTravelTime(selectedOrigin, selectedDestination, aircraft.speed),
                    inRange: calculateCityDistance(selectedOrigin, selectedDestination) <= aircraft.range
                  }))
                }} />
              </div>
              <div className="text-sm text-muted-foreground">
                Distance: {formatNumber(calculateCityDistance(selectedOrigin, selectedDestination))} km
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleCreateRoute}
            disabled={!routeName || !selectedOrigin || !selectedDestination}
            className="w-full md:w-auto"
          >
            Create Route
          </Button>
        </CardContent>
      </Card>
      
      {/* Route Management */}
      <Card>
        <CardHeader>
          <CardTitle>Route Management ({routes.length})</CardTitle>
          <CardDescription>Manage your routes and assign aircraft</CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No routes created yet. Create a route above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => {
                const originCity = getCity(route.originCityId);
                const destinationCity = getCity(route.destinationCityId);
                const assignedAircraft = route.assignedAircraftIds.map(id => 
                  fleet.find(aircraft => aircraft.id === id)
                ).filter(Boolean);
                
                return (
                  <Card key={route.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{route.name}</CardTitle>
                          <CardDescription>
                            {originCity?.name} → {destinationCity?.name} • {formatNumber(route.distance)} km
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={route.isActive ? "default" : "secondary"}>
                            {route.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {route.assignedAircraftIds.length} Aircraft
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Flight Time:</span>
                          <div className="font-medium">{route.flightTime.toFixed(1)}h</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price/Passenger:</span>
                          <div className="font-medium">{formatCurrency(route.pricePerPassenger)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Revenue:</span>
                          <div className="font-medium text-green-600">{formatCurrency(route.totalRevenue)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Load Factor:</span>
                          <div className="font-medium">{route.averageLoadFactor.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Assigned Aircraft */}
                      {assignedAircraft.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Assigned Aircraft:</h4>
                          <div className="space-y-2">
                            {assignedAircraft.map((aircraft) => {
                              if (!aircraft) return null;
                              const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                              return (
                                <div key={aircraft.id} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                                  <div className="flex-1">
                                    <div className="font-medium">{aircraftType?.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      ID: {aircraft.id.slice(-8)} • Condition: {aircraft.condition}%
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveAircraft(route.id, aircraft.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Aircraft Assignment */}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-2 block">Assign Aircraft:</label>
                          <Select
                            onValueChange={(aircraftId) => handleAssignAircraft(route.id, aircraftId)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select aircraft to assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAircraft
                                .filter(aircraft => {
                                  const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                                  return aircraftType && route.distance <= aircraftType.range;
                                })
                                .map((aircraft) => {
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
                        
                        {route.assignedAircraftIds.length === 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            Delete Route
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 