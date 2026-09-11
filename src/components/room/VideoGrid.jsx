// src/components/VideoGrid.jsx

import { useEffect, useRef, useState, memo } from "react";
import { FiMicOff } from "react-icons/fi";

function RemoteVideo({
  stream,
  isConnected,
  name,
  isThumbnail,
  hideName,
  isMuted,
  isCameraOff,
  forceMuted
}) {
  const videoRef = useRef(null);
  const [bubble, setBubble] = useState(null);
  const bubbleTimerRef = useRef(null);

  useEffect(() => {
    const handleBubble = (event) => {
      const {
        sender,
        text,
        id
      } = event.detail || {};

      if (sender === name) {
        if (bubbleTimerRef.current) {
          clearTimeout(bubbleTimerRef.current);
        }

        setBubble({
          text,
          id
        });

        bubbleTimerRef.current =
          setTimeout(
            () => setBubble(null),
            6200
          );
      }
    };

    window.addEventListener(
      "chat-bubble",
      handleBubble
    );

    return () => {
      window.removeEventListener(
        "chat-bubble",
        handleBubble
      );

      if (bubbleTimerRef.current) {
        clearTimeout(
          bubbleTimerRef.current
        );
      }
    };
  }, [name]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // IMPORTANT:
    // Keep the video element mounted even when the participant's
    // camera is OFF. The same MediaStream carries the audio track.
    // Removing the <video> element would also stop remote audio.
    if (forceMuted) {
      video.muted = true;
      video.volume = 0;
      video.defaultMuted = true;
    } else {
      video.muted = false;
      video.volume = 1;
      video.defaultMuted = false;
    }

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      video.play().catch(error => {
        // Autoplay can be blocked until the user interacts with the page.
        console.warn(
          "Remote media play failed:",
          error
        );
      });
    } else {
      video.srcObject = null;
    }

    return () => {
      // Do not stop the stream here. WebRTC owns the stream.
    };
  }, [stream, forceMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (forceMuted) {
      video.muted = true;
      video.volume = 0;
    } else {
      video.muted = false;
      video.volume = 1;
    }

    if (video.paused && stream) {
      video.play().catch(() => {});
    }
  }, [isCameraOff, stream, forceMuted]);

  return (
    <div
      className={`relative w-full h-full ${
        isThumbnail
          ? "rounded-xl"
          : "rounded-2xl"
      } overflow-hidden border border-white/10 bg-[#111] shadow-xl flex items-center justify-center`}
    >
      {/* Keep this element mounted so remote audio keeps playing. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        disablePictureInPicture
        muted={false}
        className={`remote-video-element absolute inset-0 w-full h-full ${
          isThumbnail
            ? "object-cover"
            : "object-contain"
        } transition-all duration-300 ${
          isCameraOff
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      />

      {/* Camera-off avatar is visual only. Audio still comes from <video>. */}
      {isCameraOff && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg">
            {name
              ? name.charAt(0).toUpperCase()
              : "?"}
          </div>
        </div>
      )}

      {/* Floating Speech Bubble */}
      {bubble && (
        <div
          key={bubble.id}
          className="chat-bubble-anim absolute bottom-12 left-3 right-3 z-20 pointer-events-none"
        >
          <div className="inline-block max-w-full bg-white/90 border border-cyan-400 text-black text-sm sm:text-base px-4 py-3 rounded-2xl rounded-bl-sm shadow-lg leading-snug">
            {bubble.text}
          </div>

          <div className="w-2.5 h-2.5 bg-black/75 border-l border-b border-white/10 rotate-[-45deg] ml-3 -mt-1.5" />
        </div>
      )}

      {!hideName && name && (
        <div className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs sm:text-sm text-white font-medium tracking-wide border border-white/10 shadow-lg flex items-center gap-2">
          {name}

          {isMuted && (
            <FiMicOff
              className="text-red-500"
              size={14}
            />
          )}
        </div>
      )}

      {hideName && isMuted && (
        <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
          <FiMicOff
            className="text-red-500"
            size={12}
          />
        </div>
      )}

      {/* Connection indicator */}
      {!isConnected && stream && (
        <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-slate-300">
          Connecting...
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
  startExternalStream,
  roomState
}) {
  const [
    remoteScreenSharers,
    setRemoteScreenSharers
  ] = useState(new Set());

  const [
    localBubble,
    setLocalBubble
  ] = useState(null);

  const localBubbleTimer =
    useRef(null);

  useEffect(() => {
    const handleBubble = (event) => {
      const {
        sender,
        text,
        id
      } = event.detail || {};

      if (sender === localName) {
        if (localBubbleTimer.current) {
          clearTimeout(
            localBubbleTimer.current
          );
        }

        setLocalBubble({
          text,
          id
        });

        localBubbleTimer.current =
          setTimeout(
            () => setLocalBubble(null),
            6200
          );
      }
    };

    window.addEventListener(
      "chat-bubble",
      handleBubble
    );

    return () => {
      window.removeEventListener(
        "chat-bubble",
        handleBubble
      );

      if (localBubbleTimer.current) {
        clearTimeout(
          localBubbleTimer.current
        );
      }
    };
  }, [localName]);

  useEffect(() => {
    const handleRemoteScreen = (event) => {
      const {
        uid,
        isSharingScreen
      } = event.detail || {};

      if (!uid) return;

      setRemoteScreenSharers(
        prev => {
          const next = new Set(prev);

          if (isSharingScreen) {
            next.add(uid);
          } else {
            next.delete(uid);
          }

          return next;
        }
      );
    };

    window.addEventListener(
      "remote-screen-status",
      handleRemoteScreen
    );

    return () =>
      window.removeEventListener(
        "remote-screen-status",
        handleRemoteScreen
      );
  }, []);

  // Remove screen sharers that no longer have a remote stream.
  useEffect(() => {
    const activeUids = new Set(
      remoteStreams.keys()
    );

    setRemoteScreenSharers(prev => {
      const next = new Set(
        [...prev].filter(uid =>
          activeUids.has(uid)
        )
      );

      if (next.size === prev.size) {
        let same = true;

        for (const uid of prev) {
          if (!next.has(uid)) {
            same = false;
            break;
          }
        }

        if (same) return prev;
      }

      return next;
    });
  }, [remoteStreams]);

  const pinnedUid =
    roomState?.spotlightUid || Array.from(remoteScreenSharers)[0] || null;

  const isSomeonePresenting =
    !!pinnedUid ||
    isScreenSharing ||
    !!mediaFileUrl;

  useEffect(() => {
    const updateLocalStream = () => {
      const video = localVideoRef?.current;

      if (!video || !localStream) return;

      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;

      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
      }

      video.play().catch(error => {
        console.warn(
          "Local video play failed:",
          error
        );
      });
    };

    updateLocalStream();

    window.addEventListener(
      "streamchanged",
      updateLocalStream
    );

    return () =>
      window.removeEventListener(
        "streamchanged",
        updateLocalStream
      );
  }, [
    localStream,
    localVideoRef,
    isSomeonePresenting,
    localIsCameraOff
  ]);

  const isConnected =
    connectionState === "connected";

  const streamsEntries =
    Array.from(
      remoteStreams.entries()
    );

  const count =
    streamsEntries.length;

  // ---------------------------------------------------------
  // DISCORD-STYLE PRESENTATION LAYOUT
  // ---------------------------------------------------------
  if (isSomeonePresenting) {
    return (
      <div className="flex-1 w-full h-full flex flex-col bg-[#050505] relative overflow-hidden z-0">

        {/* Main Stage */}
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 pb-0 min-h-0">

          {pinnedUid ? (
            <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black">

              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 sm:gap-3 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[13px] font-medium border border-white/10 flex items-center gap-2 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {pinnedUid === "local" ? (localName || "You") : (participantNames?.get(pinnedUid) || "Participant")}
                  {remoteScreenSharers.has(pinnedUid) ? "'s Screen" : " (Spotlight)"}
                </div>

                <div className="bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                  LIVE
                </div>
              </div>

              {pinnedUid === "local" ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  disablePictureInPicture
                  className="w-full h-full object-contain scale-x-[-1]"
                />
              ) : (
                <RemoteVideo
                  stream={remoteStreams.get(pinnedUid)}
                  isConnected={isConnected}
                  name=""
                  hideName={true}
                  isMuted={participantStates?.get(pinnedUid)?.isMuted}
                  isCameraOff={false}
                />
              )}
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
                playsInline
                disablePictureInPicture
                className="w-full h-full object-contain"
                onPlay={event => {
                  const capture =
                    event.target.captureStream ||
                    event.target.mozCaptureStream;

                  if (capture) {
                    const stream =
                      capture.call(
                        event.target,
                        30
                      );

                    if (
                      startExternalStream
                    ) {
                      startExternalStream(
                        stream,
                        false
                      );
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

              <p className="text-cyan-400 font-medium text-lg">
                You are sharing your screen
              </p>
            </div>
          )}
        </div>

        {/* Bottom Participant Row */}
        <div className="w-full shrink-0 flex flex-row items-start justify-center gap-3 px-4 pt-2 pb-24 sm:pb-28 overflow-x-auto">

          {/* Local participant */}
          {pinnedUid !== "local" && (
          <div className="w-32 sm:w-40 h-20 sm:h-24 shrink-0 relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-xl bg-slate-900 group flex items-center justify-center">

            {localIsCameraOff ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {localName
                    ? localName
                        .charAt(0)
                        .toUpperCase()
                    : "Y"}
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

            <div className="absolute bottom-2 left-2 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] sm:text-[11px] text-white font-medium border border-white/5 shadow-lg flex items-center gap-1.5">
              {localName
                ? `${localName} (You)`
                : "You"}

              {localIsMuted && (
                <FiMicOff
                  className="text-red-500"
                  size={10}
                />
              )}
            </div>
          </div>
          )}

          {/* Remote Camera Tiles */}
          {streamsEntries.map(
            ([uid, stream]) => {
              if (uid === pinnedUid) {
                return null;
              }

              const pState = participantStates?.get(uid) || {};
              const isFocusMuted = roomState?.focusMode && uid !== roomState?.hostUid;

              return (
                <div
                  key={uid}
                  className={`w-32 sm:w-40 h-20 sm:h-24 shrink-0 transition-opacity duration-500 ${isFocusMuted ? 'opacity-40 grayscale-[50%]' : 'opacity-100'}`}
                >
                  <RemoteVideo
                    stream={stream}
                    isConnected={isConnected}
                    name={participantNames?.get(uid) || "Participant"}
                    isThumbnail={true}
                    isMuted={isFocusMuted || pState.isMuted}
                    isCameraOff={pState.isCameraOff}
                    forceMuted={isFocusMuted}
                  />
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // NORMAL GRID LAYOUT
  // ---------------------------------------------------------
  let gridClass =
    "grid-cols-1 grid-rows-1";

  if (count === 2) {
    gridClass =
      "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1";
  }

  if (count === 3) {
    gridClass =
      "grid-cols-1 grid-rows-3 sm:grid-cols-2 sm:grid-rows-2";
  }

  if (count === 4) {
    gridClass =
      "grid-cols-2 grid-rows-2 sm:grid-cols-2 sm:grid-rows-2";
  }

  if (count >= 5) {
    gridClass =
      "grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2";
  }

  return (
    <div className="flex-1 w-full h-full relative bg-[#0a0a0a] overflow-hidden">

      <div
        className={`absolute inset-0 p-4 sm:p-6 pb-28 sm:pb-32 grid gap-4 ${gridClass} ${
          count > 0
            ? "z-10"
            : "z-0"
        } content-stretch`}
      >

        {count === 0 &&
        isConnected ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]">

            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full" />

              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-4xl sm:text-5xl font-light text-slate-300 shadow-2xl mb-6">
                ?
              </div>
            </div>

            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-2">
              Waiting for others
            </h2>

            <p className="text-slate-400 text-sm max-w-xs text-center">
              Share the room code{" "}
              <span className="text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                {roomId}
              </span>{" "}
              to start.
            </p>
          </div>
        ) : (
          streamsEntries.map(
            ([uid, stream]) => {
              const pState =
                participantStates?.get(
                  uid
                ) || {};

              return (
                <div
                  key={uid}
                  className="min-w-0 min-h-0"
                >
                  <RemoteVideo
                    stream={stream}
                    isConnected={
                      isConnected
                    }
                    name={
                      participantNames?.get(
                        uid
                      ) ||
                      "Participant"
                    }
                    isMuted={
                      pState.isMuted
                    }
                    isCameraOff={
                      pState.isCameraOff
                    }
                  />
                </div>
              );
            }
          )
        )}
      </div>

      {/* Cinematic Gradients */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20" />

      <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20" />

      {/* Self-view */}
      <div className="absolute z-30 overflow-hidden border border-white/10 shadow-2xl shadow-black/50 top-20 sm:top-auto sm:bottom-32 right-4 sm:right-8 w-28 h-40 sm:w-56 sm:h-36 rounded-2xl transition-transform hover:scale-[1.02] duration-300 bg-slate-900 flex items-center justify-center group">

        {localIsCameraOff ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg">
              {localName
                ? localName
                    .charAt(0)
                    .toUpperCase()
                : "Y"}
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

        <div className="absolute bottom-2 left-2 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white font-medium border border-white/5 shadow-lg flex items-center gap-1.5">
          {localName
            ? `${localName} (You)`
            : "You"}

          {localIsMuted && (
            <FiMicOff
              className="text-red-500"
              size={12}
            />
          )}
        </div>

        {/* Local speech bubble */}
        {localBubble && (
          <div
            key={localBubble.id}
            className="chat-bubble-anim absolute bottom-12 left-2 right-2 z-20 pointer-events-none"
          >
            <div className="inline-block max-w-full bg-white/90 border border-cyan-400 text-black text-[10px] sm:text-xs px-2.5 py-1.5 rounded-2xl rounded-bl-sm shadow-lg leading-snug">
              {localBubble.text}
            </div>
            {/* Tail */}
            <div className="w-2 h-2 bg-white/90 border-l border-b border-cyan-400 rotate-[-45deg] ml-2.5 -mt-1" />
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoGrid;
