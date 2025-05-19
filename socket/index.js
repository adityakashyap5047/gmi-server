import userModel from "../models/user.model.js";

const socketToUser = new Map();
const activeUsers = new Map();

export default function initSocket(io) {

    io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

        socket.on("location-update", async ({ userId, lat, lng }) => {
            if (!userId || !lat || !lng) return;
            
            activeUsers.set(userId, { lat, lng, socketId: socket.id });
            socketToUser.set(socket.id, userId);

            await broadcastUserLocations(io);
        });

        // Visibility toggle
        socket.on("visibility-toggle", async ({ userId, visible }) => {
            if (!visible) {
                activeUsers.delete(userId);
                console.log(`User ${userId} set location to hidden`);
                
                await broadcastUserLocations(io);
            }
        });

        socket.on("user-logout", async ({ userId }) => {
            if (!userId) return;

            console.log(`User logged out: ${userId}`);
        
            activeUsers.delete(userId);

            for (const [sockId, uid] of socketToUser.entries()) {
                if (uid === userId) {
                    socketToUser.delete(sockId);
                break;
                }
            }

            await broadcastUserLocations(io);
        });


        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);

            const userId = socketToUser.get(socket.id);
            if (userId) {
                activeUsers.delete(userId);
                socketToUser.delete(socket.id); 
                console.log(`Removed user ${userId} from activeUsers`);
            }

            // Broadcast updated user list
            await broadcastUserLocations(io);
        });
    });
}

// Helper to send all visible users
async function broadcastUserLocations(io) {
  const allUserData = await Promise.all(
    [...activeUsers.entries()].map(async ([id, loc]) => {
      const user = await userModel.findById(id).select("email");
      return {
        _id: id,
        email: user?.email || "Unknown",
        location: { lat: loc.lat, lng: loc.lng },
      };
    })
  );

  io.emit("location-data", allUserData);
}