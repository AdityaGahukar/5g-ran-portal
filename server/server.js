// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const promClient = require("prom-client");
const {
  updateMetrics,
  getCurrentMetrics,
  getGauges,
  globalThroughputGauge,
  globalLatencyGauge,
  graphThroughputGauge,
  graphLatencyGauge,
} = require("./utils/metrics");
const ranConfigRoutes = require("./routes/ranConfig");

// Configuration for NS-3 usage
// Set this to 'true' to use the external NS-3 binary (when it's ready)
// Set to 'false' to use the internal JavaScript-based calculation
process.env.USE_NS3 = process.env.USE_NS3 || "true";

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const MONGO_URI = "mongodb://localhost:27017/5g-ran-portal";
console.log("Trying to connect to MongoDB at:", MONGO_URI);

// Add connection options and retry logic
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Try to connect to MongoDB
mongoose
  .connect(MONGO_URI, MONGO_OPTIONS)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("\n⚠️ IMPORTANT: Make sure MongoDB is running!");
    console.log(
      "If using Docker, run: docker run -d -p 27017:27017 mongo:latest"
    );
    console.log("Or install MongoDB locally and start the service.\n");

    // Program can still run without MongoDB for demo purposes
    console.log(
      "⚠️ Running in demo mode without database. Some features will be limited."
    );
  });

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    console.error("Error generating metrics:", err);
    res.status(500).send("Error generating metrics");
  }
});

// Test endpoint to verify metrics
app.get("/test-metrics", (req, res) => {
  // Set some sample metrics with higher values for visibility
  updateMetrics(
    {
      frequency: 3500000000,
      bandwidth: 20000000,
      duplexMode: "TDD",
      transmitPower: 20,
    },
    {
      throughput: 5000000,
      latency: 0.005,
    }
  );

  console.log("Test metrics updated");
  res.json({
    message: "Test metrics set successfully",
    metrics: getCurrentMetrics(),
  });
});

// Diagnostic endpoint to get current metrics values
app.get("/metrics-debug", (req, res) => {
  const currentMetrics = getCurrentMetrics();
  res.json(currentMetrics);
});

// Direct metrics update endpoint for testing
app.get("/update-metrics/:throughput/:latency", (req, res) => {
  const throughput = parseFloat(req.params.throughput);
  const latency = parseFloat(req.params.latency);

  if (isNaN(throughput) || isNaN(latency)) {
    return res
      .status(400)
      .json({ error: "Invalid throughput or latency values" });
  }

  updateMetrics(
    {
      frequency: 3500000000,
      bandwidth: 20000000,
      duplexMode: "TDD",
      transmitPower: 20,
    },
    {
      throughput,
      latency,
    }
  );

  res.json({
    message: "Metrics updated directly",
    throughput,
    latency,
  });
});

// Raw gauge access for direct testing
app.get("/raw-gauges", (req, res) => {
  const gauges = getGauges();
  const gaugeValues = {};

  for (const [name, gauge] of Object.entries(gauges)) {
    gaugeValues[name] = gauge.get();
  }

  res.json(gaugeValues);
});

// Toggle NS-3 usage
app.get("/toggle-ns3", (req, res) => {
  // If a specific value is passed, use that, otherwise toggle
  const forceValue = req.query.force;
  let newValue;

  if (forceValue === "true" || forceValue === "false") {
    // Explicit force of a value
    newValue = forceValue;
  } else {
    // Toggle current value
    newValue = process.env.USE_NS3 === "true" ? "false" : "true";
  }

  process.env.USE_NS3 = newValue;

  console.log(
    `NS-3 usage changed to: ${newValue} (${
      newValue === "true" ? "enabled" : "disabled"
    })`
  );

  res.json({
    message: `NS-3 usage is now ${
      newValue === "true" ? "enabled" : "disabled"
    }`,
    useNs3: newValue === "true",
  });
});

// Verify NS-3 operation
app.get("/verify-ns3", async (req, res) => {
  const { runSimulation } = require("./utils/simulate");

  try {
    // Set a response timeout flag
    let hasResponded = false;

    // Set a timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({
          error: "Verification timed out after 10 seconds",
          conclusion:
            "NS-3 verification timed out - may be installed but taking too long",
          useNs3: process.env.USE_NS3 === "true",
        });
      }
    }, 10000);

    // First, store the current USE_NS3 setting
    const originalSetting = process.env.USE_NS3;

    // Run with NS-3 disabled to get a baseline
    process.env.USE_NS3 = "false";
    const jsResult = await runSimulation({
      frequency: 3500000000,
      bandwidth: 20000000,
      duplexMode: "TDD",
      transmitPower: 20,
    });

    // Run with NS-3 enabled
    process.env.USE_NS3 = "true";
    const ns3Result = await runSimulation({
      frequency: 3500000000,
      bandwidth: 20000000,
      duplexMode: "TDD",
      transmitPower: 20,
    });

    // Restore original setting
    process.env.USE_NS3 = originalSetting;

    // Clear the timeout since we completed
    clearTimeout(timeoutId);

    // Check if we already responded due to timeout
    if (hasResponded) return;
    hasResponded = true;

    // Compare results
    const isDifferent =
      jsResult.results.throughput !== ns3Result.results.throughput ||
      jsResult.results.latency !== ns3Result.results.latency;

    res.json({
      ns3_enabled: process.env.USE_NS3 === "true",
      js_result: jsResult.results,
      ns3_result: ns3Result.results,
      are_different: isDifferent,
      conclusion: isDifferent
        ? "NS-3 appears to be working (different results)"
        : "NS-3 may not be working (identical results)",
    });
  } catch (error) {
    console.error("Error verifying NS-3:", error);
    res.status(500).json({
      error: error.message,
      conclusion: "NS-3 verification failed - see error message",
    });
  }
});

// Simple NS-3 verification - just checks if NS-3 is configured
app.get("/ns3-status", (req, res) => {
  // Try to check if wsl is available
  const { exec } = require("child_process");

  exec("wsl ls -la", (error, stdout, stderr) => {
    if (error) {
      return res.json({
        ns3_enabled: process.env.USE_NS3 === "true",
        wsl_available: false,
        message:
          "WSL does not appear to be available. NS-3 will not work without WSL.",
        error: error.message,
      });
    }

    // Check if NS-3 path exists in WSL
    exec(
      'wsl test -d ~/ns-3-development/ns-3.37 && echo "exists"',
      (error, stdout, stderr) => {
        const ns3Exists = stdout.includes("exists");

        res.json({
          ns3_enabled: process.env.USE_NS3 === "true",
          wsl_available: true,
          ns3_path_exists: ns3Exists,
          message: ns3Exists
            ? "NS-3 appears to be correctly set up"
            : "NS-3 directory was not found. Please check your NS-3 installation.",
          current_setup: {
            useNs3: process.env.USE_NS3 === "true",
            expectedNs3Path: "~/ns-3-development/ns-3.37",
          },
        });
      }
    );
  });
});

// API routes
app.use("/api/configs", ranConfigRoutes);

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Set test metrics for Grafana
app.get("/set-grafana-metrics/:throughput/:latency", (req, res) => {
  try {
    const throughput = parseFloat(req.params.throughput);
    const latency = parseFloat(req.params.latency);

    if (isNaN(throughput) || isNaN(latency)) {
      return res
        .status(400)
        .json({ error: "Invalid throughput or latency values" });
    }

    // Convert throughput to Mbps for Grafana
    const throughputInMbps = throughput / 1000000;

    // Convert latency to ms for Grafana
    const latencyInMs = latency * 1000;

    // Set the global gauges (legacy)
    globalThroughputGauge.set(throughputInMbps);
    globalLatencyGauge.set(latencyInMs);

    // Set the new gauges with better units
    graphThroughputGauge.set(throughputInMbps);
    graphLatencyGauge.set(latencyInMs);

    res.json({
      message: "Test metrics set successfully",
      throughput: {
        bps: throughput,
        mbps: throughputInMbps,
      },
      latency: {
        seconds: latency,
        ms: latencyInMs,
      },
    });
  } catch (error) {
    console.error("Error setting test metrics:", error);
    res.status(500).json({ error: "Error setting test metrics" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!", error: err.message });
});

// Function to initialize metrics on startup
function initializeMetrics() {
  console.log("Initializing metrics with default values...");

  // Set initial values
  globalThroughputGauge.set(1000000); // 1 Mbps
  globalLatencyGauge.set(0.01); // 10ms

  // Test metrics by setting a value and then checking it
  setTimeout(() => {
    globalThroughputGauge.set(2000000); // 2 Mbps
    console.log("Metrics test: Global throughput set to 2 Mbps");

    // Check if metrics registration worked
    promClient.register
      .metrics()
      .then((metrics) => {
        if (metrics.includes("ran_throughput_global_bps")) {
          console.log("✅ Metrics registration successful");
        } else {
          console.log("❌ Metrics registration failed");
        }
      })
      .catch((err) => console.error("Error checking metrics:", err));
  }, 2000);
}

// Initialize metrics at startup
initializeMetrics();

// Start the server
const PORT = process.env.PORT || 5001;
const server = app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(
      `NS-3 usage is ${process.env.USE_NS3 === "true" ? "enabled" : "disabled"}`
    );
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Try using a different port.`
      );
      process.exit(1);
    } else {
      console.error("Server error:", err);
    }
  });
