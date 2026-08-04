import { useEffect, useState } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help with recommendations based on your list.",
    },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const hasOpenedThisSession = sessionStorage.getItem(
      "hasOpenedChatbotThisSession",
    );

    if (!hasOpenedThisSession) {
      setIsOpen(true);
      sessionStorage.setItem("hasOpenedChatbotThisSession", "true");
    }
  }, []);

  function handleSend(event) {
    event.preventDefault();

    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input.trim(),
    };

    const assistantMessage = {
      role: "assistant",
      text: "Recommendation assistant coming soon.",
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);

    setInput("");
  }

  return (
    <div className="chatbotShell">
      {isOpen && (
        <section className="chatWindow" aria-label="Recommendation assistant">
          <div className="chatHeader">
            <div>
              <p className="chatEyebrow">LitTracker</p>
              <h2>Assistant</h2>
            </div>
            <button
              type="button"
              className="chatClose"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              X
            </button>
          </div>

          <div className="chatMessages">
            {messages.map((message, index) => (
              <div key={index} className={`chatMessage ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="chatForm">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for recommendations!"
            />
            <button type="submit">Send</button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatToggle"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        aria-label="Toggle recommendation assistant"
      >
        <span aria-hidden="true">{"\u{1F4AC}"}</span>
      </button>
    </div>
  );
};

export default Chatbot;
