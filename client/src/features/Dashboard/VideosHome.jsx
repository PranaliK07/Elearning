import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Autocomplete
} from '@mui/material';
import { PlayCircleOutline, Search as SearchIcon, VolumeOff, VolumeUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';

import ReelPlayer from '../../components/common/ReelPlayer';

const normalizeMediaUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return src;
  return `/${src}`;
};

const VideosHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateWatchTime } = useProgress();
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const scrollFrame = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);
  const pointerStartY = useRef(null);
  const swipeLock = useRef(false);
  const [openPlayer, setOpenPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [muted, setMuted] = useState(true);
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState({}); // Track ready state per video
  const watchAccumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    fetchRecentVideos();
    fetchSubjects();
  }, []);
  
  const reelItems = useMemo(() => recentVideos, [recentVideos]);

  useEffect(() => {
    setActiveIndex(0);
    watchAccumulatorRef.current = 0;
    lastTimeRef.current = 0;
  }, [reelItems]);

  useEffect(() => {
    watchAccumulatorRef.current = 0;
    lastTimeRef.current = 0;
  }, [activeIndex]);

  useEffect(() => {
    watchAccumulatorRef.current = 0;
    lastTimeRef.current = 0;
  }, [openPlayer]);

  // Improved video playback handling
  const attemptPlay = useCallback(async (videoElement) => {
    if (!videoElement) return false;
    
    try {
      // Ensure video is muted for autoplay policies
      videoElement.muted = muted;
      
      // Reset to beginning if video ended
      if (videoElement.ended) {
        videoElement.currentTime = 0;
      }
      
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
      return false;
    } catch (err) {
      console.log('Playback failed:', err.name);
      // If autoplay fails due to policy, try with muted
      if (err.name === 'NotAllowedError' && !videoElement.muted) {
        try {
          videoElement.muted = true;
          await videoElement.play();
          return true;
        } catch (retryErr) {
          console.log('Retry failed:', retryErr);
          return false;
        }
      }
      return false;
    }
  }, [muted]);

  // Handle video playback when active index changes
  useEffect(() => {
    if (videoRefs.current.length === 0) return;
    
    // Pause all videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== activeIndex) {
        video.pause();
      }
    });
    
    // Play active video
    const activeVideo = videoRefs.current[activeIndex];
    if (activeVideo) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        attemptPlay(activeVideo);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeIndex, attemptPlay]);

  // Handle video ready state
  const handleVideoCanPlay = (index) => {
    setVideoReady(prev => ({ ...prev, [index]: true }));
    // If this is the active video, attempt to play
    if (index === activeIndex) {
      const video = videoRefs.current[index];
      if (video) {
        attemptPlay(video);
      }
    }
  };

  const handleInlineTimeUpdate = (index, videoId, currentTime) => {
    if (openPlayer) return;
    if (index !== activeIndex) return;
    const delta = currentTime - (lastTimeRef.current || 0);
    lastTimeRef.current = currentTime;
    if (delta > 0 && delta < 3) {
      watchAccumulatorRef.current += delta;
      if (watchAccumulatorRef.current >= 5) {
        const sendSeconds = Math.floor(watchAccumulatorRef.current);
        watchAccumulatorRef.current -= sendSeconds;
        updateWatchTime(videoId, sendSeconds);
      }
    }
  };

  const fetchRecentVideos = async () => {
    try {
      setRecentLoading(true);
      const response = await axios.get('/api/content?type=video&limit=10&sort=createdAt&order=desc', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const fetchedVideos = response.data?.contents || [];
      const playable = fetchedVideos.filter((video) => video.videoUrl || video.videoFile);
      setRecentVideos(playable);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setRecentVideos([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const gradeQuery = user?.grade ? `?gradeId=${user.grade}` : '';
      const response = await axios.get(`/api/subjects${gradeQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubjectSelect = (subject) => {
    if (!subject?.id) return;
    setSelectedSubject(subject);
    navigate(`/study/subject/${subject.id}`);
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        if (video) {
          video.muted = next;
          // If unmuting and video is playing, ensure it continues playing
          if (!next && video.paused && activeIndex === videoRefs.current.indexOf(video)) {
            attemptPlay(video);
          }
        }
      });
      return next;
    });
  };

  const clampIndex = (value) => {
    if (reelItems.length === 0) return 0;
    return Math.max(0, Math.min(value, reelItems.length - 1));
  };

  const handleScroll = () => {
    if (scrollFrame.current) return;
    scrollFrame.current = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        scrollFrame.current = null;
        return;
      }
      const height = container.clientHeight || 1;
      const nextIndex = clampIndex(Math.round(container.scrollTop / height));
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
      }
      scrollFrame.current = null;
    });
  };

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    if (!container) return;
    const height = container.clientHeight || 1;
    container.scrollTo({ top: height * index, behavior: 'smooth' });
  };

  const handleSwipe = (direction) => {
    if (swipeLock.current) return;
    setActiveIndex((prev) => {
      const next =
        direction === 'up'
          ? clampIndex(prev + 1)
          : direction === 'down'
            ? clampIndex(prev - 1)
            : prev;
      if (next !== prev) {
        swipeLock.current = true;
        scrollToIndex(next);
        setTimeout(() => {
          swipeLock.current = false;
        }, 350);
      }
      return next;
    });
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    touchStartY.current = event.touches[0].clientY;
    touchEndY.current = null;
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 1) return;
    touchEndY.current = event.touches[0].clientY;
    if (touchStartY.current !== null && Math.abs(touchEndY.current - touchStartY.current) > 10) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) return;
    const delta = touchStartY.current - touchEndY.current;
    if (Math.abs(delta) > 50) {
      handleSwipe(delta > 0 ? 'up' : 'down');
    }
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const handlePointerDown = (event) => {
    pointerStartY.current = event.clientY;
  };

  const handlePointerUp = (event) => {
    if (pointerStartY.current === null) return;
    const delta = pointerStartY.current - event.clientY;
    if (Math.abs(delta) > 80) {
      handleSwipe(delta > 0 ? 'up' : 'down');
    }
    pointerStartY.current = null;
  };

  // Handle video click to open fullscreen reels
  const handleVideoClick = (video) => {
    // Pause current video in reels
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.pause();
    }
    setSelectedVideo(video);
    setOpenPlayer(true);
  };

  const handleNext = () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < reelItems.length) {
      setActiveIndex(nextIndex);
      setSelectedVideo(reelItems[nextIndex]);
      scrollToIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    const prevIndex = activeIndex - 1;
    if (prevIndex >= 0) {
      setActiveIndex(prevIndex);
      setSelectedVideo(reelItems[prevIndex]);
      scrollToIndex(prevIndex);
    }
  };

  const renderReels = (items, loadingState, emptyMessage) => {
    if (loadingState) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box textAlign="center" py={6}>
          <Typography color="textSecondary">
            {emptyMessage || 'No videos available yet.'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={(event) => {
          event.preventDefault();
          if (event.deltaY > 40) handleSwipe('up');
          if (event.deltaY < -40) handleSwipe('down');
        }}
        sx={{
          height: '100%',
          borderRadius: 3,
          bgcolor: 'background.default',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          userSelect: 'none',
          touchAction: 'pan-y',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {items.map((video, index) => (
          <Box
            key={video.id}
            sx={{
              height: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 2 }
            }}
          >
            <Card
              onClick={() => handleVideoClick(video)}
              sx={{
                height: '100%',
                width: '100%',
                maxWidth: 420,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Box sx={{ position: 'relative', flexGrow: 1, bgcolor: 'black', minHeight: 400 }}>
                <video
                  ref={(el) => { 
                    videoRefs.current[index] = el;
                  }}
                  src={normalizeMediaUrl(video.videoUrl || video.videoFile)}
                  poster={normalizeMediaUrl(video.thumbnail)}
                  muted={muted}
                  loop
                  playsInline
                  preload="auto"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onCanPlay={() => handleVideoCanPlay(index)}
                  onLoadedMetadata={() => handleVideoCanPlay(index)}
                  onTimeUpdate={(e) => handleInlineTimeUpdate(index, video.id, e.currentTarget.currentTime)}
                  onError={(e) => {
                    console.error('Video load error:', e);
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    touchAction: 'pan-y'
                  }}
                />
                
                {/* Loading indicator */}
                {!videoReady[index] && index === activeIndex && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10
                    }}
                  >
                    <CircularProgress size={40} sx={{ color: 'white' }} />
                  </Box>
                )}
                
                {/* Play overlay on hover */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                >
                  <PlayCircleOutline sx={{ fontSize: 56, color: 'white' }} />
                </Box>
                
                {/* Swipe indicator for first video */}
                {index === 0 && activeIndex === 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: 12,
                      animation: 'bounce 1s infinite'
                    }}
                  >
                    Swipe Up ↑
                  </Box>
                )}
                
                {/* Video counter */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: 12,
                    zIndex: 5
                  }}
                >
                  {index + 1} / {items.length}
                </Box>
              </Box>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {video.title}
                </Typography>
                {video.description && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    {video.description.length > 60 ? `${video.description.substring(0, 60)}...` : video.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" disableGutters sx={{ height: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 96px)' } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ height: '100%' }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              p: 1,
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: 1
            }}
          >
            <Autocomplete
              fullWidth
              size="small"
              options={subjects}
              loading={subjectsLoading}
              getOptionLabel={(option) => option?.name || ''}
              value={selectedSubject}
              onChange={(event, value) => handleSubjectSelect(value)}
              inputValue={subjectQuery}
              onInputChange={(event, value) => setSubjectQuery(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search subject"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Recent Videos
            </Typography>
            <IconButton onClick={toggleMute} sx={{ bgcolor: 'action.hover' }}>
              {muted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            {renderReels(
              reelItems,
              recentLoading,
              'No videos available yet.'
            )}
          </Box>
        </Box>
      </motion.div>
      
      <ReelPlayer 
        open={openPlayer}
        onClose={() => setOpenPlayer(false)}
        video={selectedVideo}
        onWatchTime={(seconds) => updateWatchTime(selectedVideo?.id, seconds)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasMore={activeIndex < reelItems.length - 1}
        hasPrev={activeIndex > 0}
      />

      {/* Add bounce animation for swipe indicator */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </Container>
  );
};

export default VideosHome;
