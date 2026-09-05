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

## 4. Floating 'Snapchat-style' Ephemeral Chat 💬
- **Concept:** Chat messages appear as floating speech bubbles directly over the sender's video tile and fade away after 5-7 seconds.
- **Tech:** CSS animations overlaid on the `RemoteVideo` component, triggered via chat messages.
- **Why it's unique:** Eliminates the need to keep the side chat panel open, maintaining the casual "Adda" flow without cluttering the screen.

## 5. Interactive Soundboard (Adda Vibe) 🎵
- **Concept:** A built-in panel with sound effects (Applause, Laugh Track, Crickets). Pressing a button plays the sound for everyone in the meeting.
- **Tech:** Local AudioContext triggering sounds and WebRTC Data Channels broadcasting the trigger event to other peers.
- **Why it's unique:** Heavily used by streamers but absent in standard meeting apps. Perfect for casual hangouts.

## 6. Picture-in-Picture (PiP) Screen Sharing (Face + Screen overlay) 🖼️
- **Concept:** Instead of replacing the video feed with the screen share, the user's camera feed becomes a small circular overlay on top of their screen share (like a Twitch streamer).
- **Tech:** Drawing the screen share and camera tracks onto a single `<canvas>` and capturing the stream via `canvas.captureStream()`.
- **Why it's unique:** Keeps the presenter visible in context with their presentation, avoiding the "disembodied voice" effect of Google Meet.

