import React, { useState, useEffect, useRef } from "react";
import "./FloatingAIAssistant.css";
import { API_BASE_URL } from "../config/apiConfig";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "💰 What is the pending fees status?",
  "👨‍🎓 How can I view student insights?",
  "📅 How do I check attendance summary?",
  "📊 Summarize institute performance",
];

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      text: "Hello! 👋 I'm your ICE AI Assistant. Ask me anything about students, fees, attendance, or institute operations.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = (customMessage ?? message).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/Gemini/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const replyText = data?.reply || "No response received from AI.";

      setChatHistory((prev) => [
        ...prev,
        {
          id: "a-" + Date.now(),
          role: "assistant",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          text:
            error instanceof Error
              ? `⚠️ ${error.message}`
              : "⚠️ Failed to connect to AI Assistant. Please check if the server is running.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear conversation history?")) {
      setChatHistory([
        {
          id: "welcome-reset",
          role: "assistant",
          text: "Chat cleared! How else can I assist you today? 😊",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="floating-ai-window" role="dialog" aria-label="AI Assistant Window">
          {/* Header */}
          <div className="floating-ai-header">
            <div className="floating-ai-header-info">
              <div className="floating-ai-avatar">
                <i className="bi bi-robot"></i>
                <span className="floating-ai-online-dot" />
              </div>
              <div>
                <h3 className="floating-ai-title">ICE AI Assistant</h3>
                <span className="floating-ai-subtitle">Always Active • Smart Help</span>
              </div>
            </div>

            <div className="floating-ai-header-actions">
              <button
                type="button"
                className="floating-ai-btn-icon"
                title="Clear Chat"
                onClick={handleClearHistory}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
              <button
                type="button"
                className="floating-ai-btn-icon"
                title="Close"
                onClick={() => setIsOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="floating-ai-messages">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`floating-ai-msg ${msg.role}`}>
                <div className="floating-ai-msg-bubble">
                  {msg.role === "assistant" && (
                    <div className="floating-ai-msg-sender">
                      <i className="bi bi-stars"></i> ICE AI
                    </div>
                  )}
                  <p className="floating-ai-msg-text">{msg.text}</p>
                  <span className="floating-ai-msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="floating-ai-msg assistant">
                <div className="floating-ai-msg-bubble thinking">
                  <div className="floating-ai-msg-sender">
                    <i className="bi bi-stars"></i> ICE AI
                  </div>
                  <div className="floating-ai-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          {chatHistory.length <= 2 && (
            <div className="floating-ai-quick-prompts">
              <span className="floating-ai-quick-label">Suggested:</span>
              <div className="floating-ai-chips">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="floating-ai-chip"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="floating-ai-footer">
            <input
              ref={inputRef}
              type="text"
              className="floating-ai-input"
              placeholder="Ask anything about your institute..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="floating-ai-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !message.trim()}
              title="Send Message"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Button (WhatsApp-like Style) */}
      <button
        type="button"
        className={`floating-ai-pill-btn ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        <span className="floating-ai-pill-icon-wrapper">
          {isOpen ? (
            <i className="bi bi-x-lg"></i>
          ) : (
            <i className="bi bi-robot"></i>
          )}
        </span>

        <span className="floating-ai-pill-text">
          {isOpen ? "Close AI" : "AI Assistant"}
        </span>

        {!isOpen && (
          <span className="floating-ai-pill-badge" title="AI Assistant Available">
            {hasUnread ? "1" : "✨"}
          </span>
        )}
      </button>
    </>
  );
};

export default FloatingAIAssistant;
