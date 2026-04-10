import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  Slide,
  CircularProgress,
  Slider
} from '@mui/material';
import {
  Close,
  VolumeUp,
  VolumeOff,
  ArrowBackIosNew,
  ArrowForwardIos
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const normalizeMediaUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return src;
  return `/${src}`;
};

const ReelPlayer = ({
  open,
  onClose,
  video,
  onWatchTime,
  onNext,
  onPrev,
  hasMore = false,
  hasPrev = false
}) => {
  const videoRef = useRef(null);
  const lastTimeRef = useRef(0);
  const watchAccumulatorRef = useRef(0);
  const touchStartY = useRef(null);
  const touchStartTime = useRef(null);
  const swipeLock = useRef(false);
  const pointerStartY = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const flushWatchTime = () => {
    if (typeof onWatchTime !== 'function') return;
    if (watchAccumulatorRef.current >= 1) {
      const sendSeconds = Math.floor(watchAccumulatorRef.current);
      watchAccumulatorRef.current -= sendSeconds;
      onWatchTime(sendSeconds);
    }
  };

  useEffect(() => {
    let timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  useEffect(() => {
    if (open && videoRef.current) {
      setIsLoading(true);
      setProgress(0);
      setIsPlaying(false);
      lastTimeRef.current = 0;
      watchAccumulatorRef.current = 0;
    }
    if (!open) {
      flushWatchTime();
    }
  }, [video, open]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress || 0);

      if (typeof onWatchTime === 'function') {
        const currentTime = videoRef.current.currentTime || 0;
        const delta = currentTime - (lastTimeRef.current || 0);
        lastTimeRef.current = currentTime;
        if (delta > 0 && delta < 3) {
          watchAccumulatorRef.current += delta;
          if (watchAccumulatorRef.current >= 5) {
            const sendSeconds = Math.floor(watchAccumulatorRef.current);
            watchAccumulatorRef.current -= sendSeconds;
            onWatchTime(sendSeconds);
          }
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsLoading(false);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleSeek = (e, newValue) => {
    e.stopPropagation();
    if (videoRef.current) {
      const time = (newValue / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(newValue);
    }
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    touchStartY.current = event.touches[0].clientY;
    touchStartTime.current = Date.now();
    swipeLock.current = false;
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 1) return;
    if (swipeLock.current) return;
    const currentY = event.touches[0].clientY;
    const diffY = currentY - (touchStartY.current ?? currentY);
    if (Math.abs(diffY) > 10) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event) => {
    if (touchStartY.current == null) return;
    const endTime = Date.now();
    const elapsed = endTime - (touchStartTime.current ?? endTime);
    const diffY = (touchStartY.current ?? 0) - (event?.changedTouches?.[0]?.clientY ?? touchStartY.current ?? 0);
    const absDiff = Math.abs(diffY);

    const isQuickSwipe = absDiff > 60 && elapsed < 500;
    if (isQuickSwipe && !swipeLock.current) {
      swipeLock.current = true;
      if (diffY > 0 && hasMore) {
        onNext();
      } else if (diffY < 0 && hasPrev) {
        onPrev();
      }
    }

    touchStartY.current = null;
    touchStartTime.current = null;
  };

  const handlePointerDown = (event) => {
    pointerStartY.current = event.clientY;
  };

  const handlePointerUp = (event) => {
    if (pointerStartY.current == null) return;
    if (swipeLock.current) return;
    const diffY = pointerStartY.current - event.clientY;
    if (Math.abs(diffY) > 80) {
      swipeLock.current = true;
      if (diffY > 0 && hasMore) {
        onNext();
      } else if (diffY < 0 && hasPrev) {
        onPrev();
      }
      setTimeout(() => {
        swipeLock.current = false;
      }, 350);
    }
    pointerStartY.current = null;
  };

  if (!video) return null;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          bgcolor: 'black',
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'black',
          touchAction: 'none'
        }}
        onClick={() => setShowControls(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={(event) => {
          if (swipeLock.current) return;
          if (event.deltaY > 50 && hasMore) {
            swipeLock.current = true;
            onNext();
            setTimeout(() => {
              swipeLock.current = false;
            }, 350);
          } else if (event.deltaY < -50 && hasPrev) {
            swipeLock.current = true;
            onPrev();
            setTimeout(() => {
              swipeLock.current = false;
            }, 350);
          }
        }}
      >
        {isLoading && (
          <Box sx={{ position: 'absolute', zIndex: 10 }}>
            <CircularProgress sx={{ color: '#FF6B6B' }} />
          </Box>
        )}

        <video
          ref={videoRef}
          src={normalizeMediaUrl(video.videoUrl || video.videoFile)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
            flushWatchTime();
          }}
          onClick={togglePlay}
        />

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'opacity 0.3s',
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none',
            zIndex: 20
          }}
        >
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>

          <Box sx={{ flex: 1, ml: 2 }}>
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }} noWrap>
              {video.title}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }} noWrap>
              {video.Subject?.name || video.Topic?.Subject?.name || 'Education'}
            </Typography>
          </Box>

          <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
            {isMuted ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
            zIndex: 20
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Slider
              value={progress}
              onChange={handleSeek}
              sx={{
                color: '#4ECDC4',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  transition: '0.3s',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0px 0px 0px 8px rgba(78, 205, 196, 0.16)'
                  },
                  '&.Mui-active': {
                    width: 20,
                    height: 20
                  }
                }
              }}
            />
          </Box>
        </Box>

        {hasPrev && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ArrowBackIosNew />
          </IconButton>
        )}
        {hasMore && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ArrowForwardIos />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
};

export default ReelPlayer;
