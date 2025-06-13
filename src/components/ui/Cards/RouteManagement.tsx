import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ShadCN/Card';
import { Button } from '../ShadCN/Button';
import { Badge } from '../ShadCN/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ShadCN/Select';
import { Input } from '../ShadCN/Input';
import { FlightProgress } from '../ShadCN/Progress';
import { BarChart } from '../charts/passengerDemandBarChart';
import { getAircraftType } from '../../../lib/aircraft/aircraftData';
import { getCity } from '../../../lib/geography/cityData';
import { getAirport } from '../../../lib/geography/airportData';
import { getRoutePassengerDemand, getAircraftSchedule } from '../../../lib/routes/routeService';
import { formatNumber } from '../../../lib/gamemechanics/utils';

interface RouteManagementProps {
  routes: any[];
  fleet: any[];
  availableAircraft: any[];
  gameState: any;
  handleAssignAircraft: (routeId: string, aircraftId: string) => void;
  handleRemoveAircraft: (routeId: string, aircraftId: string) => void;
  handleDeleteRoute: (routeId: string) => void;
  formatCurrency: (amount: number) => string;
  updateAircraftSchedule: (routeId: string, aircraftId: string, dailyFlights: number) => void;
}

export const RouteManagement: React.FC<RouteManagementProps> = ({
  routes,
  fleet,
  availableAircraft,
  gameState,
  handleAssignAircraft,
  handleRemoveAircraft,
  handleDeleteRoute,
  formatCurrency,
  updateAircraftSchedule,
}) => {
  return (
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
              const originAirport = getAirport(route.originAirportId);
              const destinationAirport = getAirport(route.destinationAirportId);
              const originCity = originAirport ? getCity(originAirport.cityId) : null;
              const destinationCity = destinationAirport ? getCity(destinationAirport.cityId) : null;
              const assignedAircraft = route.assignedAircraftIds.map((id: string) =>
                fleet.find((aircraft: any) => aircraft.id === id)
              ).filter(Boolean);
              const activeFlights = gameState.activeFlights.filter((flight: any) => flight.routeId === route.id);

              // Demand and seats for BarChart
              const demand = getRoutePassengerDemand(route.id);
              let seats = 0;
              assignedAircraft.forEach((aircraft: any) => {
                if (!aircraft) return;
                const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                const schedule = getAircraftSchedule(route.id, aircraft.id);
                if (aircraftType && schedule) {
                  seats += aircraftType.maxPassengers * schedule.dailyFlights;
                }
              });
              const barData = [
                { label: 'Demand', value: demand, color: '#3b82f6' },
                { label: 'Seats', value: seats, color: '#ef4444' }
              ];

              return (
                <Card key={route.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <CardDescription>
                          {originAirport?.code} ({originCity?.name}) → {destinationAirport?.code} ({destinationCity?.name}) • {formatNumber(route.distance)} km
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
                    {/* Demand vs Seats BarChart */}
                    <div className="pt-2">
                      <BarChart data={barData} height={120} title="Demand vs Seats" />
                    </div>
                    {/* Active Flights */}
                    {activeFlights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Active Flights:</h4>
                        <div className="space-y-3">
                          {activeFlights.map((flight: any) => {
                            const aircraft = fleet.find((a: any) => a.id === flight.aircraftId);
                            const aircraftType = aircraft ? getAircraftType(aircraft.aircraftTypeId) : null;
                            return (
                              <div key={flight.id} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">
                                      {aircraftType?.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {flight.passengers} / {flight.maxPassengers} passengers • {flight.currentPhase}
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {flight.remainingTime.toFixed(1)}h remaining
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Flight Progress</span>
                                    <span>{flight.currentProgress.toFixed(1)}%</span>
                                  </div>
                                  <FlightProgress
                                    currentProgress={flight.currentProgress}
                                    flightTime={flight.flightTime}
                                    turnTime={flight.turnTime}
                                    totalTime={flight.totalRoundTripTime}
                                    currentPhase={flight.currentPhase}
                                    className="h-3"
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>🛫 Outbound: {flight.flightTime.toFixed(1)}h</span>
                                    <span>🔄 Turn: {flight.turnTime.toFixed(1)}h</span>
                                    <span>🛬 Return: {flight.flightTime.toFixed(1)}h</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Assigned Aircraft */}
                    {assignedAircraft.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Assigned Aircraft:</h4>
                        <div className="space-y-2">
                          {assignedAircraft.map((aircraft: any) => {
                            if (!aircraft) return null;
                            const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                            const schedule = getAircraftSchedule(route.id, aircraft.id);
                            return (
                              <div key={aircraft.id} className="flex flex-col gap-2 bg-muted/50 rounded-lg p-3">
                                <div className="flex justify-between items-start">
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
                                {/* Schedule Management */}
                                {schedule && (
                                  <div className="mt-2 pt-2 border-t border-muted">
                                    <div className="flex items-center gap-2 mb-2">
                                      <label className="text-sm font-medium">Daily Flights:</label>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={Math.floor(24 / (route.flightTime * 2 + (aircraftType?.turnTime || 1.5)))}
                                        value={schedule.dailyFlights}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          if (!isNaN(value)) {
                                            updateAircraftSchedule(route.id, aircraft.id, value);
                                          }
                                        }}
                                        className="w-20"
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        ({schedule.totalHoursPerDay.toFixed(1)} hours/day)
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Flight: {route.flightTime.toFixed(1)}h × 2 + Turn: {aircraftType?.turnTime || 1.5}h = {(route.flightTime * 2 + (aircraftType?.turnTime || 1.5)).toFixed(1)}h per trip
                                    </div>
                                  </div>
                                )}
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
                              .filter((aircraft: any) => {
                                const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                                return aircraftType && route.distance <= aircraftType.range;
                              })
                              .map((aircraft: any) => {
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
  );
}; 