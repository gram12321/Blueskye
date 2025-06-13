import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from './ShadCN';
import { Progress } from './ShadCN/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ShadCN/Tooltip';
import { getCity } from '../../lib/geography/cityData';
import { getAirport } from '../../lib/geography/airportData';
import { Aircraft } from '../../lib/aircraft/aircraftTypes';
import { Route } from '../../lib/routes/routeTypes';
import { AircraftType } from '../../lib/aircraft/aircraftTypes';
import { Input } from './ShadCN/Input';
import { useState } from 'react';

interface AircraftCardProps {
  aircraft: Aircraft;
  aircraftType: AircraftType;
  assignedRoute?: Route;
  onMaintain?: (aircraftId: string) => void;
  onSell?: (aircraftId: string) => void;
  onSetMaintenancePlan?: (aircraftId: string, hours: number) => void;
}

export function AircraftCard({ aircraft, aircraftType, assignedRoute, onMaintain, onSell, onSetMaintenancePlan }: AircraftCardProps) {
  const [planInput, setPlanInput] = useState(aircraft.maintenancePlan ?? 4);

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

  // Current value calculation
  const currentValue = Math.floor(aircraftType.cost * (aircraft.condition / 100) * 0.7);

  return (
    <Card>
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
          <div>
            <span className="text-muted-foreground">Current Value:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium underline decoration-dotted cursor-help">
                    {formatCurrency(currentValue)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Value = Base Cost × (Condition / 100) × 0.7
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {/* Maintenance Plan UI */}
        <div className="flex items-center gap-2 text-sm mt-2">
          <span className="text-muted-foreground">Maintenance Plan:</span>
          <Input
            type="number"
            min={1}
            max={24}
            value={planInput}
            onChange={e => setPlanInput(Number(e.target.value))}
            className="w-16 h-7 px-2 text-sm"
            disabled={aircraft.status === 'maintenance'}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => onSetMaintenancePlan && onSetMaintenancePlan(aircraft.id, planInput)}
            disabled={aircraft.status === 'maintenance'}
          >
            Set
          </Button>
          <span className="text-xs text-muted-foreground">h/week</span>
        </div>
        {aircraft.status === 'maintenance' && (
          <div className="text-xs text-yellow-700 mt-1">
            In maintenance: {aircraft.maintenanceHoursRemaining ?? 0}h left
          </div>
        )}
        {assignedRoute && (() => {
          const originAirport = getAirport(assignedRoute.originAirportId);
          const destinationAirport = getAirport(assignedRoute.destinationAirportId);
          const originCity = originAirport ? getCity(originAirport.cityId) : null;
          const destinationCity = destinationAirport ? getCity(destinationAirport.cityId) : null;
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
              <div className="text-xs text-blue-800 font-medium">Assigned Route:</div>
              <div className="text-sm text-blue-700">
                {assignedRoute.name}
              </div>
              <div className="text-xs text-blue-600">
                {originAirport?.code} ({originCity?.name}) → {destinationAirport?.code} ({destinationCity?.name})
              </div>
            </div>
          );
        })()}
        <div className="border-t pt-3 mt-3"></div>
        <div className="flex gap-2">
          {aircraft.condition < 80 && aircraft.status !== 'in-flight' && onMaintain && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onMaintain(aircraft.id)}
            >
              Maintain
            </Button>
          )}
          {aircraft.status !== 'in-flight' && onSell && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onSell(aircraft.id)}
            >
              Sell
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 