import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ShadCN';
import { getAvailableAircraftTypes } from '../../lib/aircraft/aircraftData';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';

interface AircraftPurchasePanelProps {
  onPurchase?: (aircraftTypeId: string) => void;
}

export function AircraftPurchasePanel({ onPurchase }: AircraftPurchasePanelProps) {
  useDisplayUpdate();
  const gameState = getGameState();
  const availableAircraftTypes = getAvailableAircraftTypes();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePurchase = (aircraftTypeId: string) => {
    if (onPurchase) {
      onPurchase(aircraftTypeId);
    }
  };

  return (
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
                  <div>
                    <span className="text-muted-foreground">Maintenance:</span>
                    <div className="font-medium">{formatCurrency(aircraftType.maintenanceCost)} /week</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Turn Time:</span>
                    <div className="font-medium">{aircraftType.turnTime} h</div>
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
                    onClick={() => handlePurchase(aircraftType.id)}
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
  );
} 