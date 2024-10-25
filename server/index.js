// Import packages
import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";
import fs from "fs";
import path from "path";

// Initialize
const app = express();
const port = process.env["OPENAI_API_SERVER_PORT"];
const openai = new OpenAI();
const generatedSpeechFile = path.resolve("./generated_speech.mp3");

// Parse incoming requests with JSON payloads
// Body parser is a middleware for Node.js that parses incoming request bodies and makes them available as objects in the req.body property
// https://medium.com/@amirakhaled2027/body-parser-middleware-in-node-js-75b6b9a36613
app.use(bodyParser.json());

// Allow CORS
app.use(cors());

// Setup server on specified port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// POST /text_generation/chat_completions that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/chat/create
// API library https://github.com/openai/openai-node/blob/master/api.md
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

// POST /image_generation/images that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/images/create
// API library https://github.com/openai/openai-node/blob/master/api.md
app.post("/image_generation/images", async (request, response) => {
  const generatedImage = await openai.images.generate({
    model: "dall-e-3",
    prompt: request.body.prompt_message,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  response.json({
    output: {
      imageURL: generatedImage.data[0].url,
    },
  });
});

// // POST /vision/images that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/chat/create
// API library https://github.com/openai/openai-node/blob/master/api.md
app.post("/vision/images", async (request, response) => {
  const visionComprehension = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What's in this image?" },
          {
            type: "image_url",
            image_url: {
              url: request.body.image_url,
            },
          },
        ],
      },
    ],
  });
  response.json({
    output: {
      imageURL: request.body.image_url,
      imageComprehension: visionComprehension.choices[0],
    },
  });
});

// POST /text_to_speech/audio_speeches that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/audio/createSpeech
// API library https://github.com/openai/openai-node/blob/master/api.md
// Supported languages https://platform.openai.com/docs/guides/text-to-speech/supported-languages
// You can generate spoken audio in these languages by providing the input text in the language of your choice.
// Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan,
// Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician,
// German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada,
// Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian,
// Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili,
// Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh
// Thought not specified, it also supports Gujarati
app.post("/text_to_speech/audio_speeches", async (request, response) => {
  const generatedSpeech = await openai.audio.speech.create({
    model: "tts-1",
    response_format: "mp3",
    voice: "onyx",
    input: request.body.prompt_message,
    speed: "1",
  });

  const buffer = Buffer.from(await generatedSpeech.arrayBuffer());
  await fs.promises.writeFile(generatedSpeechFile, buffer);

  console.log(generatedSpeechFile);

  response.json({
    output: {
      speechFileGeneration: "successful",
    },
  });
});

// POST /speech_to_text/audio_transcrptions that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/audio/createTranscription
// API library https://github.com/openai/openai-node/blob/master/api.md
// Thought not specified, it doesn't support Gujarati and lacks accuracy for Hindi
app.post("/speech_to_text/audio_transcrptions", async (request, response) => {
  const speechTranscription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(generatedSpeechFile),
    model: "whisper-1",
    response_format: "json",
  });

  console.log(speechTranscription);

  response.json({
    output: {
      speechTranscript: speechTranscription.text,
    },
  });
});

// POST /speech_to_text/audio_translations that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/audio/createTranslation
// API library https://github.com/openai/openai-node/blob/master/api.md
app.post("/speech_to_text/audio_translations", async (request, response) => {
  const speechTranslation = await openai.audio.translations.create({
    file: fs.createReadStream(generatedSpeechFile),
    model: "whisper-1",
    response_format: "json",
  });

  console.log(speechTranslation);

  response.json({
    output: {
      speechTranslated: speechTranslation.text,
    },
  });
});

// POST /vector_embeddings/embeddings that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/embeddings/create
// API library https://github.com/openai/openai-node/blob/master/api.md
app.post("/vector_embeddings/embeddings", async (request, response) => {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: request.body.input_text.replace(/[\n\r]/g, " "),
    encoding_format: "float",
    dimensions: 512,
  });

  console.log(embedding);

  response.json({
    output: {
      embeddedVector: embedding.data[0].embedding,
    },
  });
});

// POST /moderation/moderations that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/moderations
// API library https://github.com/openai/openai-node/blob/master/api.md
// Text moderation works only for English
app.post("/moderation/moderations", async (request, response) => {
  let inputContent = [];
  inputContent.push({ type: "text", text: request.body.input_text });
  if (request.body.input_url) {
    inputContent.push({
      type: "image_url",
      image_url: {
        url: request.body.input_url,
      },
    });
  }
  console.log("inputContent ", inputContent);
  const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: inputContent,
  });

  response.json({
    output: {
      moderationAnalysis: moderation.results,
    },
  });
});

// POST /reasoning/chat_completions that calls OpenAI API
// API reference https://platform.openai.com/docs/api-reference/chat
// API library https://github.com/openai/openai-node/blob/master/api.md
// Text moderation works only for English
app.post("/reasoning/chat_completions", async (request, response) => {
  const completion = await openai.chat.completions.create({
    model: "o1-preview",
    messages: [
      {
        role: "user",
        content: request.body.input_text.trim(),
      },
    ],
  });

  response.json({
    output: completion.choices[0].message,
  });
});
