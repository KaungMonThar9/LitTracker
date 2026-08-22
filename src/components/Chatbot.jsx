import { useEffect, useState } from "react";
import axios from "axios";
import "./Chatbot.css";
import ReactMarkdown from "react-markdown";

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

  async function handleSend(event) {
    event.preventDefault();

    if (!input.trim()) return;

    const userInquiry = input.trim();
    const loadingMessageId = crypto.randomUUID();

    const userMessage = {
      role: "user",
      text: userInquiry,
    };

    const loadingMessage = {
      id: loadingMessageId,
      role: "assistant",
      isLoading: true,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      loadingMessage,
    ]);
    setInput("");

    const assistantMessageText = await chatResponseLoader(userInquiry);

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === loadingMessageId
          ? { role: "assistant", text: assistantMessageText }
          : message,
      ),
    );
  }

  async function chatResponseLoader(userInquiry) {
    const token = localStorage.getItem("token");
    if (!token) {
      return "Please log in to use personalized recommendations!";
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(
        `${apiUrl}/api/chat-response`,
        { message: userInquiry },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data ?? "Response failed, please try again!";
    } catch (error) {
      console.error(error);
    }
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
              <div
                key={message.id ?? index}
                className={`chatMessage ${message.role}`}
              >
                {message.isLoading ? (
                  <span className="typingDots" aria-label="Assistant is typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                ) : (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                )}
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
