import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * VideoPlayer: High-Performance 4K Cinematic Background Video Engine
 * Handles precise timestamp tracking, pause at window entrance, resume on departure,
 * and seamless fallback handling.
 */
const VideoPlayer = forwardRef(
  (
    {
      src = '/videos/cinematic-bus.mp4',
      onTimeUpdate,
      onEnded,
      onLoadedData,
      onError,
      isMuted = true,
      playbackRate = 1.0,
    },
    ref
  ) => {
    const videoRef = useRef(null);

    // Expose imperative video controls to parent
    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          return videoRef.current.play().catch((err) => {
            console.warn('Playback play() was prevented:', err);
          });
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      seek: (seconds) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
      getCurrentTime: () => {
        return videoRef.current ? videoRef.current.currentTime : 0;
      },
      getDuration: () => {
        return videoRef.current ? videoRef.current.duration : 0;
      },
      getVideoElement: () => videoRef.current,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      video.playbackRate = playbackRate;
    }, [playbackRate]);

    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration || 22.8);
      }
    };

    return (
      <div className="cinematic-video-wrapper">
        <video
          ref={videoRef}
          src={src}
          className="cinematic-video"
          playsInline
          muted={isMuted}
          autoPlay
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={onLoadedData}
          onEnded={onEnded}
          onError={onError}
        />
        {/* Subtle cinematic gradient overlays for contrast and glassmorphism reflection */}
        <div className="cinematic-vignette" />
        <div className="cinematic-mist-glow" />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
