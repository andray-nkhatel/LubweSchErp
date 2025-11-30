<template>
  <form @submit.prevent="handleSubmit" class="p-fluid">
    <div class="field">
      <label for="teacher" class="block font-medium mb-2">Teacher *</label>
      <Dropdown
        id="teacher"
        v-model="selectedTeacher"
        :options="teachers"
        optionLabel="fullName"
        optionValue="id"
        placeholder="Select a teacher"
        :loading="loadingTeachers"
        :class="{ 'p-invalid': submitted && !selectedTeacher }"
        class="w-full"
        filter
        filterBy="fullName"
      >
        <template #option="slotProps">
          <div class="flex flex-column">
            <span class="font-medium">{{ slotProps.option.fullName }}</span>
          </div>
        </template>
      </Dropdown>
      <small v-if="submitted && !selectedTeacher" class="p-error">
        Teacher is required.
      </small>
    </div>

    <div class="field mt-3">
      <label class="block font-medium mb-2">Subject-Grade Assignments *</label>
      <div v-if="loadingTeachers" class="flex items-center justify-center min-h-[48px]">
        <i class="pi pi-spin pi-spinner text-xl text-primary"></i>
        <span class="ml-2">Loading assignments...</span>
      </div>
      <div v-else>
        <!-- Subject Selection -->
        <div class="mb-3">
          <label class="block font-medium mb-2 text-sm">Select Subjects</label>
          <MultiSelect
            v-model="selectedSubjectIds"
            :options="subjects"
            optionLabel="name"
            optionValue="id"
            placeholder="Choose subjects..."
            :disabled="!selectedTeacher || loadingTeachers"
            class="w-full"
            filter
            filterBy="name"
          />
        </div>

        <!-- Grade Selection for Each Subject -->
        <div v-if="selectedSubjectIds.length > 0" class="space-y-3">
          <div v-for="subjectId in selectedSubjectIds" :key="subjectId" class="border-1 border-200 border-round p-3">
            <div class="flex justify-content-between align-items-center mb-2">
              <h4 class="font-medium text-primary m-0">
                {{ getSubjectName(subjectId) }}
              </h4>
              <Button
                type="button"
                icon="pi pi-times"
                severity="secondary"
                text
                size="small"
                @click="removeSubject(subjectId)"
                :disabled="loading"
              />
            </div>
            <MultiSelect
              v-model="subjectGradeMap[subjectId]"
              :options="grades"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Select grades for this subject..."
              :disabled="!selectedTeacher || loadingTeachers"
              class="w-full"
              filter
              filterBy="fullName"
            />
          </div>
        </div>

        <!-- Add Subject Button -->
        <div v-if="selectedSubjectIds.length < subjects.length" class="mt-3">
          <Button
            type="button"
            label="Add Another Subject"
            icon="pi pi-plus"
            severity="secondary"
            text
            @click="showSubjectSelector = true"
            :disabled="!selectedTeacher || loadingTeachers"
          />
        </div>
      </div>
      <small v-if="submitted && getSelectedAssignments().length === 0 && !loadingTeachers" class="p-error">
        At least one subject-grade assignment is required.
      </small>
    </div>

    <div v-if="getAssignmentPreview().length > 0 && !loadingTeachers" class="field">
      <label class="block font-medium mb-2">Assignment Preview</label>
      <div class="border-1 border-200 border-round p-3 bg-50">
        <div v-for="(preview, idx) in getAssignmentPreview()" :key="idx" class="text-sm mb-1">
          {{ preview }}
        </div>
      </div>
    </div>

    <div class="flex justify-content-end gap-2 mt-4">
      <Button
        type="button"
        label="Refresh"
        icon="pi pi-refresh"
        severity="info"
        @click="refreshTeacherAssignments"
        :disabled="loading || !selectedTeacher"
      />
      <Button
        type="button"
        label="Clear Form"
        icon="pi pi-trash"
        severity="warning"
        @click="resetForm"
        :disabled="loading"
      />
      <Button
        type="button"
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        @click="resetForm"
        :disabled="loading"
      />
      <Button
        type="submit"
        label="Assign"
        icon="pi pi-check"
        :loading="loading"
      />
    </div>
  </form>
</template>

<script setup>
import { subjectService, userService } from '@/service/api.service'
import { ref, watch } from 'vue'

const props = defineProps({
  teachers: Array,
  subjects: Array,
  grades: Array
})
const emit = defineEmits(['assignment-created'])

const selectedTeacher = ref(null)
const selectedSubjectIds = ref([]) // Array of subject IDs
const subjectGradeMap = ref({}) // { subjectId: [gradeIds] }
const loading = ref(false)
const loadingTeachers = ref(false)
const submitted = ref(false)
const showSubjectSelector = ref(false)

// Track existing assignments for the selected teacher
const existingAssignments = ref([]) // Array of { subjectId, gradeId, assignmentId }

// When teacher changes, fetch their assignments
watch(selectedTeacher, async (teacherId) => {
  selectedSubjectIds.value = []
  subjectGradeMap.value = {}
  existingAssignments.value = []
  if (!teacherId) return
  loadingTeachers.value = true
  try {
    // Fetch all assignments for this teacher in one call
    const assignments = await userService.getTeacherAssignments(teacherId)
    existingAssignments.value = assignments.map(a => ({
      subjectId: a.subjectId,
      gradeId: a.gradeId,
      assignmentId: a.assignmentId
    }))
    
    // Group existing assignments by subject
    const assignmentsBySubject = {}
    existingAssignments.value.forEach(a => {
      if (!assignmentsBySubject[a.subjectId]) {
        assignmentsBySubject[a.subjectId] = []
      }
      assignmentsBySubject[a.subjectId].push(a.gradeId)
    })
    
    // Set up the form with existing assignments
    selectedSubjectIds.value = Object.keys(assignmentsBySubject).map(Number)
    subjectGradeMap.value = assignmentsBySubject
  } finally {
    loadingTeachers.value = false
  }
})

// Watch for changes in selected subjects to initialize grade selections
watch(selectedSubjectIds, (newSubjectIds) => {
  // Initialize grade selections for new subjects
  newSubjectIds.forEach(subjectId => {
    if (!subjectGradeMap.value[subjectId]) {
      subjectGradeMap.value[subjectId] = []
    }
  })
  
  // Remove grade selections for removed subjects
  Object.keys(subjectGradeMap.value).forEach(subjectId => {
    if (!newSubjectIds.includes(Number(subjectId))) {
      delete subjectGradeMap.value[subjectId]
    }
  })
}, { deep: true })

function getSubjectName(subjectId) {
  const subject = props.subjects.find(s => s.id === subjectId)
  return subject?.name || 'Unknown Subject'
}

function removeSubject(subjectId) {
  selectedSubjectIds.value = selectedSubjectIds.value.filter(id => id !== subjectId)
  delete subjectGradeMap.value[subjectId]
}

function getSelectedAssignments() {
  console.log('🔍 getSelectedAssignments called')
  console.log('📚 Selected subject IDs:', selectedSubjectIds.value)
  console.log('🗺️ Subject grade map:', subjectGradeMap.value)
  
  const assignments = []
  selectedSubjectIds.value.forEach(subjectId => {
    const gradeIds = subjectGradeMap.value[subjectId] || []
    console.log(`📖 Subject ${subjectId} has grades:`, gradeIds)
    gradeIds.forEach(gradeId => {
      assignments.push({ subjectId, gradeId })
    })
  })
  
  console.log('📋 Final assignments:', assignments)
  return assignments
}

function resetForm() {
  selectedTeacher.value = null
  selectedSubjectIds.value = []
  subjectGradeMap.value = {}
  existingAssignments.value = []
  submitted.value = false
}

function getAssignmentPreview() {
  if (!selectedTeacher.value) return []
  const teacher = props.teachers.find(t => t.id === selectedTeacher.value)
  const assignments = getSelectedAssignments()
  const previews = []
  
  for (const assignment of assignments) {
    const subject = props.subjects.find(s => s.id === assignment.subjectId)
    const grade = props.grades.find(g => g.id === assignment.gradeId)
    previews.push(`${teacher?.fullName || 'Teacher'} → ${subject?.name || 'Subject'} → ${grade?.fullName || 'Class'}`)
  }
  return previews
}

async function handleSubmit() {
  console.log('🚀 handleSubmit called')
  submitted.value = true
  const assignments = getSelectedAssignments()
  console.log('📋 Selected assignments:', assignments)
  console.log('👨‍🏫 Selected teacher:', selectedTeacher.value)
  
  if (!selectedTeacher.value || assignments.length === 0) {
    console.log('❌ Validation failed - no teacher or assignments')
    return
  }
  try {
    loading.value = true
    // Build sets for easy comparison
    const selectedPairs = new Set(assignments.map(a => `${a.subjectId}|${a.gradeId}`))
    const existingPairs = new Set(existingAssignments.value.map(a => `${a.subjectId}|${a.gradeId}`))
    console.log('🔍 Selected pairs:', Array.from(selectedPairs))
    console.log('📝 Existing pairs:', Array.from(existingPairs))
    
    // To assign: in selected but not in existing
    const toAssign = Array.from(selectedPairs).filter(pair => !existingPairs.has(pair))
    // To unassign: in existing but not in selected
    const toUnassign = existingAssignments.value.filter(a => !selectedPairs.has(`${a.subjectId}|${a.gradeId}`))
    
    console.log('➕ To assign:', toAssign)
    console.log('➖ To unassign:', toUnassign)
    
    // Assign new
    if (toAssign.length > 0) {
      const newAssignments = toAssign.map(pair => {
        const [subjectId, gradeId] = pair.split('|').map(Number)
        return {
          teacherId: selectedTeacher.value,
          subjectId,
          gradeId
        }
      })
      console.log('📤 Sending new assignments:', newAssignments)
      await subjectService.bulkAssignTeachersToSubjects({ assignments: newAssignments })
      console.log('✅ Bulk assignment successful')
    }
    // Unassign removed
    for (const a of toUnassign) {
      console.log('🗑️ Removing assignment:', a.assignmentId)
      try {
        await subjectService.removeTeacherAssignment(a.assignmentId)
        console.log('✅ Successfully removed assignment:', a.assignmentId)
      } catch (error) {
        console.error('❌ Failed to remove assignment:', a.assignmentId, error)
        throw error
      }
    }
    console.log('✅ All operations completed')
    
    // Add a small delay to ensure backend has processed the changes
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Show success message
    const message = `${toAssign.length > 0 ? `${toAssign.length} assignment(s) created` : ''}${toAssign.length > 0 && toUnassign.length > 0 ? ', ' : ''}${toUnassign.length > 0 ? `${toUnassign.length} assignment(s) removed` : ''}`
    
    // Try multiple toast methods
    if (window.$toast) {
      window.$toast.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000
      })
    } else if (window.$primevue?.toast) {
      window.$primevue.toast.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000
      })
    } else {
      // Fallback to alert if no toast system
      alert(`Success: ${message}`)
    }
    
    // Refresh the teacher's assignments to show updated state
    console.log('🔄 Refreshing teacher assignments after operation...')
    await refreshTeacherAssignments()
    
    emit('assignment-created')
    
    // Don't reset form immediately - let user see the updated state
    // They can manually reset or select a different teacher
  } catch (error) {
    console.error('❌ Error in handleSubmit:', error)
    
    // Try multiple toast methods for error
    const errorMessage = error.response?.data?.message || 'Failed to update assignments'
    if (window.$toast) {
      window.$toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      })
    } else if (window.$primevue?.toast) {
      window.$primevue.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      })
    } else {
      // Fallback to alert if no toast system
      alert(`Error: ${errorMessage}`)
    }
  } finally {
    loading.value = false
  }
}

async function refreshTeacherAssignments() {
  console.log('🔄 Refreshing teacher assignments for teacher:', selectedTeacher.value)
  if (!selectedTeacher.value) return
  
  loadingTeachers.value = true
  try {
    // Fetch all assignments for this teacher in one call
    const assignments = await userService.getTeacherAssignments(selectedTeacher.value)
    console.log('🔄 Fetched assignments from API:', assignments)
    existingAssignments.value = assignments.map(a => ({
      subjectId: a.subjectId,
      gradeId: a.gradeId,
      assignmentId: a.assignmentId
    }))
    console.log('📝 Updated existingAssignments:', existingAssignments.value)
    
    // Group existing assignments by subject
    const assignmentsBySubject = {}
    existingAssignments.value.forEach(a => {
      if (!assignmentsBySubject[a.subjectId]) {
        assignmentsBySubject[a.subjectId] = []
      }
      assignmentsBySubject[a.subjectId].push(a.gradeId)
    })
    
    // Set up the form with existing assignments
    selectedSubjectIds.value = Object.keys(assignmentsBySubject).map(Number)
    subjectGradeMap.value = assignmentsBySubject
    
    console.log('✅ Teacher assignments refreshed:', existingAssignments.value)
    
    // Show success message
    if (window.$toast) {
      window.$toast.add({
        severity: 'info',
        summary: 'Refreshed',
        detail: 'Teacher assignments refreshed',
        life: 2000
      })
    }
  } catch (error) {
    console.error('❌ Failed to refresh teacher assignments:', error)
    if (window.$toast) {
      window.$toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to refresh assignments',
        life: 3000
      })
    }
  } finally {
    loadingTeachers.value = false
  }
}
</script> 