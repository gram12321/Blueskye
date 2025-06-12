import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getFleet, getFleetStats, purchaseAircraft, sellAircraft, performMaintenance } from '../../lib/aircraft/fleetService';
import { getAvailableAircraftTypes, getAircraftType } from '../../lib/aircraft/aircraftData';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Progress } from '../ui/ShadCN';

export function FleetView() {
  useDisplayUpdate();
  
  const gameState = getGameState();
  const fleet = getFleet();
  const fleetStats = getFleetStats();
  const availableAircraftTypes = getAvailableAircraftTypes();
  
  const handlePurchaseAircraft = (aircraftTypeId: string) => {
    const success = purchaseAircraft(aircraftTypeId);
    if (!success) {
      // Could add toast notification here
      console.log('Failed to purchase aircraft - insufficient funds or other error');
    }
  };
  
  const handleSellAircraft = (aircraftId: string) => {
    if (confirm('Are you sure you want to sell this aircraft?')) {
      sellAircraft(aircraftId);
    }
  };
  
  const handleMaintenance = (aircraftId: string) => {
    const success = performMaintenance(aircraftId);
    if (!success) {
      console.log('Failed to perform maintenance - insufficient funds or aircraft in flight');
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
      case 'available': return 'bg-green-500';
      case 'in-flight': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-6">
      <ViewHeader 
        title="🛫 Fleet Management" 
        description="Manage your aircraft fleet and purchase new planes"
      />
      
      {/* Fleet Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{fleetStats.totalAircraft}</div>
            <div className="text-sm text-muted-foreground">Total Aircraft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{fleetStats.availableAircraft}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{fleetStats.inFlightAircraft}</div>
            <div className="text-sm text-muted-foreground">In Flight</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{fleetStats.maintenanceAircraft}</div>
            <div className="text-sm text-muted-foreground">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(fleetStats.totalValue)}</div>
            <div className="text-sm text-muted-foreground">Fleet Value</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Fleet */}
      <Card>
        <CardHeader>
          <CardTitle>Your Aircraft ({fleet.length})</CardTitle>
          <CardDescription>Manage your current aircraft fleet</CardDescription>
        </CardHeader>
        <CardContent>
          {fleet.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No aircraft in your fleet. Purchase aircraft below to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fleet.map((aircraft) => {
                const aircraftType = getAircraftType(aircraft.aircraftTypeId);
                if (!aircraftType) return null;
                
                return (
                  <Card key={aircraft.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{aircraftType.name}</CardTitle>
                          <CardDescription>{aircraftType.manufacturer}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(aircraft.status)}>
                          {aircraft.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Condition</span>
                          <span>{aircraft.condition}%</span>
                        </div>
                        <Progress value={aircraft.condition} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Flight Hours:</span>
                          <div className="font-medium">{aircraft.totalFlightHours.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Passengers:</span>
                          <div className="font-medium">{aircraftType.maxPassengers}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mt-3"></div>
                      
                      <div className="flex gap-2">
                        {aircraft.condition < 80 && aircraft.status !== 'in-flight' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMaintenance(aircraft.id)}
                          >
                            Maintain
                          </Button>
                        )}
                        {aircraft.status !== 'in-flight' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleSellAircraft(aircraft.id)}
                          >
                            Sell
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
      
      {/* Purchase New Aircraft */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Aircraft</CardTitle>
          <CardDescription>Buy new aircraft to expand your fleet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableAircraftTypes.map((aircraftType) => (
              <Card key={aircraftType.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{aircraftType.name}</CardTitle>
                  <CardDescription>{aircraftType.manufacturer}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Speed:</span>
                      <div className="font-medium">{aircraftType.speed} km/h</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Range:</span>
                      <div className="font-medium">{aircraftType.range.toLocaleString()} km</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Passengers:</span>
                      <div className="font-medium">{aircraftType.maxPassengers}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fuel:</span>
                      <div className="font-medium">{aircraftType.fuelConsumption} L/km</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4"></div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Price:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(aircraftType.cost)}
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchaseAircraft(aircraftType.id)}
                      disabled={!gameState.player || gameState.player.money < aircraftType.cost}
                    >
                      {!gameState.player || gameState.player.money < aircraftType.cost 
                        ? 'Insufficient Funds' 
                        : 'Purchase Aircraft'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 