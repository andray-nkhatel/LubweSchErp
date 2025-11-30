<template>
  <div class="assign-teacher-subject mb-4">
    <AssignTeacherForm
      :teachers="teachers"
      :subjects="subjects"
      :grades="grades"
      @assignment-created="onAssignmentCreated"
    />
    <RecentAssignmentsTable class="mt-3" :assignments="recentAssignments" @delete="onDeleteAssignment" />
    <AssignmentResultsModal v-model:visible="showResultsModal" :results="assignmentResults" />
    <TransferAssignmentsModal v-model:visible="showTransferModal" :teachers="teachers" @transfer="onTransfer" />
    <Toast ref="toast" />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useTeacherAssignments } from '@/composables/useTeacherAssignments'
import { subjectService } from '@/service/api.service'
import { onMounted, ref } from 'vue'
import AssignmentResultsModal from './AssignmentResultsModal.vue'
import AssignTeacherForm from './AssignTeacherForm.vue'
import RecentAssignmentsTable from './RecentAssignmentsTable.vue'
import TransferAssignmentsModal from './TransferAssignmentsModal.vue'

const { teachers, subjects, grades, loadTeachers, loadSubjects, loadGrades } = useTeacherAssignments()
const recentAssignments = ref([])
const showResultsModal = ref(false)
const showTransferModal = ref(false)
const assignmentResults = ref(null)

async function loadAll() {
  await Promise.all([loadTeachers(), loadSubjects(), loadGrades()])
  await loadRecentAssignments()
}

onMounted(loadAll)

async function loadRecentAssignments() {
  try {
    const allAssignments = []
    for (const subject of subjects.value) {
      try {
        const assignments = await subjectService.getSubjectAssignments(subject.id)
        if (assignments.assignments) {
          allAssignments.push(...assignments.assignments.map(a => {
            const grade = grades.value.find(g => g.id === a.gradeId)
            return {
              id: a.assignmentId,
              teacherId: a.teacherId,
              teacherName: a.teacherName,
              subjectId: subject.id,
              subjectName: subject.name,
              gradeId: a.gradeId,
              gradeName: a.gradeName,
              gradeStream: grade ? grade.stream : undefined,
              gradeFullName: grade ? grade.fullName : undefined,
              assignedDate: new Date().toISOString(),
              isActive: a.isActive
            }
          }))
        }
      } catch (error) {
        console.warn(`Failed to load assignments for subject ${subject.id}:`, error)
      }
    }
    recentAssignments.value = allAssignments
  } catch (error) {
    console.error('Failed to load recent assignments:', error)
  }
}

async function onAssignmentCreated() {
  console.log('🔄 Assignment created event received, refreshing data...')
  try {
    await loadRecentAssignments()
    console.log('✅ Recent assignments refreshed')
    
    // Also refresh the teacher assignments data if needed
    // This ensures the form shows updated data when reopened
    if (teachers.value.length > 0) {
      console.log('🔄 Refreshing teacher data...')
      // You might need to refresh teacher-specific data here
    }
  } catch (error) {
    console.error('❌ Failed to refresh assignments after creation:', error)
  }
}

async function onDeleteAssignment(assignmentId) {
  try {
    await subjectService.removeTeacherAssignment(assignmentId)
    window.$toast?.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Assignment removed successfully',
      life: 3000
    })
    await loadRecentAssignments()
  } catch (error) {
    window.$toast?.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove assignment',
      life: 3000
    })
  }
}

async function onTransfer(transferData) {
  try {
    // POST /api/subjects/transfer-assignments
    const response = await subjectService.transferAssignments(transferData)
    showTransferModal.value = false
    window.$toast?.add({
      severity: 'success',
      summary: 'Success',
      detail: `${response.transferred} assignment(s) transferred successfully`,
      life: 3000
    })
    if (response.conflicts > 0) {
      window.$toast?.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `${response.conflicts} assignment(s) had conflicts and were skipped`,
        life: 5000
      })
    }
    await loadRecentAssignments()
  } catch (error) {
    window.$toast?.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to transfer assignments',
      life: 5000
    })
  }
}
</script>

<style scoped>
.assign-teacher-subject {
  max-width: 900px;
  margin: 0 auto;
}
</style>