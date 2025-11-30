<template>
    <div class="student-promotion">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <h2 class="text-2xl font-semibold text-900 m-0">Student Promotion</h2>
          <Button 
            label="Back to List" 
            icon="pi pi-arrow-left" 
            @click="backToList"
            outlined
            class="ml-auto"
          />
        </div>
  
        <!-- Instructions Section -->
        <div class="surface-50 border-round p-4 mb-4">
          <h3 class="text-lg font-medium text-900 mt-0 mb-3">
            <i class="pi pi-info-circle mr-2"></i>
            Promotion Instructions
          </h3>
          <p class="text-600 line-height-3 m-0">
            Select the source grade and destination grade to promote all active students. 
            This action will move all students from the selected grade to the next grade level.
            Please review the student list before confirming the promotion.
          </p>
        </div>
  
        <!-- Grade Selection Form -->
        <form @submit.prevent="loadStudents" class="mb-4">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="fromGrade" class="font-medium text-900 mb-2 block">
                  From Grade *
                </label>
                <Dropdown 
                  id="fromGrade"
                  v-model="selectedFromGrade" 
                  :options="availableGrades" 
                 optionLabel="name"
                  optionValue="id"
                  placeholder="Select source grade"
                  :loading="loadingGrades"
                  :class="{ 'p-invalid': errors.fromGrade }"
                  @change="onFromGradeChange"
                  class="w-full"
                >
                <template #option="slotProps">
              {{ slotProps.option.name }} - {{ slotProps.option.stream }}
              </template>
              </Dropdown>
                <small v-if="errors.fromGrade" class="p-error">{{ errors.fromGrade }}</small>
              </div>
            </div>
  
            <div class="col-12 md:col-6">
              <div class="field">
                <label for="toGrade" class="font-medium text-900 mb-2 block">
                  To Grade *
                </label>
                <Dropdown 
                  id="toGrade"
                  v-model="selectedToGrade" 
                  :options="targetGrades" 
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select destination grade"
                  :disabled="!selectedFromGrade"
                  :class="{ 'p-invalid': errors.toGrade }"
                  class="w-full"
                >
                <template #option="slotProps">
                {{ slotProps.option.name }} - {{ slotProps.option.stream }}
                </template>
                </Dropdown>
                <small v-if="errors.toGrade" class="p-error">{{ errors.toGrade }}</small>
              </div>
            </div>
  
            <div class="col-12">
              <div class="flex gap-2">
                <Button 
                  type="submit"
                  label="Load Students" 
                  icon="pi pi-search"
                  :disabled="!selectedFromGrade"
                  :loading="loadingStudents"
                />
                <Button 
                  label="Clear Selection" 
                  icon="pi pi-times"
                  @click="clearSelection"
                  outlined
                  severity="secondary"
                  :disabled="!selectedFromGrade && !selectedToGrade"
                />
              </div>
            </div>
          </div>
        </form>
  
        <!-- Grade Information Display -->
        <div v-if="gradeInfo.from && gradeInfo.to" class="mb-4">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="surface-100 border-round p-4 text-center">
                <h4 class="text-900 font-medium mb-2">From Grade</h4>
                <div class="text-3xl font-bold text-blue-600 mb-2">{{ gradeInfo.from.name }}</div>
                <div class="text-sm text-600">{{ gradeInfo.from.description || 'Source Grade' }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="surface-100 border-round p-4 text-center">
                <h4 class="text-900 font-medium mb-2">To Grade</h4>
                <div class="text-3xl font-bold text-green-600 mb-2">{{ gradeInfo.to.name }}</div>
                <div class="text-sm text-600">{{ gradeInfo.to.description || 'Destination Grade' }}</div>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-3">
            <i class="pi pi-arrow-right text-2xl text-400"></i>
          </div>
        </div>
  
        <!-- Students List -->
        <div v-if="studentsToPromote.length > 0" class="mb-4">
          <div class="flex justify-content-between align-items-center mb-3">
            <h3 class="text-lg font-medium text-900 m-0">
              Students to Promote ({{ studentsToPromote.length }})
            </h3>
            <div class="flex gap-2">
              <Button 
                :label="showAllStudents ? 'Show Less' : 'Show All'"
                :icon="showAllStudents ? 'pi pi-minus' : 'pi pi-plus'"
                @click="showAllStudents = !showAllStudents"
                text
                size="small"
              />
            </div>
          </div>
  
          <DataTable 
            :value="displayedStudents" 
            class="p-datatable-sm"
            showGridlines
            stripedRows
          >
            <Column field="studentNumber" header="Student #" style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.studentNumber" severity="info" />
              </template>
            </Column>
  
            <Column field="fullName" header="Full Name" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <Avatar 
                    :label="data.firstName.charAt(0) + data.lastName.charAt(0)" 
                    size="small"
                    style="background-color: #e3f2fd; color: #1976d2"
                  />
                  <span class="font-medium">{{ data.fullName }}</span>
                </div>
              </template>
            </Column>
  
            <Column field="dateOfBirth" header="Date of Birth" style="width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.dateOfBirth) }}
              </template>
            </Column>
  
            <Column field="gender" header="Gender" style="width: 80px">
              <template #body="{ data }">
                <Tag 
                  :value="data.gender" 
                  :severity="data.gender?.toLowerCase() === 'male' ? 'info' : 'warn'"
                />
              </template>
            </Column>
  
            <Column field="guardianName" header="Guardian" style="min-width: 150px">
              <template #body="{ data }">
                <span class="text-600">{{ data.guardianName }}</span>
              </template>
            </Column>
  
            <Column field="enrollmentDate" header="Enrolled" style="width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.enrollmentDate) }}
              </template>
            </Column>
  
            <template #empty>
              <div class="text-center py-4">
                <i class="pi pi-users text-4xl text-400"></i>
                <p class="text-500 mt-2">No students found in selected grade</p>
              </div>
            </template>
          </DataTable>
  
          <div v-if="!showAllStudents && studentsToPromote.length > 5" class="text-center mt-3">
            <small class="text-500">
              Showing 5 of {{ studentsToPromote.length }} students. 
              <Button label="Show all" @click="showAllStudents = true" link class="p-0 text-sm" />
            </small>
          </div>
        </div>
  
        <!-- No Students Message -->
        <div v-else-if="studentsLoaded && studentsToPromote.length === 0" class="text-center py-6">
          <i class="pi pi-info-circle text-4xl text-400 mb-3"></i>
          <h4 class="text-900 font-medium mb-2">No Students Found</h4>
          <p class="text-600">There are no active students in the selected grade to promote.</p>
        </div>
  
        <!-- Promotion Summary -->
        <div v-if="studentsToPromote.length > 0" class="surface-50 border-round p-4 mb-4">
          <h4 class="text-900 font-medium mb-3">
            <i class="pi pi-clipboard-check mr-2"></i>
            Promotion Summary
          </h4>
          <div class="grid">
            <div class="col-12 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ studentsToPromote.length }}</div>
                <div class="text-sm text-600">Students to Promote</div>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ gradeInfo.from?.name || '-' }}</div>
                <div class="text-sm text-600">From Grade</div>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">{{ gradeInfo.to?.name || '-' }}</div>
                <div class="text-sm text-600">To Grade</div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Promotion Actions -->
        <div v-if="studentsToPromote.length > 0" class="flex gap-2 justify-content-end">
          <Button 
            label="Cancel" 
            icon="pi pi-times"
            @click="clearSelection"
            outlined
            severity="secondary"
            :disabled="promoting"
          />
          <Button 
            label="Confirm Promotion" 
            icon="pi pi-check"
            @click="showConfirmDialog = true"
            severity="success"
            :disabled="promoting || !selectedToGrade"
          />
        </div>
  
        <!-- Promotion Results -->
        <div v-if="promotionResults" class="mt-4">
          <div class="surface-100 border-round p-4">
            <h4 class="font-medium text-900 mb-3">
              <i class="pi pi-check-circle mr-2 text-green-600"></i>
              Promotion Results
            </h4>
            <div class="grid">
              <div class="col-12 sm:col-6 md:col-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{{ promotionResults.successful }}</div>
                  <div class="text-sm text-600">Successfully Promoted</div>
                </div>
              </div>
              <div class="col-12 sm:col-6 md:col-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-600">{{ promotionResults.failed }}</div>
                  <div class="text-sm text-600">Failed to Promote</div>
                </div>
              </div>
              <div class="col-12 sm:col-6 md:col-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ promotionResults.total }}</div>
                  <div class="text-sm text-600">Total Processed</div>
                </div>
              </div>
            </div>
  
            <!-- Error Details -->
            <div v-if="promotionResults.errors?.length > 0" class="mt-4">
              <h5 class="font-medium text-red-600 mb-2">Promotion Errors:</h5>
              <div class="max-h-20rem overflow-auto">
                <div 
                  v-for="(error, index) in promotionResults.errors" 
                  :key="index"
                  class="bg-red-50 border-l-4 border-red-400 p-3 mb-2"
                >
                  <p class="text-sm text-red-800">{{ error }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Confirmation Dialog -->
      <Dialog 
        v-model:visible="showConfirmDialog" 
        modal 
        header="Confirm Student Promotion"
        :style="{ width: '450px' }"
      >
        <div class="confirmation-content">
          <div class="flex align-items-center gap-3 mb-4">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
            <div>
              <h4 class="text-900 font-medium mb-1">Are you sure?</h4>
              <p class="text-600 m-0">This action will promote all students and cannot be undone.</p>
            </div>
          </div>
          
          <div class="surface-100 border-round p-3 mb-4">
            <div class="text-sm text-600 mb-2">Promotion Details:</div>
            <div class="flex justify-content-between mb-1">
              <span class="font-medium">From:</span>
              <span>{{ gradeInfo.from?.name }}</span>
            </div>
            <div class="flex justify-content-between mb-1">
              <span class="font-medium">To:</span>
              <span>{{ gradeInfo.to?.name }}</span>
            </div>
            <div class="flex justify-content-between">
              <span class="font-medium">Students:</span>
              <span>{{ studentsToPromote.length }}</span>
            </div>
          </div>
        </div>
  
        <template #footer>
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="showConfirmDialog = false"
            outlined
            :disabled="promoting"
          />
          <Button 
            label="Promote Students" 
            icon="pi pi-check" 
            @click="promoteStudents"
            :loading="promoting"
            severity="success"
          />
        </template>
      </Dialog>
    </div>
  </template>
  
  <script setup>
import { gradeService, studentService } from '@/service/api.service'; // Adjust path as needed
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
  
  // Emits
  const emit = defineEmits(['back', 'studentsPromoted'])
  const router = useRouter()
  const backToList = () => {
    router.push({name: 'students'})
    //router.push('/students');
  }
  
  // Toast for notifications
  const toast = useToast()
  
  // Component state
  const selectedFromGrade = ref(null)
  const selectedToGrade = ref(null)
  const availableGrades = ref([])
  const studentsToPromote = ref([])
  const loadingGrades = ref(false)
  const loadingStudents = ref(false)
  const promoting = ref(false)
  const studentsLoaded = ref(false)
  const showAllStudents = ref(false)
  const showConfirmDialog = ref(false)
  const promotionResults = ref(null)
  
  // Form validation errors
  const errors = reactive({})
  
  // Grade information for display
  const gradeInfo = reactive({
    from: null,
    to: null
  })
  
  // Computed properties
  const targetGrades = computed(() => {
    if (!selectedFromGrade.value || !availableGrades.value.length) return []
    
    // Filter out the selected from grade and show logical progression
    return availableGrades.value.filter(grade => grade.id !== selectedFromGrade.value)
  })
  
  const displayedStudents = computed(() => {
    if (showAllStudents.value) {
      return studentsToPromote.value
    }
    return studentsToPromote.value.slice(0, 5)
  })
  
  // Load grades for dropdowns
  const loadGrades = async () => {
    loadingGrades.value = true
    try {
      // Replace this with your actual grade service call
      const grades = await gradeService.getAll()
      availableGrades.value = grades
      
      // Mock data for now - replace with actual API call
    //   availableGrades.value = [
    //     { id: 1, name: 'Grade 1', description: 'First Grade' },
    //     { id: 2, name: 'Grade 2', description: 'Second Grade' },
    //     { id: 3, name: 'Grade 3', description: 'Third Grade' },
    //     { id: 4, name: 'Grade 4', description: 'Fourth Grade' },
    //     { id: 5, name: 'Grade 5', description: 'Fifth Grade' },
    //     { id: 6, name: 'Grade 6', description: 'Sixth Grade' },
    //     { id: 7, name: 'Grade 7', description: 'Seventh Grade' },
    //     { id: 8, name: 'Grade 8', description: 'Eighth Grade' },
    //     { id: 9, name: 'Grade 9', description: 'Ninth Grade' },
    //     { id: 10, name: 'Grade 10', description: 'Tenth Grade' },
    //     { id: 11, name: 'Grade 11', description: 'Eleventh Grade' },
    //     { id: 12, name: 'Grade 12', description: 'Twelfth Grade' }
    //   ]
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load grades',
        life: 3000
      })
    } finally {
      loadingGrades.value = false
    }
  }
  
  // Handle from grade change
  const onFromGradeChange = () => {
    selectedToGrade.value = null
    studentsToPromote.value = []
    studentsLoaded.value = false
    promotionResults.value = null
    updateGradeInfo()
  }
  
  // Update grade information display
  const updateGradeInfo = () => {
    gradeInfo.from = availableGrades.value.find(g => g.id === selectedFromGrade.value) || null
    gradeInfo.to = availableGrades.value.find(g => g.id === selectedToGrade.value) || null
  }
  
  // Load students from selected grade
  const loadStudents = async () => {
    if (!validateSelection()) return
  
    loadingStudents.value = true
    studentsLoaded.value = false
    
    try {
      const students = await studentService.getByGrade(selectedFromGrade.value)
      // Filter only active students
      studentsToPromote.value = students.filter(student => student.isActive && !student.isArchived)
      studentsLoaded.value = true
      promotionResults.value = null
      updateGradeInfo()
      
      toast.add({
        severity: 'success',
        summary: 'Students Loaded',
        detail: `Found ${studentsToPromote.value.length} students to promote`,
        life: 3000
      })
    } catch (error) {
      console.error('Error loading students:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load students',
        life: 3000
      })
    } finally {
      loadingStudents.value = false
    }
  }
  
  // Validate selection
  const validateSelection = () => {
    const newErrors = {}
  
    if (!selectedFromGrade.value) {
      newErrors.fromGrade = 'Please select a source grade'
    }
  
    if (!selectedToGrade.value) {
      newErrors.toGrade = 'Please select a destination grade'
    }
  
    if (selectedFromGrade.value === selectedToGrade.value) {
      newErrors.toGrade = 'Destination grade must be different from source grade'
    }
  
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])
    // Set new errors
    Object.assign(errors, newErrors)
  
    return Object.keys(newErrors).length === 0
  }
  
  // Promote students
  const promoteStudents = async () => {
    if (!validateSelection()) return
  
    promoting.value = true
    showConfirmDialog.value = false
    
    try {
      const promotionData = {
        fromGradeId: selectedFromGrade.value,
        toGradeId: selectedToGrade.value
      }
  
      const result = await studentService.promoteStudents(promotionData)
      
      console.log('Promotion API response:', result) // Debug log
      
      // Handle the promotion result - adjust based on actual API response structure
      // If result is just a success response without detailed counts, assume all students were promoted
      if (result && typeof result === 'object') {
        promotionResults.value = {
          successful: result.successful || result.promotedCount || result.count || studentsToPromote.value.length,
          failed: result.failed || result.failedCount || result.errors?.length || 0,
          total: result.total || result.totalProcessed || studentsToPromote.value.length,
          errors: result.errors || []
        }
      } else {
        // If result is simple success response, assume all students were promoted successfully
        promotionResults.value = {
          successful: studentsToPromote.value.length,
          failed: 0,
          total: studentsToPromote.value.length,
          errors: []
        }
      }
  
      toast.add({
        severity: 'success',
        summary: 'Promotion Complete',
        detail: `Successfully promoted ${promotionResults.value.successful} students`,
        life: 5000
      })
  
      // Emit event to parent component
      emit('studentsPromoted', {
        fromGrade: gradeInfo.from,
        toGrade: gradeInfo.to,
        results: promotionResults.value
      })
  
      // Clear the student list since they've been promoted
      studentsToPromote.value = []
  
    } catch (error) {
      console.error('Error promoting students:', error)
      
      const errorMessage = error.response?.data?.message || 'Failed to promote students'
      const errors = error.response?.data?.errors || [errorMessage]
      
      promotionResults.value = {
        successful: 0,
        failed: studentsToPromote.value.length,
        total: studentsToPromote.value.length,
        errors: Array.isArray(errors) ? errors : [errors]
      }
  
      toast.add({
        severity: 'error',
        summary: 'Promotion Failed',
        detail: errorMessage,
        life: 5000
      })
    } finally {
      promoting.value = false
    }
  }
  
  // Clear selection and reset form
  const clearSelection = () => {
    selectedFromGrade.value = null
    selectedToGrade.value = null
    studentsToPromote.value = []
    studentsLoaded.value = false
    showAllStudents.value = false
    promotionResults.value = null
    gradeInfo.from = null
    gradeInfo.to = null
    Object.keys(errors).forEach(key => delete errors[key])
  }
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }
  
  // Load data on component mount
  onMounted(() => {
    loadGrades()
  })
  </script>
  
  <style scoped>
  .student-promotion {
    padding: 1rem;
  }
  
  .card {
    /* background: white; */
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .field {
    margin-bottom: 1rem;
  }
  
  .confirmation-content {
    padding: 1rem 0;
  }
  
  .max-h-20rem {
    max-height: 20rem;
  }
  
  :deep(.p-invalid) {
    border-color: #ef4444;
  }
  
  .p-error {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  :deep(.p-avatar) {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
  
  :deep(.p-tag) {
    font-size: 0.75rem;
  }
  </style>