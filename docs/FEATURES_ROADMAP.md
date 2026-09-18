# AddaSync - Future Vision & Features Roadmap

## 🌟 The Vision: The Ultimate Startup MS Teams Replacement
**Goal:** In 1 year, AddaSync will pivot from a standalone video app into a complete, lightning-fast, and highly affordable workspace platform tailored for Startups. 

The current Video Conferencing feature will become a robust built-in tool within a much larger ecosystem.

### Phase 1: Authentication & Identity

## ✅ Recently Completed (Platform Foundations)

1. **Feature-Based Modular Architecture**
   - The entire codebase was refactored from a flat structure into a domain-driven, feature-based architecture (`src/features/home`, `src/features/room`, `src/shared`). 
   - This ensures the project is scalable for adding Dashboards, Auth, and Group Chats without massive technical debt.

2. **Military-Grade E2EE File Sharing (Cloudinary + WebCrypto API)**
   - Complete End-to-End Encryption implementation for file sharing.
   - Files are locally encrypted via AES-256-GCM before ever leaving the browser.
   - Ciphertexts are uploaded seamlessly to Cloudinary (bypassing restriction mechanisms using .txt spoofing).
   - Only room participants receive the decryption key (transferred via Firestore), rendering files 100% inaccessible to Cloudinary, AWS, or any third party.
   - Files are automatically crypto-shredded when the chat is deleted (destroying the decryption key).

3. **Smart Cleanup Mechanism**
   - Complete teardown of WebRTC connections, Firestore chat messages, signaling data, and persistent files when the last person leaves the room.

### Phase 1: Authentication & Identity
1. **Login & Signup System**
   - Implement Firebase/Supabase Auth.
   - Support for Google OAuth and Email/Password.
   - **Seamless Entry:** If a user logs in via Google or Email, they will *never* be asked for their name again. Their Google account name and avatar will automatically be pulled and used across all chats and video calls.

### Phase 2: The Core Workspace & Dashboard
2. **Beautiful, Centralized Dashboard**
   - A highly polished, intuitive dashboard serving as the home screen.
   - Everything necessary in one place: Scheduled meetings, recent chats, files, and quick-launch video buttons.
   - The current Video Conference app will become a feature accessible directly from this dashboard.

3. **End-to-End Encrypted Group Chats**
   - **Persistent Chat:** Move beyond ephemeral meeting chat. Create dedicated chat channels for teams and projects.
   - **Total Encryption:** All text, files, and data shared in group chats will be entirely End-to-End Encrypted (E2EE) ensuring total privacy for startups.
   - **Rich Media & Data Sharing:** Support for dropping files, code snippets, and data directly into the group chat.

4. **Mail-Based Invites & Team Building**
   - Easily invite team members to Group Chats or Meetings by sending email invites directly from the app.
   - Clicking an invite link will auto-authenticate the user (if logged in) and place them securely in the group without friction.

---

## 🎨 Unique Meeting Features (The "Adda" Edge)
*These features will be integrated into the Video Calling module to ensure it remains superior and more interactive than standard corporate apps.*

### 1. "Whisper" Mode (Private Talk without Breakout Rooms) 🤫
- **Concept:** Press and hold a participant's video tile to speak *only* to them. 
- **Tech:** Can be implemented using WebRTC Data Channels.

### 2. "True Sync" Watch Party (YouTube/Spotify Sync) 🍿
- **Concept:** Paste a YouTube link in the chat to open a floating video player that synchronizes perfectly for everyone in the room.


<!-- ### 5. Picture-in-Picture (PiP) Screen Sharing (Face + Screen overlay) 🖼️
- **Concept:** Instead of replacing the video feed with the screen share, the user's camera feed becomes a small circular overlay on top of their screen share (like a Twitch streamer).

### 6. Host-Specific Special Activities (Director Mode) 👑
- **Concept:** Special "God-mode" controls only available to the room creator:
  - **Spotlight / Stage Director:** Force focus on specific users.
  - **Change Room Vibe:** Instantly change CSS themes and ambient music for everyone.
  - **Focus Mode:** Hard mute with a dramatic animation.
  - **Forced Leave:** Admin power to kick unruly participants. -->


<!-- 1. Audio Visualizer & Active Speaker Highlight 🎙️

Jokhon keu kotha bolbe, tar video ba namer charpase ekta animated glow ba audio wave (waveform) toiri hobe jeta tar kothar volume er sathe sathe choto-boro hobe.
Je kotha bolche tar border ta automatic glow korbe jate sohoje bojha jay ke kotha bolche. -->
<!-- 2. Premium Micro-Interactions & Sound Effects 🎵

App ta ke "Jibonto" (alive) feel koranor jonnyo chotto chotto sound effect dewa jete pare. Jemon: Keu meeting e join korle ekta smooth "ding", mute/unmute korle chotto "click", ba notun message asle "pop" sound. -->
Button e click korle haptic feedback ba ripple effect dewa jete pare.
3. Fluid Animations (Framer Motion diye) 🌪️

Ekhon CSS diye animation kora ache, kintu framer-motion package ta use korle Apple-er app gulor moto Spring Physics animation add kora jay. Jemon, chat box open hole ba participant list open hole ekdom makhon-er (butter) moto smooth transition hobe.
4. Draggable Floating UI 🪟

Control dock ba chat panel take fixed na rekhe, user chaile drag kore screen er jekono jaygay soriye rakhte parbe (PiP mode er moto).
<!-- 5. Network Quality Indicator 📶

Prottek user er namer pashe ekta chotto signal bar thakbe (Green/Yellow/Red). Jar internet slow, tar pashe automatic lal signal dekhabe, jate user ra bujhte pare kar net problem korche.
6. Typing Indicators 💬

Chat e keu kichu likhle onnyora realtime e dekhte pabe "Alex is typing..." ekta chotto animated text hisebe. -->