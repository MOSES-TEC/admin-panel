import React, { useState } from 'react';
import { FaCopy, FaTimes } from 'react-icons/fa';

const JsonViewer = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="json-viewer-overlay">
      <div className="json-viewer-container">
        <div className="json-viewer-header">
          <h3>JSON Data</h3>
          <div className="json-viewer-actions">
            <button 
              onClick={copyToClipboard}
              className="json-viewer-copy-btn"
              title="Copy to clipboard"
            >
              <FaCopy />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button 
              onClick={onClose}
              className="json-viewer-close-btn"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="json-viewer-content">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
      <style jsx global>{`
        .json-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .json-viewer-container {
          background: #1e1e1e;
          border-radius: 12px;
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .json-viewer-header {
          background: #252526;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
        }

        .json-viewer-header h3 {
          margin: 0;
          color: #fff;
          font-size: 18px;
          font-weight: 500;
        }

        .json-viewer-actions {
          display: flex;
          gap: 12px;
        }

        .json-viewer-copy-btn,
        .json-viewer-close-btn {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s;
        }

        .json-viewer-copy-btn:hover {
          background: #2d2d2d;
        }

        .json-viewer-close-btn:hover {
          background: #dc2626;
        }

        .json-viewer-content {
          padding: 20px;
          overflow: auto;
          flex: 1;
        }

        .json-viewer-content pre {
          margin: 0;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        /* Syntax highlighting */
        .json-viewer-content pre {
          color: #d4d4d4;
        }

        .json-viewer-content pre .string {
          color: #ce9178;
        }

        .json-viewer-content pre .number {
          color: #b5cea8;
        }

        .json-viewer-content pre .boolean {
          color: #569cd6;
        }

        .json-viewer-content pre .null {
          color: #569cd6;
        }

        .json-viewer-content pre .key {
          color: #9cdcfe;
        }
      `}</style>
    </div>
  );
};

export default JsonViewer; 