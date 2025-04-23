const mongoose = require('mongoose');

/**
 * Schema for RAN configuration
 */
const ranConfigSchema = new mongoose.Schema(
  {
    frequency: {
      type: Number,
      required: true,
      description: 'Frequency in Hz'
    },
    bandwidth: {
      type: Number,
      required: true,
      description: 'Bandwidth in Hz'
    },
    duplexMode: {
      type: String,
      enum: ['TDD', 'FDD'],
      required: true,
      description: 'Duplex mode (TDD or FDD)'
    },
    transmitPower: {
      type: Number,
      required: true,
      description: 'Transmit power in dBm'
    },
    simulationResult: {
      throughput: {
        type: Number,
        description: 'Throughput in bps'
      },
      latency: {
        type: Number,
        description: 'Latency in seconds'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RanConfig', ranConfigSchema); 