import apiClient from './api.service.js'

class BabyClassSkillService {
  constructor() {
    this.baseUrl = '/BabyClassSkills'
  }

  // Get all baby class skills
  async getAllSkills() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/skills`)
      return response.data
    } catch (error) {
      console.error('Error fetching baby class skills:', error)
      throw error
    }
  }

  // Get skill items for a specific skill
  async getSkillItems(skillId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/skills/${skillId}/items`)
      return response.data
    } catch (error) {
      console.error('Error fetching skill items:', error)
      throw error
    }
  }

  // Get student skill assessments
  async getStudentAssessments(studentId, academicYear, term) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/students/${studentId}/assessments`, {
        params: { academicYear, term }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching student assessments:', error)
      throw error
    }
  }

  // Create or update a skill assessment
  async createOrUpdateAssessment(assessmentData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/assessments`, assessmentData)
      return response.data
    } catch (error) {
      console.error('Error creating/updating assessment:', error)
      throw error
    }
  }

  // Update an existing skill assessment
  async updateAssessment(assessmentData) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/assessments`, assessmentData)
      return response.data
    } catch (error) {
      console.error('Error updating assessment:', error)
      throw error
    }
  }

  // Delete a skill assessment
  async deleteAssessment(assessmentId) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/assessments/${assessmentId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting assessment:', error)
      throw error
    }
  }

  // Get class skill assessments
  async getClassAssessments(gradeId, academicYear, term) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/classes/${gradeId}/assessments`, {
        params: { academicYear, term }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching class assessments:', error)
      throw error
    }
  }
}

export const babyClassSkillService = new BabyClassSkillService()