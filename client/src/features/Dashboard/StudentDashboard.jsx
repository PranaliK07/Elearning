// src/components/dashboard/StudentDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  Slide,
  useMediaQuery,
  useTheme,
  Slider,
  FormControl,
  Select,
  MenuItem,
  LinearProgress,
  Badge,
  Divider,
  alpha,
  Fade
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  EmojiEvents,
  TrendingUp,
  Schedule,
  Star,
  School,
  Close,
  PlayArrow,
  Pause,
  Fullscreen,
  FullscreenExit,
  Settings,
  Replay10,
  Forward10,
  Book,
  Quiz,
  AutoGraph,
  LocalFireDepartment,
  CheckCircle,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Refresh,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import axios from 'axios';
import ReelPlayer from '../../components/common/ReelPlayer';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StudentDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { watchTimeStats, getGradeProgress, updateWatchTime, getQuizStats } = useProgress();
  
  // State
  const [achievements, setAchievements] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [videoProgress, setVideoProgress] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoading, setVideoLoading] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  
  // Quiz states
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [currentVideoQuiz, setCurrentVideoQuiz] = useState(null);
  
  // Full screen player states
  const [openPlayer, setOpenPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  // Refs
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const fullVideoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const swipeDistance = useRef(0);
  const isScrolling = useRef(false);
  const playAttemptRef = useRef(null);
  const dialogTransitionRef = useRef(null);
  const swipeRafRef = useRef(null);
  const swipeLockRef = useRef(false);
  const swipeCooldownRef = useRef(0);
  const inlineWatchAccumulatorRef = useRef(0);
  const inlineLastTimeRef = useRef(0);
  
  // Constants
  const SWIPE_THRESHOLD = 60;
  const SWIPE_TIME_LIMIT = 900;

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Load video progress from localStorage
    const savedProgress = localStorage.getItem('videoProgress');
    if (savedProgress) {
      setVideoProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Handle video playback when index changes
  useEffect(() => {
    if (videoRefs.current.length > 0 && videos.length > 0 && !openPlayer) {
      // Pause all videos
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            // Play current video
            setTimeout(() => {
              if (videoProgress[videos[currentIndex]?.id]) {
                video.currentTime = videoProgress[videos[currentIndex].id];
              }
              attemptPlay(video);
            }, 100);
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    }
  }, [currentIndex, videos, openPlayer, videoProgress]);

  useEffect(() => {
    inlineWatchAccumulatorRef.current = 0;
    inlineLastTimeRef.current = 0;
  }, [currentIndex]);

  useEffect(() => {
    inlineWatchAccumulatorRef.current = 0;
    inlineLastTimeRef.current = 0;
  }, [openPlayer]);

  // Handle fullscreen video events - IMPROVED VERSION
  useEffect(() => {
    if (openPlayer && fullVideoRef.current && selectedVideo) {
      const video = fullVideoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        
        // Update progress every 5 seconds
        if (Math.floor(video.currentTime) % 5 === 0) {
          if (selectedVideo?.id) {
            updateWatchTime(selectedVideo.id, 5);
          }
          
          // Store video progress
          if (selectedVideo?.id && video.duration) {
            setVideoProgress(prev => ({
              ...prev,
              [selectedVideo.id]: video.currentTime
            }));
          }
        }
      };

      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setVideoLoading(prev => ({ ...prev, [selectedVideo.id]: false }));
        setVideoReady(true);
        
        // Restore progress if available
        if (videoProgress[selectedVideo?.id] && videoProgress[selectedVideo?.id] < video.duration - 5) {
          video.currentTime = videoProgress[selectedVideo.id];
        }
        
        // Auto play with better handling
        setTimeout(() => {
          if (openPlayer && fullVideoRef.current && !videoEnded) {
            attemptPlay(fullVideoRef.current).then(success => {
              setIsPlaying(success);
            });
          }
        }, 100);
      };

      const handleLoadStart = () => {
        setVideoLoading(prev => ({ ...prev, [selectedVideo.id]: true }));
        setVideoReady(false);
      };

      const handleCanPlay = () => {
        setVideoLoading(prev => ({ ...prev, [selectedVideo.id]: false }));
        setVideoReady(true);
        if (openPlayer && !videoEnded) {
          attemptPlay(video).then(success => {
            setIsPlaying(success);
          });
        }
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setVideoEnded(false);
      };
      
      const handlePause = () => setIsPlaying(false);
      
      const handleEnded = () => {
        setVideoEnded(true);
        setIsPlaying(false);
        
        // Check for available quiz
        const hasQuiz = availableQuizzes.some(q => q.videoId === selectedVideo?.id);
        if (hasQuiz) {
          setCurrentVideoQuiz(selectedVideo);
          setShowQuizPrompt(true);
        }
      };

      const handleError = (e) => {
        console.error('Video error:', e);
        setVideoErrors(prev => ({ ...prev, [selectedVideo.id]: true }));
        setVideoLoading(prev => ({ ...prev, [selectedVideo.id]: false }));
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);

      // Set initial playback rate
      video.playbackRate = playbackSpeed;

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        
        if (playAttemptRef.current) {
          clearTimeout(playAttemptRef.current);
        }
      };
    }
  }, [openPlayer, selectedVideo, updateWatchTime, videoProgress, availableQuizzes, playbackSpeed, videoEnded]);

  // Auto-hide controls
  useEffect(() => {
    if (openPlayer && isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [openPlayer, isPlaying]);

  // Save video progress to localStorage
  useEffect(() => {
    if (Object.keys(videoProgress).length > 0) {
      localStorage.setItem('videoProgress', JSON.stringify(videoProgress));
    }
  }, [videoProgress]);

  const handleNextVideo = () => {
    if (currentIndex < videos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedVideo(videos[nextIndex]);
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedVideo(videos[prevIndex]);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1 || isTransitioning || openPlayer || swipeLockRef.current) return;
    
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchStartTime.current = Date.now();
    isSwiping.current = true;
    isScrolling.current = false;
    swipeDistance.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current || isTransitioning || openPlayer || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartY.current;
    const diffX = touch.clientX - touchStartX.current;
    const absDiffY = Math.abs(diffY);
    const absDiffX = Math.abs(diffX);
    
    // Determine if it's a vertical swipe
    if (!isScrolling.current) {
      if (absDiffY > absDiffX && absDiffY > 10) {
        isScrolling.current = true;
        e.preventDefault();
      } else {
        return;
      }
    }
    
    if (isScrolling.current) {
      e.preventDefault();
      
      // Apply transform with resistance (rAF to keep it smooth)
      const resistance = 0.3;
      const boundedDiff = diffY * resistance;
      swipeDistance.current = diffY;
      
      if (containerRef.current) {
        if (swipeRafRef.current) cancelAnimationFrame(swipeRafRef.current);
        swipeRafRef.current = requestAnimationFrame(() => {
          if (!containerRef.current) return;
          containerRef.current.style.transform = `translate3d(0, ${boundedDiff}px, 0)`;
          containerRef.current.style.transition = 'none';
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current || isTransitioning || openPlayer || swipeLockRef.current) {
      resetSwipe();
      return;
    }
    
    const diffY = swipeDistance.current;
    const absDiffY = Math.abs(diffY);
    const timeDiff = Date.now() - touchStartTime.current;
    
    // Reset transform
    if (containerRef.current) {
      containerRef.current.style.transform = 'translate3d(0, 0, 0)';
      containerRef.current.style.transition = 'transform 0.2s ease-out';
    }
    
    const isValidSwipe = absDiffY > SWIPE_THRESHOLD && timeDiff < SWIPE_TIME_LIMIT;
    const isForceSwipe = absDiffY > 140;
    
    const now = Date.now();
    if (now - swipeCooldownRef.current < 450) {
      resetSwipe();
      return;
    }

    if ((isValidSwipe || isForceSwipe) && isScrolling.current) {
      if (diffY < 0 && currentIndex < videos.length - 1) {
        // Swipe up - next video
        swipeLockRef.current = true;
        swipeCooldownRef.current = now;
        setIsTransitioning(true);
        const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
        setCurrentIndex(nextIndex);
        setSelectedVideo(videos[nextIndex]);
        
        if (window.navigator.vibrate) {
          window.navigator.vibrate(20);
        }
      } else if (diffY > 0 && currentIndex > 0) {
        // Swipe down - previous video
        swipeLockRef.current = true;
        swipeCooldownRef.current = now;
        setIsTransitioning(true);
        const prevIndex = Math.max(currentIndex - 1, 0);
        setCurrentIndex(prevIndex);
        setSelectedVideo(videos[prevIndex]);
        
        if (window.navigator.vibrate) {
          window.navigator.vibrate(20);
        }
      } else if (currentIndex === 0 && diffY > 100) {
        // Pull down on first video - show stats
        setShowStats(true);
        setTimeout(() => setShowStats(false), 3000);
      }
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
      swipeLockRef.current = false;
    }, 320);
    
    resetSwipe();
  };

  const handleTouchCancel = () => {
    resetSwipe();
  };

  const resetSwipe = () => {
    isSwiping.current = false;
    isScrolling.current = false;
    swipeDistance.current = 0;
    if (swipeRafRef.current) {
      cancelAnimationFrame(swipeRafRef.current);
      swipeRafRef.current = null;
    }
    
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.transition = '';
    }
  };

  // Handle video click - IMPROVED VERSION
  const handleVideoClick = async (video, index) => {
    if (isTransitioning || isSwiping.current) return;
    
    // Pause current video in reels
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.pause();
    }
    
    // Close sidebar if open
    setSidebarOpen(false);
    
    // Reset states
    setVideoReady(false);
    setVideoEnded(false);
    setShowQuizPrompt(false);
    setShowSettings(false);
    setCurrentTime(videoProgress[video.id] || 0);
    
    // Set selected video and open player
    setSelectedVideo(video);
    setOpenPlayer(true);
    setShowControls(true);
    
    // Small delay to ensure dialog is mounted
    setTimeout(() => {
      if (fullVideoRef.current) {
        // Set playback rate
        fullVideoRef.current.playbackRate = playbackSpeed;
        
        // Restore progress
        if (videoProgress[video.id] && videoProgress[video.id] > 0) {
          fullVideoRef.current.currentTime = videoProgress[video.id];
        }
        
        // Attempt to play
        attemptPlay(fullVideoRef.current).then(success => {
          setIsPlaying(success);
          if (!success) {
            // If autoplay fails, show play button
            setShowControls(true);
          }
        });
      }
    }, 200);
  };

  // Full screen player handlers
  const handleClosePlayer = () => {
    // Save current progress before closing
    if (fullVideoRef.current && selectedVideo) {
      setVideoProgress(prev => ({
        ...prev,
        [selectedVideo.id]: fullVideoRef.current.currentTime
      }));
    }
    
    setOpenPlayer(false);
    setSelectedVideo(null);
    setIsPlaying(false);
    setVideoReady(false);
    setShowSettings(false);
    setVideoEnded(false);
    setShowQuizPrompt(false);
    
    // Resume main reel video
    setTimeout(() => {
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        if (videoProgress[videos[currentIndex]?.id]) {
          currentVideo.currentTime = videoProgress[videos[currentIndex].id];
        }
        attemptPlay(currentVideo);
      }
    }, 300);
  };

  const togglePlayPause = (e) => {
    e?.stopPropagation();
    if (!fullVideoRef.current) return;
    
    if (isPlaying) {
      fullVideoRef.current.pause();
    } else {
      attemptPlay(fullVideoRef.current);
      setVideoEnded(false);
    }
    setShowControls(true);
  };

  const toggleFullscreen = async (e) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        if (playerContainerRef.current?.requestFullscreen) {
          await playerContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (event, newValue) => {
    if (fullVideoRef.current) {
      fullVideoRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (fullVideoRef.current) {
      fullVideoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  const skipForward = (e) => {
    e.stopPropagation();
    if (fullVideoRef.current) {
      fullVideoRef.current.currentTime = Math.min(fullVideoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = (e) => {
    e.stopPropagation();
    if (fullVideoRef.current) {
      fullVideoRef.current.currentTime = Math.max(fullVideoRef.current.currentTime - 10, 0);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    setShowSettings(false);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const normalizeMediaUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/')) return src;
    return `/${src}`;
  };

  const attemptPlay = async (videoEl) => {
    if (!videoEl) return false;
    
    try {
      // Ensure video is not paused
      if (videoEl.paused) {
        // Set muted state before playing
        videoEl.muted = muted;
        await videoEl.play();
        return true;
      }
      return true;
    } catch (err) {
      console.log('Play failed:', err);
      // Try with sound off if autoplay failed
      if (err.name === 'NotAllowedError') {
        videoEl.muted = true;
        try {
          await videoEl.play();
          return true;
        } catch (retryErr) {
          console.log('Retry failed:', retryErr);
          return false;
        }
      }
      return false;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [achievementsRes, videosRes, quizzesRes] = await Promise.allSettled([
        axios.get('/api/achievements/user', { headers }),
        axios.get('/api/content?type=video&limit=20&sort=createdAt&order=desc', { headers }),
        axios.get('/api/quizzes/available', { headers })
      ]);

      if (achievementsRes.status === 'fulfilled') {
        setAchievements(achievementsRes.value.data || []);
      }

      if (videosRes.status === 'fulfilled') {
        const fetchedVideos = videosRes.value.data?.contents || [];
        
        // More flexible filtering
        const playable = fetchedVideos.filter(v => {
          return v.videoUrl || v.videoFile || v.video?.url || v.contentUrl;
        }).map(v => ({
          ...v,
          videoUrl: v.videoUrl || v.videoFile || v.video?.url || v.contentUrl,
          thumbnail: v.thumbnail || v.thumb || '/default-thumbnail.jpg',
          title: v.title || 'Untitled Video',
          description: v.description || 'No description available'
        }));
        
        setVideos(playable);
        console.log('Loaded videos:', playable.length);
      }

      if (quizzesRes.status === 'fulfilled') {
        setAvailableQuizzes(quizzesRes.value.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    setMuted(!muted);
    videoRefs.current.forEach(video => { 
      if (video) video.muted = !muted; 
    });
    if (fullVideoRef.current) {
      fullVideoRef.current.muted = !muted;
      // If unmuting and video is playing, ensure it continues playing
      if (!muted && isPlaying && fullVideoRef.current.paused) {
        attemptPlay(fullVideoRef.current);
      }
    }
  };

  const toggleLike = (videoId, e) => {
    e?.stopPropagation();
    setLiked(prev => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const handleTakeQuiz = () => {
    setShowQuizPrompt(false);
    setOpenPlayer(false);
    navigate(`/quiz/${currentVideoQuiz?.id}`);
  };

  const handleRetryVideo = (videoId, e) => {
    e.stopPropagation();
    setVideoErrors(prev => ({ ...prev, [videoId]: false }));
    setVideoLoading(prev => ({ ...prev, [videoId]: true }));
    
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.load();
      setTimeout(() => attemptPlay(video), 500);
    }
  };

  const formatWatchTime = (seconds) => {
    const totalSeconds = Number(seconds) || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleInlineTimeUpdate = (index, videoId, currentTime) => {
    if (openPlayer) return;
    if (index !== currentIndex) return;
    const delta = currentTime - (inlineLastTimeRef.current || 0);
    inlineLastTimeRef.current = currentTime;
    if (delta > 0 && delta < 3) {
      inlineWatchAccumulatorRef.current += delta;
      if (inlineWatchAccumulatorRef.current >= 5) {
        const sendSeconds = Math.floor(inlineWatchAccumulatorRef.current);
        inlineWatchAccumulatorRef.current -= sendSeconds;
        updateWatchTime(videoId, sendSeconds);
      }
    }
  };

  const gradeProgress = getGradeProgress(user?.grade);
  const quizStats = getQuizStats();
  
  const progressItems = [
    { label: 'Grade', value: user?.grade || 'N/A', icon: School, color: '#FF6B6B' },
    { label: 'Progress', value: `${gradeProgress}%`, icon: AutoGraph, color: '#4ECDC4' },
    { label: 'Watch Time', value: formatWatchTime(watchTimeStats?.totalWatchTime || 0), icon: Schedule, color: '#FFD93D' },
    { label: 'Points', value: user?.points || 0, icon: Star, color: '#6C5CE7' }
  ];

  const quizProgressItems = [
    { label: 'Quizzes', value: quizStats.totalTaken, icon: Quiz, color: '#A8E6CF' },
    { label: 'Avg. Score', value: `${quizStats.averageScore}%`, icon: TrendingUp, color: '#FF8B94' },
    { label: 'Streak', value: `${quizStats.currentStreak}d`, icon: LocalFireDepartment, color: '#FFA07A' }
  ];

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#0A0A0A',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Loading your feed...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#0A0A0A',
      overflow: 'hidden',
      position: 'relative',
      width: '100%'
    }}>
      {/* Top Bar - Fixed position with proper z-index */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ 
              color: 'white', 
              pointerEvents: 'auto',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', letterSpacing: 0.5 }}>
              Welcome back,
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              color: 'white', 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.2
            }}>
              {user?.name?.split(' ')[0]}! 👋
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, pointerEvents: 'auto' }}>
          <IconButton 
            onClick={toggleMute} 
            size="small"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          >
            {muted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
          </IconButton>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box sx={{ 
                width: 10, 
                height: 10, 
                bgcolor: '#4ECDC4', 
                borderRadius: '50%',
                border: '2px solid #0A0A0A'
              }} />
            }
          >
            <Avatar 
              src={user?.avatar} 
              sx={{ 
                border: '2px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                bgcolor: '#6C5CE7'
              }}
              onClick={() => navigate('/profile')}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </Box>
      </Box>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(5px)',
                zIndex: 1001
              }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 280,
                background: 'rgba(20,20,20,0.98)',
                backdropFilter: 'blur(20px)',
                zIndex: 1002,
                borderRight: '1px solid rgba(255,255,255,0.1)',
                overflowY: 'auto'
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 700 }}>
                  Menu
                </Typography>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    navigate('/study');
                    setSidebarOpen(false);
                  }}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    color: 'white', 
                    py: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  startIcon={<Book />}
                >
                  Study
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    navigate('/play#quizzes');
                    setSidebarOpen(false);
                  }}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    color: 'white', 
                    py: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  startIcon={<Quiz />}
                >
                  Quizzes
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    navigate('/profile');
                    setSidebarOpen(false);
                  }}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    color: 'white', 
                    py: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  startIcon={<School />}
                >
                  Profile
                </Button>
              </Box>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats Pull-down */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              top: 70,
              left: 12,
              right: 12,
              zIndex: 900
            }}
          >
            <Paper sx={{ 
              p: 2, 
              borderRadius: 4,
              bgcolor: 'rgba(20,20,20,0.95)',
              backdropFilter: 'blur(20px)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, opacity: 0.7, fontSize: '0.8rem', letterSpacing: 1 }}>
                TODAY'S PROGRESS
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                {progressItems.map(item => (
                  <Box key={item.label} sx={{ textAlign: 'center' }}>
                    <Box sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '50%', 
                      bgcolor: alpha(item.color, 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 0.5
                    }}>
                      <item.icon sx={{ color: item.color, fontSize: 18 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                {quizProgressItems.map(item => (
                  <Box key={item.label} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: item.color }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Hint */}
      {videos.length > 0 && !openPlayer && currentIndex === 0 && (
        <Fade in={true} timeout={2000}>
          <Box sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
            pointerEvents: 'none',
            textAlign: 'center'
          }}>
            <Paper sx={{ 
              bgcolor: 'rgba(20,20,20,0.9)', 
              color: 'white', 
              p: 2,
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <KeyboardArrowUp sx={{ animation: 'bounce 1s infinite' }} />
                  <KeyboardArrowDown sx={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Swipe up/down for more videos
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Tap video for fullscreen
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Video Reels Container */}
      <Box
        ref={containerRef}
        sx={{
          height: '100%',
          overflow: 'hidden',
          touchAction: 'none',
          overscrollBehavior: 'contain',
          position: 'relative',
          willChange: 'transform',
          pt: '70px', // Add padding to account for fixed top bar
          pb: { xs: '120px', sm: '140px' } // Add padding for bottom cards
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Videos Stack */}
        {videos.map((video, index) => (
          <Box
            key={video.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: index === currentIndex ? 1 : 0,
              visibility: index === currentIndex || Math.abs(index - currentIndex) === 1 ? 'visible' : 'hidden',
              zIndex: index === currentIndex ? 2 : 1,
              transition: isTransitioning ? 'opacity 0.3s ease' : 'none',
              pointerEvents: index === currentIndex ? 'auto' : 'none',
              bgcolor: '#0A0A0A'
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => handleVideoClick(video, index)}
            >
              {/* Video Element */}
              <video
                ref={el => videoRefs.current[index] = el}
                src={normalizeMediaUrl(video.videoUrl)}
                poster={normalizeMediaUrl(video.thumbnail)}
                muted={muted}
                loop
                playsInline
                onTimeUpdate={(e) => handleInlineTimeUpdate(index, video.id, e.currentTarget.currentTime)}
                preload={index === currentIndex ? 'auto' : 'metadata'}
                onError={() => setVideoErrors(prev => ({ ...prev, [video.id]: true }))}
                onLoadedData={() => {
                  setVideoErrors(prev => ({ ...prev, [video.id]: false }));
                  setVideoLoading(prev => ({ ...prev, [video.id]: false }));
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: videoErrors[video.id] ? 0.5 : 1
                }}
              />

              {/* Loading Indicator */}
              {videoLoading[video.id] && index === currentIndex && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5
                }}>
                  <CircularProgress sx={{ color: '#4ECDC4' }} />
                </Box>
              )}

              {/* Error State */}
              {videoErrors[video.id] && index === currentIndex && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5,
                  textAlign: 'center',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  p: 2,
                  borderRadius: 2
                }}>
                  <Typography color="white" gutterBottom>
                    Video unavailable
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleRetryVideo(video.id, e)}
                    startIcon={<Refresh />}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Retry
                  </Button>
                </Box>
              )}

              {/* Video Title Overlay */}
              {index === currentIndex && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  color: 'white',
                  p: { xs: 1.5, sm: 2 },
                  pb: { xs: 8, sm: 10 }
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.9rem', sm: '1rem' }, 
                    mb: 0.5,
                    lineHeight: 1.3
                  }}>
                    {video.title}
                  </Typography>

                  {/* Video Progress Bar */}
                  {videoProgress[video.id] && video.duration && (
                    <Box sx={{ mt: 1, mb: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(videoProgress[video.id] / video.duration) * 100}
                        sx={{
                          height: 2,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#4ECDC4' }
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Video Counter removed */}
            </Box>
          </Box>
        ))}

        {/* Progress Indicator */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          right: 4,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          zIndex: 3
        }}>
          {videos.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 4,
                height: index === currentIndex ? 20 : 4,
                borderRadius: 2,
                bgcolor: index === currentIndex ? '#4ECDC4' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Full Screen Video Player - IMPROVED VERSION */}
      <ReelPlayer 
        open={openPlayer}
        onClose={handleClosePlayer}
        video={selectedVideo}
        onWatchTime={(seconds) => updateWatchTime(selectedVideo?.id, seconds)}
        onNext={handleNextVideo}
        onPrev={handlePrevVideo}
        hasMore={currentIndex < videos.length - 1}
        hasPrev={currentIndex > 0}
      />

      {/* Progress + Achievements Card */}
      {(achievements.length > 0 || progressItems.length > 0) && (
        <Paper sx={{
          position: 'fixed',
          bottom: { xs: '70px', sm: '80px' },
          left: { xs: 8, sm: 12 },
          right: { xs: 8, sm: 12 },
          bgcolor: 'rgba(20,20,20,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          p: { xs: 1, sm: 1.5 },
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 10,
          maxWidth: { sm: '400px', md: '500px' },
          mx: 'auto'
        }}>
          {/* Quick Stats */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, 1fr)' }, 
            gap: { xs: 0.75, sm: 1 },
            mb: achievements.length > 0 ? 1.5 : 0
          }}>
            {progressItems.map((item) => (
              <Box
                key={item.label}
                sx={{ 
                  textAlign: 'center',
                  minWidth: 0
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5
                }}>
                  <item.icon sx={{ color: item.color, fontSize: { xs: 16, sm: 18 } }} />
                </Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.8rem' }, lineHeight: 1.2 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.52rem', sm: '0.55rem' }, display: 'block', lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Achievements */}
          {achievements.length > 0 && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1.5 }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    fontWeight: 600
                  }}>
                    <EmojiEvents sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5, color: '#FFD93D' }} />
                    ACHIEVEMENTS
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/achievements')} 
                    sx={{ 
                      color: '#4ECDC4', 
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(78,205,196,0.1)' }
                    }}
                  >
                    View All
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, overflow: 'auto', pb: 0.5 }}>
                  {achievements.slice(0, 5).map((achievement) => (
                    <Chip
                      key={achievement.id}
                      icon={<EmojiEvents sx={{ fontSize: { xs: '0.7rem !important', sm: '0.8rem !important' } }} />}
                      label={achievement.name}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#FFD93D', 0.15),
                        color: '#FFD93D',
                        height: { xs: 22, sm: 24 },
                        border: '1px solid rgba(255, 217, 61, 0.3)',
                        '& .MuiChip-label': { fontSize: { xs: '0.6rem', sm: '0.65rem' }, px: 1, fontWeight: 500 }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Quick Action Buttons */}
      <Box sx={{
        position: 'fixed',
        bottom: 'env(safe-area-inset-bottom, 16px)',
        left: { xs: 8, sm: 12 },
        right: { xs: 8, sm: 12 },
        display: 'flex',
        gap: 1,
        zIndex: 10,
        maxWidth: { sm: '400px', md: '500px' },
        mx: 'auto'
      }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/study')}
          startIcon={<Book />}
          sx={{ 
            borderRadius: 3,
            textTransform: 'none',
            py: { xs: 1, sm: 1.2 },
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            fontWeight: 600,
            bgcolor: '#4ECDC4',
            color: '#0A0A0A',
            '&:hover': { bgcolor: '#45b8b0' }
          }}
        >
          Study
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/play#quizzes')}
          startIcon={<Quiz />}
          sx={{ 
            borderRadius: 3,
            textTransform: 'none',
            py: { xs: 1, sm: 1.2 },
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            fontWeight: 600,
            bgcolor: '#FF6B6B',
            color: 'white',
            '&:hover': { bgcolor: '#ff5252' }
          }}
        >
          Quiz
        </Button>
      </Box>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
      `}</style>
    </Box>
  );
};

export default StudentDashboard;
