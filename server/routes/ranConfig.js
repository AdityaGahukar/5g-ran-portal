const express = require("express");
const router = express.Router();
const RanConfig = require("../models/RanConfig");
const { runSimulation } = require("../utils/simulate");
const { updateMetrics } = require("../utils/metrics");
const {
  globalThroughputGauge,
  globalLatencyGauge,
} = require("../utils/metrics");

/**
 * @route   POST /api/configs
 * @desc    Create a new RAN configuration and run simulation
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    const { frequency, bandwidth, duplexMode, transmitPower } = req.body;

    // Basic validation
    if (!frequency || !bandwidth || !duplexMode || !transmitPower) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Run the simulation
    const simulationResult = await runSimulation({
      frequency,
      bandwidth,
      duplexMode,
      transmitPower,
    });

    // Ensure we have numeric values for throughput and latency
    const throughput = parseFloat(simulationResult.results.throughput);
    const latency = parseFloat(simulationResult.results.latency);

    // Update the simulation results if parsing produced valid numbers
    if (!isNaN(throughput)) simulationResult.results.throughput = throughput;
    if (!isNaN(latency)) simulationResult.results.latency = latency;

    // Create a new RAN configuration with simulation results
    const newConfig = new RanConfig({
      frequency,
      bandwidth,
      duplexMode,
      transmitPower,
      simulationResult: simulationResult.results,
    });

    // Save the configuration to the database
    await newConfig.save();

    // Update Prometheus metrics - ensure we're using the actual simulation results
    updateMetrics(
      { frequency, bandwidth, duplexMode, transmitPower },
      simulationResult.results
    );

    // Directly set the global gauges for Grafana (IMPORTANT!)
    globalThroughputGauge.set(throughput);
    globalLatencyGauge.set(latency);
    console.log(
      `Direct Grafana metrics set: throughput=${throughput}, latency=${latency}`
    );

    // Double-check the metrics update by running it a second time
    setTimeout(() => {
      globalThroughputGauge.set(throughput);
      globalLatencyGauge.set(latency);
      console.log("Grafana metrics refreshed for reliability");
    }, 1000);

    console.log("Metrics updated after simulation");
    console.log(
      `Throughput: ${simulationResult.results.throughput}, Latency: ${simulationResult.results.latency}`
    );

    // Return the configuration with simulation results
    res.status(201).json({
      message: "RAN Config saved",
      config: newConfig,
      simulationResult: simulationResult.results,
    });
  } catch (error) {
    console.error("Error creating configuration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/configs
 * @desc    Get all RAN configurations
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const configs = await RanConfig.find().sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching configurations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/configs/:id
 * @desc    Get a specific RAN configuration
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const config = await RanConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: "Configuration not found" });
    }
    res.json(config);
  } catch (error) {
    console.error("Error fetching configuration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
