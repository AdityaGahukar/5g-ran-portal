const client = require("prom-client");

// Enable collection of default metrics
client.collectDefaultMetrics();

// Create a Counter metric for simulations
const simulationCounter = new client.Counter({
  name: "ran_simulation_total",
  help: "Total number of RAN simulations run",
  labelNames: ["duplex_mode"],
});

// Create Gauge metrics for various measurements
const throughputGauge = new client.Gauge({
  name: "ran_throughput_bps",
  help: "RAN throughput in bits per second",
  labelNames: ["duplex_mode"],
});

const latencyGauge = new client.Gauge({
  name: "ran_latency_seconds",
  help: "RAN latency in seconds",
  labelNames: ["duplex_mode"],
});

const frequencyGauge = new client.Gauge({
  name: "ran_frequency_hz",
  help: "RAN frequency in Hz",
  labelNames: ["duplex_mode"],
});

const bandwidthGauge = new client.Gauge({
  name: "ran_bandwidth_hz",
  help: "RAN bandwidth in Hz",
  labelNames: ["duplex_mode"],
});

const transmitPowerGauge = new client.Gauge({
  name: "ran_transmit_power_dbm",
  help: "RAN transmit power in dBm",
  labelNames: ["duplex_mode"],
});

// Create Gauge metrics for global values (no labels) for better Grafana compatibility
const globalThroughputGauge = new client.Gauge({
  name: "ran_throughput_global_bps",
  help: "Global RAN throughput value in bits per second (no labels)",
});

const globalLatencyGauge = new client.Gauge({
  name: "ran_latency_global_seconds",
  help: "Global RAN latency value in seconds (no labels)",
});

// Create new gauges with better units for Grafana
const graphThroughputGauge = new client.Gauge({
  name: "ran_throughput_mbps",
  help: "RAN throughput in Mbps for Grafana display",
});

const graphLatencyGauge = new client.Gauge({
  name: "ran_latency_ms",
  help: "RAN latency in milliseconds for Grafana display",
});

// Initialize with default values for both TDD and FDD
throughputGauge.set({ duplex_mode: "TDD" }, 0);
latencyGauge.set({ duplex_mode: "TDD" }, 0);
frequencyGauge.set({ duplex_mode: "TDD" }, 0);
bandwidthGauge.set({ duplex_mode: "TDD" }, 0);
transmitPowerGauge.set({ duplex_mode: "TDD" }, 0);

throughputGauge.set({ duplex_mode: "FDD" }, 0);
latencyGauge.set({ duplex_mode: "FDD" }, 0);
frequencyGauge.set({ duplex_mode: "FDD" }, 0);
bandwidthGauge.set({ duplex_mode: "FDD" }, 0);
transmitPowerGauge.set({ duplex_mode: "FDD" }, 0);

// Initialize global gauges
globalThroughputGauge.set(0);
globalLatencyGauge.set(0);

// Last simulation results for debug purposes
let lastResults = {
  throughput: 0,
  latency: 0,
  frequency: 0,
  bandwidth: 0,
  transmitPower: 0,
  duplexMode: "TDD",
};

/**
 * Update metrics with simulation results
 * @param {Object} config - RAN configuration
 * @param {Object} results - Simulation results
 */
function updateMetrics(config, results) {
  const { frequency, bandwidth, duplexMode, transmitPower } = config;
  const { throughput, latency } = results;

  try {
    // Keep track of last results for debugging
    lastResults = {
      throughput,
      latency,
      frequency,
      bandwidth,
      transmitPower,
      duplexMode,
    };

    // Increment the simulation counter
    simulationCounter.inc({ duplex_mode: duplexMode });

    // Parsed values for reliability
    const parsedThroughput = parseFloat(throughput);
    const parsedLatency = parseFloat(latency);

    // Update the gauges - use parseFloat to ensure we have numbers
    throughputGauge.set({ duplex_mode: duplexMode }, parsedThroughput);
    latencyGauge.set({ duplex_mode: duplexMode }, parsedLatency);
    frequencyGauge.set({ duplex_mode: duplexMode }, parseFloat(frequency));
    bandwidthGauge.set({ duplex_mode: duplexMode }, parseFloat(bandwidth));
    transmitPowerGauge.set(
      { duplex_mode: duplexMode },
      parseFloat(transmitPower)
    );

    // Convert throughput to Mbps for Grafana display
    // This makes it match what's shown in the UI better
    const throughputInMbps = parsedThroughput / 1000000; // convert from bps to Mbps

    // Convert latency to ms for Grafana display
    const latencyInMs = parsedLatency * 1000; // convert from seconds to ms

    // Update the original global gauges (keeping for backward compatibility)
    globalThroughputGauge.set(throughputInMbps);
    globalLatencyGauge.set(latencyInMs);

    // Update the new gauges with clearer units - these are better for Grafana
    graphThroughputGauge.set(throughputInMbps);
    graphLatencyGauge.set(latencyInMs);

    console.log(
      `Metrics updated: DuplexMode=${duplexMode}, ThroughPut=${parsedThroughput} bps (${throughputInMbps} Mbps), Latency=${parsedLatency} s (${latencyInMs} ms)`
    );

    // Force a global metrics update for good measure
    client.register.metrics();
  } catch (err) {
    console.error("Error updating metrics:", err);
  }
}

/**
 * Debug helper to get current metric values
 */
function getCurrentMetrics() {
  let metrics = {};

  try {
    // For gauges, we need to get values by label
    const tddThroughput = throughputGauge.get({ duplex_mode: "TDD" }) || 0;
    const tddLatency = latencyGauge.get({ duplex_mode: "TDD" }) || 0;
    const fddThroughput = throughputGauge.get({ duplex_mode: "FDD" }) || 0;
    const fddLatency = latencyGauge.get({ duplex_mode: "FDD" }) || 0;

    metrics = {
      throughput: lastResults.throughput,
      latency: lastResults.latency,
      frequency: lastResults.frequency,
      bandwidth: lastResults.bandwidth,
      transmitPower: lastResults.transmitPower,
      duplexMode: lastResults.duplexMode,
      gauges: {
        throughput: {
          TDD: tddThroughput.value || 0,
          FDD: fddThroughput.value || 0,
        },
        latency: {
          TDD: tddLatency.value || 0,
          FDD: fddLatency.value || 0,
        },
        frequency:
          frequencyGauge.get({ duplex_mode: lastResults.duplexMode }) || 0,
        bandwidth:
          bandwidthGauge.get({ duplex_mode: lastResults.duplexMode }) || 0,
        transmitPower:
          transmitPowerGauge.get({ duplex_mode: lastResults.duplexMode }) || 0,
      },
      simulationCount: simulationCounter.get() || { TDD: 0, FDD: 0 },
    };

    // Log the raw values to diagnose issues
    console.log("Current metrics retrieved:");
    console.log(
      `Throughput (${lastResults.duplexMode}): ${
        metrics.gauges.throughput[lastResults.duplexMode]
      }`
    );
    console.log(
      `Latency (${lastResults.duplexMode}): ${
        metrics.gauges.latency[lastResults.duplexMode]
      }`
    );
  } catch (err) {
    console.error("Error getting metrics:", err);
  }

  return metrics;
}

// Export raw gauges for direct testing
function getGauges() {
  return {
    throughputGauge,
    latencyGauge,
    frequencyGauge,
    bandwidthGauge,
    transmitPowerGauge,
    simulationCounter,
  };
}

module.exports = {
  updateMetrics,
  getCurrentMetrics,
  getGauges,
  globalThroughputGauge,
  globalLatencyGauge,
  graphThroughputGauge,
  graphLatencyGauge,
};
