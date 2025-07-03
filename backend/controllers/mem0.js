const { encode } = require("gpt-3-encoder");

class MemoryManager {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 8000;
    this.reserveTokens = options.reserveTokens || 200; // buffer for assistant reply
  }

  countTokens(message) {
    if (!message || !message.content) return 0;
    if (Array.isArray(message.content)) {
      return message.content.reduce((sum, part) => {
        return (
          sum +
          (part.text ? encode(part.text).length : 0) +
          (part.image_url ? 1000 : 0) // crude estimate for image
        );
      }, 0);
    }
    return encode(message.content).length;
  }

  prune(messages) {
    const reversed = [...messages].reverse();
    const result = [];
    let total = 0;
    const limit = this.maxTokens - this.reserveTokens;

    for (const msg of reversed) {
      const tokens = this.countTokens(msg);
      if (total + tokens > limit) break;
      result.unshift(msg);
      total += tokens;
    }

    return result;
  }
}

module.exports = { MemoryManager };
