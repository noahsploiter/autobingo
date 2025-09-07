import mongoose from "mongoose";

const gameStatsSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    totalGames: {
      type: Number,
      default: 0,
    },
    dailyStats: {
      type: Map,
      of: {
        games: Number,
        total: Number, // Daily Total
        profit: Number, // Daily Profit
      },
      default: new Map(),
    },
    weeklyStats: {
      type: Map,
      of: {
        games: Number,
        total: Number, // Weekly Total
        profit: Number, // Weekly Profit
      },
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

const GameStats =
  mongoose.models.GameStats || mongoose.model("GameStats", gameStatsSchema);

export default GameStats;
