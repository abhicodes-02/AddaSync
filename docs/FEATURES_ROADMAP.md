# AddaSync - Future Unique Features Roadmap

This document contains a list of highly unique, non-traditional features planned for AddaSync to make it stand out from typical corporate meeting apps (like Google Meet, Zoom, MS Teams).

## 1. "Whisper" Mode (Private Talk without Breakout Rooms) 🤫
- **Concept:** Press and hold a participant's video tile to speak *only* to them. 
- **Tech:** Can be implemented using WebRTC Data Channels to send audio directly to specific peers or by dynamically adjusting remote track volumes.
- **Why it's unique:** No need to leave the main room or create breakout rooms just to say something private to one person.

## 2. Laser Pointer on Screen Share (Collaborative Pointing) 🔴
- **Concept:** When someone shares a screen, other participants can click and drag their mouse to show a "Red Laser Dot" with their name on the shared screen.
- **Tech:** WebRTC Data Channels sending X/Y coordinates in real-time, rendered on a transparent `<canvas>` overlay.
- **Why it's unique:** Standard apps only let the host point at things. This makes screen sharing truly interactive.

## 3. "True Sync" Watch Party (YouTube/Spotify Sync) 🍿
- **Concept:** Paste a YouTube link in the chat to open a floating video player. If the host pauses, seeks, or changes volume, it synchronizes perfectly for everyone in the room.
- **Tech:** WebRTC Data Channels syncing video player states (`currentTime`, `paused`) across all clients.
- **Why it's unique:** Brings a "Netflix Party" or Discord Activity vibe directly into a browser-based meeting app.


## 5. Interactive Soundboard (Adda Vibe) 🎵
- **Concept:** A built-in panel with sound effects (Applause, Laugh Track, Crickets). Pressing a button plays the sound for everyone in the meeting.
- **Tech:** Local AudioContext triggering sounds and WebRTC Data Channels broadcasting the trigger event to other peers.
- **Why it's unique:** Heavily used by streamers but absent in standard meeting apps. Perfect for casual hangouts.

## 6. Picture-in-Picture (PiP) Screen Sharing (Face + Screen overlay) 🖼️
- **Concept:** Instead of replacing the video feed with the screen share, the user's camera feed becomes a small circular overlay on top of their screen share (like a Twitch streamer).
- **Tech:** Drawing the screen share and camera tracks onto a single `<canvas>` and capturing the stream via `canvas.captureStream()`.
- **Why it's unique:** Keeps the presenter visible in context with their presentation, avoiding the "disembodied voice" effect of Google Meet.

## 7. Host-Specific Special Activities (Director Mode) 👑
- **Concept:** Special "God-mode" controls only available to the room creator. Features include:
  - **"Spotlight / Stage Director":** Host can drag-and-drop participants into the main view, forcing everyone's screen to focus on that specific person (like a live TV director).
  - **"Change Room Vibe":** Host can instantly change the room's CSS theme (e.g., Neon Cyberpunk, Cozy Cafe, Horror Dark Mode) and background ambient music for *everyone* at once.
  - **"Focus Mode (Hard Mute)":** One button to silence everyone and force the layout to only show the host, complete with a dramatic "Shhh" animation.
- **Tech:** WebRTC Data Channels broadcasting `admin-command` events to all peers. Firebase Firestore can sync the "Room State" (like current theme or spotlighted user).
- **Why it's unique:** Turns the host into a DJ/Director of the room, making virtual hangouts much more dynamic and entertaining than standard meetings.
- **Forced Leave Participants:** Host can freely have the power to remove any participant from the room if necessary.

