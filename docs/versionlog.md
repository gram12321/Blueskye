## [0.010]  - 2025-06-12 - Route Scheduling & Aircraft Assignment + hour time system

### Major Features & Changes
- **Route Scheduling**:
  - **NEW**: Route scheduling system to manage aircraft assignments and flight times.
  - **NEW**: Hour-based time system for flight progression.



## [0.009]  - 2025-06-12 - Enhanced Passenger Demand Visualization & Map Integration

### Major Features & Changes
- **Interactive Data Visualization**:
  - **NEW**: Interactive pie charts for passenger distribution analysis
  - **IMPROVED**: Bar chart scaling and responsiveness for better data readability
  - **ENHANCED**: Chart tooltips with detailed passenger statistics and market insights
- **Map Integration**:
  - **NEW**: OpenStreetMap integration for geographical visualization
  - **NEW**: Airport and route visualization on the map interface
  - **NEW**: Interactive map markers with passenger demand information


## [0.008]  - 2025-06-12 - Simplified airport and passenger interfaces & data cleanup

### Major Features & Changes
- **Interface Simplification**:
  - **REMOVED**: Airport properties: `capacity`, `hub`, `international` - simplified airport model for cleaner implementation.
  - **REMOVED**: Passenger property: `priority` - simplified passenger model.
  - **REMOVED**: City properties: `passengerDemandMultiplier`, `domesticPreference` - simplified city data.
- **Data Organization**:
  - **NEW**: `airportData.ts` - moved all airport data from `cityData.ts` to separate dedicated file.
  - **UPDATED**: Domestic preferences now handled as constants in `passengerDemandService.ts`.
  - **UPDATED**: All import statements throughout codebase to use new `airportData.ts`.
- **Component Updates**:
  - **UPDATED**: `AirportCard` component simplified to show only essential information (coordinates, waiting passengers).
  - **UPDATED**: `CityCard` component simplified to show only population and coordinates.
  - **UPDATED**: `GeographyView` and `PassengerDemandView` updated to work with simplified data model.
- **Service Updates**:
  - **UPDATED**: `passengerDemandService.ts` to use constant domestic preferences instead of city properties.
  - **UPDATED**: All route and distance services to import from new `airportData.ts`.
  - **CLEANED**: Removed all references to removed properties throughout the codebase.

## [0.007]  - 2025-06-12 - Airport-based passenger demand system & major overhaul

### Major Features & Changes
- **Complete Airport-Based System Redesign**:
  - **NEW**: Routes now connect airports instead of cities, providing more realistic flight operations.
  - **NEW**: Airport data with major airports for London (LHR, LGW, LTN), Paris (CDG, ORY), and Lyon (LYS).
  - Each airport has capacity, hub status, international capability, and specific coordinates.
- **Revolutionary Passenger Demand System**:
  - **NEW**: Realistic passenger generation each game week based on city population and demand multipliers.
  - **NEW**: Intelligent destination selection using exponential distance decay, domestic preferences, and city attractiveness.
  - **NEW**: Airport distribution system where passengers choose airports based on distance from origin city (Heathrow gets more London passengers than Gatwick, but even Liverpool gets some).
  - **NEW**: Passenger priority system (business vs leisure travelers) affecting pricing potential.
- **New UI Components & Views**:
  - **NEW**: `AirportCard` component displaying airport capacity, utilization, and waiting passengers.
  - **NEW**: `PassengerDemandView` - comprehensive view showing passenger statistics, airport utilization, and market insights.
  - Updated `RouteCreator` to work with airports instead of cities, showing airport codes and city information.
- **Enhanced Route System**:
  - Routes now use airport IDs (`originAirportId`, `destinationAirportId`) instead of city IDs.
  - Updated route service with new airport distance calculations and passenger demand integration.
  - Route displays now show airport codes and city names (e.g., "LHR (London) → CDG (Paris)").
- **Game State Integration**:
  - Added `waitingPassengers` array to game state to track generated passengers.
  - Passenger generation integrated into game tick system (generates new passengers each week).
  - Updated all existing views (Fleet, Routes, Geography) to work with the new airport system.
- **Technical Infrastructure**:
  - New `passengerDemandService.ts` with sophisticated passenger generation algorithms.
  - Enhanced distance service with airport-to-airport calculations.
  - Updated route types and services for airport compatibility.
  - Navigation updated with new "Passengers" view for demand monitoring.

## [0.006]  - 2025-06-12 - Advanced Market & Analytics Update

### Major Features & Changes
- **Enhanced Passenger Demand System**: 
  - Improved demand calculations considering both origin and destination city factors
  - Distance-based demand curves with optimal ranges for different flight types
  - Seasonal variation and business/leisure travel factors
  - Domestic preference penalties for international routes when cities favor domestic travel
- **Dynamic Pricing System**: 
  - Demand-based pricing adjustments (premium for high demand, discounts for low demand)
  - Market size factors and distance-based pricing tiers
  - Minimum viable pricing thresholds to prevent unrealistic low prices
- **Comprehensive Cost Model**: 
  - Enhanced operational costs including fuel, airport fees, crew wages, maintenance, and handling costs
  - Realistic cost structure that affects route profitability
- **Route Analytics & Profitability Analysis**: 
  - `src/lib/routes/routeAnalytics.ts`: Advanced analytics for route performance, market analysis, and profitability insights
  - Performance metrics, market penetration analysis, and optimization recommendations
  - Market opportunity identification and competition analysis
- **Geography/Map View**:
  - `src/components/views/GeographyView.tsx`: New view for city information, demand analysis, distance calculator, and market opportunities



## [0.005]  - 2025-06-12 - Gamemechanics alpha

### Major Features & Changes
- **Core Game Mechanics Implemented**:
  - **Aircraft System**:
    - `src/lib/aircraft/aircraftTypes.ts`: Defines aircraft interfaces and properties (speed, range, maxPassengers, cost, fuel consumption).
    - `src/lib/aircraft/fleetService.ts`: Manages player's fleet (purchase, sell, maintain, track condition/flight hours).
    - `src/lib/aircraft/aircraftData.ts`: Contains available aircraft types (Boeing, Airbus).
  - **Cities & Geography**:
    - `src/lib/geography/cityTypes.ts`: Defines city interfaces (population, country, coordinates, demand multipliers).
    - `src/lib/geography/cityData.ts`: Initializes and manages city data (London, Paris, Lyon).
    - `src/lib/geography/distanceService.ts`: Calculates distances and travel times between cities.
  - **Route Management**:
    - `src/lib/routes/routeTypes.ts`: Defines route interfaces and status tracking.
    - `src/lib/routes/routeService.ts`: Manages route creation, progress, income, demand, and completion.
  - **Game State Integration**:
    - `src/lib/gamemechanics/gameState.ts`: Extended to include fleet, cities, active/completed routes, and total income.
    - `src/lib/gamemechanics/gameTick.ts`: Updated to process route progress and income generation each game tick.
  - **User Interface Components**:
    - `src/components/views/FleetView.tsx`: Displays owned aircraft, allows purchase/sale/maintenance, shows fleet stats.
    - `src/components/views/RouteView.tsx`: Displays active routes with progress bars, allows route creation/cancellation, shows route stats.
    - *(Planned but not yet implemented: Geography/Map View for city info, demand, and route planning)*
- **Finance System Integration**: All major mechanics now use the centralized finance system for transaction tracking:
  - Aircraft purchases, sales, and maintenance now record transactions with appropriate categories and descriptions.
  - Route revenue and flight expenses (fuel costs) are now logged as financial transactions when flights complete.
- **Realistic Flight Progression**: Flight progress is now based on actual flight hours:
  - Each game day advances flight progress by a percentage based on the route's real flight time (distance/speed), rather than a fixed weekly increment.
  - Aircraft flight hours and condition are updated accurately upon route completion.
- **Improved Transaction Tracking**: All financial actions (buy/sell/maintain aircraft, route revenue/expenses) are visible in the Finance view's cash flow and transaction history.
- **Bug Fixes & Refactoring**:
  - Removed direct player money updates from mechanics; all money changes now go through the finance system.
  - Improved error handling for missing aircraft types and invalid operations.
  - Enhanced transaction descriptions for clarity in financial reports.


## [0.004]  - 2025-06-12 - Notification system and fixing playerlogin

### Major Features & Changes
- **Notification System**: Added a notification system for in-game messages to the player.
- **Finance System**: Added a finance system to track the player's finances.
- **Player Login**: Fixed the player login system to work correctly.
- **Game Tick**: Created gameTick.ts to handle the game tick IE advancing the week.

## [0.003]  - 2025-06-12 - Core systems and UI/UX improvements

### Major Features & Changes
- **Player + Company System**: Multi-company management, company switching, and persistent player profiles via LocalStorage abstraction (`storageService`).
- **Navigation Simplification**: TopBar and navigation menu refactored for clarity and minimalism (Company, Finance, Tradepedia as main views).
- **Radix UI Integration**: Added and integrated Radix UI components (Switch, Select, RadioGroup, DropdownMenu, etc.) via Shadcn UI wrappers for consistent, accessible UI elements.
- **Tailwind CSS + Shadcn UI Compliance**: All styling now uses Tailwind utility classes and Shadcn UI components; no custom CSS or Bootstrap.
- **Display Management System**: All UI updates are now managed via the subscription-based displayManager (`useDisplayUpdate`, `createActionHandler`), ensuring components re-render on state changes.
- **Centralized State Management**: All business/game logic and state reside in `gameState.ts` and related services; React hooks minimized except for display management.
- **Responsive & Mobile-First Design**: Layouts and components refactored for mobile-first responsiveness, touch-friendly controls, and adaptive grid/card layouts.
- **Admin Dashboard Tools**: Added admin tools for company/data management, global tutorial toggling, and cheat controls (add money, clear data, etc.).

### Technical Compliance
- All persistent storage operations routed through `src/lib/localStorage/storageService.ts`.



## [0.002]  - 2025-06-11 - Initial project setup

### Core Systems
- Finance system // placeholder
- Tradepedia system // placeholder
- Company system // placeholder
- Highscore system // placeholder
- Admin dashboard system // placeholder
- Achievements system // placeholder

### Technical Architecture implemented

- React + TypeScript
- Tailwind CSS
- LocalStorage persistence (storageService.ts)
- Centralized game state management (gameState.ts)
- Display management system (displayManager.ts)

### Added
- Initial frontend setup (CompanyView, TopBar, LoginView)
- Responsive design with Tailwind CSS
- `ViewHeader` component for consistent view titles
- `uiEmojis` for consistent emoji usage across the UI
- Utility functions (`utils.ts`) for common formatting and game date handling


## [0.001]  - 2025-06-11 - Initial project setup

### Added
- Old Iteration of Simulus
- AI rules
- Redme.md
