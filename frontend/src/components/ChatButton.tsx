import React from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';

interface ChatButtonProps {
  onClick: () => void;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <Tooltip title="ИИ-ассистент" arrow>
      <IconButton
        onClick={onClick}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          width: 44,
          height: 44,
          borderRadius: 2.5,
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: 'primary.dark',
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          },
        }}
      >
        <BotIcon sx={{ fontSize: 24 }} />
      </IconButton>
    </Tooltip>
  );
};

export default ChatButton;
