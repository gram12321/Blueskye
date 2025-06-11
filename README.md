# Blueskye - AI-Powered Air Management Game

## About Blueskye

Blueskye is a sophisticated web-based air management game that models complex air traffic, population demographics and fleet management.

Additional instructions for automated coding tools can be found in **.cursor/ai-agent-rules.md** 

## AI Code Generation Principles for Management Game

### 💡 ALWAYS, IN EVERY RESPONS

- Read @readme.md and Ai-Rules.mdc
- After major updates ALWAYS ask to update @readme.md and Ai-Rules.mdc
- Start every response with "Blueskye: Have read the Readme.md", and if you have, start with "Blueskye: Have read the Readme.md and Ai-Rules.mdc"

## Technical Stack

### Architecture Overview

- **Component-Based Structure**: Modular views and reusable components
- **Service Layer Pattern**: Dedicated services for core functionalities
  - `storageService.ts`: Handles all localStorage operations
  - `playerservice.ts`: Manages login, logout, and company management
  - `gameState.ts`: Centralized game state management
- **Display Manager System**: Centralized UI update management
- **Game State Management**: Single source of truth for game data


- **Component Creation**: Place new UI components in the appropriate subfolder of `src/components/`
- **State Management**: Use the `gameState.ts` for all game-related data
- **UI Updates**: Leverage the Display Manager pattern via `useDisplayUpdate()` hook
- **Data Persistence**: Use `storageService.ts` for all localStorage operations
- **Authentication**: Utilize `playerservice.ts` for company-related functions

## Development Guidelines



## Core Game Systems

### 2. Company Management

- **Key Files**: `src/lib/player/playerService.ts`, `src/lib/localStorage/storageService.ts`, `src/components/views/LoginView.tsx`

- **Description**: Handles the management of multiple company profiles:
  - **Multiple Companies**: Users can create and manage multiple companies on a single device
  - **Company Selection**: Interface for choosing between existing companies or creating new ones
  - **Company Deletion**: Option to delete companies with confirmation dialog to prevent accidental deletion
  - **Persistent Storage**: All company data is securely stored in LocalStorage

### 3. Inventory System


### 4. Market System

### 5. Production System (Buildings)


### 6. Population System

### 7. Tradepedia

- **Key Files**: `src/components/views/TradepediaView.tsx`, 

- **Description**: Provides informational views on game mechanics. Includes tabs for:
  

### 8. Tutorial System
NOT YET IMPLEMENTED
- **Key Files**:
  - `src/lib/tutorial/tutorialService.ts`: Core tutorial state management and control
  - `src/lib/tutorial/tutorialTypes.ts`: Type definitions for tutorials and steps
  - `src/lib/tutorial/tutorialData.ts`: Tutorial content definitions
  - `src/lib/tutorial/tutorialInitService.ts`: Tutorial system initialization
  - `src/components/tutorial/BlueSkyeDialog.tsx`: Tutorial dialog UI
  - `src/components/tutorial/ElementHighlight.tsx`: Element highlighting system

- **Description**: Implements a comprehensive tutorial system featuring BlueSkye, an AI assistant that guides players through the game. Features include:
  - **Progressive Tutorials**: Naturally triggered based on player navigation and actions
  - **Element Highlighting**: Visual highlighting of relevant UI elements during tutorials
  - **State Management**: Tracks seen tutorials and tutorial progress
  - **View-Specific Guidance**: Dedicated tutorials for each major game view (Company, fleet, etc.)
  - **Persistent State**: Tutorial progress saved per company
  - **Configurable System**: Can be enabled/disabled and reset via Settings

    Not implemented:
  - Chained tutorial (Difficulties coding this. The tutorial doesn't show when we start to chain them. Perhaps the previous tutorial is still active, and two tutorials can't run at the same time)
  - Highlight important btns/functions (Should have infrastructure implemented for this in the tutorial type)

### 9. Finance System
If you are editing  the finance system, start you response with "Blueskye: Have read the Readme.md and Ai-Rules.mdc - now editing finance system"

NOT IMPLEMENTED

- **Key Files**: `src/components/views/FinanceView.tsx`, `src/components/views/CompanyView.tsx`, `src/lib/gamemechanics/gameState.ts`, `src/lib/resources/core/resourceService.ts`, `src/lib/buildings/buildingService.ts`

- **Description**: Tracks the company's financial health. 

- **Core Metrics**:
  - **Cash Balance**: 
  - **Inventory Value**: // Posible implementation
  - **Building Value**:  // Posible implementation
  - **Total Company Value**: `Cash Balance` + `Inventory Value` + `Building Value`. // Posible implementation
- **Display**: // Posible implementation
  - `FinanceView.tsx`: Shows a detailed Balance Sheet (Assets, Liabilities, Equity), total company value, and a breakdown of individual building values. // Posible implementation
  - `CompanyView.tsx`: Displays a summary overview of Cash, Inventory Value, Building Value, and Total Company Value. // Posible implementation

### 10. Highscore System (Firebase Exception)

// Not implemented may be able to copy entirely from Simulus iteration

- **Key Files**: `src/lib/highscore/highscoreService.ts`, `src/lib/firebase/firebaseConfig.ts`, `src/components/views/HighscoreView.tsx`, `src/components/views/CompanyView.tsx`

- **Description**: Implements a global cross-player highscore leaderboard with multiple ranking categories.
- **Firebase Usage**: **CRITICAL NOTE:** This system uses Google Firebase Firestore as an exception to the project's standard LocalStorage-only data persistence rule. Firebase is used *exclusively* for storing and retrieving highscore data. Separate Firestore collections for each leaderboard type
- **Strict Limitation**: The use of Firebase is **STRICTLY LIMITED** to this highscore functionality. No other game data or logic should use Firebase or any external database unless explicitly approved by the user for a specific feature.
- **Leaderboard Categories**:
  - **Gold**: ,  **Company Value**: , **Gold Per Day**: **Company Value Per Day**:

## Technical Architecture

### Helper Systems

- **Display Management** (`src/lib/gamemechanics/displayManager.ts`): Provides a subscription-based system (`subscribe`, `unsubscribe`) and React hook (`useDisplayUpdate`) / HOC (`withDisplayUpdate`) to trigger UI refreshes on game state changes.

- **Console System** // May not be implementet instead entirely replaced by the toast system 

(`src/components/layout/Console.tsx`): This file contains both the `consoleService` logic and the `Console` component. The service (`consoleService`) handles adding messages (`info`, `success`, `warning`, `error`) which can optionally be tagged with a `category` (e.g., 'population', 'market', 'building'). **Includes detailed production logs**: Cycle start (inputs used/bought/substituted) and cycle end (outputs produced). Messages are saved per company to localStorage (`storageService`) and loaded on game start (`App.tsx`). The `Console` component can render in two modes: as a modal (for main Message History accessed via `TopBar`) which includes a dropdown to filter by category ('General' shows uncategorized messages), or as an embedded view (e.g., in `PopulationView`) showing only messages for a specific category passed via the `categoryFilter` prop.
- **Game Tick** (`src/lib/gamemechanics/gameTick.ts`): Orchestrates the daily cycle via `advanceDay`. This function increments the game day and sequentially processes: market sync, market diffusion, building production, population aging, births, deaths, and resource consumption.


### Data Management
- **Primary Storage**: Local storage (`src/lib/localStorage/storageService.ts`) is the standard method for saving/loading all core game state per company (player progress, inventory, buildings, etc.).
- **Highscore System (Firebase Exception)**:
  - **Purpose**: To enable a shared, global leaderboard across all players, the highscore system utilizes Google Firebase Firestore.
  - **Implementation**: Handled by `src/lib/highscore/highscoreService.ts` using the configuration in `src/lib/firebase/firebaseConfig.ts`.
  - **Rule**: **NO OTHER database interactions (read or write) are permitted anywhere else in the codebase without specific user confirmation for each instance.**

### Mobile Compatibility Guidelines #### Core Mobile Design Principles

If you are editing and focus about mobile compatibility, start you response with "Blueskye: Have read the Readme.md and Ai-Rules.mdc - now focusing on mobile compatibility"

### Responsive Design

- **Mobile-First Approach**: All components designed with mobile-first principles
- **Breakpoint System**:
  - Base (mobile): < 640px
  - sm: 640px and up
  - lg: 1024px and up
- **Viewport Optimization**:
  - Proper content scaling
  - Touch-friendly interactions
  - Readable text sizes across devices
- **Layout Adaptability**:
  - Flexible containers
  - Dynamic spacing
  - Responsive typography
- **Card-Based Layouts**: Replace tables with card layouts on mobile views
- **Vertical Stacking**: Use vertical layouts instead of horizontal scrolling
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Grid Systems**:
  - Use 2-column grids for selection interfaces
  - Single column for data-heavy displays
  - Maintain hierarchy through indentation and spacing

#### Responsive Patterns

- **Tables**: Convert to cards on mobile (`block md:hidden`, `hidden md:block`), using grid layouts for data and maintaining hierarchy.
- **Navigation**: Tabs use 2x2 grid layout on mobile; selection interfaces use grid layouts instead of horizontal scrolling, maintaining touch-friendly spacing (min 8px).
- **Typography**: Base text 14px (mobile) / 16px (desktop); headers scale down on mobile. Use responsive classes (e.g., `text-sm md:text-base`).
- **Spacing System**: Responsive classes for card padding (`p-4 md:p-6`), vertical gaps (`space-y-3 md:space-y-4`), section margins (`mb-4 md:mb-6`), and 16px content indentation.

## File Structure Overview
```
docs/
├── readme.md
└── versionlog.md
.cursor/
├── ai-agent-rules.md
src/
├── App.tsx              # Main application component (view switching logic)
├── components/            # React components
│   ├── ui
│   │   ├── ShadCN               # Reusable UI components (Shadcn UI based + Custom) 
    │   │   ├── Toast
    │   │   │   ├── toast.tsx
    │   │   │   └── toast-container.tsx
        │   │   ├── Toaster.tsx
        │   │   ├── Tooltip.tsx
        │   │   ├── useCollapseState.ts  # Hook for managing collapse state
        │   │   └── use-toast.ts         # Hook for managing toast notifications
    │   │   ├── Accordion.tsx
    │   │   ├── Alert.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── Badge.tsx
    │   │   ├── BarChart.tsx
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Checkbox.tsx
    │   │   ├── ConsumptionDisplay.tsx # Component for displaying consumption rates
    │   │   ├── Dialog.tsx
    │   │   ├── DropdownMenu.tsx
    │   │   ├── emojiMap.ts          # Mapping resource/UI names to emojis
    │   │   ├── Input.tsx
    │   │   ├── Label.tsx
    │   │   ├── MarketFlowVisual.tsx   # Component for visualizing market flow
    │   │   ├── NavigationMenu.tsx
    │   │   ├── Popover.tsx
    │   │   ├── Progress.tsx
    │   │   ├── ProgressBar.tsx        # Simple progress bar component
    │   │   ├── RadioGroup.tsx
    │   │   ├── ResourceCard.tsx       # Card for displaying resource details
    │   │   ├── ScrollArea.tsx
    │   │   ├── Select.tsx
    │   │   ├── Separator.tsx
    │   │   ├── Sheet.tsx
    │   │   ├── Switch.tsx
    │   │   ├── Table.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── toast.tsx              # Toast notification system (definitions, service)
    │   │   ├── toast-container.tsx     # Container for toast notifications
    │   │   ├── Toaster.tsx            # Component that renders toasts
    │   │   ├── Tooltip.tsx
    │   │   └── ViewHeader.tsx         # Standard header for views
│   └── views/            # Main application views/screens 
│       ├── AchievementsView.tsx
│       ├── AdminDashboardView.tsx
│       ├── CompanyView.tsx
│       ├── FinanceView.tsx
│       ├── HighscoreView.tsx
│       ├── LoginView.tsx
│       ├── ProfileView.tsx
│       ├── SettingsView.tsx
│       └── TradepediaView.tsx
├── css/                  # Global styles
│   └── global.css
├── lib/                    # Core game logic and services 
│   ├── buildings/         # Building system 

│   ├── const/             # Constant values 

│   ├── definitions/       # Static definitions for game entities 

│   ├── finance/           # Financial calculations and services
│   │   └── financeService.ts      # Handles financial calculations, company value
│   ├── firebase/          # Firebase configuration (for Highscores ONLY)
│   │   └── firebaseConfig.ts
│   ├── gamemechanics/     # Core game loop, state, utilities 
│   │   ├── displayManager.ts      # UI update subscription system
│   │   ├── gameState.ts          # Central state management
│   │   ├── gameTick.ts           # Handles the daily progression logic
│   │   ├── tailwindUtils.ts      # Tailwind CSS utility functions (e.g., \`cn\`)
│   │   └── utils.ts              # General utility functions (formatting, etc.)
│   ├── highscore/         # Highscore service (Firebase)
│   │   └── highscoreService.ts
│   ├── localStorage/      # Data persistence layer (LocalStorage) 
│   │   └── storageService.ts      # General game state persistence
│   ├── player/            # Player-specific data, initialization, and authentication
│   │   └── playerService.ts       # Handles player management, initialization, and auth
│   ├── population/        # Population system 

│   ├── tradepedia/        # Informational data services
│   │   └── tradepediaService.ts   # Provides data for Tradepedia views
│   └── tutorial/          # Tutorial system 
│       ├── tutorialData.ts        # Tutorial content definitions
│       ├── tutorialInitService.ts # Tutorial initialization
│       ├── tutorialService.ts     # Core tutorial state management
│       └── tutorialTypes.ts       # Tutorial type definitions
├── main.tsx             # Application entry point (React DOM rendering)
└── vite-env.d.ts        # Vite type declarations
