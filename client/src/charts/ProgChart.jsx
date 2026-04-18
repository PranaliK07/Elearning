import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ProgressChart = ({ type = 'bar', data, options, height = 300 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const renderChart = () => {
    switch(type) {
      case 'bar':
        return <Bar data={data} options={{ ...defaultOptions, ...options }} />;
      case 'doughnut':
        return <Doughnut data={data} options={{ ...defaultOptions, ...options }} />;
      default:
        return <Bar data={data} options={{ ...defaultOptions, ...options }} />;
    }
  };

  if (!data) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No data available</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height, width: '100%' }}>
      {renderChart()}
    </Box>
  );
};

export default ProgressChart;
