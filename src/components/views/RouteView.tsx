import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getAllRoutes, getRouteStats, assignAircraftToRoute, removeAircraftFromRoute, deleteRoute, updateAircraftSchedule } from '../../lib/routes/routeService';
import { getAvailableAircraft, getFleet } from '../../lib/aircraft/fleetService';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/ShadCN'; // Consolidated ShadCN imports
import { RouteCreator } from '../ui/RouteCreator';
import { RouteManagement } from '../ui/Cards/RouteManagement';

export function RouteView() {
  useDisplayUpdate();
  
  const routes = getAllRoutes();
  const routeStats = getRouteStats();
  const availableAircraft = getAvailableAircraft();
  const fleet = getFleet();
  const gameState = getGameState();
  
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
            <div className="text-sm text-muted-foreground">Load Factor (7d)</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create New Route */}
      <RouteCreator />
      
      {/* Route Management */}
      <RouteManagement
        routes={routes}
        fleet={fleet}
        availableAircraft={availableAircraft}
        gameState={gameState}
        handleAssignAircraft={handleAssignAircraft}
        handleRemoveAircraft={handleRemoveAircraft}
        handleDeleteRoute={handleDeleteRoute}
        formatCurrency={formatCurrency}
        updateAircraftSchedule={updateAircraftSchedule}
      />
    </div>
  );
} 