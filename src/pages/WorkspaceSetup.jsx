import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/workspace/MessageBubble";

export default function WorkspaceSetup() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      const conv = await base44.agents.createConversation({
        agent_name: "workspace_assistant",
        metadata: { name: "Workspace Setup" },
      });
      setConversation(conv);
      setMessages(conv.messages || []);

      base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
              CANONICAL
            </span>
          </Link>
          <Link to="/Home">
            <Button variant="ghost" size="sm" className="gap-2 text-[#0a0a0a]/50 hover:text-[#0a0a0a]">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-28 pb-4 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-medium text-indigo-600 tracking-widest uppercase mb-2">
              Onboarding
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Workspace Setup
            </h1>
            <p className="text-sm text-[#0a0a0a]/40 mt-1">
              Your AI guide to configuring CANONICAL
            </p>
          </motion.div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !conversation && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-[#0a0a0a]/20" />
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#fafafa]/90 backdrop-blur-xl border-t border-black/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            className="flex-1 resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            placeholder="Ask anything about setting up your workspace…"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !conversation || sending}
            className="self-end bg-[#0a0a0a] hover:bg-[#0a0a0a]/80 text-white rounded-xl px-4 h-10"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}