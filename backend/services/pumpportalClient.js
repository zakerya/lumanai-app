// frontend/services/pumpportalClient.js

import WebSocket from "ws";

let ws;
let subscribers = [];

function connect() {
  ws = new WebSocket("wss://pumpportal.fun/api/data");

  ws.on("open", () => {
    console.log("[PumpPortal] Connected");

    // Default subscriptions
    ws.send(JSON.stringify({ method: "subscribeNewToken" }));
    ws.send(JSON.stringify({ method: "subscribeMigration" }));
  });

  ws.on("message", (data) => {
    const event = JSON.parse(data);
    subscribers.forEach((cb) => cb(event));
  });

  ws.on("close", () => {
    console.log("[PumpPortal] Disconnected. Reconnecting...");
    setTimeout(connect, 2000);
  });

  ws.on("error", (err) => {
    console.error("[PumpPortal] Error:", err);
  });
}

export function startPumpPortal() {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    connect();
  }
}

export function subscribeToPumpEvents(callback) {
  subscribers.push(callback);
}

export function subscribeTokenTrade(tokenAddresses = []) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ method: "subscribeTokenTrade", keys: tokenAddresses }));
  }
}

export function subscribeAccountTrade(accountAddresses = []) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ method: "subscribeAccountTrade", keys: accountAddresses }));
  }
}
