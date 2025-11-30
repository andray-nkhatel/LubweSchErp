<template>
  <div class="secondary-subject-assignment">
    <div class="card">
      <div class="card-header">
        <h3>Secondary Subject Assignment</h3>
        <p>Manage individual subject assignments for secondary students</p>
      </div>

      <!-- DataTable Container -->
      <div class="card-body">

        <!-- Students DataTable -->
        <DataTable 
          ref="dataTableRef"
          :value="filteredStudents" 
          :loading="loading"
          paginator 
          :rows="30" 
          :rowsPerPageOptions="[5, 10, 20, 50]"
          sortField="fullName" 
          :sortOrder="1"
          :emptyMessage="loading ? 'Loading students...' : 'No students found'"
          class="p-datatable-sm"
          responsiveLayout="scroll"
        >
          <!-- Global Search -->
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <div class="flex align-items-center gap-2">
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText 
                    v-model="searchQuery" 
                    placeholder="Search students..." 
                    class="p-inputtext-sm"
                  />
                </span>
                <Button 
                  v-if="searchQuery"
                  icon="pi pi-times" 
                  class="p-button-text p-button-sm"
                  @click="clearSearch"
                  v-tooltip.top="'Clear search'"
                />
                <span v-if="searchQuery" class="text-sm text-500">
                  {{ filteredStudents.length }} of {{ students.length }} students
                </span>
              </div>
              <div class="flex gap-2">
                <Button 
                  label="Refresh" 
                  icon="pi pi-refresh" 
                  @click="loadStudents"
                  class="p-button-outlined p-button-sm"
                />
                <Button 
                  label="Bulk Assign" 
                  icon="pi pi-users" 
                  @click="showBulkAssignDialog = true"
                  class="p-button-success p-button-sm"
                />
              </div>
            </div>
          </template>

          <!-- Student Name Column -->
          <Column field="fullName" header="Student" sortable>
            <template #body="{ data }">
              <div class="flex flex-column">
                <span class="font-semibold">{{ data.fullName }}</span>
                <!-- <span class="text-sm text-500">{{ data.studentNumber }}</span> -->
              </div>
            </template>
          </Column>

          <!-- Grade Column -->
          <Column field="gradeName" header="Grade" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.gradeName }}</span>
            </template>
          </Column>

          <!-- Section Column -->
          <Column field="section" header="Section" sortable>
            <template #body="{ data }">
              <Tag 
                :value="data.section" 
                :severity="getSectionSeverity(data.section)"
                class="text-xs"
              />
            </template>
          </Column>

          <!-- Subjects Column -->
          <Column header="Subjects" :sortable="false">
            <template #body="{ data }">
              <div v-if="data.subjects && data.subjects.length > 0" class="flex flex-wrap gap-1">
                <Tag 
                  v-for="subject in data.subjects.slice(0, 3)" 
                  :key="subject.id"
                  :value="subject.subjectName"
                  severity="info"
                  class="text-xs"
                />
                <Tag 
                  v-if="data.subjects.length > 3"
                  :value="`+${data.subjects.length - 3} more`"
                  severity="secondary"
                  class="text-xs"
                />
              </div>
              <span v-else class="text-500 text-sm">No subjects assigned</span>
            </template>
          </Column>

          <!-- Actions Column -->
          <Column header="Actions" :sortable="false" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-cog" 
                  class="p-button-sm p-button-outlined"
                  @click="openStudentDialog(data)"
                  v-tooltip.top="'Manage Subjects'"
                />
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-sm p-button-outlined p-button-secondary"
                  @click="viewStudentSubjects(data)"
                  v-tooltip.top="'View Subjects'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Student Subject Management Dialog -->
    <Dialog 
      v-model:visible="studentDialog" 
      :header="`Manage Subjects - ${selectedStudent?.fullName}`"
      :style="{ width: '70vw', maxWidth: '800px' }"
      :modal="true"
      :closable="true"
    >
      <div v-if="selectedStudent">
        <!-- Student Info -->
        <div class="mb-4 p-3 border-round surface-100">
          <div class="grid">
            <div class="col-12 md:col-3">
              <strong>Name:</strong> {{ selectedStudent.fullName }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Number:</strong> {{ selectedStudent.studentNumber }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Grade:</strong> {{ selectedStudent.gradeName }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Section:</strong> 
              <Tag :value="selectedStudent.section" :severity="getSectionSeverity(selectedStudent.section)" class="ml-2" />
            </div>
          </div>
        </div>

        <!-- Subject Selection -->
        <div class="mb-3">
          <h5 class="mb-3">Select Subjects to Assign</h5>
          <div class="card flex flex-wrap justify-content-center gap-3 p-3">
            <div 
              v-for="subject in availableSubjects" 
              :key="subject.id"
              class="flex align-items-center gap-2"
            >
              <Checkbox 
                :id="`subject-${subject.id}`"
                v-model="selectedSubjectIds"
                :value="subject.id"
                :disabled="isSubjectAssigned(subject.id)"
              />
              <label :for="`subject-${subject.id}`" class="cursor-pointer" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="subject.name">
                {{ subject.name }}
                <Tag 
                  v-if="isSubjectAssigned(subject.id)"
                  value="Assigned" 
                  severity="warning" 
                  class="text-xs ml-2"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Current Assignments -->
        <div v-if="selectedStudent.subjects.length > 0" class="mb-3">
          <h5 class="mb-3">Currently Assigned Subjects</h5>
          <div class="card flex flex-wrap justify-content-center gap-3 p-3">
            <div 
              v-for="subject in selectedStudent.subjects" 
              :key="subject.id"
              class="flex align-items-center gap-2"
            >
              <div class="flex align-items-center gap-2">
                <i class="pi pi-check-circle text-green-500"></i>
                <span class="font-semibold" style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="subject.subjectName">{{ subject.subjectName }}</span>
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-sm p-button-danger p-button-outlined"
                  @click="confirmRemoveSubject(subject)"
                  v-tooltip.top="'Remove subject'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-content-end gap-2 mt-4">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="studentDialog = false"
            class="p-button-outlined"
          />
          <Button 
            label="Save Changes" 
            icon="pi pi-check" 
            @click="saveSubjectAssignments"
            :disabled="selectedSubjectIds.length === 0 || saveLoading"
            :loading="saveLoading"
            class="p-button-success"
          />
        </div>
      </div>
    </Dialog>

    <!-- Bulk Assignment Dialog -->
    <Dialog 
      v-model:visible="showBulkAssignDialog" 
      header="Bulk Subject Assignment"
      :style="{ width: '60vw' }"
      :modal="true"
    >
      <div class="row">
        <div class="col-md-6">
          <h6>Select Students</h6>
          <div class="form-check" v-for="student in (students || [])" :key="student.id">
            <input 
              class="form-check-input" 
              type="checkbox" 
              :value="student.id"
              v-model="bulkSelectedStudents"
              :id="`student-${student.id}`"
            >
            <label class="form-check-label" :for="`student-${student.id}`">
              {{ student.fullName }} ({{ student.gradeName }})
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <h6>Select Subjects</h6>
          <div class="form-check" v-for="subject in (availableSubjects || [])" :key="subject.id">
            <input 
              class="form-check-input" 
              type="checkbox" 
              :value="subject.id"
              v-model="bulkSelectedSubjects"
              :id="`subject-${subject.id}`"
            >
            <label class="form-check-label" :for="`subject-${subject.id}`">
              {{ subject.name }} ({{ subject.code }})
            </label>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showBulkAssignDialog = false" outlined />
        <Button 
          label="Assign Subjects" 
          @click="performBulkAssignment"
          :loading="bulkAssignLoading"
          severity="success"
        />
      </template>
    </Dialog>

    <!-- Student Subjects View Dialog -->
    <Dialog 
      v-model:visible="viewDialog" 
      :header="`Subjects - ${selectedStudent?.fullName}`"
      :style="{ width: '50vw' }"
      :modal="true"
    >
      <div v-if="selectedStudent">
        <div class="row">
          <div class="col-12">
            <h6>Current Subject Assignments</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="subject in selectedStudent.subjects" :key="subject.id">
                    <td>{{ subject.subjectName }}</td>
                    <td>{{ subject.subjectCode }}</td>
                    <td>{{ formatDate(subject.enrolledDate) }}</td>
                    <td>
                      <span class="badge" :class="subject.isActive ? 'bg-success' : 'bg-secondary'">
                        {{ subject.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Confirmation Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { secondarySubjectService } from '@/service/api.service'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref, watch } from 'vue'

const toast = useToast()
const confirm = useConfirm()

// Data
const students = ref([])
const availableSubjects = ref([])
const searchQuery = ref('')
const studentDialog = ref(false)
const viewDialog = ref(false)
const showBulkAssignDialog = ref(false)
const selectedStudent = ref(null)
const bulkSelectedStudents = ref([])
const bulkSelectedSubjects = ref([])
const bulkAssignLoading = ref(false)
const loading = ref(false)
const dataTableRef = ref(null)
const selectedSubjectIds = ref([])
const saveLoading = ref(false)

// Computed
const filteredStudents = computed(() => {
  if (!students.value || !Array.isArray(students.value)) return []
  if (!searchQuery.value || searchQuery.value.trim() === '') return students.value
  
  const query = searchQuery.value.toLowerCase().trim()
  return students.value.filter(student => 
    (student.fullName && student.fullName.toLowerCase().includes(query)) ||
    (student.studentNumber && student.studentNumber.toLowerCase().includes(query)) ||
    (student.gradeName && student.gradeName.toLowerCase().includes(query)) ||
    (student.section && student.section.toLowerCase().includes(query))
  )
})

// Methods
const loadStudents = async () => {
  loading.value = true
  try {
    const response = await secondarySubjectService.getSecondaryStudents()
    students.value = response.data || []
  } catch (error) {
    console.error('Error loading students:', error)
    students.value = [] // Ensure we always have an array
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load students',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadSubjects = async () => {
  try {
    const response = await secondarySubjectService.getAllSubjects()
    availableSubjects.value = response.data || []
  } catch (error) {
    console.error('Error loading subjects:', error)
    availableSubjects.value = [] // Ensure we always have an array
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load subjects',
      life: 3000
    })
  }
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Watch for search query changes
watch(searchQuery, (newValue) => {
  console.log('Search query changed:', newValue)
  console.log('Filtered students count:', filteredStudents.value.length)
})

const openStudentDialog = async (student) => {
  try {
    // Load student's current subjects
    const response = await secondarySubjectService.getStudentSubjects(student.id)
    
    selectedStudent.value = {
      id: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      gradeName: student.gradeName,
      section: student.section,
      subjects: response.data || []
    }
    
    // Initialize selected subjects with currently assigned ones
    selectedSubjectIds.value = selectedStudent.value.subjects.map(s => s.subjectId)
    
    studentDialog.value = true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student subjects',
      life: 3000
    })
  }
}

const viewStudentSubjects = async (student) => {
  try {
    // Load student's current subjects
    const response = await secondarySubjectService.getStudentSubjects(student.id)
    
    selectedStudent.value = {
      id: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      gradeName: student.gradeName,
      section: student.section,
      subjects: response.data || []
    }
    viewDialog.value = true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student subjects',
      life: 3000
    })
  }
}

const isSubjectAssigned = (subjectId) => {
  if (!selectedStudent.value) return false
  return selectedStudent.value.subjects.some(s => s.subjectId === subjectId)
}

const saveSubjectAssignments = async () => {
  saveLoading.value = true
  try {
    const currentSubjectIds = selectedStudent.value.subjects.map(s => s.subjectId)
    const subjectsToAdd = selectedSubjectIds.value.filter(id => !currentSubjectIds.includes(id))
    const subjectsToRemove = currentSubjectIds.filter(id => !selectedSubjectIds.value.includes(id))
    
    console.log('Current subjects:', currentSubjectIds)
    console.log('Selected subjects:', selectedSubjectIds.value)
    console.log('Subjects to add:', subjectsToAdd)
    console.log('Subjects to remove:', subjectsToRemove)
    
    // Remove subjects that are no longer selected
    for (const subjectId of subjectsToRemove) {
      await secondarySubjectService.removeSubject(selectedStudent.value.id, subjectId)
    }
    
    // Add new subjects
    for (const subjectId of subjectsToAdd) {
      await secondarySubjectService.assignSubject(selectedStudent.value.id, {
        subjectId: subjectId,
        assignedBy: 'System' // TODO: Get from user context
      })
    }
    
    // Refresh student subjects from API
    const response = await secondarySubjectService.getStudentSubjects(selectedStudent.value.id)
    selectedStudent.value.subjects = response.data || []
    
    // Update the selectedSubjectIds to match the actual assigned subjects
    selectedSubjectIds.value = selectedStudent.value.subjects.map(s => s.subjectId)
    
    console.log('Updated subjects after save:', selectedStudent.value.subjects)
    console.log('Updated selectedSubjectIds:', selectedSubjectIds.value)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Subject assignments updated successfully',
      life: 3000
    })
    
    // Close dialog
    studentDialog.value = false
    
    // Refresh the main student list
    await loadStudents()
  } catch (error) {
    console.error('Error saving subject assignments:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update subject assignments',
      life: 3000
    })
  } finally {
    saveLoading.value = false
  }
}

const assignSubject = async (subject) => {
  try {
    await secondarySubjectService.assignSubject(selectedStudent.value.id, {
      subjectId: subject.id,
      assignedBy: 'System' // TODO: Get from user context
    })
    
    // Add to local state with proper structure
    selectedStudent.value.subjects.push({
      id: `temp-${Date.now()}`, // Temporary ID for local state
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      enrolledDate: new Date().toISOString(),
      isActive: true
    })
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Subject ${subject.name} assigned successfully`,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to assign subject',
      life: 3000
    })
  }
}

const confirmRemoveSubject = (subject) => {
  confirm.require({
    message: `Are you sure you want to remove "${subject.subjectName}" from ${selectedStudent.value.fullName}?`,
    header: 'Remove Subject',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Remove',
    accept: () => {
      removeSubject(subject)
    }
  })
}

const removeSubject = async (subject) => {
  try {
    await secondarySubjectService.removeSubject(selectedStudent.value.id, subject.subjectId)
    
    // Remove from local state
    const index = selectedStudent.value.subjects.findIndex(s => s.id === subject.id)
    if (index > -1) {
      selectedStudent.value.subjects.splice(index, 1)
    }
    
    // Update selectedSubjectIds to remove the subject
    selectedSubjectIds.value = selectedSubjectIds.value.filter(id => id !== subject.subjectId)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Subject ${subject.subjectName} removed successfully`,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove subject',
      life: 3000
    })
  }
}

const performBulkAssignment = async () => {
  if (bulkSelectedStudents.value.length === 0 || bulkSelectedSubjects.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select both students and subjects',
      life: 3000
    })
    return
  }

  bulkAssignLoading.value = true
  try {
    await secondarySubjectService.bulkAssignSubjects({
      studentIds: bulkSelectedStudents.value,
      subjectIds: bulkSelectedSubjects.value,
      assignedBy: 'System' // TODO: Get from user context
    })
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Bulk assignment completed successfully',
      life: 3000
    })
    
    showBulkAssignDialog.value = false
    bulkSelectedStudents.value = []
    bulkSelectedSubjects.value = []
    await loadStudents() // Refresh the list
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to perform bulk assignment',
      life: 3000
    })
  } finally {
    bulkAssignLoading.value = false
  }
}

const getSectionSeverity = (section) => {
  switch (section) {
    case 'SecondaryJunior':
      return 'info'
    case 'SecondarySenior':
      return 'warning'
    default:
      return 'secondary'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadStudents()
  loadSubjects()
})
</script>

<style scoped>
.secondary-subject-assignment {
  padding: 20px;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
}

.card-header p {
  margin: 5px 0 0 0;
  color: #6c757d;
}

.list-group-item {
  border: 1px solid #dee2e6;
  margin-bottom: 5px;
}

.form-check {
  margin-bottom: 10px;
}

.form-check-input {
  margin-right: 8px;
}

/* Custom DataTable styles */
:deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  border-color: #dee2e6;
  font-weight: 600;
  color: #495057;
}

:deep(.p-tag) {
  font-size: 0.75rem;
}

:deep(.p-button-sm) {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

/* Simple checkbox styling */
:deep(.p-checkbox .p-checkbox-box) {
  border-radius: 4px;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #10b981;
  border-color: #10b981;
}

/* Simple dialog styling */
:deep(.p-dialog .p-dialog-content) {
  padding: 1.5rem;
}

/* Surface styling for subject items */
.surface-50 {
  background-color: #f8f9fa;
}

.surface-100 {
  background-color: #f1f3f4;
}
</style>
