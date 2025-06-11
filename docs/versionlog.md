## [0.004]  - 2025-06-12 - Notification system and fixing playerlogin

### Major Features & Changes
- **Notification System**: Added a notification system for in-game messages to the player.
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
- LocalStorage persistence // not implemented
- AI-assisted development // not implemented
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
