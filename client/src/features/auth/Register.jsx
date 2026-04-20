import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateSelectRequired
} from '../../utils/validation';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    grade: '',
    parentPhone: '',
    parentEmail: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const steps = ['Personal Info', 'Account Details', 'Preferences'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      const nameError = validateName(formData.name, 'Full name');
      if (nameError) newErrors.name = nameError;
    }
    
    if (activeStep === 1) {
      const emailError = validateEmail(formData.email);
      const passwordError = validatePassword(formData.password);
      if (emailError) newErrors.email = emailError;
      if (passwordError) newErrors.password = passwordError;
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (activeStep === 2) {
      if (formData.role === 'student') {
        const gradeError = validateSelectRequired(formData.grade, 'Grade');
        if (gradeError) newErrors.grade = gradeError;
      }
      if (formData.role === 'student') {
        if (!formData.parentPhone) {
          newErrors.parentPhone = 'Parent mobile is required';
        } else if (!/^[+\d][\d\s()-]{6,19}$/.test(formData.parentPhone)) {
          newErrors.parentPhone = 'Enter a valid parent mobile number';
        }
        if (!formData.parentEmail) {
          newErrors.parentEmail = 'Parent email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.parentEmail)) {
          newErrors.parentEmail = 'Enter a valid parent email';
        }
      }
    }
    
    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    setLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
              variant="outlined"
              placeholder="Enter your full name"
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              variant="outlined"
              placeholder="Enter your email"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <TextField
              select
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            {formData.role === 'student' && (
              <TextField
                select
                fullWidth
                label="Grade/Class"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                error={!!errors.grade}
                helperText={errors.grade}
                margin="normal"
                variant="outlined"
              >
                <MenuItem value="">Select Grade</MenuItem>
                <MenuItem value={1}>Class 1</MenuItem>
                <MenuItem value={2}>Class 2</MenuItem>
                <MenuItem value={3}>Class 3</MenuItem>
                <MenuItem value={4}>Class 4</MenuItem>
                <MenuItem value={5}>Class 5</MenuItem>
              </TextField>
            )}

            {formData.role === 'student' && (
              <TextField
                fullWidth
                label="Parent Mobile"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                error={!!errors.parentPhone}
                helperText={errors.parentPhone || 'Required for assignment reminders'}
                margin="normal"
                variant="outlined"
                placeholder="+1 555 123 4567"
                required
              />
            )}

            {formData.role === 'student' && (
              <TextField
                fullWidth
                label="Parent Email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                error={!!errors.parentEmail}
                helperText={errors.parentEmail || 'Required for assignment reminders'}
                margin="normal"
                variant="outlined"
                placeholder="parent@example.com"
                required
              />
            )}
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            marginTop: { xs: 2, sm: 4 },
            marginBottom: { xs: 2, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: { xs: 2.5, sm: 4 },
              width: '100%',
              borderRadius: 4
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontFamily: '"Comic Neue", cursive',
                fontWeight: 'bold',
                color: 'primary.main'
              }}
            >
              Join Kids Learn! 🎓
            </Typography>
            
            <Typography
              variant="body2"
              align="center"
              color="textSecondary"
              sx={{ mb: 3 }}
            >
              Create your account and start learning
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form>
              {getStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  variant="outlined"
                >
                  Back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    variant="contained"
                  >
                    Next
                  </Button>
                )}
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: '#0B1F3B',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Login here
                  </Link>
                </Typography>
              </Box>
            </form>
          </Paper>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Register;

