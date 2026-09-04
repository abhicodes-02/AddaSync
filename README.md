# MeetFlow 🎥

A modern peer-to-peer video conferencing app built with **React 19**, **WebRTC**, and **Firebase Firestore** for signaling.

## Features

- 📹 **HD Video & Audio** — Real-time peer-to-peer connection via WebRTC
- 🎤 **Mic & Camera Controls** — Toggle with buttons or keyboard shortcuts (`M` / `V`)
- 🖥️ **Screen Sharing** — Share your screen with one click
- 💬 **Real-time Chat** — In-call messaging with sender names and timestamps
- 🖼️ **Picture-in-Picture** — Auto-PiP when switching tabs
- 📋 **Room ID Sharing** — Copy room ID to clipboard with toast confirmation
- 📱 **Responsive Design** — Full mobile support with floating local video overlay
- ⚡ **Fast Builds** — Powered by Vite with instant HMR

## Tech Stack

| Layer | Technology |
| --- | --- |
| Build Tool | [Vite](https://vitejs.dev/) |
| UI Framework | [React 19](https://react.dev/) |
| Routing | [React Router v7](https://reactrouter.com/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Real-time Video | [WebRTC](https://webrtc.org/) |
| Signaling | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Icons | [React Icons (Feather)](https://react-icons.github.io/react-icons/) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd meetflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── room/
│   │   ├── RoomHeader.jsx      # Header with room info & connection state
│   │   ├── VideoGrid.jsx       # Main + local video layout
│   │   ├── ChatPanel.jsx       # Slide-in chat with messages
│   │   └── ControlDock.jsx     # Floating control bar with tooltips
│   ├── ui/
│   │   ├── Toast.jsx           # Toast notification system
│   │   └── LoadingScreen.jsx   # Loading state with animation
│   ├── JoinRoom.jsx            # Landing page (create/join room)
│   └── VideoRoom.jsx           # Main room (composes hooks + components)
├── hooks/
│   ├── useWebRTC.js            # WebRTC peer connection & signaling
│   ├── useMediaControls.js     # Mic, camera, screen share
│   ├── useChat.js              # Real-time chat via Firestore
│   └── usePictureInPicture.js  # PiP mode management
├── firebase/
│   └── firebase.js             # Firebase init (reads from .env)
├── App.jsx                     # Router with lazy loading
├── main.jsx                    # Entry point
└── index.css                   # Tailwind + custom styles
```

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `M` | Toggle microphone |
| `V` | Toggle camera |
| `Esc` | Leave the call |

## License

MIT
