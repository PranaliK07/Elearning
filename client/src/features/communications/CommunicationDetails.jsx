import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../../utils/axios';

const formatWhen = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return '';
  }
};

const CommunicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/teacher/communications/item/${id}`);
        setItem(data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) toast.error('You are not allowed to view this message');
        else if (status === 404) toast.error('Message not found');
        else toast.error('Failed to load message');
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h5">Message</Typography>
            <Typography variant="caption" color="textSecondary">
              {item?.Grade?.name ? `Class: ${item.Grade.name}` : 'Class: All Classes'}
              {item?.createdAt ? ` • ${formatWhen(item.createdAt)}` : ''}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading && (
          <Typography variant="body2" color="textSecondary">
            Loading...
          </Typography>
        )}

        {!loading && !item && (
          <Typography variant="body2" color="textSecondary">
            No message to display.
          </Typography>
        )}

        {!loading && item && (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {item.title}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {item.message}
            </Typography>
            {item?.teacher?.name && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                From: {item.teacher.name}
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CommunicationDetails;

