import { useState } from 'react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { createRoute } from '../../lib/routes/routeService';
import { getOwnedAircraftTypes, getAvailableAircraft } from '../../lib/aircraft/fleetService';
import { getAircraftType } from '../../lib/aircraft/aircraftData';
import { getCity } from '../../lib/geography/cityData';
import { getAllAirports, getAirport } from '../../lib/geography/airportData';
import { calculateAirportDistance, calculateAirportTravelTime } from '../../lib/geography/distanceService';
import { checkGateAvailability, bookGateSlot } from '../../lib/geography/gateService';
import { getGameState, updateGameState } from '../../lib/gamemechanics/gameState';
import { GateBookingRequest, TimeSlot } from '../../lib/geography/gateTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ShadCN/Card';
import { Button } from './ShadCN/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ShadCN/Select';
import { Input } from './ShadCN/Input';
import { Badge } from './ShadCN/Badge';
import { AirportCard } from './Cards/AirportCard';
import { RouteInfoCard } from './Cards/RouteInfoCard';
import { formatNumber } from '../../lib/gamemechanics/utils';
import { AlertTriangle, Clock, Plane, Euro } from 'lucide-react';

export function RouteCreator() {
  useDisplayUpdate();
  
  const airports = getAllAirports();
  const ownedAircraftTypes = getOwnedAircraftTypes();
  const availableAircraft = getAvailableAircraft();
  const gameState = getGameState();
  
  // Form state for creating new routes
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [roundtripsPerDay, setRoundtripsPerDay] = useState<number>(1);
  const [showGateDetails, setShowGateDetails] = useState<boolean>(false);

  // Calculate slot requirements based on aircraft and roundtrips
  const calculateSlotRequirements = () => {
    if (!selectedAircraft || !selectedOrigin || !selectedDestination) return null;

    const aircraft = availableAircraft.find(a => a.id === selectedAircraft);
    const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
    
    if (!aircraftType) return null;

    const originAirport = getAirport(selectedOrigin);
    const destinationAirport = getAirport(selectedDestination);
    
    if (!originAirport || !destinationAirport) return null;

    // Calculate turn time with airport modifier and add buffer
    const baseTurnTime = aircraftType.turnTime;
    const originTurnTime = baseTurnTime * originAirport.turnTimeModifier;
    const destinationTurnTime = baseTurnTime * destinationAirport.turnTimeModifier;
    
    // Add 30 minutes buffer (15 min before + 15 min after)
    const originSlotDuration = Math.ceil((originTurnTime * 60) + 30); // Convert to minutes and add buffer
    const destinationSlotDuration = Math.ceil((destinationTurnTime * 60) + 30);

    return {
      originSlotDuration,
      destinationSlotDuration,
      aircraftType,
      originTurnTime,
      destinationTurnTime
    };
  };

  // Get available gates for both airports
  const getGateAvailability = () => {
    if (!selectedOrigin || !selectedDestination || !selectedAircraft) return null;

    const slotReqs = calculateSlotRequirements();
    if (!slotReqs) return null;

    // For simplicity, check availability starting at 8:00 AM
    const startTime: TimeSlot = { hour: 8, minute: 0 };

    const originGates = checkGateAvailability(
      selectedOrigin,
      startTime,
      slotReqs.originSlotDuration,
      selectedAircraft
    );

    const destinationGates = checkGateAvailability(
      selectedDestination,
      startTime,
      slotReqs.destinationSlotDuration,
      selectedAircraft
    );

    return {
      originGates,
      destinationGates,
      slotReqs
    };
  };

  const handleCreateRoute = async () => {
    if (!selectedOrigin || !selectedDestination || !selectedAircraft) return;

      const originAirport = getAirport(selectedOrigin);
      const destinationAirport = getAirport(selectedDestination);
      
    if (!originAirport || !destinationAirport) return;

        const originCity = getCity(originAirport.cityId);
        const destinationCity = getCity(destinationAirport.cityId);
        
    if (!originCity || !destinationCity) return;

    // Create the route first
          const routeName = `${originAirport.code} - ${destinationAirport.code}`;
    const route = createRoute(routeName, selectedOrigin, selectedDestination, undefined, selectedAircraft);
          
    if (!route) return;

    // Store roundtrips information for the aircraft assignment
    // This will be used by the assignAircraftToRoute function
    const routeAssignmentData = (gameState as any).routeAssignmentData || {};
    routeAssignmentData[route.id] = {
      aircraftId: selectedAircraft,
      roundtripsPerDay: roundtripsPerDay
    };
    updateGameState({ routeAssignmentData } as any);
    
            // Reset form
            setSelectedOrigin('');
            setSelectedDestination('');
    setSelectedAircraft('');
    setRoundtripsPerDay(1);
    setShowGateDetails(false);
  };
  
  // Filter destinations based on selected aircraft range
  const getValidDestinations = () => {
    if (!selectedOrigin) return airports;
    return airports.filter(airport => airport.id !== selectedOrigin);
  };

  // Filter aircraft based on route distance
  const getValidAircraft = () => {
    if (!selectedOrigin || !selectedDestination) return availableAircraft;
    
    const distance = calculateAirportDistance(selectedOrigin, selectedDestination);
    return availableAircraft.filter(aircraft => {
      const aircraftType = getAircraftType(aircraft.aircraftTypeId);
      return aircraftType && distance <= aircraftType.range;
    });
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
  const gateAvailability = getGateAvailability();
  const slotReqs = calculateSlotRequirements();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Route</CardTitle>
        <CardDescription>Plan a new flight route with aircraft assignment and gate booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Aircraft and Schedule Selection */}
        {selectedOrigin && selectedDestination && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Aircraft</label>
              <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {getValidAircraft().length > 0 ? (
                    getValidAircraft().map((aircraft) => {
                      const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                      return (
                        <SelectItem key={aircraft.id} value={aircraft.id}>
                          {aircraftType?.name} (ID: {aircraft.id.slice(-8)})
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-aircraft" disabled>
                      No suitable aircraft available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {getValidAircraft().length === 0 && (
                <div className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>No aircraft available with sufficient range for this route</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Roundtrips per Day</label>
              <Input
                type="number"
                min="1"
                max="6"
                value={roundtripsPerDay}
                onChange={(e) => setRoundtripsPerDay(parseInt(e.target.value) || 1)}
                placeholder="1"
                disabled={!selectedAircraft}
              />
              <div className="text-xs text-gray-500 mt-1">
                Maximum flights depend on aircraft speed and turn times
              </div>
            </div>
          </div>
        )}

        {/* Slot Requirements Display */}
        {slotReqs && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Slot Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Origin ({getAirport(selectedOrigin)?.code})</div>
                  <div className="text-gray-600">
                    Turn time: {slotReqs.originTurnTime.toFixed(1)}h + 30min buffer
                  </div>
                  <div className="text-blue-600 font-medium">
                    Slot duration: {slotReqs.originSlotDuration} minutes
                  </div>
                </div>
                <div>
                  <div className="font-medium">Destination ({getAirport(selectedDestination)?.code})</div>
                  <div className="text-gray-600">
                    Turn time: {slotReqs.destinationTurnTime.toFixed(1)}h + 30min buffer
                  </div>
                  <div className="text-blue-600 font-medium">
                    Slot duration: {slotReqs.destinationSlotDuration} minutes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gate Availability */}
        {gateAvailability && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Gate Availability</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGateDetails(!showGateDetails)}
              >
                {showGateDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className={gateAvailability.originGates.length > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-4 w-4" />
                    <span className="font-medium">Origin Gates</span>
                  </div>
                  <div className="text-sm">
                    {gateAvailability.originGates.length > 0 ? (
                      <div className="text-green-700">
                        {gateAvailability.originGates.length} gates available
                      </div>
                    ) : (
                      <div className="text-red-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No gates available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={gateAvailability.destinationGates.length > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-4 w-4" />
                    <span className="font-medium">Destination Gates</span>
                  </div>
                  <div className="text-sm">
                    {gateAvailability.destinationGates.length > 0 ? (
                      <div className="text-green-700">
                        {gateAvailability.destinationGates.length} gates available
                      </div>
                    ) : (
                      <div className="text-red-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No gates available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Gate Information */}
            {showGateDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origin Gates Detail */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Origin Gates ({getAirport(selectedOrigin)?.code})</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {gateAvailability.originGates.length > 0 ? (
                      <div className="space-y-2">
                        {gateAvailability.originGates.slice(0, 3).map((gate) => (
                          <div key={gate.gateId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{gate.gateNumber}</span>
                              <Badge className={
                                gate.gateType === 'exclusive' ? 'bg-purple-100 text-purple-800' :
                                gate.gateType === 'preferential' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {gate.gateType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Euro className="h-3 w-3" />
                              <span>{gate.priceRange.min}-{gate.priceRange.max}</span>
                            </div>
                          </div>
                        ))}
                        {gateAvailability.originGates.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{gateAvailability.originGates.length - 3} more gates
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No gates owned at this airport. Purchase gates to enable route operations.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Destination Gates Detail */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Destination Gates ({getAirport(selectedDestination)?.code})</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {gateAvailability.destinationGates.length > 0 ? (
                      <div className="space-y-2">
                        {gateAvailability.destinationGates.slice(0, 3).map((gate) => (
                          <div key={gate.gateId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{gate.gateNumber}</span>
                              <Badge className={
                                gate.gateType === 'exclusive' ? 'bg-purple-100 text-purple-800' :
                                gate.gateType === 'preferential' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {gate.gateType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Euro className="h-3 w-3" />
                              <span>{gate.priceRange.min}-{gate.priceRange.max}</span>
                            </div>
                          </div>
                        ))}
                        {gateAvailability.destinationGates.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{gateAvailability.destinationGates.length - 3} more gates
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No gates owned at this airport. Purchase gates to enable route operations.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
        
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
        
        {/* Debug Information (can be removed later) */}
        {(selectedOrigin || selectedDestination || selectedAircraft) && (
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Selection Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Origin:</span>
                  <span className={selectedOrigin ? 'text-green-600' : 'text-red-600'}>
                    {selectedOrigin ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <span className={selectedDestination ? 'text-green-600' : 'text-red-600'}>
                    {selectedDestination ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Aircraft:</span>
                  <span className={selectedAircraft ? 'text-green-600' : 'text-red-600'}>
                    {selectedAircraft ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valid Aircraft:</span>
                  <span className={getValidAircraft().length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {getValidAircraft().length > 0 ? `${getValidAircraft().length} available` : 'None'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Create Route Button */}
        <div className="space-y-2">
          {gateAvailability && (gateAvailability.originGates.length === 0 || gateAvailability.destinationGates.length === 0) && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Route will be created without gate bookings. Purchase gates at both airports for full functionality.</span>
            </div>
          )}
          
          {/* Button with tooltip */}
          <div className="relative group">
        <Button 
          onClick={handleCreateRoute}
              disabled={!selectedOrigin || !selectedDestination || !selectedAircraft || getValidAircraft().length === 0}
          className="w-full"
        >
              Create Route {selectedAircraft && `& Assign Aircraft`}
        </Button>
            
            {/* Tooltip for disabled state */}
            {(!selectedOrigin || !selectedDestination || !selectedAircraft || getValidAircraft().length === 0) && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {!selectedOrigin && "Select origin airport"}
                {selectedOrigin && !selectedDestination && "Select destination airport"}
                {selectedOrigin && selectedDestination && getValidAircraft().length === 0 && "No aircraft available with sufficient range"}
                {selectedOrigin && selectedDestination && getValidAircraft().length > 0 && !selectedAircraft && "Select an aircraft"}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 