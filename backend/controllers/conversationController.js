const Chat = require("../models/Chat");
const Conversation = require("../models/Conversation");
const { generateStreamResponse } = require("../aiProvider/chatgpt-ai");
const { encode } = require("gpt-3-encoder");
const { MemoryClient } = require("mem0ai");

const MAX_TOKENS = 8000;
const memory = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY, // ensure this is in .env
});

function trimMessagesToFit(messages, maxTokens) {
  const reversed = [...messages].reverse();
  let total = 0, trimmed = [];
  for (const msg of reversed) {
    const tok = encode(msg.content || "").length;
    if (total + tok > maxTokens) break;
    trimmed.unshift(msg);
    total += tok;
  }
  return trimmed;
}

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message?.content) return res.status(400).json({ error: "Message content is required" });

    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    if (!chat) return res.status(401).json({ error: "Chat not found" });

    let conversation = await Conversation.findOne({ chatId });
    if (!conversation) conversation = new Conversation({ chatId, messages: [] });

    const userMessage = { role: "user", content: message.content };
    conversation.messages.push(userMessage);
    chat.updatedAt = Date.now();
    await chat.save();
    await conversation.save();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let assistantResponse = { fullResponse: "", title: null };

    try {
      const systemMessage = {
        role: "system",
        content: `
You are ChatGpt, a helpful AI assistant. Provide concise, clear, and useful responses.
Always end your first response with a descriptive chat title like:
[TITLE: example title here]`
      };

      // 1. Fetch memory (limit to top 4 results)
      let memoryContext = [];
      try {
        const memResults = await memory.search(message.content, {
          user_id: req.user.id.toString(),
          version: "v2",
          limit: 4,
        });

        memoryContext = (memResults?.results || []).map(m => ({
          role: "system",
          content: m.memory,
        }));
      } catch (memErr) {
        console.warn("Memory fetch failed, continuing without memory:", memErr.message);
      }

      // 2. Include last 6 user/assistant messages (short-term memory)
      const recentMessages = [...conversation.messages]
        .filter(m => m.role !== "system")
        .slice(-6);

      let messagesToSend = [
        systemMessage,
        ...memoryContext,
        ...recentMessages
      ];

      // 3. Token-trim if needed
      messagesToSend = trimMessagesToFit(messagesToSend, MAX_TOKENS);

      assistantResponse = await generateStreamResponse(messagesToSend, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });

      const assistantMessage = {
        role: "assistant",
        content: assistantResponse.fullResponse
      };

      conversation.messages.push(assistantMessage);
      await conversation.save();

      // 4. Save memory entries (user + assistant)
      try {
        await memory.add([
          { role: "user", content: message.content },
          { role: "assistant", content: assistantResponse.fullResponse }
        ], {
          user_id: req.user.id.toString()
        });
      } catch (memAddErr) {
        console.warn("Memory add failed:", memAddErr.message);
      }

      if (chat.title === "New Chat" && assistantResponse.title) {
        chat.title = assistantResponse.title;
        await chat.save();
      }

      res.write(`data: ${JSON.stringify({ done: true, title: assistantResponse.title })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();

    } catch (err) {
      console.error("Error during AI generation:", err);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }

  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getConverstion = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    if (!chat) return res.status(401).json({ error: "Chat not found" });

    const conversation = await Conversation.findOne({ chatId });
    const messages = conversation?.messages.filter(m => m.role !== "system") || [];
    return res.json({ messages });
  } catch (err) {
    console.error("getConverstion error:", err);
    res.status(500).json({ error: err.message });
  }
};
