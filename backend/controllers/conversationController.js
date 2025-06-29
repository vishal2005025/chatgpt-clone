
const Chat = require("../models/Chat");
const Conversation = require("../models/Conversation");
const { generateStreamResponse } = require('../aiProvider/chatgpt-ai');

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message || !message.content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    if (!chat) {
      return res.status(401).json({ error: "Chat not found" });
    }

    let conversation = await Conversation.findOne({ chatId });
    if (!conversation) {
      conversation = new Conversation({ chatId, messages: [] });
    }

    // Add user message
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
      assistantResponse = await generateStreamResponse(
        conversation.messages,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      );

      // Save assistant message
      conversation.messages.push({
        role: "assistant",
        content: assistantResponse.fullResponse,
      });
      await conversation.save();

      // If it's the first assistant response, extract title
      if (chat.title === "New Chat") {
        const assistantMessages = conversation.messages.filter((msg) => msg.role === "assistant");
        if (assistantMessages.length === 1 && assistantResponse.title) {
          chat.title = assistantResponse.title;
          await chat.save();
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, title: assistantResponse.title })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error) {
      console.error("Error generating response:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error("Error in sendMessage API:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getConverstion = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });

    if (!chat) {
      return res.status(401).json({ error: "Chat not found" });
    }

    const conversation = await Conversation.findOne({ chatId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = conversation.messages.filter((msg) => msg.role !== "system");
    return res.json({ messages });

  } catch (error) {
    console.error("Error in getConversation API:", error);
    return res.status(500).json({ error: error.message });
  }
};







