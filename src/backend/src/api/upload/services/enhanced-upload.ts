/**
 * Enhanced upload service
 */

export default ({ strapi }) => ({
  /**
   * Upload a file and attach it to a specific field of an entry
   */
  async uploadAndAttach(params: {
    id: number
    model: string
    field: string
    file: any
    data?: Record<string, any>
  }) {
    try {
      const { id, model, field, file, data = {} } = params
      
      // Upload the file
      const uploadedFile = await strapi.plugins.upload.services.upload.upload({
        data: {
          fileInfo: {
            alternativeText: data.alternativeText || file.name,
            caption: data.caption || '',
            name: data.name || file.name,
          },
        },
        files: file,
      })
      
      // Get the ID of the first uploaded file (there should be only one)
      const fileId = uploadedFile[0].id
      
      // Update the entry with the file ID
      const updatedEntry = await strapi.entityService.update(model, id, {
        data: {
          [field]: fileId,
        },
      })
      
      return updatedEntry
    } catch (error) {
      strapi.log.error('Error in enhanced upload service:', error)
      throw error
    }
  },
  
  /**
   * Delete a file associated with a specific field of an entry
   */
  async deleteFile(params: {
    id: number
    model: string
    field: string
  }) {
    try {
      const { id, model, field } = params
      
      // Find the entry and get the file ID
      const entry = await strapi.entityService.findOne(model, id, {
        populate: [field],
      })
      
      if (!entry || !entry[field]) {
        return { success: false, message: 'No file found' }
      }
      
      const fileId = entry[field].id
      
      // Delete the file
      await strapi.plugins.upload.services.upload.remove({
        id: fileId,
      })
      
      // Update the entry to remove the file reference
      const updatedEntry = await strapi.entityService.update(model, id, {
        data: {
          [field]: null,
        },
      })
      
      return { success: true, entry: updatedEntry }
    } catch (error) {
      strapi.log.error('Error in enhanced upload service:', error)
      throw error
    }
  },
}) 