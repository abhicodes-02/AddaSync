# MeetFlow: Design Flow & Architecture

This document outlines the UI component hierarchy, layout states, and state management hooks driving the MeetFlow interface.

## 1. Component Hierarchy
The UI is modularized into feature-specific components:

```text
App
 ├── JoinRoom (Landing Page & Onboarding)
 └── VideoRoom (Main Conference View)
      ├── RoomHeader (Room code, copy link, email invites)
      ├── SidePanel (Chat & Participant List tabbed interface)
      ├── ControlDock (Bottom media controls: Mic, Cam, Share, Hangup)
      └── VideoGrid (Dynamic video layout engine)
           └── RemoteVideo (Individual participant video tile)
```

## 2. Dynamic Layout Engine (`VideoGrid.jsx`)
The core of the visual experience is `VideoGrid`, which switches between two distinct layouts based on the room's context.

### Standard Grid Layout (Camera Only)
- Used when no one is presenting.
- Tailwind CSS Grid dynamically adapts columns based on participant count (`grid-cols-1`, `sm:grid-cols-2`, `sm:grid-cols-3`).
- Videos use `object-contain` to ensure faces/bodies are never cropped, regardless of mobile (9:16) or desktop (16:9) aspect ratios.
- The local user's video floats in the bottom-right corner as a mini-tile with a cinematic shadow.

### Presentation Layout (Discord-Style)
- Triggered when `isScreenSharing` is locally true, or when a remote user's Firestore flag `isSharingScreen` is true.
- **Main Stage**: The screen share is extracted from the grid and placed centrally, maximizing real estate against a pure black background.
- **Overlays**: "LIVE" and "[Name]'s Screen" badges are overlayed using absolute positioning.
- **Thumbnail Row**: The floating local video vanishes, and *all* participants (local + remote) are placed in a horizontal, scrollable flex-row at the bottom center of the screen, just above the control dock.

## 3. State Management Hooks
State is decoupled from the UI using custom React hooks located in `src/hooks/`:

- **`useWebRTC(roomId, localName)`**: The heavyweight hook. Manages WebRTC initialization, Firestore listeners, ICE trickling, waiting room state (`connectionState`), and host approval flows. Returns a map of `remoteStreams`.
- **`useMediaControls(localStreamRef, peersRef, setLocalStream)`**: Handles user media toggles (mute/unmute, camera on/off). Specifically handles the complex `shareScreen` logic, track replacement for active peers, and Web Audio API mixing.
- **`usePictureInPicture(localVideoRef, remoteStreams, localStream)`**: Manages popping the conference out into a floating window. Prioritizes the modern `document.pictureInPictureEnabled` API (Chrome 116+) allowing free-form window resizing, falling back to Canvas PiP on older browsers.
- **`useChat(roomId, userName)`**: Connects to the Firestore `chat` subcollection, syncing messages ordered by timestamp.

## 4. Responsive Design Philosophy
- **Mobile-First Tailwind**: Breakpoints (e.g., `sm:`, `md:`) are used extensively.
- **Spacing**: The bottom row of thumbnails (`pb-24 sm:pb-28`) is carefully padded to ensure it sits elegantly above the absolutely positioned `ControlDock` without overlapping.
- **Scrollability**: The presentation layout's thumbnail row uses `overflow-x-auto`, ensuring mobile users can swipe horizontally through participants without cluttering vertical screen space.
- **Custom Scrollbars**: Native browser scrollbars are hidden and replaced with minimalist, dark-glassmorphic WebKit scrollbars.

## 5. React Render Performance & UX
- **Memoization Framework**: In real-time apps, chat messages or unrelated state changes can cause the entire video grid to re-render, leading to micro-stutters. MeetFlow wraps heavy UI components (`VideoGrid`, `SidePanel`, `RoomHeader`, `ControlDock`) in `React.memo()`. This creates rendering boundaries, ensuring the video streams are never interrupted by a chat update.
- **UX Caching**: Users' display names are saved to the browser's `localStorage`. Returning to the app immediately pre-fills the onboarding screen, streamlining entry into future meetings.

