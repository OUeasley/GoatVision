# GoatVision Monitoring

GoatVision is a metrics monitoring application with dashboards and visualizations. It uses ClickHouse for the metric store!

## Tech Stack

### Frontend

- React
- React Router
- TypeScript
- ECharts for visualizations

### Backend

- Node.js with Express
- TypeScript
- ClickHouse for metrics storage
- Lucia Auth for authentication

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm
- Docker and Docker Compose

### Quick Start

The easiest way to get started is to use the provided development script:

```bash
# Install dependencies and start all components
npm run dev
```

This will:

1. Start the ClickHouse Docker container
2. Install dependencies for both frontend and backend
3. Start the frontend, backend, and metrics generator

### Running Components Individually

#### Docker (ClickHouse)

```bash
# Start ClickHouse container
npm run docker:up

# Stop ClickHouse container
npm run docker:down
```

#### Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

#### Backend Setup

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Metrics Generator

```bash
# Start the metrics generator (simulates K8s sending data)
npm run start:metrics-generator
```

## Project Structure

```text
goatvision/
├── docker-compose.yml        # Docker configuration for ClickHouse
├── public/                   # Static assets
├── server/                   # Backend code
│   ├── src/
│   │   ├── config/           # Server configuration
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware
│   │   ├── scripts/          # Scripts for metrics generation
│   │   └── index.ts          # Server entry point
├── src/                      # Frontend code
│   ├── components/           # Reusable React components
│   ├── pages/                # Page components
│   ├── styles/               # CSS styles
│   └── App.tsx               # Main React component
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies and scripts
```
