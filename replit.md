# Overview

EcoFinds is a sustainable second-hand marketplace web application, similar to a lightweight Amazon clone, built with a full-stack architecture. The platform enables users to buy and sell pre-owned items across categories like Electronics, Clothes, Books, and Furniture, promoting environmental consciousness through reuse and recycling.

The application features user authentication, product listings management, shopping cart functionality, order processing with delivery tracking, and a complete user profile system. It's designed with a modern, responsive interface that works seamlessly across desktop and mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Management**: React Hook Form with Zod validation schemas

**Component Structure**:
- Page-level components for major routes (Home, Cart, Orders, Profile, etc.)
- Reusable UI components following atomic design principles
- Custom hooks for authentication and mobile detection
- Responsive design with mobile-first approach

## Backend Architecture

**Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints with consistent error handling
- **Request Processing**: JSON body parsing and URL encoding support
- **Logging**: Custom request/response logging middleware

**Route Structure**:
- Authentication routes (`/api/auth/*`)
- Product management (`/api/products/*`, `/api/my-products`)
- Shopping cart operations (`/api/cart/*`)
- Order management (`/api/orders/*`)

## Data Storage Solutions

**Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle-kit for migrations and schema synchronization
- **Query Builder**: Type-safe database queries with Drizzle ORM

**Database Schema**:
- Users table with profile information and contact details
- Products table with category, pricing, and seller relationships
- Cart items with user-product associations and quantities
- Orders and order items for purchase tracking
- Sessions table for authentication state management

## Authentication and Authorization

**Primary Authentication**: Replit OAuth integration
- **Session Management**: Express sessions with PostgreSQL store
- **User Lifecycle**: Automatic user creation/update on authentication
- **Security**: HTTP-only cookies with secure flags and CSRF protection

**Access Control**:
- Route-level authentication middleware
- User-specific data isolation (cart, orders, listings)
- Seller authorization for product management operations

## External Dependencies

**Database Services**:
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

**Authentication Services**:
- **Replit OAuth**: Primary authentication provider with OpenID Connect
- **Passport.js**: Authentication middleware with OpenID strategy

**Development Tools**:
- **Vite**: Frontend build tool with React plugin and development server
- **ESBuild**: Backend bundling for production deployments
- **TypeScript**: Type checking and compilation across the stack

**UI and Styling Libraries**:
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variant management

**Validation and Forms**:
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form state management and validation integration
- **@hookform/resolvers**: Zod integration for form validation

**Utility Libraries**:
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional class name utility
- **nanoid**: Unique ID generation for various entities