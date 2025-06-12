Okay it seems we are ready for implementing the first core gamemechanics. 

We will need to implement the following:
 A interface for planes, props for speed, range, max passengers, cost. 
     - A list of available planes Lets just do a boing and a airbus. 
     - a way to create instances of planes, so the player can buy them.
     - a way to keep track of the players planes. IE Fleet management.
 a Interface for cities, props for population, avalible passengers, country 
  - a list of available cities, lets just do a london+ paris + lyon and we will want to initaite them on gamestart
  - A simple way to calculate the distance between cities. (maybe we can do some sort of trianglulating from coordinates )
   - a simple way to calculate the time it takes to travel between cities. Should be just speed and distance. 
   - a simple way to calculate population -> passengers. And a simple mechanic that decides where passengers wanna go. We would implement something that will increase the demand for domestic routes. . 
  A way for the player to create routes, props for distance. We might want to do a interface for routes. 
  We will need a view for showing routes. We will likely use a card for this.  And we could use the progress bar for the distance. At update with the distance traveled on each gametick.  
  - a way to keep track of the players routes. IE Route management. (Not sure how we do this, or if its needed or we just stick to the interface mentioned above)
  - a simple way to calculate the income per pasenger per route, and a mechanic to add income to the player when flight is completed.  


🛫 Implementation Plan for Core Game Mechanics
Phase 1: Core Data Structures & Services
1.1 Aircraft System (src/lib/aircraft/)
Create aircraftTypes.ts - Define plane interfaces and available aircraft
Create fleetService.ts - Manage player's fleet of planes
Aircraft properties: speed, range, maxPassengers, cost, fuel consumption
1.2 Cities & Geography (src/lib/geography/)
Create cityTypes.ts - Define city interfaces with population, country, coordinates
Create cityService.ts - Initialize cities (London, Paris, Lyon) and manage city data
Create distanceService.ts - Calculate distances and travel times between cities
1.3 Route Management (src/lib/routes/)
Create routeTypes.ts - Define route interfaces and status tracking
Create routeService.ts - Create, manage, and track active routes
Route properties: origin, destination, aircraft, progress, income calculation
Phase 2: Game State Integration
2.1 Extend GameState Interface
Apply to AIguide-Core...
2.2 Update Game Tick System
Modify gameTick.ts to process route progress and income generation
Handle aircraft movement and route completion
Phase 3: User Interface Components
3.1 Fleet Management View (src/components/views/FleetView.tsx)
Display owned aircraft with cards
Purchase new aircraft interface
Aircraft details and statistics
3.2 Route Management View (src/components/views/RouteView.tsx)
Active routes display with progress bars
Create new route interface
Route income and performance metrics
3.3 Geography/Map View (src/components/views/GeographyView.tsx)
City information and passenger demand
Distance calculator between cities
Route planning interface
Phase 4: Game Mechanics Implementation
4.1 Passenger Demand System
Population-based passenger generation
Domestic route preference logic
Dynamic pricing based on demand
4.2 Income Calculation
Per-passenger income based on distance
Route profitability analysis
Fuel costs and operational expenses
🗂️ Suggested File Structure
Apply to AIguide-Core...
🎯 Implementation Order
Start with Aircraft System - Define plane types and fleet management
Add Cities & Geography - Create city data and distance calculations
Implement Routes - Basic route creation and tracking
Extend Game State - Integrate all systems into central state
Create UI Components - Fleet and Route management views
Add Game Mechanics - Income, passenger demand, and progression