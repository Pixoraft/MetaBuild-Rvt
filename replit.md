# Meta Build - Personal Productivity Tracker

## Overview

Meta Build is a mobile-first full-stack productivity companion designed for personal use. The application provides comprehensive tracking across multiple life areas including daily tasks, workouts, mind training, routines, and development goals. Built as a single cohesive platform, it emphasizes data persistence, streak tracking, and visual progress monitoring through charts and progress indicators.

The application follows a modern web architecture with React frontend, Express backend, and PostgreSQL database, specifically optimized for mobile devices with a clean, minimalist interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Mobile-First Design**: Responsive design optimized specifically for mobile devices with bottom navigation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with comprehensive CRUD operations for all data entities
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Storage Solutions
- **Primary Storage**: JSON File Storage with automatic persistence
- **Database**: PostgreSQL with Neon serverless hosting (available as alternative)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema covering users, tasks, workouts, routines, mind exercises, development goals, and performance tracking
- **Migrations**: Drizzle Kit for database schema management
- **Data Relationships**: Proper foreign key relationships with cascade deletes for data integrity
- **Backup System**: Automatic daily backups at 12:01 AM with manual backup capability
- **Data Persistence**: All user interactions are immediately saved to JSON files on the server

### Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect flow
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, secure session configuration
- **User Management**: Automatic user creation and profile management
- **Route Protection**: Middleware-based authentication checks for API endpoints

### External Dependencies
- **Database Hosting**: Neon PostgreSQL serverless platform
- **Authentication**: Replit Auth service for user management
- **UI Components**: Radix UI for accessible, unstyled components
- **Development Tools**: Vite for fast development and building
- **Deployment**: Replit infrastructure with environment-based configuration

### Key Architectural Decisions

**Mobile-First Approach**: The entire application is designed exclusively for mobile devices, with a maximum width container and touch-optimized interactions. This decision was made to focus on the primary use case and ensure optimal mobile experience.

**Server-Side Data Persistence**: All user data is stored server-side with proper authentication, avoiding local storage dependencies. This ensures data synchronization across devices and prevents data loss.

**Component-Based Architecture**: Modular React components with clear separation of concerns, reusable UI components, and consistent design patterns throughout the application.

**Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas ensures compile-time error catching and better developer experience.

**Performance Optimization**: TanStack Query provides intelligent caching, background updates, and optimistic updates for smooth user experience with minimal loading states.

**Preloaded Data Structure**: The application includes comprehensive preloaded workout routines, development goals, and productivity templates that users can customize, providing immediate value without empty state friction.

**Data Reliability**: Implemented JSON file storage system with automatic daily backups at 12:01 AM and manual backup functionality. All user data is immediately persisted to the server file system, preventing any data loss from browser refresh or session endings. The backup system maintains up to 30 historical snapshots with automatic cleanup.

**Production Deployment Architecture**: Created separate production entry point (`server/production.ts`) that excludes all Vite dependencies to resolve deployment issues. The production build uses esbuild to create a standalone server bundle without development-time imports, ensuring clean deployment to platforms like Render without Vite runtime dependencies.