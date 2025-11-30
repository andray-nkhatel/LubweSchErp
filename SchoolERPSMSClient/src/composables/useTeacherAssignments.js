import { gradeService, subjectService, userService } from '@/service/api.service'
import { ref } from 'vue'

export function useTeacherAssignments() {
  const teachers = ref([])
  const subjects = ref([])
  const grades = ref([])
  const loadingTeachers = ref(false)
  const loadingSubjects = ref(false)
  const loadingGrades = ref(false)

  async function loadTeachers() {
    loadingTeachers.value = true
    try {
      const allUsers = await userService.getAll()
      teachers.value = allUsers.filter(user => user.role === 'Teacher' && user.isActive)
    } finally {
      loadingTeachers.value = false
    }
  }

  async function loadSubjects() {
    loadingSubjects.value = true
    try {
      subjects.value = await subjectService.getAll()
    } finally {
      loadingSubjects.value = false
    }
  }

  async function loadGrades() {
    loadingGrades.value = true
    try {
      grades.value = await gradeService.getAll()
    } finally {
      loadingGrades.value = false
    }
  }

  return {
    teachers, subjects, grades,
    loadingTeachers, loadingSubjects, loadingGrades,
    loadTeachers, loadSubjects, loadGrades
  }
} 