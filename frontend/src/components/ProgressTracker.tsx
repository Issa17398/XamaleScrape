import React from 'react';
import type { ProgressState } from '../types';

interface ProgressTrackerProps {
  progress: ProgressState;
  onCancel?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress, onCancel }) => {
  return (
    <div className="card progress-card fade-in" id="progress-tracker-container">
      <div className="progress-header">
        <div className="status-indicator-live">
          <span className="pulse-beacon" />
          <h3 className="progress-title">Exploration & Extraction en cours</h3>
        </div>
        <span className="percentage-text">{progress.percentage}%</span>
      </div>

      {/* Barre de progression avec dégradé animé */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.percentage}%` }}
          id="progress-bar-element"
        />
      </div>

      {/* Compteurs de pages */}
      <div className="metrics-row">
        <div className="metric-box">
          <span className="metric-label">Étape active</span>
          <span className="metric-value step-highlight">{progress.currentStep}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Pages découvertes</span>
          <span className="metric-value">{progress.pagesFound}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Pages extraites</span>
          <span className="metric-value">{progress.pagesProcessed} / {progress.maxPages}</span>
        </div>
      </div>

      {/* Console de logs en temps réel */}
      <div className="terminal-logs-wrapper">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="terminal-title">Journal d'exécution de la tâche</span>
        </div>
        <div className="terminal-body" id="terminal-logs-body">
          {progress.logs.map((log, index) => (
            <div key={index} className="log-line">
              <span className="log-prefix">&gt;</span>
              <span className="log-text">{log}</span>
            </div>
          ))}
        </div>
      </div>

      {onCancel && (
        <div className="progress-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            id="btn-cancel-task"
          >
            Interrompre la tâche
          </button>
        </div>
      )}
    </div>
  );
};
