## [0.013.1] - 2025-06-13 - Finance Transaction Consolidation Bugfix

### Bugfix & Improvements
- **Issue Addressed**: Resolved an issue introduced in v0.013 where the Finance View became cluttered with an excessive number of individual passenger pickup transactions, making financial analysis difficult and overwhelming.
- **Consolidated Revenue Reporting**: Implemented a system to consolidate all passenger revenue for a given route into a single, comprehensive daily summary transaction. This replaces numerous micro-transactions with one clear entry per route per day.
- **Improved Finance View Readability**: The Finance View now displays aggregated daily revenue for each route, providing a cleaner and more meaningful overview of financial performance without overwhelming detail.
- **Smart Revenue Tracking**: The system now tracks revenue throughout the day and processes summaries at the end of each game day, ensuring accurate financial records without overwhelming detail.

### Technical Implementation
- Introduced `DailyRouteRevenue` interface and `trackDailyRevenue()` function to accumulate daily statistics per route.
- Created `processDailyRevenueSummaries()` function that runs at the end of each game day to create consolidated transactions.
- Integrated daily summary processing into the game tick system (`gameTick.ts`).
- Revenue is now collected once per day per route as a summary transaction, instead of generating a transaction for every individual passenger pickup, dramatically reducing transaction volume.

### User Experience Improvements
- Finance View transactions are now meaningful and readable instead of being cluttered with repetitive entries.
- Daily summaries provide better insights into route performance and revenue patterns.
- Transaction history remains clean and useful for financial analysis.

## [0.014] - 2025-06-13 - Load Factor Tracking & In-Game Time Integration

### Major Features & Improvements
- **Comprehensive Load Factor System**: Implemented robust load factor calculations based on actual passenger vs. capacity ratios from completed flights. This includes route-level, aircraft-level, and system-wide load factors, displayed for the "last 7 in-game days". Load factors now show meaningful percentages based on actual performance.
- **In-Game Time Integration**: Crucially, all load factor calculations, historical flight tracking, and data cleanup now utilize the game's internal time system (`hour`, `day`, `week`, `month`, `year`) via the `calculateAbsoluteDays()` utility function. This ensures load factors are calculated based on in-game progression rather than real-world dates, aligning with the `gameTick.ts` system.
- **Flight History & Cleanup**: Enhanced completed flight storage to include game time fields (`completedGameDay`, `completedGameWeek`, `completedGameMonth`, `completedGameYear`), enabling accurate historical analysis. Automatic cleanup of old completed flights (keeping 30 in-game days) prevents memory bloat while maintaining sufficient data.

### UI Improvements
- Updated RouteManagement and RouteView components to display meaningful "Load Factor (7d)" percentages for both routes and individual aircraft assignments.

### Technical Implementation
- Introduced `getRouteLoadFactor()`, `getAircraftRouteLoadFactor()`, `calculateRecentLoadFactor()`, and `cleanupOldCompletedFlights()` functions.
- Flight completion records now include game time attributes for precise historical tracking.
- All time-based filtering and cleanup logic consistently use `calculateAbsoluteDays()` for in-game time comparisons.

## [0.013]  - 2025-06-13 - Revenue Collection System Implementation

### Major Features & Changes
- **Revenue Collection at Passenger Pickup**: Implemented automatic revenue collection when aircraft pick up passengers at airports. Players now earn money immediately when passengers board their aircraft, based on the route's ticket price and number of passengers.
- **Distance-Based Static Ticket Pricing**: Replaced the old pricing algorithm with a simplified static calculation based on distance and domestic/international classification. Domestic flights cost €0.12/km and international flights €0.15/km, with distance-based adjustments and minimum prices.
- **Flight Revenue Tracking**: Enhanced flight objects to properly track revenue and profit. Each flight now records total revenue from both outbound and return passenger pickups.
- **Route Statistics Integration**: Revenue collection automatically updates route statistics (totalRevenue, totalFlights) and integrates with the centralized finance system through the `addMoney()` function.
- **Financial Transaction Logging**: All passenger revenue is logged as "Flight Revenue" transactions with detailed descriptions showing passenger count and route information.

### Technical Improvements
- Refactored passenger pickup logic in `processContinuousFlights()` to include revenue calculation and finance integration.
- Added `calculateTicketPrice()` function for consistent distance-based pricing across the game.
- Enhanced `pickupPassengersAndCollectRevenue()` function to handle both passenger logistics and financial transactions.
- All revenue collection happens during the "origin-turn" and "destination-turn" phases of flights, ensuring realistic timing.

## [0.012]  - 2025-06-13 - Passenger demand system & Route Management UI overhaul

### Major Features & Changes
- **Passenger Demand Visualization**:
  - Added interactive bar charts to display outbound, return, and seat capacity for each route, enabling clear comparison of demand vs. available seats.
  - Route creation now previews demand and aircraft compatibility with a dedicated info card and bar chart.
- **Route Management UI Overhaul**:
  - Refactored Route Management into a reusable component with a modern, card-based layout.
  - Each route card now shows bidirectional demand, daily seat capacity, active flights, assigned aircraft, and detailed flight progress (multi-phase, color-coded progress bars).
  - Added in-place aircraft assignment, daily flight scheduling, and real-time load factor/revenue stats.
  - Improved deletion and assignment logic for safer, more intuitive management.
- **Component & Service Enhancements**:
  - New `BarChart` component for demand/seat visualization.
  - Enhanced `RouteInfoCard`, `RouteCreator`, and `AirportCard` to integrate new demand data and visualizations.
  - Updated `routeService` and `passengerDemandService` with helpers for bidirectional demand and seat calculations.
- **UX Improvements**:
  - All UI updates remain fully compliant with Tailwind CSS and Shadcn UI.
  - Centralized state and display management for consistent, responsive updates across all views.

## [0.011]  - 2025-06-13 - Aircraft Maintenance System

### Major Features & Changes
- **Aircraft Maintenance System**: Implemented a staggered, per-aircraft maintenance system based on purchase date and 168 flight-hour intervals. Players can set weekly maintenance plans, with hourly progress processing and condition restoration based on tonnage. Fleet view UI now displays maintenance status, progress, and allows plan management. Weekly maintenance costs are deducted with transaction records.
- **Bugfixes & Improvements**: Fixed aircraft purchase logic. Maintenance actions are blocked for in-flight aircraft. Fleet statistics and UI accurately reflect aircraft status. Maintenance logic centralized in `fleetService.ts`.

## [0.010]  - 2025-06-12 - Route Scheduling & Aircraft Assignment + hour time system

### Major Features & Changes
- **Hour-Based Time System & Route Scheduling**: Transitioned to an hour-based game tick for more realistic flight progression, updating all time-related systems (finance, transactions, UI) and introducing a comprehensive route scheduling system for aircraft assignments.
- **Aircraft Turn Time & Airport Infrastructure**: Implemented aircraft-specific turn times based on size/complexity and an airport gate system with modifiers, leading to more realistic flight processing. Airport data structures were updated to support this.
- **Enhanced Flight Progress Visualization**: Introduced multi-phase, color-coded progress bars (outbound, turnaround, return) and detailed flight timing breakdowns in route management, improving aircraft utilization scheduling.



## [0.009]  - 2025-06-12 - Enhanced Passenger Demand Visualization & Map Integration

### Major Features & Changes
- **Enhanced UI Visualizations**: Introduced interactive pie charts for passenger distribution, improved bar chart readability, and enhanced chart tooltips with detailed passenger statistics.
- **Integrated Map System**: Added OpenStreetMap for geographical visualization, including airport and route displays with interactive markers showing passenger demand.


## [0.008]  - 2025-06-12 - Simplified airport and passenger interfaces & data cleanup

### Major Features & Changes
-   **Data Model Simplification & Refactoring**: Streamlined `Airport`, `Passenger`, and `City` data models by removing unused properties (e.g., `capacity`, `priority`, `domesticPreference`). Airport data was moved from `cityData.ts` to a new `airportData.ts` file, and domestic preferences were centralized as constants in `passengerDemandService.ts`. All related imports and references were updated or removed.
-   **UI & Service Alignment**: `AirportCard`, `CityCard`, `GeographyView`, and `PassengerDemandView` components were updated to reflect the simplified data models. All route and distance services were also adjusted to integrate with the new `airportData.ts` and simplified data structures.

## [0.007]  - 2025-06-12 - Airport-based passenger demand system & major overhaul

### Major Features & Changes
- **Airport-Centric Operations**: Major redesign to connect routes to specific airports (e.g., LHR, CDG) instead of cities, introducing detailed airport data and properties.
- **Sophisticated Passenger Demand**: Implemented realistic passenger generation with intelligent destination and airport distribution based on factors like distance and domestic preference.
- **UI & System Integration**: Introduced new UI components (`AirportCard`, `PassengerDemandView`) and updated existing systems (`RouteCreator`, game tick, route displays) to fully support the new airport-based mechanics.

## [0.006]  - 2025-06-12 - Advanced Market & Analytics Update

### Major Features & Changes
- **Advanced Market Mechanics**: Enhanced passenger demand calculations, dynamic pricing based on demand and market factors, and a comprehensive operational cost model.
- **Route Analytics & Geography**: Introduced detailed route analytics for profitability and market insights, along with a new `GeographyView` for geographical data and demand analysis.


## [0.005]  - 2025-06-12 - Gamemechanics alpha

### Major Features & Changes
- **Core Game Mechanics**: Implemented foundational systems for aircraft (fleet management, types), cities & geography (data, distance), and route management (creation, progress, income).
- **Game State & UI**: Integrated new mechanics into `gameState` and `gameTick`, and introduced `FleetView` and `RouteView` for managing aircraft and routes.
- **Centralized Finance**: All financial transactions (aircraft purchases, sales, maintenance, route revenue/expenses) now flow through the centralized finance system for accurate tracking and reporting.
- **Realistic Flight Progression**: Flight progress is now based on actual flight hours, updating aircraft condition and flight hours accordingly.
- **Refactoring**: General bug fixes and refactoring, including centralizing money updates via the finance system and improving transaction descriptions.


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
