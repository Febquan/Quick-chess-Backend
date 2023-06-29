const shortid = require("shortid");
function handleSocketEvents(io) {
  let availiableRoomIds = [];
  let PrivateRoom = [];

  io.on("connection", (socket) => {
    console.log("client connect");

    socket.on("GameOn", ({ name, elo }) => {
      console.log("GAMEONNNN");
      for (const roomId of availiableRoomIds) {
        if (io.sockets.adapter.rooms.get(roomId)?.size < 2) {
          //join guest
          socket.join(roomId);
          socket.nsp.to(roomId).emit("joined", roomId);
          io.to(socket.id).emit("host", false);
          socket
            ?.to(roomId)
            .emit("ServerSendMessage", `User ${name} elo ${elo} joined`);

          //get host name
          socket.to(roomId).emit("IntroduceYourself");
          return;
        }
      }
      // create Room
      const roomId = generateRoomId();
      socket.join(roomId);
      availiableRoomIds.push(roomId);
      socket.nsp.to(roomId).emit("joined", roomId);
      io.to(roomId).emit("host", true);
      console.log(io.sockets.adapter.rooms);
    });

    socket.on("JoinRoom", ({ name, elo, PrivateRoomId }) => {
      if (!PrivateRoom.includes(PrivateRoomId)) {
        socket?.emit("NoRoomFound");
        return;
      }
      socket.join(PrivateRoomId);
      socket.nsp.to(PrivateRoomId).emit("joined", PrivateRoomId);
      io.to(socket.id).emit("host", false);
      socket
        ?.to(PrivateRoomId)
        .emit("ServerSendMessage", `User ${name} elo ${elo} joined`);
      //get host name
      socket.to(PrivateRoomId).emit("IntroduceYourself");
    });

    socket.on("CreatePrivateRoom", () => {
      const roomId = generateRoomId();
      socket.join(roomId);
      PrivateRoom.push(roomId);
      socket.nsp.to(roomId).emit("joined", roomId);
      io.to(roomId).emit("host", true);
      console.log(io.sockets.adapter.rooms);
    });

    socket.on("HiIam", ({ name, elo, roomId }) => {
      socket.to(roomId).emit("HeIntroduce", { name, elo });
    });
    // Leave a room
    socket.on("LeaveRoom", (roomName) => {
      socket.leave(roomName);
      if (!io.sockets.adapter.rooms.has(roomName)) {
        availiableRoomIds = availiableRoomIds.filter((el) => el !== roomName);
        PrivateRoom = PrivateRoom.filter((el) => el !== roomName);
      }

      console.log("leavve", io.sockets.adapter.rooms);
      socket.nsp.to(roomName).emit("host", true);
      socket.to(roomName).emit("OpponentLeave");
      socket.to(roomName).emit("ServerSendMessage", "Server: Player leave !");
    });
    socket.on("IBeatYou", (roomId) => {
      socket.to(roomId).emit("YouLose");
    });
    socket.on("Surrender", (roomId) => {
      socket.to(roomId).emit("EnemySurrender", "Congratulation !");
    });
    socket.on("DeclineDraw", (roomId) => {
      socket.to(roomId).emit("DeclineCallDraw");
    });
    socket.on("AcceptDraw", (roomId) => {
      socket.to(roomId).emit("AcceptCallDraw");
    });
    socket.on("CallDraw", (roomId) => {
      socket.to(roomId).emit("OpponentCallDraw");
    });

    // Handle chess moves
    socket.on("MakeMove", (allLocation, roomId, name, currentId) => {
      socket.to(roomId).emit("OpponentMakeMove", allLocation, name, currentId);
    });
    //Hanlde ready
    socket.on("IamReady", (roomId) => {
      socket.to(roomId).emit("OpponentReady");
    });
    // Handle setting
    socket.on("ChangeSetting", (message) => {
      socket.to(message.roomId).emit("SettingChanged", message);
    });
    // Handle setting
    socket.on("MySettingChanged", () => {
      socket.emit("ConfirmSettingChanged");
    });
    socket.on("GameStart", (roomId) => {
      socket.to(roomId).emit("GameStart");
    });

    // Handle message
    socket.on("SendMessage", (message, roomId) => {
      // Broadcast the move to all clients in the room
      console.log("SENDMEEES", io.sockets.adapter.rooms);

      socket.to(roomId).emit("SendMessage", message);
    });
    socket.on("TimeOut", (roomId) => {
      socket.to(roomId).emit("OpponentCallTimeOut");
    });

    socket.on("disconnecting", () => {
      console.log("Client disconnected", io.sockets.adapter.rooms);
      io.sockets.adapter.rooms.forEach((room, roomName) => {
        if (room.has(socket.id)) {
          socket.to(roomName).emit("OpponentLeave");
          socket
            .to(roomName)
            .emit("ServerSendMessage", "Server: Player leave !");
          socket.nsp.to(roomName).emit("host", true);
        }
      });
    });

    // Function to generate a random room ID
    function generateRoomId() {
      return shortid.generate();
    }
  });
}
module.exports = handleSocketEvents;
