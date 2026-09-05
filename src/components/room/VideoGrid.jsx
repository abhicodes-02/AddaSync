import { useEffect, useRef, useState, memo } from "react";

import { FiMicOff, FiVideoOff } from "react-icons/fi";

function RemoteVideo({ stream, isConnected, name, isThumbnail, hideName, isMuted, isCameraOff }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play failed:", e));
      }
    }
  }, [stream, isCameraOff]);

  return (
    <div className={`relative w-full h-full ${isThumbnail ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden border border-white/10 bg-[#111] shadow-xl flex items-center justify-center`}>
      {isCameraOff ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          disablePictureInPicture
          className={`remote-video-element w-full h-full ${isThumbnail ? 'object-cover' : 'object-contain'} transition-all duration-700`}
        />
      )}

      {!hideName && name && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs sm:text-sm text-white font-medium tracking-wide border border-white/10 shadow-lg flex items-center gap-2">
          {name}
          {isMuted && <FiMicOff className="text-red-500" size={14} />}
        </div>
      )}
      
      {/* Show big mute icon if only thumbnail */}
      {hideName && isMuted && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
          <FiMicOff className="text-red-500" size={12} />
        </div>
      )}
    </div>
  );
}

const VideoGrid = memo(function VideoGrid({
  localStream,
  remoteStreams,
  participantNames,
  participantStates,
  localName,
  localIsMuted,
  localIsCameraOff,
  connectionState,
  roomId,
  localVideoRef,
  isScreenSharing,
  mediaFileUrl,
  startExternalStream
}) {
  const [remoteScreenSharers, setRemoteScreenSharers] = useState(new Set());

  useEffect(() => {
    const handleRemoteScreen = (e) => {
       const { uid, isSharingScreen } = e.detail;
       setRemoteScreenSharers(prev => {
          const next = new Set(prev);
          if (isSharingScreen) next.add(uid);
          else next.delete(uid);
          return next;
       });
    };
    window.addEventListener('remote-screen-status', handleRemoteScreen);
    return () => window.removeEventListener('remote-screen-status', handleRemoteScreen);
  }, []);

  const pinnedUid = Array.from(remoteScreenSharers)[0] || null;
  const isSomeonePresenting = !!pinnedUid || isScreenSharing || !!mediaFileUrl;

  useEffect(() => {
    const updateLocalStream = () => {
      if (localVideoRef.current && localStream) {
        if (localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(e => console.warn("Local video play failed:", e));
        }
      }
    };
    updateLocalStream();
    window.addEventListener('streamchanged', updateLocalStream);
    return () => window.removeEventListener('streamchanged', updateLocalStream);
  }, [localStream, localVideoRef, isSomeonePresenting, localIsCameraOff]);

  const isConnected = connectionState === "connected";
  const streamsEntries = Array.from(remoteStreams.entries());
  const count = streamsEntries.length;

  // --- DISCORD STYLE PRESENTATION LAYOUT ---
  if (isSomeonePresenting) {
    return (
      <div className="flex-1 w-full h-full flex flex-col bg-[#050505] relative overflow-hidden z-0">
        
        {/* Main Stage */}
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 pb-0 min-h-0">
          {pinnedUid ? (
            <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black">
               {/* Discord-style overlay badges */}
               <div className="absolute top-4 left-4 z-20 flex items-center gap-2 sm:gap-3 pointer-events-none">
                 <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[13px] font-medium border border-white/10 flex items-center gap-2 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {participantNames?.get(pinnedUid) || "Participant"}'s Screen
                 </div>
                 <div className="bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                    LIVE
                 </div>
               </div>
               <RemoteVideo 
                 stream={remoteStreams.get(pinnedUid)} 
                 isConnected={isConnected} 
                 name=""
                 hideName={true}
               />
            </div>
          ) : mediaFileUrl ? (
            <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black">
               <div className="absolute top-4 left-4 z-20 flex items-center gap-2 sm:gap-3 pointer-events-none">
                 <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-cyan-50 text-[13px] font-medium border border-cyan-500/30 flex items-center gap-2 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Playing Local Media
                 </div>
                 <div className="bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                    LIVE
                 </div>
               </div>
               <video 
                 src={mediaFileUrl}
                 controls
                 autoPlay
                 disablePictureInPicture
                 className="w-full h-full object-contain"
                 onPlay={(e) => {
                    // Capture stream when it starts playing at 30fps
                    const capture = e.target.captureStream || e.target.mozCaptureStream;
                    if (capture) {
                       const stream = capture.call(e.target, 30);
                       if (startExternalStream) {
                          startExternalStream(stream, false);
                       }
                    }
                 }}
               />
            </div>
          ) : (
            <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-cyan-950/20 flex flex-col items-center justify-center border border-cyan-500/20">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 sm:gap-3 pointer-events-none">
                 <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-cyan-50 text-[13px] font-medium border border-cyan-500/30 flex items-center gap-2 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Your Screen
                 </div>
                 <div className="bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                    LIVE
                 </div>
              </div>
              <div className="p-5 bg-cyan-500/10 rounded-full mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                 <div className="w-10 h-10 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-4 bg-cyan-400/20 border border-cyan-400/50 rounded-sm" />
                 </div>
              </div>
              <p className="text-cyan-400 font-medium text-lg">You are sharing your screen</p>
            </div>
          )}
        </div>

        {/* Discord-style Bottom Row of Participants */}
        <div className="w-full shrink-0 flex flex-row items-start justify-center gap-3 px-4 pt-2 pb-24 sm:pb-28 overflow-x-auto">
          
          <div className="w-32 sm:w-40 h-20 sm:h-24 shrink-0 relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-xl bg-slate-900 group flex items-center justify-center">
             {localIsCameraOff ? (
               <div className="flex flex-col items-center gap-1">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                   {localName ? localName.charAt(0).toUpperCase() : "Y"}
                 </div>
               </div>
             ) : (
               <video
                 ref={localVideoRef}
                 autoPlay
                 muted
                 playsInline
                 disablePictureInPicture
                 className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
               />
             )}
             <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] sm:text-[11px] text-white font-medium border border-white/5 shadow-lg flex items-center gap-1.5">
                {localName ? `${localName} (You)` : "You"}
                {localIsMuted && <FiMicOff className="text-red-500" size={10} />}
             </div>
          </div>

          {/* Remote Camera Tiles */}
          {streamsEntries.map(([uid, stream]) => {
             if (uid === pinnedUid) return null; // Don't show pinned user's face camera duplicate yet
             const pState = participantStates?.get(uid) || {};
             return (
               <div key={uid} className="w-32 sm:w-40 h-20 sm:h-24 shrink-0">
                  <RemoteVideo 
                     stream={stream} 
                     isConnected={isConnected} 
                     name={participantNames?.get(uid) || "Participant"} 
                     isThumbnail={true}
                     isMuted={pState.isMuted}
                     isCameraOff={pState.isCameraOff}
                  />
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // --- NORMAL GRID LAYOUT ---
  let gridClass = "grid-cols-1 grid-rows-1";
  if (count === 2) gridClass = "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1";
  if (count === 3) gridClass = "grid-cols-1 grid-rows-3 sm:grid-cols-2 sm:grid-rows-2";
  if (count === 4) gridClass = "grid-cols-2 grid-rows-2 sm:grid-cols-2 sm:grid-rows-2";
  if (count >= 5) gridClass = "grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2";

  return (
    <div className="flex-1 w-full h-full relative bg-[#0a0a0a] overflow-hidden">
      
      <div className={`absolute inset-0 p-4 sm:p-6 pb-28 sm:pb-32 grid gap-4 ${gridClass} ${count > 0 ? "z-10" : "z-0"} content-stretch`}>
        {count === 0 && isConnected ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full" />
              <div className="
                relative h-24 w-24 sm:h-32 sm:w-32 rounded-full
                bg-gradient-to-br from-slate-800 to-slate-900
                border border-white/5
                flex items-center justify-center
                text-4xl sm:text-5xl font-light text-slate-300
                shadow-2xl mb-6
              ">
                ?
              </div>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-2">
              Waiting for others
            </h2>
            <p className="text-slate-400 text-sm max-w-xs text-center">
              Share the room code <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">{roomId}</span> to start.
            </p>
          </div>
        ) : (
          streamsEntries.map(([uid, stream]) => {
            const pState = participantStates?.get(uid) || {};
            return (
              <div key={uid}>
                 <RemoteVideo 
                   stream={stream} 
                   isConnected={isConnected} 
                   name={participantNames?.get(uid) || "Participant"}
                   isMuted={pState.isMuted}
                   isCameraOff={pState.isCameraOff}
                 />
              </div>
            );
          })
        )}
      </div>

      {/* Cinematic Gradients */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20" />

      {/* Self-view floating mini tile */}
      <div className="
        absolute z-30 overflow-hidden
        border border-white/10 shadow-2xl shadow-black/50
        top-20 sm:top-auto sm:bottom-32 right-4 sm:right-8 w-28 h-40 sm:w-56 sm:h-36
        rounded-2xl transition-transform hover:scale-[1.02] duration-300
        bg-slate-900 flex items-center justify-center group
      ">
        {localIsCameraOff ? (
           <div className="flex flex-col items-center gap-1">
             <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg">
               {localName ? localName.charAt(0).toUpperCase() : "Y"}
             </div>
           </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white font-medium border border-white/5 shadow-lg flex items-center gap-1.5">
          {localName ? `${localName} (You)` : "You"}
          {localIsMuted && <FiMicOff className="text-red-500" size={12} />}
        </div>
      </div>
    </div>
  );
});

export default VideoGrid;
