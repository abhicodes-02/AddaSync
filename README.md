# MeetFlow

MeetFlow is a modern, decentralized video conferencing web application built with React, Vite, and Firebase. It leverages WebRTC for peer-to-peer mesh networking, offering a highly responsive, low-latency communication experience without the need for a central media server.

## Features

- **Mesh WebRTC Architecture**: Direct peer-to-peer audio and video connections for up to 5-6 participants per room.
- **Host & Waiting Room**: The first person to join a room automatically becomes the Host. Subsequent guests enter a "Knocking" state and must be admitted by the Host before connecting to the mesh.
- **Discord-Style Presentation Layout**: When a user shares their screen, the UI dynamically transforms. The presentation takes the cinematic main stage, while all participant cameras (including the local user) are moved into a neat, scrollable horizontal row at the bottom.
- **System Audio Mixing**: Utilizes the Web Audio API to seamlessly mix your microphone with system/movie audio when sharing a screen/tab, allowing peers to hear both simultaneously.
- **Document Picture-in-Picture**: Supports the modern Document PiP API, allowing you to pop out the entire video grid into a free-form, resizable window that floats above other applications.
- **Real-time Chat**: Integrated side panel powered by Firestore for text communication.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend / Signaling**: Firebase Firestore (NoSQL realtime database)
- **Media Protocols**: WebRTC, Web Audio API, Document Picture-in-Picture API

## Local Development Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Firebase project:
   - Create a Firestore Database.
   - Enable Firebase Hosting (optional).
   - Copy your Firebase config into `.env` (using `VITE_FIREBASE_*` variables).
4. Start the development server:
   ```bash
   npm run dev
   ```

## Documentation

For a deep dive into the underlying architecture and UI/UX decisions, see the following documentation:
- [Workflow & Architecture](./docs/WORKFLOW.md) - Explains the WebRTC signaling, waiting room lifecycle, and mesh networking logic.
- [Design & UI Flow](./docs/DESIGN.md) - Details the component tree, responsive layout strategies, and state management hooks.
