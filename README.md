# FreeRoam3D

FreeRoam3D is a browser-based first-person 3D playground controlled from a phone. Open the game on a computer, pair a phone using a QR code or six-digit room code, and use the phone as a wireless game controller over the same Wi-Fi network.

## Features

- Three.js 3D scene with trees, lighting, shadows, and first-person movement
- QR-code pairing and manual room-code pairing
- One controller per game room
- Mobile-only controller route and desktop-only game route
- PUBG-style mobile controls:
  - Left virtual joystick for movement
  - Open touch area for drag-to-look camera controls
- Controller disconnect handling with safe input reset and reconnection QR screen
- Local-network support for phones on the same Wi-Fi
- Desktop pointer-lock controls for local testing (`W`, `A`, `S`, `D` + mouse)

## Tech stack

| Area | Technology |
| --- | --- |
| 3D rendering | Three.js |
| Frontend tooling | Vite |
| Real-time communication | Socket.IO |
| Backend | Node.js, Express |
| Pairing QR generation | `qrcode` |

## Project structure

```text
freeRoam3d/
├── backend/
│   └── server.js             # Express + Socket.IO room server
├── frontend/
│   ├── index.html            # Desktop game and pairing screen
│   ├── controller.html       # Mobile controller
│   ├── src/main.js           # Three.js world and input handling
│   ├── src/style.css         # Game/pairing screen styles
│   └── vite.config.js        # LAN host and Socket.IO proxy configuration
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A computer and phone connected to the same Wi-Fi network

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start the backend

In one terminal:

```bash
cd backend
npm run server
```

The Socket.IO server runs on port `3001`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite listens on all network interfaces, so the project can be opened from devices on the same Wi-Fi network.

### 4. Pair the phone

1. Open the Vite game URL on the computer.
2. The game displays a QR code and a six-digit room code.
3. On the phone, either:
   - scan the QR code with the phone's Camera app, or
   - open the same frontend URL and enter the six-digit code.
4. Once connected, the computer starts the game and the phone becomes the controller.

> If Windows Firewall asks for permission, allow Node.js on **Private networks**. Otherwise, the phone may not be able to reach the computer.

## Controls

### Phone controller

| Control | Action |
| --- | --- |
| Left joystick | Move forward, backward, left, and right |
| Open screen area | Drag to look around |
| Landscape orientation | Recommended for the best experience |

### Desktop testing controls

| Control | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around after clicking the game window |

## Networking notes

- The backend automatically finds the computer's LAN IPv4 address and puts it in the generated controller QR link.
- Vite proxies `/socket.io` to the backend, so the phone connects to the correct server instead of its own `localhost`.
- To override the frontend address embedded in QR codes, set `FRONTEND_ORIGIN` before starting the backend:

```powershell
$env:FRONTEND_ORIGIN = "http://192.168.1.3:5173"
npm run server
```

## Fullscreen and orientation

The game requests fullscreen when a controller connects. Browsers may block automatic fullscreen because it was not triggered by a direct click; pressing `F11` on the computer always works.

The mobile controller also requests landscape/fullscreen. If orientation locking is not supported by the phone browser, it shows a message asking the player to rotate the device for the best experience.

## Production build

Build both the game and controller pages with:

```bash
cd frontend
npm run build
```

The generated files are placed in `frontend/dist/`.
