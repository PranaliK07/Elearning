import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [progress, setProgress] = useState([]);
  const [watchTimeStats, setWatchTimeStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProgress();
      fetchWatchTimeStats();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchTimeStats = async () => {
    try {
      const response = await axios.get('/api/progress/watchtime', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWatchTimeStats(response.data);
    } catch (error) {
      console.error('Error fetching watch time stats:', error);
    }
  };

  const updateProgress = async (contentId, data) => {
    try {
      const response = await axios.post('/api/progress/update', 
        { contentId, ...data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local progress
      setProgress(prev => {
        const index = prev.findIndex(p => p.ContentId === contentId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = response.data;
          return updated;
        }
        return [...prev, response.data];
      });

      // Refresh watch time stats
      fetchWatchTimeStats();

      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      return { success: false };
    }
  };

  const updateWatchTime = async (contentId, secondsWatched = 0) => {
    if (!contentId || !secondsWatched || Number.isNaN(secondsWatched)) {
      return { success: false };
    }
    const seconds = Math.max(0, Math.floor(secondsWatched));
    if (seconds <= 0) return { success: false };
    return updateProgress(contentId, { watchTime: seconds });
  };

  const getContentProgress = (contentId) => {
    return progress.find(p => p.ContentId === contentId);
  };

  const getGradeProgress = (gradeId) => {
    const normalizedGradeId = Number(gradeId);
    const gradeContents = progress.filter((p) => Number(p.Content?.Topic?.Subject?.GradeId) === normalizedGradeId);
    if (gradeContents.length === 0) return 0;
    
    const completed = gradeContents.filter(p => p.completed).length;
    return Math.round((completed / gradeContents.length) * 100);
  };

  const getSubjectProgress = (subjectId) => {
    const normalizedSubjectId = Number(subjectId);
    const subjectContents = progress.filter((p) => Number(p.Content?.Topic?.SubjectId) === normalizedSubjectId);
    if (subjectContents.length === 0) return 0;
    
    const completed = subjectContents.filter(p => p.completed).length;
    return Math.round((completed / subjectContents.length) * 100);
  };

  const getQuizStats = () => {
    const quizEntries = progress.filter((p) => p.quizScore !== null && p.quizScore !== undefined);
    const totalTaken = quizEntries.length;
    const averageScore = totalTaken
      ? Math.round(quizEntries.reduce((sum, p) => sum + (p.quizScore || 0), 0) / totalTaken)
      : 0;
    return {
      totalTaken,
      averageScore,
      currentStreak: user?.streak || 0
    };
  };

  const value = {
    progress,
    watchTimeStats,
    loading,
    updateProgress,
    getContentProgress,
    getGradeProgress,
    getSubjectProgress,
    updateWatchTime,
    getQuizStats,
    refreshStats: fetchWatchTimeStats
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
