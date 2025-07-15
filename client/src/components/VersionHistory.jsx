import React, { useState, useEffect } from 'react'
import './VersionHistory.css'

const VersionHistory = ({ socket, roomId, onClose, onRestore }) => {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVersion, setSelectedVersion] = useState(null)
  
  useEffect(() => {
    if (socket && roomId) {
      // Listen for version history
      socket.on('version-history', (data) => {
        setVersions(data)
        setLoading(false)
      })
      
      socket.on('error', (error) => {
        setError(error.message)
        setLoading(false)
      })
      
      // Request version history
      socket.emit('get-version-history', { roomId, limit: 20 })
    }
    
    return () => {
      if (socket) {
        socket.off('version-history')
        socket.off('error')
      }
    }
  }, [socket, roomId])
  
  const handleRestore = (versionId) => {
    if (window.confirm('Are you sure you want to restore this version? Current content will be replaced.')) {
      onRestore(versionId)
      onClose()
    }
  }
  
  const handlePreview = (version) => {
    setSelectedVersion(version)
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }
  
  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }
  
  return (
    <div className="version-history-overlay">
      <div className="version-history">
        <div className="version-history-header">
          <h2>Version History</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <span>Loading versions...</span>
          </div>
        )}
        
        <div className="version-history-content">
          {!loading && versions.length === 0 && (
            <div className="no-versions">
              <p>No version history available</p>
            </div>
          )}
          
          {!loading && versions.length > 0 && (
            <div className="versions-container">
              <div className="versions-list">
                <h3>Versions</h3>
                <div className="versions-scroll">
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''}`}
                      onClick={() => handlePreview(version)}
                    >
                      <div className="version-info">
                        <div className="version-date">
                          {formatDate(version.created_at)}
                        </div>
                        <div className="version-author">
                          by {version.created_by || 'Unknown'}
                        </div>
                        <div className="version-preview">
                          {truncateContent(version.content)}
                        </div>
                      </div>
                      <div className="version-actions">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreview(version)
                          }}
                        >
                          Preview
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestore(version.id)
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="version-preview-panel">
                {selectedVersion ? (
                  <div className="preview-content">
                    <h3>Preview</h3>
                    <div className="preview-meta">
                      <div><strong>Date:</strong> {formatDate(selectedVersion.created_at)}</div>
                      <div><strong>Author:</strong> {selectedVersion.created_by || 'Unknown'}</div>
                      <div><strong>Size:</strong> {selectedVersion.content.length} characters</div>
                    </div>
                    <div className="preview-text">
                      <textarea
                        value={selectedVersion.content}
                        readOnly
                        className="preview-textarea"
                      />
                    </div>
                    <div className="preview-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleRestore(selectedVersion.id)}
                      >
                        Restore This Version
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-preview">
                    <p>Select a version to preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VersionHistory
