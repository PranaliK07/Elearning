import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  MoreVert,
  PushPin,
  VolumeUp,
  Event
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const AnnouncementCard = ({ announcement, onPin, onDelete, onMarkRead }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 3,
        borderLeft: announcement.pinned ? '4px solid #f50057' : 'none',
        bgcolor: announcement.read ? 'background.paper' : 'action.hover'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
            {announcement.pinned ? <PushPin /> : <VolumeUp />}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                {announcement.title}
                {announcement.pinned && (
                  <Chip
                    label="Pinned"
                    size="small"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            </Box>

            <Typography variant="body2" color="textSecondary" paragraph>
              {announcement.content}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`By: ${announcement.author}`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<Event />}
                label={formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                size="small"
                variant="outlined"
              />
              <Chip
                label={announcement.priority}
                size="small"
                color={getPriorityColor(announcement.priority)}
              />
              {announcement.targetAudience && (
                <Chip
                  label={`For: ${announcement.targetAudience}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {!announcement.pinned && (
            <MenuItem onClick={() => { onPin(announcement.id); handleMenuClose(); }}>
              <PushPin sx={{ mr: 1 }} /> Pin Announcement
            </MenuItem>
          )}
          {!announcement.read && (
            <MenuItem onClick={() => { onMarkRead(announcement.id); handleMenuClose(); }}>
              Mark as Read
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
