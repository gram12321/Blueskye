# Blueskye - AI-Powered Air Management Game

## About Blueskye

Blueskye is a sophisticated web-based air management game that models complex air traffic, population demographics and fleet management.

Additional instructions for automated coding tools can be found in **.cursor/ai-agent-rules.md** 

## AI Code Generation Principles for Management Game

### 💡 ALWAYS, IN EVERY RESPONS

- Read @readme.md and Ai-Rules.mdc
- After major updates ALWAYS ask to update @readme.md and Ai-Rules.mdc
- AI-Check message: Start every response with "Blueskye: Have read the Readme.md"

## Technical Stack

### Architecture Overview
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", also read the Architecture Overview"
Blueskye is a React + TypeScript Single Page Application (SPA) with a clear, modular architecture focused on centralized state management, a robust service layer, and an efficient display management system.

- **Component-Based Structure**: Modular React components organize the UI.
- **Centralized Game State**: All core game data and business logic are managed from a single source.
- **Service Layer**: Dedicated modules handle functionalities like data persistence, player management, and game mechanics.
  - `storageService.ts`: Handles all localStorage operations
  - `playerService.ts`: Manages login, logout, and company management
  - `gameState.ts`: Centralized game state management
  - `gameTick.ts`: Handles the daily cycle via `advanceDay`. This function increments the game day and sequentially processes: market sync, market diffusion, building production, population aging, births, deaths, and resource consumption.
  - `displayManager.ts`: Provides a subscription-based system (`subscribe`, `unsubscribe`) and React hook (`useDisplayUpdate`) / HOC (`withDisplayUpdate`) to trigger UI refreshes on game state changes.
  - `utils.ts`: General utility functions (formatting, etc.)
  - `tailwindUtils.ts`: Tailwind CSS utility functions (e.g., \`cn\`)
  - `gameState.ts`: Centralized game state management
  - `gameTick.ts`: Handles the daily cycle via `advanceDay`. This function increments the game day and sequentially processes: market sync, market diffusion, building production, population aging, births, deaths, and resource consumption.
- **Display Management**: A specialized system ensures efficient UI synchronization with state changes.

## Development Guidelines

## Core Game Systems

### 1. Company Management
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", also read the Company Management "
- **Key Files**: 
  - `src/lib/player/playerService.ts`: Core logic for player and company authentication, creation, login/logout, and retrieval of detailed company information.
  - `src/lib/localStorage/storageService.ts`: Handles all persistent data storage and retrieval in LocalStorage, including managing individual company data and player profiles.
  - `src/components/views/LoginView.tsx`: The primary UI for player login, company selection, and new company creation.
  - `src/components/views/CompanyView.tsx`: Displays the current company's overview and financial summaries.

- **Description**: This system is central to managing player profiles and multiple company operations. It features:
  - **Player Profile Management**: Allows creation and management of individual player profiles.
  - **Multiple Company Support**: Players can create, select, and manage multiple distinct companies.
  - **Secure Persistent Storage**: All company-specific game states, player settings, and tutorial progress are securely stored in the browser's LocalStorage.
  - **Company Lifecycle**: Facilitates seamless login to existing companies, creation of new companies with initial game state, and secure logout/company deletion functionalities.
  - **Comprehensive Company Data**: Provides detailed company overviews, including financial metrics and game progression, accessible via the `CompanyInfo` interface.

### 2. Passenger System
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", also read the Passenger system"
- **Key Files**:
  - `src/lib/geography/passengerDemandService.ts`: Core logic for generating, distributing, and managing passenger demand.
  - `src/lib/geography/cityData.ts`: Provides static data for cities, which influences passenger generation.
  - `src/lib/geography/airportData.ts`: Provides static data for airports, used for passenger distribution.
  - `src/components/views/PassengerDemandView.tsx`: Displays insights into passenger demand and market opportunities.
  - `src/components/ui/Cards/AirportCard.tsx` and `src/components/ui/Cards/RouteInfoCard.tsx`: UI components that visualize passenger demand at airports and for routes.

- **Description**: The Market System simulates dynamic passenger demand within the game world. Its key features include:
  - **Realistic Passenger Generation**: Generates new passengers daily based on city populations and other game parameters.
  - **Intelligent Demand Distribution**: Passengers are distributed between airports and destination cities using probability calculations that account for distance, domestic/international factors, and population density.
  - **Aggregate Demand Management**: Utilizes an aggregate `waitingPassengerMap` to efficiently track passenger numbers for various airport-to-city pairs.
  - **Demand Decay**: Periodically reduces passenger demand to simulate market fluctuations and incentivize timely flight operations.
  - **Passenger Delivery**: Integrates with the flight system to handle the pickup and delivery of passengers by aircraft, converting demand into revenue.

### 3. Tradepedia
NOT YET IMPLEMENTED
- **Key Files**: `src/components/views/TradepediaView.tsx`
- **Description**: Provides informational views on game mechanics.

### 4. Tutorial System
NOT YET IMPLEMENTED
- **Key Files**:
  - `src/lib/tutorial/tutorialService.ts`: Core tutorial state management and control
  - `src/lib/tutorial/tutorialTypes.ts`: Type definitions for tutorials and steps
  - `src/lib/tutorial/tutorialData.ts`: Tutorial content definitions
  - `src/lib/tutorial/tutorialInitService.ts`: Tutorial system initialization
  - `src/components/tutorial/BlueSkyeDialog.tsx`: Tutorial dialog UI
  - `src/components/tutorial/ElementHighlight.tsx`: Element highlighting system

- **Description**: Implements a comprehensive tutorial system featuring BlueSkye, an AI assistant that guides players through the game. Features include:
  - **Progressive Tutorials**: Naturally triggered based on player navigation and actions.
  - **Element Highlighting**: Visual highlighting of relevant UI elements during tutorials.
  - **State Management**: Tracks seen tutorials and tutorial progress.
  - **View-Specific Guidance**: Dedicated tutorials for each major game view (Company, fleet, etc.).
  - **Persistent State**: Tutorial progress saved per company.
  - **Configurable System**: Can be enabled/disabled and reset via Settings.

    *Current Limitations*:
  - Chained tutorials are not fully functional yet.
  - Highlighting important buttons/functions needs further infrastructure.

### 5. Finance System
If you've read this section of the readme and are editing the finance system,  make sure to add to the AI-Check-Message  ", now editing the finance system"

- **Key Files**:
  - `src/lib/finance/financeService.ts`: Centralized logic for all financial calculations, money transactions (`addMoney`), company valuation (`calculateCompanyValue`), and cash flow analysis (`calculateCashFlow`). Also manages transaction logging.
  - `src/components/views/FinanceView.tsx`: The main UI for detailed financial reports, including a Balance Sheet and a comprehensive Cash Flow statement with filtering and pagination.
  - `src/components/views/CompanyView.tsx`: Provides a summary financial overview, displaying key metrics like cash balance, fleet value, building value, and total company value.
  - `src/lib/gamemechanics/gameState.ts`: Stores the overall game state, including the player's money and all financial transaction records.

- **Description**: This system comprehensively tracks the company's financial health and provides detailed insights into its monetary movements and asset values. It features:
  - **Centralized Transaction Management**: All money inflows (income) and outflows (expenses) are processed through a single `addMoney` function, ensuring consistency and accurate logging.
  - **Transaction Logging**: Records detailed transactions with timestamps, game date (hour, day, week, month, year), category, description, and resulting balance.
  - **Comprehensive Valuation**: Calculates the total company value, breaking it down into cash balance, fleet value, and building (assets) value. (Note: Fleet and building values are currently placeholders and will be calculated with their respective systems).
  - **Balance Sheet**: Provides a snapshot of the company's financial position, detailing assets (current and fixed) and liabilities & equity.
  - **Cash Flow Analysis**: Offers a dynamic view of income and expenses over various time periods (e.g., last hour, last day, current month, all time) with categorization and pagination for easy review.
  - **UI Integration**: Financial data is prominently displayed in both the `FinanceView` for in-depth analysis and the `CompanyView` for a quick overview.

### 6. Highscore System (Firebase Exception)
If you've read this section of the readme and are editing the highscore system,  make sure to add to the AI-Check-Message  ", now editing the highscore system"
NOT YET FULLY IMPLEMENTED (Placeholder)
- **Key Files**:
  - `src/lib/highscore/highscoreService.ts`: Contains placeholder functions for retrieving highscores. Will be implemented with actual Firebase integration.
  - `src/lib/firebase/firebaseConfig.ts`: Firebase configuration for connecting to Firestore.
  - `src/components/views/HighscoreView.tsx`: The UI component intended to display the global highscore leaderboard.
  - `src/components/views/CompanyView.tsx`: Displays a summary of the player's ranking in various highscore categories.

- **Description**: This system is designed to implement a global cross-player highscore leaderboard with multiple ranking categories.
- **Firebase Usage**: **CRITICAL NOTE:** This system utilizes Google Firebase Firestore (`src/lib/firebase/firebaseConfig.ts`) as an exception to the project's standard LocalStorage-only data persistence rule. Firebase is intended to be used *exclusively* for storing and retrieving highscore data across all players.
- **Strict Limitation**: The use of Firebase is **STRICTLY LIMITED** to this highscore functionality. No other game data or logic should use Firebase or any external database unless explicitly approved by the user for a specific feature.
- **Leaderboard Categories**: Planned categories include **Gold**, **Company Value**, **Gold Per Day**, and **Company Value Per Day**.

## Technical Architecture
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", And understand the Technical Architecture, including the Helper Systems (Display Management, Notification System, Game Tick System)
### Helper Systems

- **Display Management** (`src/lib/gamemechanics/displayManager.ts`): Provides a subscription-based system (`subscribe`, `unsubscribe`) and React hook (`useDisplayUpdate`) / HOC (`withDisplayUpdate`) to trigger UI refreshes on game state changes.

- **Notification System**:
  - **Key Files**:
    - `src/lib/notifications/notificationService.ts`: Manages the creation, storage, and retrieval of in-game messages.
    - `src/lib/notifications/useNotifications.ts`: A React hook for subscribing to and managing notifications within components.
    - `src/components/ui/MessageLog.tsx`: The UI component responsible for displaying recent notifications in the TopBar.
  - **Description**: This system provides a robust way to deliver various in-game messages (info, success) to the player. Notifications are categorized and can be displayed as toasts or in a persistent message log. Messages are saved per company in LocalStorage.
- **Game Tick System**:
  - **Key Files**:
    - `src/lib/gamemechanics/gameTick.ts`: Manages the progression of in-game time (hour, day, week, month, year) and orchestrates hourly and daily game processes.
  - **Description**: The Game Tick system is the core time progression mechanism. It advances the game by one hour at a time via the `advanceHour()` function. Each hour, it processes continuous flights and hourly aircraft maintenance. At the end of each game day, it triggers passenger generation and processes daily revenue summaries. Weekly, it also handles weekly maintenance cost deductions.


### Data Management
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", And understand the Data Management system"
- **Primary Storage**: LocalStorage (`src/lib/localStorage/storageService.ts`) is the exclusive method for saving and loading all core game state, including player progress, inventory, and buildings, with data saved securely per company.
- **Highscore System (Firebase Exception)**:
  - **Purpose**: To enable a shared, global leaderboard across all players.
  - **Implementation**: Handled by `src/lib/highscore/highscoreService.ts` using the configuration in `src/lib/firebase/firebaseConfig.ts`.
  - **Rule**: **NO OTHER database interactions (read or write) are permitted anywhere else in the codebase without explicit user confirmation for each instance.**

### Mobile Compatibility Guidelines
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", And understand the Mobile Compatibility Guidelines"
#### Core Mobile Design Principles

Blueskye prioritizes a mobile-first approach to ensure optimal user experience across all devices. The UI adapts dynamically to various screen sizes, focusing on readability, touch-friendly interactions, and efficient content presentation.

- **Responsive Design**: All components are designed with mobile-first principles.
- **Breakpoint System**: Utilizes a tiered breakpoint system for responsive layouts:
  - `Base` (mobile): < 640px
  - `sm`: 640px and up
  - `lg`: 1024px and up
- **Viewport Optimization**: Ensures proper content scaling, touch-friendly interactions, and readable text sizes across devices.
- **Layout Adaptability**: Features flexible containers, dynamic spacing, and responsive typography.

#### Responsive Patterns

- **Card-Based Layouts**: Tables are converted to card layouts on mobile (`block md:hidden`, `hidden md:block`), using grid layouts for data and maintaining hierarchy.
- **Vertical Stacking**: Employs vertical layouts instead of horizontal scrolling for data-heavy displays.
- **Touch Targets**: Interactive elements adhere to a minimum size of 44x44px for improved touch usability.
- **Grid Systems**: Uses 2-column grids for selection interfaces and single columns for data-heavy displays, maintaining hierarchy through indentation and spacing.
- **Navigation**: Tabs use a 2x2 grid layout on mobile; selection interfaces use grid layouts instead of horizontal scrolling, maintaining touch-friendly spacing (min 8px).
- **Typography**: Base text sizes are 14px (mobile) / 16px (desktop); headers scale down on mobile, utilizing responsive classes (e.g., `text-sm md:text-base`).
- **Spacing System**: Responsive classes are used for consistent spacing, including card padding (`p-4 md:p-6`), vertical gaps (`space-y-3 md:space-y-4`), section margins (`mb-4 md:mb-6`), and 16px content indentation.

## File Structure Overview
If you've read this section of the readme,  make sure to add to the AI-Check-Message  ", And understand the File Structure Overview"
AI-Instruction: You are allowed/encouraged to use tools to check the file structure, and to use readtools for reading relevant files not allready shared with you.
```
docs/
├── readme.md
└── versionlog.md
.cursor/
├── ai-agent-rules.md
src/
├── App.tsx              # Main application component (view switching logic)
├── components/            # React components
│   ├── layout/            # Layout components
│   │   └── TopBar.tsx
│   ├── ui/                # General UI components
│   │   ├── Cards/           # Card components for various game entities
│   │   │   ├── AircraftCard.tsx
│   │   │   ├── AirportCard.tsx
│   │   │   ├── CityCard.tsx
│   │   │   ├── RouteInfoCard.tsx
│   │   │   └── RouteManagement.tsx
│   │   ├── charts/          # Charting components for data visualization
│   │   │   ├── passengerDemandBarChart.tsx
│   │   │   └── passengerDestinationPieChart.tsx
│   │   ├── maps/            # Map-related components for geographical display
│   │   │   └── RouteMap.tsx
│   │   ├── resources/       # Resource-related UI elements and emoji mappings
│   │   │   └── emojiMap.ts
│   │   ├── ShadCN/          # Reusable UI components based on Shadcn UI (individual files omitted for brevity)
│   │   ├── AircraftPurchasePanel.tsx # Panel for purchasing aircraft
│   │   ├── MessageLog.tsx   # Component to display in-game messages/notifications
│   │   ├── RouteCreator.tsx # Component for creating new flight routes
│   │   └── ViewHeader.tsx   # Standard header component for views
│   ├── tutorial/          # Tutorial-related components
│   │   ├── BlueSkyeDialog.tsx
│   │   └── ElementHighlight.tsx
│   └── views/             # Main application views/screens
│       ├── AdminDashboardView.tsx
│       ├── CompanyView.tsx
│       ├── FinanceView.tsx
│       ├── FleetView.tsx
│       ├── GeographyView.tsx
│       ├── LoginView.tsx
│       ├── PassengerDemandView.tsx
│       ├── PlaceholderView.tsx
│       ├── ProfileView.tsx
│       ├── RouteView.tsx
│       └── SettingsView.tsx
├── css/                  # Global styles
│   └── global.css
├── lib/                    # Core game logic and services
│   ├── aircraft/          # Aircraft management and related data
│   │   ├── aircraftData.ts
│   │   ├── aircraftTypes.ts
│   │   ├── fleetMaintenance.ts
│   │   └── fleetService.ts
│   ├── finance/           # Financial calculations and services
│   │   └── financeService.ts
│   ├── gamemechanics/     # Core game loop, state, utilities
│   │   ├── displayManager.ts
│   │   ├── gameState.ts
│   │   ├── gameTick.ts
│   │   ├── tailwindUtils.ts
│   │   └── utils.ts
│   ├── geography/         # Geographical data and services (cities, airports, distances)
│   │   ├── airportData.ts
│   │   ├── cityData.ts
│   │   ├── cityTypes.ts
│   │   ├── distanceService.ts
│   │   └── passengerDemandService.ts
│   ├── highscore/         # Highscore service (Firebase)
│   │   └── highscoreService.ts
│   ├── localStorage/      # Data persistence layer (LocalStorage)
│   │   └── storageService.ts
│   ├── notifications/     # In-game notification system
│   │   ├── notificationService.ts
│   │   └── useNotifications.ts
│   ├── player/            # Player-specific data, initialization, and authentication
│   │   └── playerService.ts
│   ├── routes/            # Route management and flight mechanics
│   │   ├── routeService.ts
│   │   └── routeTypes.ts
│   └── tutorial/          # Tutorial system
│       └── tutorialService.ts
├── main.tsx             # Application entry point (React DOM rendering)
└── vite-env.d.ts        # Vite type declarations
