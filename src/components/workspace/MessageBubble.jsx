import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isThinking =
    !isUser && (!message.content || message.content.trim() === "") && message.tool_calls?.length === 0;

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
          <span className="text-indigo-600 text-[10px] font-bold">C</span>
        </div>
      )}
      <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
        {isThinking ? (
          <div className="rounded-2xl px-4 py-2.5 bg-white border border-black/[0.06]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0a0a0a]/30" />
          </div>
        ) : message.content ? (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-[#0a0a0a] text-white"
                : "bg-white border border-black/[0.06] text-[#0a0a0a]"
            )}
          >
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children }) => (
                    <code className="px-1 py-0.5 rounded bg-[#0a0a0a]/[0.04] text-xs font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}