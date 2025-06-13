import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getFleet, getFleetStats, purchaseAircraft, sellAircraft } from '../../lib/aircraft/fleetService';
import { performMaintenance } from '../../lib/aircraft/fleetMaintenance';
import { getAircraftType } from '../../lib/aircraft/aircraftData';
import { getAllRoutes } from '../../lib/routes/routeService';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '../ui/ShadCN';
import { notificationService } from '../../lib/notifications/notificationService';
import { AircraftPurchasePanel } from '../ui/AircraftPurchasePanel';
import { AircraftCard } from '../ui/Cards/AircraftCard';
import { getGameState, updateGameState } from '../../lib/gamemechanics/gameState';

export function FleetView() {
  useDisplayUpdate();
  

  const fleet = getFleet();
  const fleetStats = getFleetStats();
  const routes = getAllRoutes();
  
  const handlePurchaseAircraft = (aircraftTypeId: string) => {
    const success = purchaseAircraft(aircraftTypeId);
    if (!success) {
      // Could add toast notification here
    }
  };
  
  const handleSellAircraft = (aircraftId: string) => {
    const success = sellAircraft(aircraftId);
    if (success) {
      notificationService.success('Aircraft sold successfully.', { category: 'Fleet' });
    } else {
      notificationService.info('Unable to sell aircraft. It may be in flight or an error occurred.', { category: 'Fleet' });
    }
  };
  
  const handleMaintenance = (aircraftId: string) => {
    const success = performMaintenance(aircraftId);
    if (!success) {
      console.log('Failed to perform maintenance - insufficient funds or aircraft in flight');
    }
  };
  
  const handleSetMaintenancePlan = (aircraftId: string, hours: number) => {
    // Update the maintenancePlan for the aircraft
    const gameState = getGameState();
    const fleet = gameState.fleet || [];
    const updatedFleet = fleet.map(aircraft => {
      if (aircraft.id === aircraftId) {
        // If in maintenance, update plan and remaining hours
        if (aircraft.status === 'maintenance') {
          performMaintenance(aircraftId, hours);
        }
        return {
          ...aircraft,
          maintenancePlan: hours
        };
      }
      return aircraft;
    });
    updateGameState({ fleet: updatedFleet });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getAircraftRoute = (aircraftId: string) => {
    return routes.find(route => route.assignedAircraftIds.includes(aircraftId));
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
                const assignedRoute = getAircraftRoute(aircraft.id);
                return (
                  <AircraftCard
                    key={aircraft.id}
                    aircraft={aircraft}
                    aircraftType={aircraftType}
                    assignedRoute={assignedRoute}
                    onMaintain={handleMaintenance}
                    onSell={handleSellAircraft}
                    onSetMaintenancePlan={handleSetMaintenancePlan}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Purchase New Aircraft */}
      <AircraftPurchasePanel onPurchase={handlePurchaseAircraft} />
    </div>
  );
} 