# Live Voting System

A real-time voting web application with animations, designed for live events.

## Features
- **Mobile Voting**: `/vote` - Simple slider interface, fingerprint-based duplicate prevention.
- **Live Reveal**: `/reveal` - Animated visualization of votes with GSAP and Fireworks.
- **Backend**: Next.js, Prisma, SQLite.
- **Animations**: GSAP, Flip Plugin, Fireworks-js.

## Prerequisites
- Node.js 18+
- npm

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Database Setup**
    Initialize the SQLite database:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Usage

### Voting
- Navigate to `/vote` (e.g., on smartphone).
- Select a number (0-100).
- Press "CONFERMA VOTO".

### Reveal
- Navigate to `/reveal` (e.g., on projector).
- Wait for votes to come in.
- Click "AVVIA PREMIAZIONE" to start the show.

## Environment Variables
Defined in `.env`:
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

## Troubleshooting
- **Fingerprinting**: Uses `FingerprintJS` visitorId. Clearing cookies/storage might reset it in incognito, but it's robust enough for casual events.
- **IP Logging**: Logs `x-forwarded-for` or fallback IP.
