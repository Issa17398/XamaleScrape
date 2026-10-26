import React from 'react';

interface ErrorDisplayProps {
  message: string;
  details?: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, details, onRetry }) => {
  return (
    <div className="card error-card fade-in" id="error-display-card">
      <div className="error-icon-box">❌</div>
      <div className="error-content">
        <h3 className="error-title">Échec de l'opération</h3>
        <p className="error-message">{message}</p>
        {details && <pre className="error-details">{details}</pre>}
      </div>
      <div className="error-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onRetry}
          id="btn-retry"
        >
          Modifier l'URL & Réessayer
        </button>
      </div>
    </div>
  );
};
