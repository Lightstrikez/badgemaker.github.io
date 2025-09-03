# OJC Graduate Profile Badges System

## Overview

A comprehensive student badge management system for OJC (Otago Junior College) that allows students to browse, apply for, and track their progress toward earning Graduate Profile Badges. The system supports six graduate profile categories (Excellence, Innovation, Integrity, Inspiration, Hauora, and Relationships) with multiple badge levels and evidence submission capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Uploads**: Multer middleware for handling evidence file uploads
- **Session Management**: Express sessions with PostgreSQL session store

### Database Schema
The system uses PostgreSQL with the following core entities:
- **Users**: Student and teacher accounts with role-based access
- **Badges**: Badge definitions organized by graduate profile categories
- **Badge Applications**: Student applications for specific badges
- **Evidence**: File uploads and submissions linked to applications

Key relationships:
- Users can have multiple badge applications
- Each application belongs to one badge and contains multiple evidence items
- Badges are categorized by graduate profile (excellence, innovation, etc.)

### Authentication and Authorization
- Basic username/password authentication
- Role-based access control (student, teacher, admin)
- Session-based authentication with secure cookie storage

### File Management
- Local file storage system for evidence uploads
- Support for multiple file types (images, videos, documents)
- 10MB file size limit with type validation
- Organized file storage in dedicated uploads directory

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **WebSocket Support**: Node.js ws package for Neon connection handling

### UI and Design System
- **Radix UI**: Comprehensive primitive components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant API for component styling

### Development Tools
- **Vite**: Fast build tool and development server
- **TSX**: TypeScript execution environment for development
- **ESBuild**: JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins and runtime error handling

### Form and Data Handling
- **React Hook Form**: Performant form library with validation
- **Zod**: TypeScript-first schema validation
- **Date-fns**: Modern date utility library
- **Drizzle-Zod**: Integration between Drizzle ORM and Zod validation

The architecture follows a full-stack TypeScript approach with shared schema definitions between frontend and backend, enabling type safety across the entire application.