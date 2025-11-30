<template>
  <div class="student-form w-full mx-auto mt-6">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-semibold text-900 m-0">
          {{ isEditMode ? 'Edit Student' : 'Add New Student' }}
        </h2>
        <Button 
          label="Back to List" 
          icon="pi pi-arrow-left" 
          @click="goToStudentPage"
          outlined
          class="ml-auto"
        />
      </div>

      <!-- Loading indicator while student data is being loaded -->
      <div v-if="loadingStudent" class="flex align-items-center justify-content-center p-6">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        <span class="ml-3 text-lg">Loading student data...</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="p-fluid">
        <div class="flex flex-col gap-6">
          <!-- Personal Information Section -->
          <div>
            <h3 class="text-lg font-medium text-900 mb-3">Personal Information</h3>
          </div>

          <!-- Name Fields Row -->
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <div class="flex-auto">
              <label for="firstName" class="block font-semibold mb-2">First Name *</label>
              <InputText 
                id="firstName"
                class="w-full"
                v-model="form.firstName" 
                :class="{ 'p-invalid': errors.firstName }"
                placeholder="Enter first name"
              />
              <small v-if="errors.firstName" class="p-error">{{ errors.firstName }}</small>
            </div>
            <div class="flex-auto">
              <label for="middleName" class="block font-semibold mb-2">Middle Name</label>
              <InputText 
                id="middleName"
                class="w-full"
                v-model="form.middleName" 
                placeholder="Enter middle name (optional)"
              />
            </div>
            <div class="flex-auto">
              <label for="lastName" class="block font-semibold mb-2">Last Name *</label>
              <InputText 
                class="w-full"
                id="lastName"
                v-model="form.lastName" 
                :class="{ 'p-invalid': errors.lastName }"
                placeholder="Enter last name"
              />
              <small v-if="errors.lastName" class="p-error">{{ errors.lastName }}</small>
            </div>
          </div>

          <!-- Guardian Phone Number -->
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <div class="flex-auto">
              <label for="guardianPhone" class="block font-semibold mb-2">Guardian/Parent Phone Number *</label>
              <InputText 
                id="guardianPhone"
                class="w-full"
                v-model="form.guardianPhone" 
                :class="{ 'p-invalid': errors.guardianPhone }"
                placeholder="260xxxxxxxxx"
                maxlength="12"
                @input="formatPhoneNumber"
              />
              <small v-if="errors.guardianPhone" class="p-error">{{ errors.guardianPhone }}</small>
              <small class="text-600">Format: 260 followed by 9 digits (e.g., 260950003929)</small>
            </div>
          </div>

          <!-- Grade Selection -->
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <div class="flex-auto">
              <label for="gradeId" class="block font-semibold mb-2">Grade *</label>
              <Select 
                id="gradeId"
                class="w-full"
                v-model="form.gradeId" 
                :options="gradeOptions" 
                optionLabel="fullName" 
                optionValue="id"
                :class="{ 'p-invalid': errors.gradeId }"
                placeholder="Select grade"
                :loading="loadingGrades"
              />
              <small v-if="errors.gradeId" class="p-error">{{ errors.gradeId }}</small>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="mt-6">
            <div class="flex gap-2 justify-content-end">
              <Button 
                label="Cancel" 
                icon="pi pi-times"
                @click="handleCancel"
                outlined
                :disabled="loading"
              />
              <Button 
                label="Reset" 
                icon="pi pi-refresh"
                @click="resetForm"
                outlined
                severity="secondary"
                :disabled="loading"
              />
              <Button 
                type="submit"
                :label="isEditMode ? 'Update Student' : 'Add Student'" 
                icon="pi pi-check"
                :loading="loading"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { gradeService, studentService } from '../../service/api.service';

// Emits
const emit = defineEmits(['back', 'studentAdded', 'studentUpdated'])

const router = useRouter();
const route = useRoute();

// Check if we're in edit mode based on route params
const isEditMode = computed(() => !!route.params.id)
const studentId = computed(() => route.params.id)

function goToStudentPage() {
  router.push('/app/students');
}

// Toast for notifications
const toast = useToast()

// Form state
const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  guardianPhone: '',
  gradeId: null
})

// Form validation errors
const errors = reactive({})

// Loading states
const loading = ref(false)
const loadingStudent = ref(false)
const loadingGrades = ref(false)

const gradeOptions = ref([])

// Store original student data to preserve all fields when updating
const originalStudentData = ref(null)

// Format phone number input (remove non-digits and limit to 12 digits)
const formatPhoneNumber = (event) => {
  let value = event.target.value
  // Remove all non-digit characters
  value = value.replace(/\D/g, '')
  // Limit to 12 digits
  value = value.slice(0, 12)
  form.guardianPhone = value
}

// Validation rules
const validateForm = () => {
  const newErrors = {}

  if (!form.firstName?.trim()) {
    newErrors.firstName = 'First name is required'
  }

  if (!form.lastName?.trim()) {
    newErrors.lastName = 'Last name is required'
  }

  // Validate guardian phone number
  const phoneNumber = form.guardianPhone?.trim() || ''
  if (!phoneNumber) {
    newErrors.guardianPhone = 'Guardian/Parent phone number is required'
  } else if (phoneNumber.length < 12) {
    newErrors.guardianPhone = `Phone number must be exactly 12 digits. Currently ${phoneNumber.length} digit(s). Format: 260 followed by 9 digits (e.g., 260950003929)`
  } else if (!/^260\d{9}$/.test(phoneNumber)) {
    newErrors.guardianPhone = 'Phone number must be 12 digits starting with 260 (e.g., 260950003929)'
  }

  if (!form.gradeId) {
    newErrors.gradeId = 'Grade is required'
  }

  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key])
  // Set new errors
  Object.assign(errors, newErrors)

  return Object.keys(newErrors).length === 0
}

// Load grades for dropdown
const loadGrades = async () => {
  loadingGrades.value = true
  try {
    const grades = await gradeService.getAll()
    gradeOptions.value = grades
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

// Load student data for editing
const loadStudent = async () => {
  if (!isEditMode.value || !studentId.value) {
    console.log('Not in edit mode or no student ID:', { isEditMode: isEditMode.value, studentId: studentId.value })
    return
  }

  loadingStudent.value = true
  try {
    console.log('Loading student with ID:', studentId.value)
    const response = await studentService.getById(studentId.value)
    
    // Handle API response wrapper if present
    const student = response?.data || response
    
    console.log('Loaded student data:', student)
    
    if (!student) {
      throw new Error('Student data not found')
    }
    
    // Store original student data to preserve all fields when updating
    originalStudentData.value = { ...student }
    
    form.firstName = student.firstName || ''
    form.middleName = student.middleName || ''
    form.lastName = student.lastName || ''
    // Check for GuardianPhone (API field name) first, then fallback to other variations
    // Note: PhoneNumber is the student's phone, GuardianPhone is the guardian's phone
    form.guardianPhone = student.GuardianPhone || student.guardianPhone || student.guardianPhoneNumber || ''
    form.gradeId = student.gradeId || null
    
    console.log('Form populated:', form)
    console.log('Original student data stored:', originalStudentData.value)
    console.log('Student fields:', Object.keys(student))
    console.log('middleName value:', student.middleName, 'type:', typeof student.middleName)
    console.log('studentNumber value:', student.studentNumber, 'type:', typeof student.studentNumber)
  } catch (error) {
    console.error('Error loading student:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load student data. ' + (error.message || ''),
      life: 5000
    })
    // Don't redirect immediately, let user see the error
  } finally {
    loadingStudent.value = false
  }
}


// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000
    })
    return
  }

  loading.value = true
  try {
    let result;
    if (isEditMode.value) {
      // Update existing student - preserve all existing fields and update only the ones from form
      if (!originalStudentData.value) {
        throw new Error('Original student data not loaded. Please refresh the page.')
      }
      
      // Merge original student data with form data to preserve all required fields
      // Start with original data and explicitly set all required fields
      const studentData = { ...originalStudentData.value }
      
      // Update the fields from the form
      studentData.firstName = form.firstName?.trim() || ''
      studentData.lastName = form.lastName?.trim() || ''
      // GuardianPhone is the form field - update it
      studentData.GuardianPhone = form.guardianPhone?.trim() || ''
      studentData.guardianPhone = form.guardianPhone?.trim() || '' // Keep lowercase for compatibility
      // Preserve original PhoneNumber (student's phone) - API requires it but it's separate from guardian phone
      studentData.PhoneNumber = originalStudentData.value.PhoneNumber || originalStudentData.value.phoneNumber || ''
      studentData.phoneNumber = originalStudentData.value.PhoneNumber || originalStudentData.value.phoneNumber || '' // Keep lowercase for compatibility
      studentData.gradeId = form.gradeId || null
      
      // Explicitly set required fields - API requires these and rejects null/undefined
      // Always ensure these are strings, never null or undefined
      // For middleName, use form value if provided, otherwise use original, otherwise empty string
      const middleNameValue = form.middleName?.trim()
      studentData.middleName = middleNameValue !== undefined && middleNameValue !== null 
        ? middleNameValue 
        : (originalStudentData.value.middleName ?? '')
      
      // For other required fields, use original value or empty string
      studentData.studentNumber = originalStudentData.value.studentNumber ?? ''
      studentData.gender = originalStudentData.value.gender ?? ''
      studentData.address = originalStudentData.value.address ?? ''
      
      // Ensure all required string fields are never null or undefined
      const requiredStringFields = ['middleName', 'studentNumber', 'gender', 'address', 'firstName', 'lastName', 'PhoneNumber', 'GuardianPhone']
      requiredStringFields.forEach(field => {
        if (studentData[field] === null || studentData[field] === undefined) {
          studentData[field] = ''
        }
        // Ensure it's a string type
        if (typeof studentData[field] !== 'string') {
          studentData[field] = String(studentData[field] || '')
        }
      })
      
      console.log('Updating student with data:', studentData)
      console.log('Original student data:', originalStudentData.value)
      console.log('Required fields check:', {
        middleName: studentData.middleName,
        studentNumber: studentData.studentNumber,
        gender: studentData.gender,
        address: studentData.address
      })
      result = await studentService.update(studentId.value, studentData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Student updated successfully',
        life: 3000
      })
      emit('studentUpdated', result)
    } else {
      // Create new student - use full create method to include guardian phone
      const studentData = {
        firstName: form.firstName?.trim() || '',
        middleName: form.middleName?.trim() || null,
        lastName: form.lastName?.trim() || '',
        PhoneNumber: '', // Student's phone (empty for new students)
        GuardianPhone: form.guardianPhone?.trim() || '', // Guardian's phone from form
        guardianPhone: form.guardianPhone?.trim() || '', // Keep lowercase for compatibility
        gradeId: form.gradeId || null
      }
      result = await studentService.create(studentData)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Student added successfully',
        life: 3000
      })
      emit('studentAdded', result)
      resetForm()
    }
    setTimeout(() => {
      router.push('/app/students')
    }, 1000)
  } catch (error) {
    console.error('Error saving student:', error)
    console.error('Error details:', {
      message: error.message,
      userMessage: error.userMessage,
      response: error.response,
      responseData: error.response?.data,
      status: error.response?.status,
      isNonJsonResponse: error.isNonJsonResponse
    })
    
    let errorMessage = `Failed to ${isEditMode.value ? 'update' : 'add'} student`;
    
    // Use the user-friendly message from the API interceptor if available
    if (error.userMessage) {
      errorMessage = error.userMessage;
    } else if (error.message && error.message !== 'An error occurred') {
      errorMessage = error.message;
    } else if (error.response?.data) {
      // Handle different response data formats
      const data = error.response.data;
      if (typeof data === 'string') {
        // If response is a string (HTML/XML error page), try to extract meaningful info
        errorMessage = `Server error (Status: ${error.response.status}). Please check the server logs or try again.`;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.title) {
        errorMessage = data.title;
      } else if (data.error) {
        errorMessage = data.error;
      } else {
        errorMessage = `Server error (Status: ${error.response.status}). Please try again or contact support.`;
      }
    } else if (error.response?.status) {
      errorMessage = `Server error (Status: ${error.response.status}). Please try again or contact support.`;
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 10000
    })
  } finally {
    loading.value = false
  }
}

// Reset form
const resetForm = () => {
  if (isEditMode.value) {
    originalStudentData.value = null
    loadStudent()
  } else {
    form.firstName = ''
    form.middleName = ''
    form.lastName = ''
    form.guardianPhone = ''
    form.gradeId = null
    originalStudentData.value = null
  }
  Object.keys(errors).forEach(key => delete errors[key])
}

// Handle cancel
const handleCancel = () => {
  router.push('/app/students')
}

// Watch for route changes (in case component is reused)
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('Route param changed, loading student:', newId)
    originalStudentData.value = null // Clear previous student data
    loadStudent()
  } else if (!newId && oldId) {
    // Switched from edit to create mode
    originalStudentData.value = null
    resetForm()
  }
}, { immediate: false })

// Load data on component mount
onMounted(async () => {
  await loadGrades()
  if (isEditMode.value && studentId.value) {
    await loadStudent()
  }
})
</script>

<style scoped>
.student-form {
  padding: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
}

.grid {
  margin: 0;
}

.grid > [class*="col-"] {
  padding: 0.5rem;
}

h3 {
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}


:deep(.p-invalid) {
  border-color: #ef4444;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>