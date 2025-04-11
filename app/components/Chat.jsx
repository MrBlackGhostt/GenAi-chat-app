"use client";
import { useState } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";

// interface Message {
//   id: number;
//   sender: "user" | "bot";
//   text: string;
//   timestamp: string; // Added for WhatsApp-like timestamps
// }

export const personas = {
  Hitesh: {
    name: "Hitesh Sir",
  },
  Piyush: {
    name: "Piyush Bhaiya",
  },
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState("Hitesh");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: input.trim(),
      timestamp,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: newMessage.text }] }],
          persona,
        }),
      });
      const data = await response.json();
      const botTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: data.error,
            timestamp: botTimestamp,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: data.candidates[0].content.parts[0].text,
            timestamp: botTimestamp,
          },
        ]);
      }
    } catch (error) {
      const botTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Oops, something went wrong! Try again.",
          timestamp: botTimestamp,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-teal-600 text-white p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-lg font-semibold">
              {personas[persona].name[0]}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">{personas[persona].name}</h1>
            <p className="text-xs opacity-80">Online</p>
          </div>
        </div>
        <select
          id="persona"
          value={persona}
          onChange={(e) => {
            console.log("SELECTED PERSONA", e.target.value);
            setPersona(e.target.value);
          }}
          className="bg-teal-700 text-white text-sm p-2 rounded-lg focus:outline-none">
          {Object.keys(personas).map((key) => (
            <option key={key} value={key}>
              {personas[key].name}
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pt-20 pb-16 px-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded0.png')] bg-repeat">
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[75%] p-3 rounded-lg shadow-sm text-sm whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-teal-100 text-gray-800 self-end rounded-br-none"
                  : "bg-white text-gray-800 self-start rounded-bl-none"
              }`}>
              <p>{msg.text}</p>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {msg.timestamp}
              </p>
            </div>
          ))}
          {loading && (
            <div className="max-w-[75%] p-3 rounded-lg bg-gray-200 text-gray-600 text-sm self-start rounded-bl-none shadow-sm animate-pulse">
              <p>Typing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 shadow-lg">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            className="flex-1 p-3 bg-white text-gray-800 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            className="bg-teal-600 text-white p-3 rounded-full shadow-md disabled:bg-teal-300"
            disabled={loading}>
            <PaperPlaneRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
