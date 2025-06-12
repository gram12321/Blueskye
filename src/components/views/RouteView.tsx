import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getActiveRoutes, getRouteStats, createRoute, cancelRoute, completeRoute } from '../../lib/routes/routeService';
import { getAvailableAircraft } from '../../lib/aircraft/fleetService';
import { getAircraftType } from '../../lib/aircraft/aircraftData';
import { getAllCities, getCity } from '../../lib/geography/cityData';
import { calculateCityDistance, isRouteInRange } from '../../lib/geography/distanceService';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/ShadCN/Card';
import { Button } from '../ui/ShadCN/Button';
import { Badge } from '../ui/ShadCN/Badge';
import { Progress } from '../ui/ShadCN/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/ShadCN/Select';

export function RouteView() {
  useDisplayUpdate();
  
  const gameState = getGameState();
  const activeRoutes = getActiveRoutes();
  const routeStats = getRouteStats();
  const availableAircraft = getAvailableAircraft();
  const cities = getAllCities();
  
  // Form state for creating new routes
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  
  const handleCreateRoute = () => {
    if (selectedOrigin && selectedDestination && selectedAircraft) {
      const route = createRoute(selectedOrigin, selectedDestination, selectedAircraft);
      if (route) {
        // Reset form
        setSelectedOrigin('');
        setSelectedDestination('');
        setSelectedAircraft('');
      }
    }
  };
  
  const handleCancelRoute = (routeId: string) => {
    if (confirm('Are you sure you want to cancel this route?')) {
      cancelRoute(routeId);
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
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
      return isRouteInRange(selectedOrigin, city.id, aircraftType.range);
    });
  };
  
  return (
    <div className="space-y-6">
      <ViewHeader 
        title="🗺️ Route Management" 
        description="Create and manage flight routes between cities"
      />
      
      {/* Route Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Route Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{routeStats.totalRoutes}</div>
            <div className="text-sm text-muted-foreground">Total Routes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{routeStats.activeRoutes}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{routeStats.completedRoutes}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
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
          <CardDescription>Plan a new flight route with available aircraft</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <label className="text-sm font-medium mb-2 block">Aircraft</label>
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
          
          {selectedOrigin && selectedDestination && (
            <div className="text-sm text-muted-foreground">
              Distance: {calculateCityDistance(selectedOrigin, selectedDestination).toLocaleString()} km
            </div>
          )}
          
          <Button 
            onClick={handleCreateRoute}
            disabled={!selectedOrigin || !selectedDestination || !selectedAircraft || availableAircraft.length === 0}
            className="w-full md:w-auto"
          >
            Create Route
          </Button>
        </CardContent>
      </Card>
      
      {/* Active Routes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Routes ({activeRoutes.length})</CardTitle>
          <CardDescription>Monitor your current flight operations</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRoutes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active routes. Create a route above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {activeRoutes.map((route) => {
                const originCity = getCity(route.originCityId);
                const destinationCity = getCity(route.destinationCityId);
                const aircraft = availableAircraft.find(a => a.id === route.aircraftId) || 
                               gameState.fleet?.find(a => a.id === route.aircraftId);
                const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
                
                return (
                  <Card key={route.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {originCity?.name} → {destinationCity?.name}
                          </CardTitle>
                          <CardDescription>
                            {aircraftType?.name} • {route.passengers}/{route.maxPassengers} passengers
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(route.status)}>
                          {route.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {route.status === 'in-progress' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Flight Progress</span>
                            <span>{route.currentProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={route.currentProgress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Remaining: {route.remainingTime.toFixed(1)} hours
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Distance:</span>
                          <div className="font-medium">{route.distance.toLocaleString()} km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Flight Time:</span>
                          <div className="font-medium">{route.flightTime.toFixed(1)}h</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <div className="font-medium text-green-600">{formatCurrency(route.totalRevenue)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit:</span>
                          <div className="font-medium text-blue-600">{formatCurrency(route.profit)}</div>
                        </div>
                      </div>
                      
                      {(route.status === 'scheduled' || (route.status === 'in-progress' && route.currentProgress < 50)) && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleCancelRoute(route.id)}
                          >
                            Cancel Route
                          </Button>
                        </div>
                      )}
                      
                      {route.currentProgress >= 100 && route.status === 'in-progress' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => completeRoute(route.id)}
                          >
                            Complete Flight
                          </Button>
                        </div>
                      )}
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