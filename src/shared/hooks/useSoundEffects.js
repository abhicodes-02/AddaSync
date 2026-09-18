import { useCallback, useRef, useEffect } from 'react';

export default function useSoundEffects() {
  const audioRefs = useRef({});

  useEffect(() => {
    // Premium UI Sounds via Mixkit (Free assets)
    const sounds = {
      pop: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'), // Message pop
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), // Button click
      join: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'), // Join chime
      leave: new Audio('https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3'), // Leave chime
    };
    
    Object.values(sounds).forEach(a => {
      a.volume = 0.4; // Soft volume for premium feel
      a.load();
    });
    
    audioRefs.current = sounds;
  }, []);

  const playSound = useCallback((type) => {
    try {
      const audio = audioRefs.current[type];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Ignore autoplay restrictions (e.g. before user interaction)
        });
      }
    } catch (e) {}
  }, []);

  return playSound;
}

