// Import packages
import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

// Initialize
const app = express();
const port = process.env['OPENAI_API_SERVER_PORT'];
const openai = new OpenAI();

// Parse incoming requests with JSON payloads
// Body parser is a middleware for Node.js that parses incoming request bodies and makes them available as objects in the req.body property
// https://medium.com/@amirakhaled2027/body-parser-middleware-in-node-js-75b6b9a36613
app.use(bodyParser.json());

// Setup server on specified port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// POST /text_generation/chat_completions that calls OpenAI API
app.post("/text_generation/chat_completions", async (request, response) => {
  const { chats } = request.body;

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a texas cowboy." },
      ...chats,
    ],
  });

  response.json({
    output: result.choices[0].message,
  });
});
