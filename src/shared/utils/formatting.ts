/**
 * Shared formatting utilities
 */

/**
 * Format a date string to a localized format
 * @param dateString ISO date string
 * @param locale Optional locale
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale = 'en-US'): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Format a number as a file size with units
 * @param bytes Size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Convert snake_case to Title Case
 * @param str Snake case string
 * @returns Title Case string
 */
export const snakeToTitleCase = (str: string): string => {
  if (!str) return ''
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Generate a placeholder image URL with specific dimensions
 * @param width Width in pixels
 * @param height Height in pixels
 * @param text Optional text to display
 * @returns Placeholder image URL
 */
export const getPlaceholderImage = (width: number, height: number, text = ''): string => {
  return `https://via.placeholder.com/${width}x${height}${text ? `?text=${encodeURIComponent(text)}` : ''}`
} 