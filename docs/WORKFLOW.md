# AddaSync: Workflow & Architecture

This document outlines the core workflows, data flow, and networking architecture of the AddaSync application.

## 1. Application Entry & Identity
When a user visits AddaSync, they land on `JoinRoom.jsx`. 
- **Identity Persistence**: The app attempts to fetch a persistent `uid` from `localStorage` using the pattern `addasync_uid_{roomId}`. If one doesn't exist, a new UUID is generated. This allows users to refresh the page without losing their identity or host privileges.
- **Room Entry**: The user enters their Name and the Room ID, which routes them to `/room/:id`.

## 2. Host Election & Waiting Room Lifecycle
AddaSync uses Firestore to manage room state in a serverless manner.

1. **Host Election**: 
   When a user mounts `useWebRTC.js`, they check the `calls/{roomId}` document. 
   - If it doesn't exist, or `hostUid` is empty, the user claims the `hostUid` field and becomes the Host.
   - If a `hostUid` already exists, the user is a Guest.
2. **Knocking**: 
   Guests write their details to `calls/{roomId}/knockers/{uid}` and listen for their status to change.
3. **Admitting**: 
   The Host receives real-time Firestore updates about new knockers. When the Host clicks "Admit", the guest's UID is moved to `calls/{roomId}/allowedUsers/{uid}`.
4. **Entry**: 
   The Guest's listener detects they are in `allowedUsers` and invokes `startWebRTC()` to begin peering.

## 3. Mesh WebRTC Signaling
Unlike traditional client-server video apps (which use an SFU/SFU), AddaSync uses a **Full Mesh Architecture**. Every participant establishes a direct P2P connection with every other participant.

- **Signaling Server**: Firestore acts as the signaling server.
- **Topology**: Under `calls/{roomId}/participants/`, each user maintains their own document.
- **Connection Handshake**:
  1. User A joins and listens to the `participants` collection.
  2. User B joins. User A detects the new addition.
  3. User A creates an `RTCPeerConnection`, generates an Offer, and writes it to `calls/{roomId}/participants/{User B}/offers`.
  4. User B detects the offer, sets the remote description, creates an Answer, and writes it to `calls/{roomId}/participants/{User A}/answers`.
  5. ICE Candidates are similarly exchanged through `candidates` subcollections.

## 4. Media Streaming & Audio Mixing Workflow
- **Standard Video**: `getUserMedia` fetches the webcam (constrained to 640x480 @ 24fps to prevent CPU overload in a mesh network).
- **Screen Sharing**:
  When a user shares their screen (`useMediaControls.js`):
  1. `getDisplayMedia` is called requesting `video` (1080p @ 30fps) and `audio: true`.
  2. If the user opts to share system audio, the Web Audio API (`AudioContext`) is used to mix the `screenAudioTrack` and the `microphoneTrack` into a single `MediaStreamDestination`.
  3. The local camera and mic tracks on all active `RTCPeerConnection` senders are replaced with the screen video and mixed audio tracks dynamically, avoiding a full WebRTC renegotiation.
  4. A signaling flag (`isSharingScreen: true`) is written to Firestore so remote peers know to update their UI layouts.
- **Local Media File Sharing**:
  To bypass strict OS/browser audio capture limitations (like sharing a VLC window without sound on Windows), AddaSync supports native file injection.
  1. The user selects a local `.mp4` or `.webm` file.
  2. The app generates a temporary `Blob URL` and mounts it to a hidden or main stage `<video>` element.
  3. The `onPlay` event triggers `e.target.captureStream(30)`, creating a high-quality 30fps media stream.
  4. The audio tracks are mixed with the microphone using `AudioContext`, and the video track seamlessly replaces the webcam track on the WebRTC peer connections.

## 5. Lifecycle and Hardware Cleanup
Properly releasing camera and microphone hardware is critical. AddaSync utilizes strict unmount paradigms:
1. **Explicit Leave**: When the user clicks the "Leave" button, `localStream.getTracks().forEach(t => t.stop())` is explicitly called. The router replaces the current history stack (`navigate("/", { replace: true })`) to prevent back-button auto-rejoin loops.
## 6. E2EE File Transfer Workflow (Cloudinary + WebCrypto API)
To ensure maximum privacy for startup users, file sharing does not rely on traditional server storage or Firebase Storage.

1. **Client-Side Encryption**:
   - The user selects a file (`useChat.js`).
   - `crypto.js` generates a random AES-256-GCM key and IV.
   - The file is encrypted directly in the browser's memory using `window.crypto.subtle.encrypt()`.
2. **Cloudinary Hosting**:
   - The encrypted ciphertext (which looks like random noise) is uploaded to a free Cloudinary bucket using an unsigned preset.
   - To bypass Cloudinary's default security block on raw/pdf files, the file is temporarily spoofed with a `.txt` extension during upload.
3. **Key Distribution**:
   - The AES decryption key and IV are embedded into the Firestore chat message document.
   - Only participants actively in the room who can read the chat collection receive the keys.
4. **Decryption on Demand**:
   - When a peer clicks the file attachment (`FileAttachment.jsx`), the encrypted `.txt` blob is fetched from Cloudinary.
   - The browser decrypts it locally using the Firestore key.
   - A `Blob URL` is generated with the original MIME type and the file is downloaded to the user's disk securely.
5. **Crypto-Shredding**:
   - When the meeting ends, the Firestore chat collection is permanently deleted.
   - Without the AES key in Firestore, the remaining ciphertext blob on Cloudinary becomes mathematically impossible to read, achieving perfect data destruction.

