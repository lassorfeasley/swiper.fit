import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState([]);
  const { user, session } = useAuth();

  async function handleSend(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage("");
    setResponses((prev) => [...prev, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: text }],
          userId: user?.id || null,
          accessToken: session?.access_token || null
        })
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const assistantText = data?.content || data?.message || data?.choices?.[0]?.message?.content || "(no response)";
      setResponses((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (err) {
      setResponses((prev) => [...prev, { role: "assistant", content: "There was an error contacting the chatbot." }]);
    }
  }

  return (
    <AppLayout title="Chatbot">
      <div className="max-w-xl mx-auto w-full px-4" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <Card>
          <CardHeader>
            <CardTitle>Ask Swiper</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="h-96 overflow-y-auto rounded-md border bg-neutral-50 p-4">
                {responses.length === 0 && (
                  <div className="text-neutral-500 text-sm">Ask Swiper anything about your workouts.</div>
                )}
                {responses.map((r, idx) => (
                  <div key={idx} className={r.role === "user" ? "text-right" : "text-left"}>
                    <div className={"inline-block rounded px-3 py-2 my-1 " + (r.role === "user" ? "bg-primary text-primary-foreground" : "bg-white border")}>{r.content}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit">Send</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


