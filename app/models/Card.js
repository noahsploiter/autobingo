import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  gameSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameSession",
    required: true,
  },
  numbers: {
    type: {
      B: {
        type: [Number],
        required: true,
        validate: (v) => Array.isArray(v) && v.length === 5,
      },
      I: {
        type: [Number],
        required: true,
        validate: (v) => Array.isArray(v) && v.length === 5,
      },
      N: {
        type: [Number],
        required: true,
        validate: (v) => Array.isArray(v) && v.length === 4,
      },
      G: {
        type: [Number],
        required: true,
        validate: (v) => Array.isArray(v) && v.length === 5,
      },
      O: {
        type: [Number],
        required: true,
        validate: (v) => Array.isArray(v) && v.length === 5,
      },
    },
    required: true,
    _id: false,
  },
  cardNumber: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a compound unique index on gameSessionId and cardNumber
cardSchema.index({ gameSessionId: 1, cardNumber: 1 }, { unique: true });

// Create a compound unique index on gameSessionId and numbers
cardSchema.index(
  {
    gameSessionId: 1,
    "numbers.B": 1,
    "numbers.I": 1,
    "numbers.N": 1,
    "numbers.G": 1,
    "numbers.O": 1,
  },
  { unique: true }
);

// Ensure latest schema during dev hot-reload
if (mongoose.models.BingoCard) {
  delete mongoose.models.BingoCard;
}
const Card = mongoose.model("BingoCard", cardSchema);

export default Card;
