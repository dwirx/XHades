import React, { useState } from 'react'
import './ActiveUsers.css'

const ActiveUsers = ({ users }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }
  
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Just now'
    
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    
    return lastSeenDate.toLocaleDateString()
  }
  
  return (
    <div className="active-users">
      <div className="active-users-trigger" onClick={toggleDropdown}>
        <div className="active-users-avatars">
          {users.slice(0, 3).map((user) => (
            <div
              key={user.user_id}
              className="user-avatar"
              style={{
                backgroundColor: user.color,
                color: getContrastColor(user.color)
              }}
              title={user.user_name}
            >
              {user.user_name.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 3 && (
            <div className="user-avatar more-users">
              +{users.length - 3}
            </div>
          )}
        </div>
        <span className="active-users-count">{users.length} active</span>
      </div>
      
      {showDropdown && (
        <div className="active-users-dropdown">
          <div className="dropdown-header">
            <h3>Active Users</h3>
            <button 
              className="close-dropdown"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>
          
          <div className="users-list">
            {users.length === 0 ? (
              <div className="no-users">
                <p>No active users</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.user_id} className="user-item">
                  <div
                    className="user-avatar"
                    style={{
                      backgroundColor: user.color,
                      color: getContrastColor(user.color)
                    }}
                  >
                    {user.user_name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="user-info">
                    <div className="user-name">{user.user_name}</div>
                    <div className="user-status">
                      <div 
                        className="status-indicator"
                        style={{ backgroundColor: user.color }}
                      />
                      <span className="last-seen">
                        {formatLastSeen(user.last_seen)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-cursor-info">
                    <div className="cursor-position">
                      Position: {user.cursor_position || 0}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {showDropdown && (
        <div 
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

// Helper function to get contrast color for text
const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return '#ffffff'
  
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export default ActiveUsers
