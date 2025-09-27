// socket.js
import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡️ User connected:", socket.id);

    // Map userId <-> socket
    socket.on("register", (userId) => {
      socket.join(userId);
      console.log(`🔗 User ${userId} registered to socket`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}

export { io };
