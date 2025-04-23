# 5G RAN Configuration Portal

![5G Technology](https://img.shields.io/badge/5G-Technology-brightgreen)
![NS-3 Simulation](https://img.shields.io/badge/NS--3-Simulation-blue)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-orange)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-9cf)

A comprehensive web portal for configuring 5G Radio Access Network (RAN) parameters, running network simulations, and visualizing performance metrics in real-time. This end-to-end solution integrates simulation, data storage, and visualization to provide insights into 5G network behavior under various configurations.

## 📋 Table of Contents

- [5G RAN Configuration Portal](#5g-ran-configuration-portal)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🏛 System Architecture](#-system-architecture)
  - [🚀 Installation](#-installation)
    - [Quick Start with Docker](#quick-start-with-docker)
    - [Manual Installation](#manual-installation)
    - [Environment Variables](#environment-variables)
  - [🔌 NS-3 Integration](#-ns-3-integration)
    - [Setting up NS-3 Integration](#setting-up-ns-3-integration)
  - [📖 Usage Guide](#-usage-guide)
    - [Configuring RAN Parameters](#configuring-ran-parameters)
    - [Viewing Results](#viewing-results)
    - [Setting up Grafana Dashboards](#setting-up-grafana-dashboards)
  - [🔄 API Documentation](#-api-documentation)
    - [Configuration Management](#configuration-management)
    - [Metrics and Monitoring](#metrics-and-monitoring)
    - [Example API Usage](#example-api-usage)
  - [📁 Project Structure](#-project-structure)
  - [📊 Screenshots](#-screenshots)
    - [Main Interface](#main-interface)
    - [Simulation Results](#simulation-results)
    - [Grafana Dashboard](#grafana-dashboard)
  - [❓ Troubleshooting](#-troubleshooting)
    - [Common Issues](#common-issues)
    - [Getting Help](#getting-help)

## ✨ Features

- **Interactive Parameter Configuration**: Adjust key 5G RAN parameters through an intuitive web interface
- **Dual Simulation Modes**:
  - JavaScript-based calculation (default, runs anywhere)
  - NS-3 simulation integration (optional, for high-fidelity results)
- **Real-time Metrics Visualization**: Monitor network performance with Grafana dashboards
- **Persistent Storage**: Save all configurations and results in MongoDB
- **RESTful API**: Programmatically access all features
- **Containerized Deployment**: Easy setup with Docker and Docker Compose
- **Responsive Design**: Works on desktop and mobile devices

## 🏛 System Architecture

The portal employs a microservices architecture with the following components:

Key components include:

- **Frontend**: Single-page application built with HTML, JavaScript, and Bootstrap 5
- **Backend**: Node.js/Express server providing RESTful API endpoints
- **Database**: MongoDB for persistent storage of configurations and results
- **Simulation Engine**: Either JavaScript calculation or NS-3 simulation (via WSL integration)
- **Monitoring Stack**:
  - Prometheus for metrics collection and time-series database
  - Grafana for dashboards and visualization
- **Container Orchestration**: Docker Compose for multi-container deployment

## 🚀 Installation

### Quick Start with Docker

The fastest way to deploy the entire application stack is using Docker:

1. **Clone the repository**

   ```bash
   git clone https://github.com/AdityaGahukar/5g-ran-portal.git
   cd 5g-ran-portal
   ```

2. **Launch supporting services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will start MongoDB, Prometheus, and Grafana containers.

3. **Start the backend server**
   ```bash
   cd server
   npm install
   npm start
   ```
   The server will start on port 5001.
4. **In a new terminal, start the frontend client**

   ```bash
   cd client
   npm install
   node server.js
   ```

   The client will start on port 8081.

5. **Access the application**
   - Frontend: http://localhost:8081
   - Grafana: http://localhost:3000 (login: admin/admin)
   - Prometheus: http://localhost:9090

### Manual Installation

For development or custom deployment, follow these steps:

1. **Clone the repository**

   ```bash
   git clone https://github.com/AdityaGahukar/5g-ran-portal.git
   cd 5g-ran-portal
   ```

2. **Set up MongoDB**

   Either use Docker:

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

   Or install MongoDB locally following the [official documentation](https://docs.mongodb.com/manual/installation/).

3. **Set up environment variables**

   ```bash
   # Create .env file in the server directory
   cd server
   cp .env.example .env  # If .env.example exists
   # Or create a new .env file with appropriate values
   ```

4. **Set up the backend server**

   ```bash
   cd server
   npm install
   npm start
   ```

   The server will start on port 5001.

5. **Set up the frontend server**

   ```bash
   cd client
   npm install
   node server.js
   ```

   The frontend will be available at http://localhost:8081.

6. **Set up Prometheus** (for metrics)

   ```bash
   docker run -d -p 9090:9090 --name prometheus \
     -v $(pwd)/config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
     prom/prometheus
   ```

7. **Set up Grafana** (for visualization)
   ```bash
   docker run -d -p 3000:3000 --name grafana \
     -v $(pwd)/config/grafana/provisioning:/etc/grafana/provisioning \
     grafana/grafana-oss
   ```

### Environment Variables

The application uses the following environment variables:

**Server Environment Variables** (server/.env):

```
# Server configuration
PORT=5001                                      # Port the server runs on

# Database settings
MONGO_URI=mongodb://localhost:27017/5g-ran-portal  # MongoDB connection string

# NS-3 settings
USE_NS3=false                                  # Whether to use NS-3 for simulations

# Development flags
DEBUG=true                                     # Enable debug logging
NODE_ENV=development                           # Environment type
```

You can create a `.env` file in the server directory with these variables or set them in your environment before starting the server.

## 🔌 NS-3 Integration

The portal can use NS-3 for high-fidelity simulations. This is optional but provides more accurate results.

### Setting up NS-3 Integration

1. **Install NS-3.43 in WSL or Linux**

   ```bash
   # In WSL or Linux terminal
   cd ~
   git clone https://gitlab.com/nsnam/ns-3-dev.git ns-3.43
   cd ns-3.43
   ./ns3 configure --enable-examples
   ./ns3 build
   ```

2. **Add the simulation script to NS-3**

   ```bash
   cp /path/to/5g-ran-portal/server/ns3/nr-simulation.cc ~/ns-3.43/scratch/
   cd ~/ns-3.43
   ./ns3 build scratch/nr-simulation
   ```

3. **Enable NS-3 in the portal**

   Toggle NS-3 usage in the web interface or set the `USE_NS3` environment variable in the `.env` file:

   ```bash
   # In server/.env
   USE_NS3=true
   ```

## 📖 Usage Guide

### Configuring RAN Parameters

1. Access the frontend at http://localhost:8081
2. The main interface allows you to configure:
   - **Frequency (Hz)**: Central carrier frequency, e.g., 3.5 GHz (3500000000 Hz)
   - **Bandwidth (Hz)**: System bandwidth, e.g., 20 MHz (20000000 Hz)
   - **Duplex Mode**: Time Division Duplex (TDD) or Frequency Division Duplex (FDD)
   - **Transmit Power (dBm)**: Transmission power, e.g., 20 dBm
3. Toggle NS-3 simulation on/off using the switch in the top-right (if configured)
4. Click "Run Simulation" to execute

### Viewing Results

After running a simulation:

1. **Immediate Results**: Throughput and latency values appear directly in the UI
2. **Grafana Dashboard**: For detailed time-series visualization, click the "Grafana Dashboards" button
3. In Grafana (http://localhost:3000):
   - Use the pre-configured 5G RAN dashboard
   - View throughput and latency metrics over time
   - Compare results across multiple simulations

### Setting up Grafana Dashboards

If you need to set up your own Grafana dashboard, follow these steps:

1. **Add Prometheus as a data source in Grafana**

   - In Grafana (http://localhost:3000), go to Configuration (gear icon) → Data sources
   - Click "Add data source"
   - Select "Prometheus"
   - For URL, enter: `http://host.docker.internal:9090` (this allows Grafana container to reach Prometheus)
   - Click "Save & Test" - you should see "Data source is working"

2. **Create a new dashboard**

   - Click on the "+" icon in the left sidebar
   - Select "Dashboard"
   - Click "Add a new panel"

3. **Configure the Throughput panel**

   - For the Query:
     - Data source: Select "Prometheus"
     - In the Metric browser field, enter: `ran_throughput_mbps`
     - Leave other settings at default
   - Panel settings (right side):
     - Title: "5G RAN Throughput"
     - Under "Standard options":
       - Unit: Select "Data rate" → "Mbit/s"
       - Min: 0
       - Decimals: 2
   - Click "Apply" in the top-right corner

4. **Add a Latency panel**

   - Click "Add panel" in the dashboard
   - For the Query:
     - Data source: "Prometheus"
     - Metric: `ran_latency_ms`
     - Leave other settings at default
   - Panel settings:
     - Title: "5G RAN Latency"
     - Under "Standard options":
       - Unit: Select "Time" → "milliseconds (ms)"
       - Min: 0
       - Decimals: 2
   - Click "Apply"

5. **Save the dashboard**
   - Click the save icon (disk) in the top right
   - Name: "5G RAN Dashboard"
   - Click "Save"

## 🔄 API Documentation

The backend provides the following RESTful API endpoints:

### Configuration Management

| Endpoint           | Method | Description                                   | Request Body                                        | Response                                     |
| ------------------ | ------ | --------------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `/api/configs`     | POST   | Create a new configuration and run simulation | `{frequency, bandwidth, duplexMode, transmitPower}` | Configuration object with simulation results |
| `/api/configs`     | GET    | Get all saved configurations                  | None                                                | Array of configuration objects               |
| `/api/configs/:id` | GET    | Get a specific configuration                  | None                                                | Configuration object                         |

### Metrics and Monitoring

| Endpoint         | Method | Description                 | Request Body | Response               |
| ---------------- | ------ | --------------------------- | ------------ | ---------------------- |
| `/metrics`       | GET    | Prometheus metrics endpoint | None         | Prometheus metrics     |
| `/toggle-ns3`    | GET    | Toggle NS-3 usage           | None         | Current NS-3 status    |
| `/metrics-debug` | GET    | Get current metrics values  | None         | Current metrics object |

### Example API Usage

```javascript
// Submit a configuration
fetch("http://localhost:5001/api/configs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    frequency: 3500000000,
    bandwidth: 20000000,
    duplexMode: "TDD",
    transmitPower: 20,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 📁 Project Structure

```
5g-ran-portal/
├── client/                  # Frontend application
│   ├── index.html           # Main web UI
│   ├── 404.html             # Error page
│   └── server.js            # Static file server
├── server/                  # Backend application
│   ├── server.js            # Main Express server
│   ├── .env                 # Environment variables (not in git)
│   ├── ns3/                 # NS-3 simulation files
│   │   ├── nr-simulation.cc # NS-3 simulation script
│   │   └── simulation_output.json # Simulation results
│   ├── routes/              # API routes
│   ├── models/              # Data models
│   └── utils/               # Utility functions
│       ├── metrics.js       # Prometheus metrics setup
│       └── simulate.js      # Simulation controller
├── config/                  # Configuration files
│   ├── prometheus/          # Prometheus configuration
│   └── grafana/             # Grafana configuration
├── .gitignore               # Git ignore file
└── docker-compose.yml       # Docker Compose configuration
```

## 📊 Screenshots

### Main Interface

![Main Interface]()

### Simulation Results

![Simulation Results](https://via.placeholder.com/800x450.png?text=Simulation+Results)

### Grafana Dashboard

![Grafana Dashboard](https://via.placeholder.com/800x450.png?text=Grafana+Dashboard)

## ❓ Troubleshooting

### Common Issues

1. **Docker services not starting**

   - Ensure Docker is running
   - Check for port conflicts on 27017, 9090, 3000, 5001, or 8081
   - Verify Docker has sufficient resources

2. **NS-3 simulation not working**

   - Confirm NS-3 is properly installed in WSL
   - Check WSL integration is enabled and working
   - Verify the NS-3 path in `server/utils/simulate.js`

3. **No metrics in Grafana**

   - Ensure Prometheus is running and scraping metrics
   - Check data source configuration in Grafana
   - Verify metrics are being generated (visit http://localhost:5001/metrics)

4. **MongoDB connection issues**
   - Check MongoDB is running (`docker ps`)
   - Verify connection string in the server code
   - Try connecting manually using MongoDB Compass

### Getting Help

If you encounter problems not covered in the troubleshooting section:

1. Check the server logs: `docker logs 5g-ran-portal-server-1`
2. Check the Prometheus logs: `docker logs prometheus`
3. File an issue in the GitHub repository with detailed information
