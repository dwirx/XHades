import React, { useState, useEffect } from 'react'
import './UserCursors.css'

const UserCursors = ({ cursors, textareaRef, content }) => {
  const [cursorElements, setCursorElements] = useState([])
  
  useEffect(() => {
    if (!textareaRef.current || !cursors || cursors.length === 0) {
      setCursorElements([])
      return
    }
    
    const textarea = textareaRef.current
    const textareaRect = textarea.getBoundingClientRect()
    const textareaStyle = window.getComputedStyle(textarea)
    
    // Create temporary div to measure text
    const measureDiv = document.createElement('div')
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    measureDiv.style.whiteSpace = 'pre-wrap'
    measureDiv.style.wordWrap = 'break-word'
    measureDiv.style.font = textareaStyle.font
    measureDiv.style.fontSize = textareaStyle.fontSize
    measureDiv.style.fontFamily = textareaStyle.fontFamily
    measureDiv.style.lineHeight = textareaStyle.lineHeight
    measureDiv.style.letterSpacing = textareaStyle.letterSpacing
    measureDiv.style.padding = textareaStyle.padding
    measureDiv.style.border = textareaStyle.border
    measureDiv.style.width = textareaStyle.width
    measureDiv.style.height = 'auto'
    measureDiv.style.overflow = 'hidden'
    
    document.body.appendChild(measureDiv)
    
    const newCursorElements = cursors.map(cursor => {
      try {
        // Get text before cursor position
        const textBeforeCursor = content.substring(0, cursor.cursorPosition)
        measureDiv.textContent = textBeforeCursor
        
        // Get the position of the cursor
        const range = document.createRange()
        const textNode = measureDiv.firstChild
        
        if (textNode) {
          range.setStart(textNode, Math.min(textBeforeCursor.length, textNode.length))
          range.setEnd(textNode, Math.min(textBeforeCursor.length, textNode.length))
          
          const rangeRect = range.getBoundingClientRect()
          const measureRect = measureDiv.getBoundingClientRect()
          
          // Calculate position relative to textarea
          const x = rangeRect.left - measureRect.left + parseInt(textareaStyle.paddingLeft)
          const y = rangeRect.top - measureRect.top + parseInt(textareaStyle.paddingTop)
          
          // Calculate position relative to viewport
          const absoluteX = textareaRect.left + x - textarea.scrollLeft
          const absoluteY = textareaRect.top + y - textarea.scrollTop
          
          return {
            id: cursor.userId,
            userName: cursor.userName,
            color: cursor.color,
            x: absoluteX,
            y: absoluteY,
            visible: absoluteX >= textareaRect.left && 
                    absoluteX <= textareaRect.right && 
                    absoluteY >= textareaRect.top && 
                    absoluteY <= textareaRect.bottom
          }
        }
      } catch (error) {
        console.error('Error calculating cursor position:', error)
      }
      
      return null
    }).filter(Boolean)
    
    document.body.removeChild(measureDiv)
    setCursorElements(newCursorElements)
  }, [cursors, textareaRef, content])
  
  // Update cursor positions on scroll
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const handleScroll = () => {
      // Trigger recalculation on scroll
      setCursorElements(prev => [...prev])
    }
    
    textarea.addEventListener('scroll', handleScroll)
    return () => textarea.removeEventListener('scroll', handleScroll)
  }, [textareaRef])
  
  return (
    <div className="user-cursors">
      {cursorElements.map(cursor => (
        cursor.visible && (
          <div key={cursor.id} className="user-cursor-container">
            <div 
              className="user-cursor"
              style={{
                left: cursor.x,
                top: cursor.y,
                borderColor: cursor.color,
                backgroundColor: cursor.color
              }}
            />
            <div 
              className="user-cursor-label"
              style={{
                left: cursor.x,
                top: cursor.y - 25,
                backgroundColor: cursor.color,
                color: getContrastColor(cursor.color)
              }}
            >
              {cursor.userName}
            </div>
          </div>
        )
      ))}
    </div>
  )
}

// Helper function to get contrast color for text
const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export default UserCursors
