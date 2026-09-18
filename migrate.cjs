const fs = require('fs');
const path = require('path');

const fileMap = {
  'src/components/JoinRoom.jsx': 'src/features/home/Home.jsx',
  'src/components/VideoRoom.jsx': 'src/features/room/Room.jsx',
  'src/components/room/ControlDock.jsx': 'src/features/room/components/ControlDock.jsx',
  'src/components/room/ErrorScreen.jsx': 'src/features/room/components/ErrorScreen.jsx',
  'src/components/room/JoinPrompt.jsx': 'src/features/room/components/JoinPrompt.jsx',
  'src/components/room/KnockingScreen.jsx': 'src/features/room/components/KnockingScreen.jsx',
  'src/components/room/RoomHeader.jsx': 'src/features/room/components/RoomHeader.jsx',
  'src/components/room/SidePanel.jsx': 'src/features/room/components/SidePanel.jsx',
  'src/components/room/VideoGrid.jsx': 'src/features/room/components/VideoGrid.jsx',
  'src/hooks/useChat.js': 'src/features/room/hooks/useChat.js',
  'src/hooks/useMediaControls.js': 'src/features/room/hooks/useMediaControls.js',
  'src/hooks/usePictureInPicture.jsx': 'src/features/room/hooks/usePictureInPicture.jsx',
  'src/hooks/useReactions.js': 'src/features/room/hooks/useReactions.js',
  'src/hooks/useWebRTC.js': 'src/features/room/hooks/useWebRTC.js',
  'src/utils/audioProcessor.js': 'src/features/room/utils/audioProcessor.js',
  'src/utils/streamCompositor.js': 'src/features/room/utils/streamCompositor.js',
  'src/components/ui/LoadingScreen.jsx': 'src/shared/components/LoadingScreen.jsx',
  'src/components/ui/Toast.jsx': 'src/shared/components/Toast.jsx',
  'src/hooks/useAudioVolume.js': 'src/shared/hooks/useAudioVolume.js',
  'src/hooks/useSoundEffects.js': 'src/shared/hooks/useSoundEffects.js',
  'src/firebase/firebase.js': 'src/shared/lib/firebase.js'
};

// 1. Create directories
const dirs = new Set();
for (const dest of Object.values(fileMap)) {
  dirs.add(path.dirname(dest));
}
for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

// 2. Move files
for (const [src, dest] of Object.entries(fileMap)) {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
}

const filesToProcess = Object.values(fileMap).concat(['src/App.jsx', 'src/main.jsx']);

function getRelativePath(fromPath, toPath) {
  const fromDir = path.dirname('/' + fromPath);
  const toAbs = '/' + toPath;
  let rel = path.relative(fromDir, toAbs);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\\/g, '/');
}

// Map of OLD abs-like paths from src to NEW dest paths
const resolveMap = {
  'components/JoinRoom': 'src/features/home/Home.jsx',
  'components/VideoRoom': 'src/features/room/Room.jsx',
  'components/room/ControlDock': 'src/features/room/components/ControlDock.jsx',
  'components/room/ErrorScreen': 'src/features/room/components/ErrorScreen.jsx',
  'components/room/JoinPrompt': 'src/features/room/components/JoinPrompt.jsx',
  'components/room/KnockingScreen': 'src/features/room/components/KnockingScreen.jsx',
  'components/room/RoomHeader': 'src/features/room/components/RoomHeader.jsx',
  'components/room/SidePanel': 'src/features/room/components/SidePanel.jsx',
  'components/room/VideoGrid': 'src/features/room/components/VideoGrid.jsx',
  'hooks/useChat': 'src/features/room/hooks/useChat.js',
  'hooks/useMediaControls': 'src/features/room/hooks/useMediaControls.js',
  'hooks/usePictureInPicture': 'src/features/room/hooks/usePictureInPicture.jsx',
  'hooks/useReactions': 'src/features/room/hooks/useReactions.js',
  'hooks/useWebRTC': 'src/features/room/hooks/useWebRTC.js',
  'utils/audioProcessor': 'src/features/room/utils/audioProcessor.js',
  'utils/streamCompositor': 'src/features/room/utils/streamCompositor.js',
  'components/ui/LoadingScreen': 'src/shared/components/LoadingScreen.jsx',
  'components/ui/Toast': 'src/shared/components/Toast.jsx',
  'hooks/useAudioVolume': 'src/shared/hooks/useAudioVolume.js',
  'hooks/useSoundEffects': 'src/shared/hooks/useSoundEffects.js',
  'firebase/firebase': 'src/shared/lib/firebase.js'
};

// We also need a way to map the old file's location to resolve relative paths
// Wait, the files have ALREADY been moved. So we only know their new location.
// We must deduce what they WERE importing.
// It's easier to just use regex for the exact import strings they had.

const exactReplacements = {
  // App.jsx
  './components/JoinRoom': './features/home/Home',
  './components/VideoRoom': './features/room/Room',
  './components/ui/Toast': './shared/components/Toast',
  
  // Home.jsx (was JoinRoom)
  '../hooks/useSoundEffects': '../../shared/hooks/useSoundEffects',

  // Room.jsx (was VideoRoom)
  '../hooks/useWebRTC': './hooks/useWebRTC',
  '../hooks/useMediaControls': './hooks/useMediaControls',
  '../hooks/useChat': './hooks/useChat',
  '../hooks/usePictureInPicture': './hooks/usePictureInPicture',
  '../hooks/useReactions': './hooks/useReactions',
  '../hooks/useSoundEffects': '../../shared/hooks/useSoundEffects',
  './room/RoomHeader': './components/RoomHeader',
  './room/VideoGrid': './components/VideoGrid',
  './room/SidePanel': './components/SidePanel',
  './room/ControlDock': './components/ControlDock',
  './ui/LoadingScreen': '../../shared/components/LoadingScreen',
  './room/JoinPrompt': './components/JoinPrompt',
  './room/ErrorScreen': './components/ErrorScreen',
  './room/KnockingScreen': './components/KnockingScreen',

  // RoomHeader
  '../ui/Toast': '../../../shared/components/Toast',

  // SidePanel
  '../ui/Toast': '../../../shared/components/Toast',

  // VideoGrid
  '../../hooks/useAudioVolume': '../../../shared/hooks/useAudioVolume',

  // hooks
  '../firebase/firebase': '../../shared/lib/firebase',
  '../../firebase/firebase': '../../../shared/lib/firebase', // if it was deep
  '../utils/audioProcessor': '../utils/audioProcessor' // same relative dir in features/room
};

for (const file of filesToProcess) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace imports using the exact map
  content = content.replace(/(import\s+.*?\s+from\s+['"])(.*?)(['"])/g, (match, p1, p2, p3) => {
    if (exactReplacements[p2]) {
      return p1 + exactReplacements[p2] + p3;
    }
    // Handle things that were moved but maybe not exactly mapped
    if (p2 === '../firebase/firebase' && file.includes('src/features/room/hooks')) {
       return p1 + '../../../shared/lib/firebase' + p3;
    }
    if (p2 === '../firebase/firebase' && file.includes('src/shared/hooks')) {
       return p1 + '../lib/firebase' + p3;
    }
    return match;
  });

  fs.writeFileSync(file, content);
}
console.log('Migration script completed.');
