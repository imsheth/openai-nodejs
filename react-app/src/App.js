import "./App.css";
import { useState } from "react";

function App() {
  const [chatMessage, setChatMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [imageDescription, setImageDescription] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [audioDescription, setAudioDescription] = useState("");
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState("");
  const [audioTranslation, setAudioTranslation] = useState("");

  const [vectorEmbeddings, setVectorEmbeddings] = useState("");
  const [generatedVectorEmbedding, setGeneratedVectorEmbedding] = useState("");

  const [moderationText, setModerationText] = useState("");
  const [moderationURL, setModerationURL] = useState("");
  const [moderationResult, setModerationResult] = useState(null);

  const performModeration = async (e, inputText, inputURL) => {
    e.preventDefault();

    try {
      const request1 = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_text: inputText,
          input_url: inputURL,
        }),
      };

      const moderationAnalysis = await fetch(
        `http://localhost:8080/moderation/moderations`,
        request1
      );
      const data1 = await moderationAnalysis.json();

      if (data1.output.moderationAnalysis) {
        setModerationResult(data1.output.moderationAnalysis);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const generateEmbedding = async (e, inputText) => {
    e.preventDefault();

    try {
      const request1 = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_text: inputText,
        }),
      };

      const generatedEmbedding = await fetch(
        `http://localhost:8080/vector_embeddings/embeddings`,
        request1
      );
      const data1 = await generatedEmbedding.json();

      if (data1.output.embeddedVector) {
        setGeneratedVectorEmbedding(data1.output.embeddedVector.join(", "));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const generateAndAnalyzeAudio = async (e, inputText) => {
    e.preventDefault();

    try {
      const request1 = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_message: inputText,
        }),
      };

      const generatedAudio = await fetch(
        `http://localhost:8080/text_to_speech/audio_speeches`,
        request1
      );
      const data1 = await generatedAudio.json();

      if (data1.output.speechFileGeneration === "successful") {
        setAudioGenerated(true);

        const request2 = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "",
        };

        const generatedAudioTranscription = await fetch(
          `http://localhost:8080/speech_to_text/audio_transcrptions`,
          request2
        );
        const data2 = await generatedAudioTranscription.json();
        if (data2.output.speechTranscript) {
          setAudioTranscription(data2.output.speechTranscript);
        }

        const request3 = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "",
        };

        const generatedAudioTranslation = await fetch(
          `http://localhost:8080/speech_to_text/audio_translations`,
          request3
        );
        const data3 = await generatedAudioTranslation.json();
        if (data3.output.speechTranslated) {
          setAudioTranslation(data3.output.speechTranslated);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const generateAndAnalyzeImage = async (e, inputText) => {
    e.preventDefault();

    try {
      const request1 = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_message: inputText,
        }),
      };

      const generatedImage = await fetch(
        `http://localhost:8080/image_generation/images`,
        request1
      );
      const data1 = await generatedImage.json();

      const request2 = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: data1.output.imageURL,
        }),
      };

      const generatedImageAnalysis = await fetch(
        `http://localhost:8080/vision/images`,
        request2
      );
      const data2 = await generatedImageAnalysis.json();

      setImageAnalysis(data2.output.imageComprehension.message.content);
      setImageUrl(data1.output.imageURL);
      setImageDescription("");
    } catch (error) {
      console.log(error);
    }
  };

  const completeChat = async (e, chatMessage) => {
    e.preventDefault();

    if (!chatMessage) return;

    setIsTyping(true);
    let msgs = chats;
    msgs.push({ role: "user", content: chatMessage });
    setChats(msgs);

    setChatMessage("");

    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chats,
      }),
    };
    try {
      const fetchResponse = await fetch(
        `http://localhost:8080/text_generation/chat_completions`,
        request
      );
      const data = await fetchResponse.json();
      msgs.push(data.output);
      setChats(msgs);
      setIsTyping(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main>
      <h1>OpenAI node.js React</h1>
      <hr />

      <section>
        <h2>/text_generation/chat_completions</h2>
        {chats && chats.length
          ? chats.map((chat, index) => (
              <p key={index} className={chat.role === "user" ? "user_msg" : ""}>
                <span>
                  {chat.role === "user" ? <b>User : </b> : <b>OpenAI : </b>}
                </span>
                <span>{chat.content}</span>
              </p>
            ))
          : ""}

        <div className={isTyping ? "" : "hide"}>
          <p>
            <i>{isTyping ? "Typing" : ""}</i>
          </p>
        </div>

        <form action="" onSubmit={(e) => completeChat(e, chatMessage)}>
          <input
            type="text"
            name="chatMessage"
            value={chatMessage}
            placeholder="Chat message"
            onChange={(e) => setChatMessage(e.target.value)}
          />
        </form>
      </section>

      <hr />

      <section>
        <h2>/image_generation/images & /vision/images</h2>

        <input
          type="text"
          name="imageDescriptionMessage"
          value={imageDescription}
          placeholder="Prompt message to generate and analyze that image"
          onChange={(e) => setImageDescription(e.target.value)}
        />
        <button
          style={{ width: "100%" }}
          onClick={(e) => generateAndAnalyzeImage(e, imageDescription)}
        >
          Generate image and analyze
        </button>
        {imageAnalysis && (
          <p>
            <span>{imageAnalysis}</span>
          </p>
        )}
        {imageUrl && <img src={imageUrl} alt="Loaded" />}
      </section>

      <hr />

      <section>
        <h2>
          /text_to_speech/audio_speeches, /speech_to_text/audio_transcrptions &
          /speech_to_text/audio_translations
        </h2>

        <input
          type="text"
          name="audioDescriptionMessage"
          value={audioDescription}
          placeholder="Prompt message to generate and transcribe + translate that audio"
          onChange={(e) => setAudioDescription(e.target.value)}
        />
        <button
          style={{ width: "100%" }}
          onClick={(e) => generateAndAnalyzeAudio(e, audioDescription)}
        >
          Generate audio and transcribe + translate
        </button>
        {audioGenerated && (
          <p>
            <span>Audio generated successfully</span>
          </p>
        )}
        {audioTranscription && audioTranscription.length > 0 && (
          <p>
            <span>Audio transcription - {audioTranscription}</span>
          </p>
        )}
        {audioTranslation && audioTranslation.length > 0 && (
          <p>
            <span>Audio translation - {audioTranslation}</span>
          </p>
        )}
      </section>

      <hr />

      <section>
        <h2>
          /vector_embeddings/embeddings
        </h2>

        <input
          type="text"
          name="vectorText"
          value={vectorEmbeddings}
          placeholder="Text to generate vector embeddings"
          onChange={(e) => setVectorEmbeddings(e.target.value)}
        />
        <button
          style={{ width: "100%" }}
          onClick={(e) => generateEmbedding(e, vectorEmbeddings)}
        >
          Generate generate vector embeddings
        </button>
        {generatedVectorEmbedding && generatedVectorEmbedding.length > 0 && (
          <p>
            <span>Generated vector embedding - {generatedVectorEmbedding}</span>
          </p>
        )}
      </section>

      <hr />

      <section>
        <h2>
          /moderation/moderations
        </h2>

        <input
          type="text"
          name="moderationText"
          value={moderationText}
          placeholder="Text to moderate"
          onChange={(e) => setModerationText(e.target.value)}
        />
        <input
          type="text"
          name="moderationURL"
          value={moderationURL}
          placeholder="URL to moderate"
          onChange={(e) => setModerationURL(e.target.value)}
        />
        <button
          style={{ width: "100%" }}
          onClick={(e) => performModeration(e, moderationText, moderationURL)}
        >
          Generate moderation analysis
        </button>
        {moderationResult && moderationResult.length > 0 && (
          <p>
            <span>Generated moderation - content to be flagged - {moderationResult[0].flagged.toString()}</span><br /><br />
            <span>Generated moderation - content analysis categories -</span><br /><br />
            {Object.entries(moderationResult[0].categories).map(([key, value]) => (<div>{`${key}: ${value}`}</div>))}
            <span>Generated moderation - content analysis scores -</span><br /><br />
            {Object.entries(moderationResult[0].category_scores).map(([key, value]) => (<div>{`${key}: ${value}`}</div>))}
          </p>
        )}
      </section>

    </main>
  );
}

export default App;
