# AddaSync - Future Vision & Features Roadmap

## 🌟 The Vision: The Ultimate Startup MS Teams Replacement
**Goal:** In 1 year, AddaSync will pivot from a standalone video app into a complete, lightning-fast, and highly affordable workspace platform tailored for Startups. 

The current Video Conferencing feature will become a robust built-in tool within a much larger ecosystem.

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

### 2. Laser Pointer on Screen Share (Collaborative Pointing) 🔴
- **Concept:** When someone shares a screen, other participants can click and drag their mouse to show a "Red Laser Dot" with their name on the shared screen.

### 3. "True Sync" Watch Party (YouTube/Spotify Sync) 🍿
- **Concept:** Paste a YouTube link in the chat to open a floating video player that synchronizes perfectly for everyone in the room.


### 5. Picture-in-Picture (PiP) Screen Sharing (Face + Screen overlay) 🖼️
- **Concept:** Instead of replacing the video feed with the screen share, the user's camera feed becomes a small circular overlay on top of their screen share (like a Twitch streamer).

### 6. Host-Specific Special Activities (Director Mode) 👑
- **Concept:** Special "God-mode" controls only available to the room creator:
  - **Spotlight / Stage Director:** Force focus on specific users.
  - **Change Room Vibe:** Instantly change CSS themes and ambient music for everyone.
  - **Focus Mode:** Hard mute with a dramatic animation.
  - **Forced Leave:** Admin power to kick unruly participants.
