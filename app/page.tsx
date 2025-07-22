"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const PlotlyEmbed = dynamic(() => import("./PlotlyEmbed"), { ssr: false });

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  html_snippet?: string;
};

type VisualizationResponse = {
  message: string;
  data: any[];
  html_snippet: string;
  success: boolean;
  error?: string | null;
};

export default function ChatPage() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    // Add user message
    setChat((prev) => [
      ...prev,
      { role: "user", text: query.trim() }
    ]);

    try {
      const res = await fetch("https://bayes-ai.onrender.com/visualization/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data: VisualizationResponse = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error from backend.");

      // Remove code blocks from message
      const cleanMsg = data.message.replace(/```[\s\S]*?```/g, "").trim();

      setChat((prev) => [
        ...prev,
        { role: "assistant", text: cleanMsg, html_snippet: data.html_snippet }
      ]);
    } catch (err: any) {
      setChat((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, there was an error processing your request." }
      ]);
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <main className="chat-main">
      <h1 className="chat-title">Visualization Chat</h1>
      <div className="chat-window">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
          >
            <div className="chat-text">{msg.text}</div>
            {msg.html_snippet && (
              <div className="chat-plot">
                <PlotlyEmbed html={msg.html_snippet} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="chat-text">Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
          className="chat-input"
          required
        />
        <button type="submit" disabled={loading || !query.trim()} className="chat-send">
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
      <style>{`
        .chat-main {
          max-width: 600px;
          margin: 40px auto;
          padding: 24px;
          background: #f7f9fb;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          display: flex;
          flex-direction: column;
          height: 80vh;
        }
        .chat-title {
          text-align: center;
          margin-bottom: 16px;
          color: #1a202c;
          font-size: 2rem;
          font-weight: 700;
        }
        .chat-window {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }
        .chat-bubble {
          max-width: 80%;
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 1rem;
          line-height: 1.5;
          word-break: break-word;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          position: relative;
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: #3182ce;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.assistant {
          align-self: flex-start;
          background: #fff;
          color: #222;
          border-bottom-left-radius: 4px;
        }
        .chat-text {
          margin-bottom: 8px;
        }
        .chat-plot {
          margin-top: 8px;
          background: #f5f7fa;
          border-radius: 8px;
          overflow: hidden;
        }
        .chat-form {
          display: flex;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }
        .chat-input {
          flex: 1;
          padding: 10px 14px;
          font-size: 1rem;
          border: 1.5px solid #b0b8c1;
          border-radius: 8px;
          outline: none;
          background: #fff;
          color: #222;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .chat-input::placeholder {
          color: #888;
          opacity: 1;
        }
        .chat-input:focus {
          border-color: #3182ce;
          box-shadow: 0 0 0 2px #c3dafc;
        }
        .chat-input:disabled {
          background: #f1f5f9;
          color: #a0aec0;
          border-color: #e2e8f0;
        }
        .chat-send {
          padding: 0 20px;
          font-size: 1rem;
          background: #3182ce;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .chat-send:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}