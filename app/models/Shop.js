import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Shop name is required"],
    unique: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  balance: {
    type: Number,
    default: 300, // Default balance of 300 ETB
    min: [0, "Balance cannot be negative"],
  },
});

// Hash password before saving
ShopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add comparePassword method to the schema
ShopSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Check if the model exists before creating a new one
const Shop = mongoose.models.Shop || mongoose.model("Shop", ShopSchema);
export default Shop;
