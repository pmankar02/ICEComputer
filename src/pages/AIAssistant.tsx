
import React, { useState, useEffect, useRef } from "react";
import "./AIAssistant.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const AIAssistant: React.FC = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); 
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatHistory, isLoading]);

  const features = [
    {
      icon: "👨‍🎓",
      title: "Student Insights",
      desc: "Student information and performance",
    },
    {
      icon: "💰",
      title: "Fees Analysis",
      desc: "Collection and pending fees",
    },
    {
      icon: "📅",
      title: "Attendance AI",
      desc: "Daily attendance summary",
    },
    {
      icon: "📊",
      title: "Business Reports",
      desc: "Institute performance analysis",
    },
    {
      icon: "📚",
      title: "AI Student Tutor",
      desc: "Learning, quizzes and practice",
    },
    {
      icon: "📄",
      title: "Document AI",
      desc: "Read and summarize documents",
    },
  ];

  const handleSend = async () => {
    const userMessage = message.trim();

    if (!userMessage || isLoading) return;

    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/Gemini/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
    } catch (error) {
      console.error("Gemini API Error:", error);

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div>
          <h1>✨ ICE SMART AI</h1>
          <p>Your Intelligent Institute Management Assistant</p>
        </div>

        <span className="ai-status">● AI Assistant</span>
      </div>

      {/* Welcome Section */}
      <div className="ai-welcome">
        <h2>Good Morning, Admin! 👋</h2>
        <p>
          Welcome to ICE SMART AI. How can I help you today?
        </p>

        {/* Chat Messages */}
        {chatHistory.length > 0 && (
          <div className="ai-chat-history">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`ai-message ${chat.role}`}
              >
                <strong>
                  {chat.role === "user" ? "You" : "✨ ICE AI"}
                </strong>

                <p>{chat.text}</p>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message assistant">
                <strong>✨ ICE AI</strong>
                <p>Thinking...</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* Chat Input */}
        <div className="ai-chat-box">
          <span>✨</span>

          <input
            type="text"
            placeholder="Ask anything about your institute..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? "Thinking..." : "Send ➤"}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="ai-section-title">
        <h2>AI Smart Features</h2>
        <p>Choose a service to get started</p>
      </div>

      <div className="ai-feature-grid">
        {features.map((feature, index) => (
         <div
            className="ai-feature-card"
            key={index}
            onClick={() => {
                if (feature.title === "Student Insights") {
                navigate("/student-insights");
                }
            }}
            >

            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
            <span>Explore →</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIAssistant;
