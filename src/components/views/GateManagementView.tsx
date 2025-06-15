// Gate Management view for comprehensive gate operations

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/ShadCN';
import { Building2, Euro, TrendingUp, MapPin, Plus } from 'lucide-react';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { getGameState } from '../../lib/gamemechanics/gameState';
import { getAllAirports } from '../../lib/geography/airportData';
import { getGateStats } from '../../lib/geography/gateService';
import { uiEmojis } from '../ui/resources/emojiMap';
import GateInfoCard from '../ui/Cards/GateInfoCard';
import GateBookingPanel from '../ui/GateBookingPanel';
import { ViewHeader } from '../ui/ViewHeader';

export function GateManagementView() {
  useDisplayUpdate();
  
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const gameState = getGameState();
  const airports = getAllAirports();
  const airportGateStates = gameState.airportGateStates || {};

  // Get airports where player has gates
  const airportsWithGates = airports.filter(airport => 
    (airportGateStates[airport.id] || []).length > 0
  );

  // Calculate overall statistics
  const overallStats = airports.reduce((acc, airport) => {
    const gateStats = getGateStats(airport.id);
    const airportGates = airportGateStates[airport.id] || [];
    
    return {
      totalGates: acc.totalGates + gateStats.totalGates,
      totalRevenue: acc.totalRevenue + gateStats.totalDailyRevenue,
      totalSlots: acc.totalSlots + (airportGates.length * 24), // Simplified slot calculation
      bookedSlots: acc.bookedSlots + Math.floor((airportGates.length * 24) * (gateStats.utilizationRate / 100)),
      airportsWithGates: acc.airportsWithGates + (airportGates.length > 0 ? 1 : 0)
    };
  }, {
    totalGates: 0,
    totalRevenue: 0,
    totalSlots: 0,
    bookedSlots: 0,
    airportsWithGates: 0
  });

  const overallUtilization = overallStats.totalSlots > 0 
    ? (overallStats.bookedSlots / overallStats.totalSlots) * 100 
    : 0;

  const handlePurchaseGate = () => {
    setShowBookingPanel(true);
  };

  const handleCloseBookingPanel = () => {
    setShowBookingPanel(false);
  };

  return (
    <div className="space-y-6">
      <ViewHeader 
        title="Gate Management" 
        description="Purchase and manage airport gates" 
        icon={uiEmojis.buildings}
      />

      {showBookingPanel && (
        <GateBookingPanel 
          onClose={handleCloseBookingPanel}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="airports">My Gates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{overallStats.totalGates}</div>
                <div className="text-sm text-gray-600">Total Gates Owned</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{overallStats.airportsWithGates}</div>
                <div className="text-sm text-gray-600">Airports with Gates</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {overallUtilization.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Utilization</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  €{overallStats.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Daily Revenue</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Purchase Gates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button
                  onClick={handlePurchaseGate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase New Gate
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Select an airport and configure your gate preferences
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gate Performance Summary */}
          {overallStats.totalGates > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Gate Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {airportsWithGates.map(airport => {
                    const gateStats = getGateStats(airport.id);
                    const gates = airportGateStates[airport.id] || [];
                    
                    return (
                      <div key={airport.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{airport.name} ({airport.code})</div>
                            <div className="text-sm text-gray-600">
                              {gates.length} gates • {gateStats.utilizationRate.toFixed(1)}% utilization
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            €{gateStats.totalDailyRevenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">daily revenue</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="airports" className="space-y-6">
          {airportsWithGates.length > 0 ? (
            airportsWithGates.map(airport => (
              <GateInfoCard
                key={airport.id}
                airportId={airport.id}
                gates={airportGateStates[airport.id] || []}
                onPurchaseGate={handlePurchaseGate}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Gates Owned</h3>
                <p className="text-gray-600 mb-4">
                  You don't own any gates yet. Purchase your first gate to start managing airport operations.
                </p>
                <Button
                  onClick={handlePurchaseGate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Your First Gate
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Gate Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gate Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {overallStats.totalGates > 0 ? (
                <div className="space-y-3">
                  {['exclusive', 'common'].map(gateType => {
                    const count = airports.reduce((acc, airport) => {
                      const gates = airportGateStates[airport.id] || [];
                      return acc + gates.filter(gate => gate.gateType === gateType).length;
                    }, 0);
                    
                    const percentage = overallStats.totalGates > 0 
                      ? (count / overallStats.totalGates) * 100 
                      : 0;
                    
                    return (
                      <div key={gateType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            gateType === 'exclusive' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {gateType}
                          </Badge>
                          <span className="text-sm">{count} gates</span>
                        </div>
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No gates owned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Airport */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Airport</CardTitle>
            </CardHeader>
            <CardContent>
              {overallStats.totalRevenue > 0 ? (
                <div className="space-y-3">
                  {airportsWithGates
                    .sort((a, b) => {
                      const aRevenue = getGateStats(a.id).totalDailyRevenue;
                      const bRevenue = getGateStats(b.id).totalDailyRevenue;
                      return bRevenue - aRevenue;
                    })
                    .slice(0, 5)
                    .map(airport => {
                      const gateStats = getGateStats(airport.id);
                      const percentage = overallStats.totalRevenue > 0 
                        ? (gateStats.totalDailyRevenue / overallStats.totalRevenue) * 100 
                        : 0;
                      
                      return (
                        <div key={airport.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{airport.code}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              €{gateStats.totalDailyRevenue.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Euro className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No revenue data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 