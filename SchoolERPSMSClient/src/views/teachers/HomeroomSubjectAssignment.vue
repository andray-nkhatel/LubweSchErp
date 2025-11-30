<template>
  <div class="homeroom-subject-assignment">
    <div class="card">
      <div class="card-header">
        <h3>My Homeroom - Subject Management</h3>
        <p>Manage subject assignments for your homeroom students</p>
      </div>

      <!-- Access Denied Message -->
      <div v-if="!isHomeroomTeacher" class="card-body">
        <div class="text-center p-4">
          <i class="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
          <h3 class="text-xl font-semibold mb-2">Access Denied</h3>
          <p class="text-gray-600 mb-4">You are not assigned as a homeroom teacher.</p>
          <p class="text-sm text-gray-500">Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>

      <!-- Homeroom Info -->
      <div v-else class="card-body">
        <div v-if="homeroomInfo" class="mb-4 p-3 border-round surface-100">
          <div class="grid">
            <div class="col-12 md:col-3">
              <strong>Homeroom:</strong> {{ homeroomInfo.name }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Grade:</strong> {{ homeroomInfo.gradeName }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Section:</strong> 
              <Tag :value="homeroomInfo.section" :severity="getSectionSeverity(homeroomInfo.section)" class="ml-2" />
            </div>
            <div class="col-12 md:col-3">
              <strong>Students:</strong> {{ students.length }} students
            </div>
          </div>
        </div>

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
                  @click="loadHomeroomStudents"
                  class="p-button-outlined p-button-sm"
                />
                <Button 
                  label="View Subjects" 
                  icon="pi pi-book" 
                  @click="subjectsDialog = true"
                  class="p-button-outlined p-button-sm"
                />
                <Button 
                  label="Assign to All" 
                  icon="pi pi-users" 
                  @click="showClassWideDialog = true"
                  class="p-button-success p-button-sm"
                />
                <Button 
                  label="Remove from All" 
                  icon="pi pi-user-minus" 
                  @click="showRemoveClassWideDialog = true"
                  class="p-button-danger p-button-outlined p-button-sm"
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
          <!-- <Column field="section" header="Section" sortable>
            <template #body="{ data }">
              <Tag 
                :value="data.section" 
                :severity="getSectionSeverity(data.section)"
                class="text-xs"
              />
            </template>
          </Column> -->

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

    <!-- Available Subjects Dialog -->
    <Dialog 
      v-model:visible="subjectsDialog" 
      header="Available Subjects"
      :style="{ width: '40vw', maxWidth: '500px' }"
      :modal="true"
    >
      <div class="mb-2 text-500 text-sm">{{ availableSubjects.length }} subjects</div>
      <DataTable 
        :value="availableSubjects" 
        paginator 
        :rows="10"
        :rowsPerPageOptions="[5,10,20]"
        responsiveLayout="scroll"
        :emptyMessage="'No subjects available'"
        class="p-datatable-sm"
      >
        <Column field="name" header="Name" sortable />
        <Column field="id" header="ID" sortable />
      </DataTable>
    </Dialog>

    <!-- Class-wide Assignment Dialog -->
    <Dialog 
      v-model:visible="showClassWideDialog" 
      header="Assign Subject to All Students"
      :style="{ width: '50vw', maxWidth: '600px' }"
      :modal="true"
    >
      <div class="mb-3">
        <label class="font-semibold mb-2 block">Select Subject to Assign to All Students</label>
        <Dropdown 
          v-model="selectedClassWideSubject"
          :options="availableSubjects"
          optionLabel="name"
          optionValue="id"
          placeholder="Choose a subject"
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showClassWideDialog = false" class="p-button-outlined" />
        <Button 
          label="Assign to All Students" 
          @click="assignSubjectToAllStudents"
          :loading="classWideLoading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Class-wide Removal Dialog -->
    <Dialog 
      v-model:visible="showRemoveClassWideDialog" 
      header="Remove Subject from All Students"
      :style="{ width: '50vw', maxWidth: '600px' }"
      :modal="true"
    >
      <div class="mb-3">
        <label class="font-semibold mb-2 block">Select Subject to Remove from All Students</label>
        <Dropdown 
          v-model="selectedRemoveClassWideSubject"
          :options="availableSubjects"
          optionLabel="name"
          optionValue="id"
          placeholder="Choose a subject"
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="showRemoveClassWideDialog = false" class="p-button-outlined" />
        <Button 
          label="Remove from All Students" 
          @click="removeSubjectFromAllStudents"
          :loading="classWideLoading"
          class="p-button-danger"
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
                      <Tag :value="subject.isActive ? 'Active' : 'Inactive'" :severity="subject.isActive ? 'success' : 'secondary'" />
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
import { homeroomService, subjectService } from '@/service/api.service'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
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
const homeroomInfo = ref(null)
const searchQuery = ref('')
const studentDialog = ref(false)
const viewDialog = ref(false)
const showClassWideDialog = ref(false)
const showRemoveClassWideDialog = ref(false)
const subjectsDialog = ref(false)
const selectedStudent = ref(null)
const selectedSubjectIds = ref([])
const saveLoading = ref(false)
const classWideLoading = ref(false)
const selectedClassWideSubject = ref(null)
const selectedRemoveClassWideSubject = ref(null)
const loading = ref(false)
const dataTableRef = ref(null)
const isHomeroomTeacher = ref(true) // Will be set based on API response

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
const loadHomeroomStudents = async () => {
  loading.value = true
  try {
    const response = await homeroomService.getHomeroomStudents()
    students.value = response.data || response || []
    
    // Load homeroom grade info
    const gradeInfoResponse = await homeroomService.getHomeroomGradeInfo()
    const gradeData = gradeInfoResponse.data || gradeInfoResponse
    homeroomInfo.value = {
      name: gradeData.gradeName || gradeData.name || 'Unknown',
      gradeName: gradeData.gradeName || 'Unknown',
      section: gradeData.section || 'Unknown'
    }
  } catch (error) {
    console.error('Error loading homeroom students:', error)
    students.value = [] // Ensure we always have an array
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load homeroom students',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadSubjects = async () => {
  try {
    const all = await subjectService.getAll()
    const arr = Array.isArray(all?.data) ? all.data : (Array.isArray(all) ? all : [])
    availableSubjects.value = arr.map(s => ({
      id: s.id ?? s.Id ?? s.subjectId,
      name: s.name ?? s.Name ?? s.subjectName
    }))
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
    // Use the subjects already loaded with the student
    selectedStudent.value = {
      id: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      gradeName: student.gradeName,
      section: student.section,
      subjects: student.subjects || []
    }
    
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
    // Use the subjects already loaded with the student
    selectedStudent.value = {
      id: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      gradeName: student.gradeName,
      section: student.section,
      subjects: student.subjects || []
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
    
    // Remove subjects that are no longer selected
    for (const subjectId of subjectsToRemove) {
      await homeroomService.removeSubjectFromStudent(selectedStudent.value.id, subjectId)
    }
    
    // Add new subjects
    for (const subjectId of subjectsToAdd) {
      await homeroomService.assignSubjectToStudent(selectedStudent.value.id, {
        subjectId: subjectId,
        notes: 'Assigned by homeroom teacher'
      })
    }
    
    // Refresh the homeroom students list to get updated data
    await loadHomeroomStudents()
    
    // Update selectedStudent with fresh data
    const updatedStudent = students.value.find(s => s.id === selectedStudent.value.id)
    if (updatedStudent) {
      selectedStudent.value.subjects = updatedStudent.subjects || []
    }
    
    // Update the selectedSubjectIds to match the actual assigned subjects
    selectedSubjectIds.value = selectedStudent.value.subjects.map(s => s.subjectId)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Subject assignments updated successfully',
      life: 3000
    })
    
    // Close dialog
    studentDialog.value = false
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

const assignSubjectToAllStudents = async () => {
  if (!selectedClassWideSubject.value) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select a subject',
      life: 3000
    })
    return
  }

  classWideLoading.value = true
  try {
    const studentIds = students.value.map(student => student.id)
    await homeroomService.bulkAssignSubjects({
      studentIds: studentIds,
      subjectId: selectedClassWideSubject.value,
      notes: 'Bulk assignment by homeroom teacher'
    })
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Subject assigned to all ${students.value.length} students`,
      life: 3000
    })
    
    showClassWideDialog.value = false
    selectedClassWideSubject.value = null
    await loadHomeroomStudents()
  } catch (error) {
    console.error('Error assigning subject to all students:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to assign subject to all students',
      life: 3000
    })
  } finally {
    classWideLoading.value = false
  }
}

const removeSubjectFromAllStudents = async () => {
  if (!selectedRemoveClassWideSubject.value) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select a subject',
      life: 3000
    })
    return
  }

  classWideLoading.value = true
  try {
    const studentIds = students.value.map(student => student.id)
    // For bulk removal, we'll need to remove from each student individually
    const promises = studentIds.map(studentId => 
      homeroomService.removeSubjectFromStudent(studentId, selectedRemoveClassWideSubject.value, 'Bulk removal by homeroom teacher')
    )
    
    await Promise.all(promises)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Subject removed from all ${students.value.length} students`,
      life: 3000
    })
    
    showRemoveClassWideDialog.value = false
    selectedRemoveClassWideSubject.value = null
    await loadHomeroomStudents()
  } catch (error) {
    console.error('Error removing subject from all students:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove subject from all students',
      life: 3000
    })
  } finally {
    classWideLoading.value = false
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
    await homeroomService.removeSubjectFromStudent(selectedStudent.value.id, subject.subjectId, 'Removed by homeroom teacher')
    
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
onMounted(async () => {
  // Try to load homeroom data first - this will naturally fail if not a homeroom teacher
  try {
    await loadHomeroomStudents()
    await loadSubjects()
    isHomeroomTeacher.value = true
  } catch (error) {
    console.error('Error loading homeroom data:', error)
    
    // Check if it's an access denied error (403) or homeroom teacher error
    if (error.message && (
      error.message.includes('homeroom') || 
      error.message.includes('Access denied') ||
      error.message.includes('not assigned as a homeroom teacher')
    )) {
      isHomeroomTeacher.value = false
      toast.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'You are not assigned as a homeroom teacher',
        life: 5000
      })
    } else {
      // For other errors, show generic error but still allow access
      isHomeroomTeacher.value = true
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Unable to load some data. Please refresh the page.',
        life: 3000
      })
    }
  }
})
</script>

<style scoped>
.homeroom-subject-assignment {
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
