import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io"
import os from "os";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://free-roam-3d.onrender.com/',
    ],
    methods: ['GET', 'POST'],
  },
});


const rooms = new Map();

function getControllerBaseUrl() {
    if (process.env.FRONTEND_ORIGIN) {
        return process.env.FRONTEND_ORIGIN.replace(/\/$/, '');
    }

    const networkInterfaces = os.networkInterfaces();

    for (const addresses of Object.values(networkInterfaces)) {
        const address = addresses?.find((entry) =>
            entry.family === 'IPv4' && !entry.internal
        );

        if (address) {
            return `http://${address.address}:5173`;
        }
    }

    return 'http://localhost:5173';
}

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  } while (rooms.has(code));
  return code;
}


app.get('/', (req, res) => {
  res.send('FreeRoam3D server is running');
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create-room', () => {
        const roomId = generateRoomCode();

        rooms.set(roomId, {
            game: socket.id,
            controller: null,
        });

        socket.join(roomId);
        socket.roomId = roomId;
        socket.role = 'game';

        console.log(
            `Game created room: ${roomId}`
        );

        socket.emit('room-created', {
            roomId,
            controllerUrl: `${getControllerBaseUrl()}/controller.html?room=${roomId}`,
        });
    })

    socket.on('join-room', (data) => {
        const roomId = data?.roomId;

        if (!roomId) {
            socket.emit('room-error', {
                message: 'Room ID is required',
            });
            return;
        }

        const room = rooms.get(roomId);
        // Room doesn't exist
        if (!room) {
            socket.emit('room-error', {
                message: 'Room not found',
            });

            return;
        }

        // Controller already connected
        if (room.controller) {
            socket.emit('room-error', {
                message: 'Controller already connected',
            });
            return;
        }

        // Add controller
        room.controller = socket.id;
        socket.join(roomId);
        socket.roomId = roomId;
        socket.role = 'controller';

        console.log(
            `Controller joined room: ${roomId}`
        );
        // Tell controller
        socket.emit('room-joined', {
            roomId,
        });

        // Tell game
        io.to(room.game).emit('controller-connected', {
                controllerId: socket.id,
        });

    });

    socket.on('controller-input', (data) => {
        // Only controllers are allowed
        // to send controller input
        if (socket.role !== 'controller') {
            return;
        }
        const roomId = socket.roomId;

        if (!roomId) {
            return;
        }

        const room = rooms.get(roomId);

        if (!room || !room.game) {
            return;
        }


        console.log(
            `Controller input [${roomId}]:`,
            data
        );


        // Send input only to the game
        io.to(room.game).emit(
            'controller-input',
            data
        );

        });

    socket.on('disconnect', () => {
        console.log(
        `Client disconnected: ${socket.id}`
        );
        const roomId = socket.roomId;

        if (!roomId) {
            return;
        }
        const room = rooms.get(roomId);

        if (!room) {
            return;
        }
        // Game disconnected
        if (room.game === socket.id) {
            if (room.controller) {
                io.to(room.controller).emit('game-disconnected');
            }
            rooms.delete(roomId);
            console.log(`Room deleted: ${roomId}`);
            }else if (room.controller === socket.id) {
                room.controller = null;
                io.to(room.game).emit('controller-disconnected');
                console.log(`Controller left room: ${roomId}`);
            }
    });
});


const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FreeRoam3D server running on port ${PORT}`);
});
