import "./App.css";
import { useState } from "react";

function App() {
  const [chatMessage, setChatMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [description, setDescription] = useState("");
  const [dreamAnalysis, setDreamAnalysis] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const generateAndAnalyzeImage = async (e, inputText) => {
    e.preventDefault();

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

    setDreamAnalysis(data2.output.imageComprehension.message.content);
    setImageUrl(data1.output.imageURL);
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
          name="chatMessage"
          value={description}
          placeholder="Prompt message to generate and analyze that image"
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          style={{ width: "100%" }}
          onClick={(e) => generateAndAnalyzeImage(e, description)}
        >
          Generate image and analyze
        </button>
        {dreamAnalysis && (
          <p><span className="dream-analysis">{dreamAnalysis}</span></p>
        )}
        {imageUrl && <img src={imageUrl} alt="Loaded" />}
      </section>
    </main>
  );
}

export default App;
