import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "active", "completed"],
    default: "pending",
  },
  betAmount: {
    type: Number,
    default: 10,
  },
  houseCut: {
    type: Number,
    default: 15,
  },
  cardCount: {
    type: Number,
    default: 0,
  },
  gamePattern: {
    type: String,
    default: "singleLine",
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
  },
  cards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BingoCard",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  winnerCardId: {
    type: Number,
  },
  winningPattern: {
    type: String,
  },
});

const GameSession =
  mongoose.models.GameSession ||
  mongoose.model("GameSession", gameSessionSchema);

export default GameSession;
