import React from 'react';

interface MinimalButtonProps {
  onClick: () => void;
  title?: string;
  color?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const MinimalButton: React.FC<MinimalButtonProps> = ({ 
  onClick, 
  title, 
  color = 'var(--text-muted)', 
  children,
  disabled = false
}) => {
  return (
    <button 
      onClick={onClick}
      style={{ 
        background: 'none', 
        border: 'none', 
        color, 
        cursor: disabled ? 'default' : 'pointer', 
        display: 'flex', 
        alignItems: 'center',
        padding: '2px',
        opacity: disabled ? 0.5 : 1
      }}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
