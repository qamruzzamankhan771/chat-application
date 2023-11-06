const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const {
  newUser,
  getRoomUsers,
  exitRoom,
  getActiveUser,
  formatMessage,
} = require("./helpers/helper");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Airtribe Chat Application";

// Run when client connects
io.on("connection", (socket) => {
  console.log(io.of("/").adapter);
  socket.on("joinRoom", ({ username, room }) => {
    const user = newUser(socket.id, username, room);

    socket.join(user.room);
    console.log("User room -", user.room);
    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to Airtribe Chat App!"));
    
    // Broadcast when a user connects
    socket.broadcast
    .to(user.room)
    .emit(
      "message",
      formatMessage(botName, `${user.username} has joined the chat`)
      );
      console.log("getRoomUsers(user.room) -", getRoomUsers(user.room));

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getActiveUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
