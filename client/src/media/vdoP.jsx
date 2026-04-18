import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  SkipNext,
  SkipPrevious,
  Speed,
  PictureInPicture
} from '@mui/icons-material';
import ReactPlayer from 'react-player';

const VideoPlayer = ({
  url,
  onProgress,
  onDuration,
  onEnded,
  autoPlay = false,
  width = '100%',
  height = 'auto'
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [pip, setPip] = useState(false);

  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e, newValue) => {
    setVolume(newValue);
  };

  const handleMute = () => {
    setMuted(!muted);
  };

  const handleSeekChange = (e, newValue) => {
    setPlayed(newValue);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e, newValue) => {
    setSeeking(false);
    playerRef.current.seekTo(newValue);
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
      onProgress?.(state);
    }
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    onDuration?.(duration);
  };

  const handleFullscreen = () => {
    const player = containerRef.current;
    if (player.requestFullscreen) {
      player.requestFullscreen();
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const handlePip = () => {
    setPip(!pip);
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <Paper
      ref={containerRef}
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'black'
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        width={width}
        height={height}
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={onEnded}
        pip={pip}
        config={{
          youtube: {
            playerVars: { showinfo: 1, controls: 0, modestbranding: 1 }
          }
        }}
      />

      {/* Custom Controls Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: 2,
          opacity: playing ? 0 : 1,
          transition: 'opacity 0.3s',
          '&:hover': {
            opacity: 1
          }
        }}
      >
        {/* Progress Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'white', minWidth: 45 }}>
            {formatTime(duration * played)}
          </Typography>
          <Slider
            value={played}
            min={0}
            max={1}
            step={0.001}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onChangeCommitted={handleSeekMouseUp}
            sx={{
              mx: 2,
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12
              }
            }}
          />
          <Typography variant="caption" sx={{ color: 'white', minWidth: 45 }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Control Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <IconButton sx={{ color: 'white' }} onClick={handlePlayPause}>
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton sx={{ color: 'white' }} onClick={handleMute}>
              {muted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <Slider
              value={volume}
              min={0}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              sx={{
                width: 100,
                display: 'inline-block',
                ml: 1,
                color: 'white',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12
                }
              }}
            />
          </Box>

          <Box>
            <IconButton sx={{ color: 'white' }} onClick={handlePip}>
              <PictureInPicture />
            </IconButton>
            <IconButton sx={{ color: 'white' }} onClick={() => setShowSpeedMenu(!showSpeedMenu)}>
              <Speed />
            </IconButton>
            <IconButton sx={{ color: 'white' }} onClick={handleFullscreen}>
              <Fullscreen />
            </IconButton>
          </Box>
        </Box>

        {/* Speed Menu */}
        {showSpeedMenu && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 70,
              right: 20,
              p: 1,
              borderRadius: 2
            }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <Box
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                sx={{
                  p: 1,
                  px: 2,
                  cursor: 'pointer',
                  borderRadius: 1,
                  bgcolor: playbackRate === speed ? 'primary.main' : 'transparent',
                  color: playbackRate === speed ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: playbackRate === speed ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                {speed}x
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Paper>
  );
};

export default VideoPlayer;
