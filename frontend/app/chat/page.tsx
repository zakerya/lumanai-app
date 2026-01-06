// frontend/app/chat/page.tsx

'use client';

import ChatContainer from "./components/ChatContainer";
import SideBar from "./components/SideBar"; // ← your new full sidebar component
import StatusFooter from "./components/StatusFooter";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      
      {/* HEADER */}
      <header className="p-4 border-b border-white/10 bg-black/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black font-bold">
              L
            </div>
            <h1 className="text-xl font-semibold tracking-wide">Luminai</h1>
          </div>
          <div className="text-sm text-white/60">AI Crypto Assistant</div>
        </div>
      </header>

      {/* SIDEBAR */}
      <SideBar />

      {/* MAIN CHAT */}
      <ChatContainer />

      {/* FOOTER */}
      <StatusFooter />
    </div>
  );
}
