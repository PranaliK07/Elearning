import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import { NotificationProvider } from './context/notificationContext';
import { ProgressProvider } from './context/ProgressContext';
import ProtectedRoute from './features/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import DashboardRouter from './features/Dashboard/DashboardRouter';
//import LandingPage from './features/landing/LandingPage';

import GradeSelect from './features/study/GradeSelect';
import StudyMaterial from './features/study/StudyMaterial';
import SubjectSelect from './features/study/SubjectSelect';
import TopicList from './features/study/TopicList';
import TopicContent from './features/study/TopicContent';
import VideoView from './features/play/VideoView';
import PlayHub from './features/play/PlayHub';
import GamePage from './features/play/GamePage';
import WatchTimeStats from './features/progress/WatchTimeStats';
import LessonContent from './features/content/lessonContent';
import QuizStart from './features/quiz/quizStart';
import QuizRunner from './features/quiz/quizRunner';
import QuizResult from './features/quiz/quizResult';
import AchievementsPage from './features/achievements/AchievementsPage';
import ProfileView from './features/profile/ProfileView';
import EditProfile from './features/profile/EditProfile';
import InstagramFeed from './features/feed/InstagramFeed';
import ContentManagement from './features/admin/ContentManagement';
import UserManagement from './features/admin/UserManagement';
import ContentOverview from './features/admin/ContentOverview';
import BusinessSettings from './features/admin/BusinessSettings';
import ReportsIssues from './features/admin/ReportsIssues';
import SystemSettings from './features/admin/SystemSettings';
import AssignmentManagement from './features/teacher/AssignmentManagement';
import Reports from './features/teacher/Reports';
import SubmissionsList from './features/teacher/SubmissionsList';
import StudentAssignmentView from './features/teacher/StudentAssignmentView';
import TopicManager from './features/teacher/TopicManager';
import ClassCommunication from './features/teacher/ClassCommunication';
import TeacherAttendance from './features/attendance/TeacherAttendance';
import StudentAttendance from './features/attendance/StudentAttendance';
import ClassManagement from './features/classes/ClassManagement';
import NotFound from './features/NotFound';
import LandingPage from './features/landing/LandingPage';
import HomeworkList from './features/homework/HomeworkList';
import AboutPage from './features/landing/AboutPage';
import ContactPage from './features/landing/ContactPage';
import Doubts from './features/support/Doubts';
import FeedbackPage from './features/feedback/FeedbackPage';
import CommunicationDetails from './features/communications/CommunicationDetails';



function App() {
  const [mode, setMode] = React.useState('light');

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#0B1F3B',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
      },
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Comic Neue", cursive',
      },
      h2: {
        fontFamily: '"Comic Neue", cursive',
      },
      h3: {
        fontFamily: '"Comic Neue", cursive',
      },
      h4: {
        fontFamily: '"Comic Neue", cursive',
      },
      h5: {
        fontFamily: '"Comic Neue", cursive',
      },
      h6: {
        fontFamily: '"Comic Neue", cursive',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 30,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px -10px rgba(0,0,0,0.2)',
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <ProgressProvider>
              <Router>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      borderRadius: '20px',
                      background: mode === 'light' ? '#fff' : '#333',
                      color: mode === 'light' ? '#333' : '#fff',
                    },
                  }}
                />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected routes with layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard routes */}
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                          <DashboardRouter />
                        </ProtectedRoute>
                      }
                    />

                    {/* Study routes */}
                    <Route path="study">
                      <Route index element={<GradeSelect />} />
                      <Route path="grade/:gradeId" element={<SubjectSelect />} />
                      <Route path="subject/:subjectId" element={<TopicList />} />
                      <Route path="topic/:topicId" element={<TopicContent />} />
                      <Route path="content/:contentId" element={<LessonContent />} />
                    </Route>

                    <Route
                      path="study-material"
                      element={
                        <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                          <StudyMaterial />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="feed" element={<InstagramFeed />} />

                    {/* Admin/Teacher routes */}
                    <Route
                      path="admin/users"
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="admin/content"
                      element={
                        <ProtectedRoute roles={['admin', 'teacher']}>
                          <ContentOverview />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="admin/reports"
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <ReportsIssues />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="admin/business-settings"
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <BusinessSettings />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="admin/system-settings"
                      element={
                        <ProtectedRoute roles={['admin']}>
                          <SystemSettings />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="content/create"
                      element={
                        <ProtectedRoute roles={['admin', 'teacher']}>
                          <ContentManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="assignments">
                      <Route
                        path="create"
                        element={
                          <ProtectedRoute roles={['teacher', 'admin']}>
                            <AssignmentManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path=":assignmentId/submissions"
                        element={
                          <ProtectedRoute roles={['teacher', 'admin']}>
                            <SubmissionsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="view/:assignmentId"
                        element={
                          <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                            <StudentAssignmentView />
                          </ProtectedRoute>
                        }
                      />
                    </Route>

                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="topics/manage"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <TopicManager />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="class-communication"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin', 'student']}>
                          <ClassCommunication />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="attendance"
                      element={
                        <ProtectedRoute roles={['student']}>
                          <StudentAttendance />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="attendance/manage"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <TeacherAttendance />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="classes/manage"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <ClassManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Play routes */}

                    <Route path="play">
                      <Route index element={<PlayHub />} />
                      <Route path="video/:contentId" element={<VideoView />} />
                      <Route path="game/:slug" element={<GamePage />} />
                    </Route>

                    {/* Progress routes */}
                    <Route path="progress">
                      <Route index element={<WatchTimeStats />} />
                      <Route path="weekly" element={<WatchTimeStats weekly />} />
                    </Route>

                    {/* Quiz routes */}
                    <Route path="quiz">
                      <Route path=":quizId/start" element={<QuizStart />} />
                      <Route path=":quizId/run" element={<QuizRunner />} />
                      <Route path=":quizId/result" element={<QuizResult />} />
                    </Route>
                    <Route path="homework" element={
                      <ProtectedRoute roles={['student']}>
                        <HomeworkList />
                      </ProtectedRoute>
                    } />
                    <Route path="doubts" element={
                      <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                        <Doubts />
                      </ProtectedRoute>
                    } />

                    <Route
                      path="feedback"
                      element={
                        <ProtectedRoute roles={['student', 'teacher', 'admin']}>
                          <FeedbackPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="communications/:id"
                      element={
                        <ProtectedRoute roles={['student', 'parent', 'teacher', 'admin']}>
                          <CommunicationDetails />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Achievements */}
                    <Route path="achievements" element={<AchievementsPage />} />

                    {/* Profile */}
                    <Route path="profile">
                      <Route index element={<ProfileView />} />
                      <Route path="edit" element={<EditProfile />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </ProgressProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
