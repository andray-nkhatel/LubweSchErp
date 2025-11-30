
<template>
  <div class="baby-class-assessments">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Student Skill Assessments</h1>
      <div class="flex gap-2">
        <select v-model="selectedGrade" @change="loadStudents" class="px-3 py-2 border rounded-md">
          <option value="">Select Grade</option>
          <option v-for="grade in grades" :key="grade.id" :value="grade.id">
            {{ grade.name }}
          </option>
        </select>
        <select v-model="selectedStudent" class="px-3 py-2 border rounded-md">
          <option value="">Select Student</option>
          <option v-for="student in students" :key="student.id" :value="student.id">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
        <select v-model="selectedAcademicYear" class="px-3 py-2 border rounded-md">
          <option value="">Select Academic Year</option>
          <option v-for="year in academicYears" :key="year.id" :value="year.id">
            {{ year.name }}
          </option>
        </select>
        <select v-model="selectedTerm" class="px-3 py-2 border rounded-md">
          <option value="">Select Term</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
        </select>
        <button @click="loadAssessments" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Load Assessments
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading assessments...</p>
    </div>

    <!-- Student Info -->
    <div v-else-if="selectedStudent && studentInfo" class="bg-blue-50 rounded-lg p-4 mb-6">
      <h2 class="text-lg font-semibold text-blue-800">{{ studentInfo.firstName }} {{ studentInfo.lastName }}</h2>
      <p class="text-blue-600">{{ studentInfo.gradeName }} - Term {{ selectedTerm }}</p>
    </div>

    <!-- Skills Assessment Form -->
    <div v-if="skills.length > 0" class="space-y-6">
      <div v-for="skill in skills" :key="skill.id" class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">{{ skill.name }}</h2>
        <p class="text-gray-600 mb-4">{{ skill.description }}</p>
        
        <div class="space-y-4">
          <div v-for="item in skill.skillItems" :key="item.id" class="border rounded-lg p-4">
            <h3 class="font-medium text-gray-700 mb-2">{{ item.name }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ item.description }}</p>
            
            <!-- Teacher Comment Input -->
            <div class="mt-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Teacher Comment:
              </label>
              <textarea
                v-model="assessments[item.id]"
                :placeholder="`Enter your assessment for ${item.name}...`"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end mt-6">
        <button 
          @click="saveAssessments" 
          :disabled="saving"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Saving...' : 'Save All Assessments' }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📝</div>
      <h3 class="text-lg font-medium text-gray-600 mb-2">No Student Selected</h3>
      <p class="text-gray-500">Please select a student, academic year, and term to begin assessments.</p>
    </div>
  </div>
</template>

<script>
import { babyClassSkillService } from '@/service/BabyClassSkillService.js';
import { onMounted, ref } from 'vue';

export default {
  name: 'BabyClassAssessments',
  setup() {
    const skills = ref([])
    const students = ref([])
    const grades = ref([])
    const academicYears = ref([])
    const assessments = ref({})
    const loading = ref(false)
    const saving = ref(false)
    
    const selectedGrade = ref('')
    const selectedStudent = ref('')
    const selectedAcademicYear = ref('')
    const selectedTerm = ref('')
    
    const studentInfo = ref(null)

    const loadStudents = async () => {
      if (!selectedGrade.value) return
      
      try {
        // This would typically come from your student service
        // For now, we'll use a mock or you can implement this
        students.value = [
          { id: 1, firstName: 'John', lastName: 'Doe', gradeName: 'Baby Class' },
          { id: 2, firstName: 'Jane', lastName: 'Smith', gradeName: 'Baby Class' }
        ]
      } catch (error) {
        console.error('Error loading students:', error)
      }
    }

    const loadAssessments = async () => {
      if (!selectedStudent.value || !selectedAcademicYear.value || !selectedTerm.value) {
        alert('Please select student, academic year, and term')
        return
      }

      loading.value = true
      try {
        // Load skills
        const skillsResponse = await babyClassSkillService.getAllSkills()
        skills.value = skillsResponse

        // Load existing assessments
        const assessmentsResponse = await babyClassSkillService.getStudentAssessments(
          selectedStudent.value,
          selectedAcademicYear.value,
          selectedTerm.value
        )

        // Initialize assessments object
        assessments.value = {}
        assessmentsResponse.forEach(assessment => {
          assessments.value[assessment.skillItemId] = assessment.teacherComment || ''
        })

        // Set student info
        studentInfo.value = students.value.find(s => s.id === selectedStudent.value)

      } catch (error) {
        console.error('Error loading assessments:', error)
        alert('Failed to load assessments. Please try again.')
      } finally {
        loading.value = false
      }
    }

    const saveAssessments = async () => {
      if (!selectedStudent.value || !selectedAcademicYear.value || !selectedTerm.value) {
        alert('Please select student, academic year, and term')
        return
      }

      saving.value = true
      try {
        const promises = []
        
        for (const [skillItemId, comment] of Object.entries(assessments.value)) {
          if (comment.trim()) {
            const assessmentData = {
              studentId: selectedStudent.value,
              skillItemId: parseInt(skillItemId),
              academicYear: selectedAcademicYear.value,
              term: selectedTerm.value,
              teacherComment: comment.trim()
            }
            
            promises.push(babyClassSkillService.createOrUpdateAssessment(assessmentData))
          }
        }

        await Promise.all(promises)
        alert('Assessments saved successfully!')
        
      } catch (error) {
        console.error('Error saving assessments:', error)
        alert('Failed to save assessments. Please try again.')
      } finally {
        saving.value = false
      }
    }

    const loadGrades = async () => {
      try {
        // This would typically come from your grade service
        grades.value = [
          { id: 1, name: 'Baby Class' },
          { id: 2, name: 'Nursery' }
        ]
      } catch (error) {
        console.error('Error loading grades:', error)
      }
    }

    const loadAcademicYears = async () => {
      try {
        academicYears.value = [
          { id: 1, name: '2024' },
          { id: 2, name: '2025' }
        ]
      } catch (error) {
        console.error('Error loading academic years:', error)
      }
    }

    onMounted(() => {
      loadGrades()
      loadAcademicYears()
    })

    return {
      skills,
      students,
      grades,
      academicYears,
      assessments,
      loading,
      saving,
      selectedGrade,
      selectedStudent,
      selectedAcademicYear,
      selectedTerm,
      studentInfo,
      loadStudents,
      loadAssessments,
      saveAssessments
    }
  }
}
</script>

<style scoped>
.baby-class-assessments {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
