/**
 * Lifecycle hooks for the Achievement model
 */

export default {
  beforeCreate(event) {
    const { data } = event.params;
    
    // Ensure tags is always a valid JSON array when empty or undefined
    if (!data.tags || data.tags === '') {
      data.tags = [];
    }
  },
  
  beforeUpdate(event) {
    const { data } = event.params;
    
    // Ensure tags is always a valid JSON array when empty or undefined
    if (data.tags !== undefined && (data.tags === '' || data.tags === null)) {
      data.tags = [];
    }
  }
} 