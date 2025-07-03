const mongoose = require("mongoose");

const cachedResponseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  title: { type: String }, // Optional for title caching
  createdAt: { type: Date, default: Date.now, expires: "7d" } 
});

module.exports = mongoose.model("CachedResponse", cachedResponseSchema);
