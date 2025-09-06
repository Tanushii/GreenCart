# Authentication Migration from Replit to Local Auth

## Overview
This project has been migrated from Replit OIDC authentication to a local email/password authentication system using Passport.js.

## Changes Made

### Backend Changes
1. **Removed Replit Auth Dependencies**:
   - `openid-client`
   - `memoizee`
   - `@types/memoizee`

2. **Added Local Auth Dependencies**:
   - `bcryptjs` - For password hashing
   - `@types/bcryptjs` - TypeScript types

3. **New Authentication System** (`server/auth.ts`):
   - Email/password registration and login
   - Password hashing with bcrypt
   - Session management with PostgreSQL
   - Input validation with Zod

4. **Updated Database Schema**:
   - Added `password` field to `users` table
   - Made `email` field required and unique

5. **Updated Storage Interface**:
   - Added `getUserByEmail()` method
   - Added `createUserWithPassword()` method

### Frontend Changes
1. **New Authentication UI**:
   - `AuthModal.tsx` - Login/Register modal component
   - Updated `Navbar.tsx` with login/logout functionality

2. **Authentication Flow**:
   - Users can register with email, password, first name, last name
   - Users can login with email and password
   - Session-based authentication (no JWT tokens)

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user (protected)
- `PUT /api/auth/user` - Update user profile (protected)

### Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for session encryption (optional, has default)
- `NODE_ENV` - Environment (development/production)

### Migration Notes
1. **User Data**: Existing users in the database will need to set passwords through a password reset flow (not implemented in this migration)
2. **Sessions**: The `sessions` table is reused for session storage
3. **User Access**: User ID is now accessed via `req.user.id` instead of `req.user.claims.sub`

### Security Improvements
- Passwords are hashed with bcrypt (12 rounds)
- Session cookies are HTTP-only and secure in production
- Input validation on all auth endpoints
- Proper error handling and user feedback

## Usage

### Starting the Application
```bash
npm run dev
```

### Database Setup
```bash
npm run db:push
```

The application will now use local authentication instead of Replit OIDC.
