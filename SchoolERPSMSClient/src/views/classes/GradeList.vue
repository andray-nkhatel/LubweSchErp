<template>

<Dialog 
  v-model:visible="addGradeDialogVisible" 
  modal 
  header="Add New Grade" 
  :style="{ width: '35rem' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
>
  <div class="">
    <!-- Grade form fields -->
    <div class="mb-3">
      <label for="gradeName">Grade Name</label>
      <InputText 
        id="gradeName" 
        class="w-full"
        v-model="newGrade.name" 
        placeholder="Enter grade name"
      />
    </div>
    
    <div class="mb-2">
      <label for="fullName">Full Name</label>
      <InputText 
        class="w-full"
        id="fullName" 
        v-model="newGrade.fullName" 
        placeholder="Enter full grade name"
      />
    </div>

    <div class="mb-2">
      <label for="stream">Stream <span class="text-red-500">*</span></label>
      <Dropdown 
        id="stream" 
        v-model="newGrade.stream" 
        :options="streamOptions" 
        optionLabel="label"
        optionValue="value"
        placeholder="Select stream"
        class="w-full"
        :class="{ 'p-invalid': submittedAdd && !newGrade.stream }"
      />
      <small v-if="submittedAdd && !newGrade.stream" class="p-error">Stream is required.</small>
    </div>
    
    <div class="mb-2">
      <label for="section">Section</label>
      <Dropdown 
        id="section" 
        v-model="newGrade.section" 
        :options="sectionOptions" 
        optionLabel="label"
        optionValue="value"
        placeholder="Select section"
        class="w-full"
      />
      <small class="text-500">Form 1–6: NeoSecondary; Grade 8–12: LegacySecondary</small>
    </div>

    <div class="mb-2">
      <label for="level">Level (for ordering)</label>
      <InputNumber 
        id="level" 
        v-model="newGrade.level" 
        :min="11" 
        :max="14" 
        placeholder="e.g. 12 for Form 2"
        class="w-full"
      />
      <small class="text-500">Form 1 = 11, Form 2 = 12, Form 3 = 13, Grade 10–12 = 12–14</small>
    </div>
  </div>

  <div class="mb-4">
      <label for="homeroomTeacher">Homeroom Teacher (Optional)</label>
      <Dropdown 
        id="homeroomTeacher" 
        v-model="newGrade.homeroomTeacherId" 
        :options="teacherOptions" 
        optionLabel="label"
        optionValue="value"
        placeholder="Select homeroom teacher"
        :loading="loadingTeachers"
        class="w-full"
        showClear
      />
  </div>
  
  <template #footer>
    <Button 
      label="Cancel" 
      icon="pi pi-times" 
      @click="cancelAdd" 
      text 
    />
    <Button 
      label="Save" 
      icon="pi pi-check" 
      @click="saveGrade" 
      :loading="saving"
    />
  </template>
</Dialog>



<Dialog 
    v-model:visible="editGradeDialogVisible" 
    modal 
    header="Edit Homeroom Teacher" 
    :style="{ width: '30rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div>
      <div class="mb-4">
        <label for="editHomeroomTeacher">Homeroom Teacher</label>
        <Dropdown 
          id="editHomeroomTeacher" 
          v-model="editGradeData.homeroomTeacherId" 
          :options="teacherOptions" 
          optionLabel="label"
          optionValue="value"
          placeholder="Select homeroom teacher"
          :loading="loadingTeachers"
          class="w-full"
          showClear
        />
      </div>
    </div>
    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        @click="cancelEdit" 
        text 
      />
      <Button 
        label="Save" 
        icon="pi pi-check" 
        @click="saveEditHomeroomTeacher" 
        :loading="savingEdit"
      />
    </template>
  </Dialog>




  <div class="grade-list">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-semibold text-900 m-0">Grades & Classes</h2>
        <div class="flex gap-2 ml-auto">
          <Button 
            :label="includeInactive ? 'Hide Inactive' : 'Show Inactive'" 
            :icon="includeInactive ? 'pi pi-eye-slash' : 'pi pi-eye'"
            @click="toggleInactive"
            :outlined="!includeInactive"
          />
          <Button 
            label="Add Grade" 
            icon="pi pi-plus" 
            @click="showAddGradeDialog"
          />
          <Button 
            label="Refresh" 
            icon="pi pi-refresh" 
            @click="loadGrades"
            outlined
          />
        </div>
      </div>

      

      <!-- Statistics Cards
      <div class="grid mb-4">
        <div class="col-12 sm:col-6 md:col-3">
          <div class="surface-100 border-round p-3 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ statistics.total }}</div>
            <div class="text-sm text-600">Total Grades</div>
          </div>
        </div>
        <div class="col-12 sm:col-6 md:col-3">
          <div class="surface-100 border-round p-3 text-center">
            <div class="text-2xl font-bold text-green-600">{{ statistics.active }}</div>
            <div class="text-sm text-600">Active Grades</div>
          </div>
        </div>
        <div class="col-12 sm:col-6 md:col-3">
          <div class="surface-100 border-round p-3 text-center">
            <div class="text-2xl font-bold text-orange-600">{{ statistics.totalStudents }}</div>
            <div class="text-sm text-600">Total Students</div>
          </div>
        </div>
        <div class="col-12 sm:col-6 md:col-3">
          <div class="surface-100 border-round p-3 text-center">
            <div class="text-2xl font-bold text-purple-600">{{ statistics.sections }}</div>
            <div class="text-sm text-600">Sections</div>
          </div>
        </div>
      </div> -->

      <!-- Section Filter -->
      <div class="mb-4">
        <div class="flex flex-wrap gap-2 align-items-center">
          <span class="font-medium text-900">Filter by Section:</span>
          <Button 
            :label="`All (${grades.length})`"
            @click="selectedSection = null"
            :outlined="selectedSection !== null"
            size="small"
          />
          <Button 
            v-for="section in availableSections" 
            :key="section"
            :label="`${section} (${getSectionCount(section)})`"
            @click="selectedSection = section"
            :outlined="selectedSection !== section"
            size="small"
          />
        </div>
      </div>

      <!-- Grades Table -->
      <DataTable 
        :value="filteredGrades" 
        :loading="loading"
        :paginator="true" 
        :rows="20"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        showGridlines
        stripedRows
        responsiveLayout="scroll"
        filterDisplay="menu"
        class="p-datatable-sm"
        :rowClass="getRowClass"
      >
        <template #header>
          <div class="flex justify-content-between align-items-center">
            <span class="text-xl font-semibold">
              {{ filteredGrades.length }} grade{{ filteredGrades.length !== 1 ? 's' : '' }} found
            </span>
            <span class="p-input-icon-left">
              
              <InputText 
                v-model="globalFilter" 
                placeholder="Search grades..." 
                class="w-20rem ml-3"
              />
              <i class="pi pi-search ml-3" />
            </span>
          </div>
        </template>

        <!-- <Column field="level" header="Level" sortable style="width: 80px">
          <template #body="{ data }">
            <div class="text-center">
              <Tag 
                :value="data.level" 
                :severity="getLevelSeverity(data.level)"
                class="font-bold"
              />
            </div>
          </template>
        </Column> -->

        <Column field="id" header="Class ID" sortable style="width: 90px">
          <template #body="{ data }">
            <span class="font-medium text-900">{{ data.id }}</span>
          </template>
        </Column>

        <Column field="name" header="Grade Name" sortable style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex flex-column gap-1">
              <span class="font-medium text-900">{{ data.fullName }}</span>
              <!-- <small class="text-500">{{ data.fullName }}</small> -->
            </div>
          </template>
        </Column>

        <Column field="stream" header="Stream" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag 
              :value="data.stream" 
              :severity="getStreamSeverity(data.stream)"
            />
          </template>
        </Column>

        <Column field="section" header="Section" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag 
              :value="data.section" 
              severity="info"
            />
          </template>
        </Column>

        <Column field="studentCount" header="Students" sortable style="width: 100px">
          <template #body="{ data }">
            <div class="text-center">
              <span class="font-bold text-900">{{ data.studentCount }}</span>
              <div class="text-xs text-500">students</div>
            </div>
          </template>
        </Column>

        <Column field="isActive" header="Status" style="width: 100px">
          <template #body="{ data }">
            <Tag 
              :value="data.isActive ? 'Active' : 'Inactive'" 
              :severity="data.isActive ? 'success' : 'danger'"
            />
          </template>
        </Column>

        <Column header="Actions" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button 
                icon="pi pi-eye" 
                @click="viewGrade(data)"
                size="small"
                outlined
                severity="info"
                v-tooltip.top="'View Details'"
              />
              <Button 
                icon="pi pi-pencil" 
                @click="editGrade(data)"
                size="small"
                outlined
                v-tooltip.top="'Edit Grade'"
              />
              <Button 
                :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'" 
                @click="toggleGradeStatus(data)"
                size="small"
                outlined
                :severity="data.isActive ? 'danger' : 'success'"
                :v-tooltip.top="data.isActive ? 'Deactivate' : 'Activate'"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-graduation-cap text-4xl text-400"></i>
            <p class="text-500 mt-2">No grades found</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Grade Details Dialog -->
    <Dialog 
      v-model:visible="showDetailsDialog" 
      modal 
      header="Grade Details"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedGrade" class="grade-details">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label class="font-medium text-900">Grade Name</label>
              <div class="text-600">{{ selectedGrade.name }}</div>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="field">
              <label class="font-medium text-900">Stream</label>
              <div class="text-600">{{ selectedGrade.stream }}</div>
            </div>
          </div>
          <div class="col-12">
            <div class="field">
              <label class="font-medium text-900">Full Name</label>
              <div class="text-600">{{ selectedGrade.fullName }}</div>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="field">
              <label class="font-medium text-900">Level</label>
              <div class="text-600">{{ selectedGrade.level }}</div>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="field">
              <label class="font-medium text-900">Section</label>
              <div class="text-600">{{ selectedGrade.section }}</div>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div class="field">
              <label class="font-medium text-900">Status</label>
              <div>
                <Tag 
                  :value="selectedGrade.isActive ? 'Active' : 'Inactive'" 
                  :severity="selectedGrade.isActive ? 'success' : 'danger'"
                />
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="field">
              <label class="font-medium text-900">Student Count</label>
              <div class="text-600">
                {{ selectedGrade.studentCount }} student{{ selectedGrade.studentCount !== 1 ? 's' : '' }} enrolled
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button 
          label="Close" 
          icon="pi pi-times" 
          @click="showDetailsDialog = false"
          outlined
        />
        <Button 
          label="Edit Grade" 
          icon="pi pi-pencil" 
          @click="editSelectedGrade"
        />
      </template>
    </Dialog>
  </div>
</template>
  
<script setup>
import { gradeService, userService } from '@/service/api.service'; // Adjust path as needed
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';

// Dialog and form state
const addGradeDialogVisible = ref(false)
const saving = ref(false)
const teacherOptions = ref([])

const loadingTeachers = ref(false)

// Function to load teachers from userService
const loadTeachers = async () => {
  loadingTeachers.value = true
  try {
    const users = await userService.getAll()
    // Filter for active teachers only
    teacherOptions.value = users
      .filter(user => user.role === 'Teacher' && user.isActive)
      .map(teacher => ({
        id: teacher.id,
        label: teacher.fullName, // For dropdown display
        value: teacher.id        // For v-model binding
      }))
  } catch (error) {
    console.error('Error loading teachers:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load teachers',
      life: 3000
    })
  } finally {
    loadingTeachers.value = false
  }
}

// Backend enum: NeoSecondary = 4 (Form 1-6), LegacySecondary = 5 (Grade 8-12)
const sectionOptions = ref([
  { label: 'NeoSecondary (Form 1 - 6)', value: 4 },
  { label: 'LegacySecondary (Grade 8 - 12)', value: 5 }
])

// Form data (section = Secondary Junior, level = 12 for Form 2)
const newGrade = reactive({
  name: '',
  fullName: '',
  stream: null,
  section: 4,
  level: 12,
  isActive: true,
  homeroomTeacherId: null
})

// Stream options for dropdown (V, W, X, Y)
const streamOptions = ref([
  { label: 'V', value: 'V' },
  { label: 'W', value: 'W' },
  { label: 'X', value: 'X' },
  { label: 'Y', value: 'Y' }
])

// Emits (you can remove these if not needed)
const emit = defineEmits(['addGrade', 'editGrade', 'viewGrade'])

// Toast for notifications
const toast = useToast()

// Component state
const grades = ref([])
const loading = ref(false)
const includeInactive = ref(false)
const globalFilter = ref('')
const sortField = ref('level')
const sortOrder = ref(1)
const selectedSection = ref(null)
const showDetailsDialog = ref(false)
const selectedGrade = ref(null)

// Stream colors for visual variety
const streamColors = ['info', 'success', 'warn', 'danger', 'secondary']

// Dialog functions
const submittedAdd = ref(false)

const showAddGradeDialog = () => {
  addGradeDialogVisible.value = true
  submittedAdd.value = false
  loadTeachers() 
  // Reset form
  Object.assign(newGrade, {
    name: '',
    fullName: '',
    stream: null,
    section: 4,
    level: 12,
    homeroomTeacherId: null,
    isActive: true
  })
}

// Edit dialog state
const editGradeDialogVisible = ref(false)
const savingEdit = ref(false)
const editGradeData = reactive({
  id: null,
  homeroomTeacherId: null
})

// Function to open the edit dialog for Homeroom Teacher
const openEditHomeroomTeacherDialog = (grade) => {
  loadTeachers()
  editGradeData.id = grade.id
  editGradeData.homeroomTeacherId = grade.homeroomTeacherId ?? null
  editGradeDialogVisible.value = true
}


// Save only the Homeroom Teacher using the dedicated endpoint
const saveEditHomeroomTeacher = async () => {
  savingEdit.value = true
  try {
    await gradeService.assignHomeroomTeacher(editGradeData.id, editGradeData.homeroomTeacherId)
    editGradeDialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Homeroom teacher updated successfully`,
      life: 3000
    })
    await loadGrades()
  } catch (error) {
    console.error('Error updating homeroom teacher:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update homeroom teacher. Please try again.',
      life: 3000
    })
  } finally {
    savingEdit.value = false
  }
}


// Cancel edit
const cancelEdit = () => {
  editGradeDialogVisible.value = false
}


// Update editGrade and editSelectedGrade handlers:
const editGrade = (grade) => {
  openEditHomeroomTeacherDialog(grade)
}
const editSelectedGrade = () => {
  showDetailsDialog.value = false
  openEditHomeroomTeacherDialog(selectedGrade.value)
}




const cancelAdd = () => {
  addGradeDialogVisible.value = false
}

const saveGrade = async () => {
  submittedAdd.value = true
  saving.value = true
  
  try {
    // Validate required fields (name, fullName, stream, section)
    if (!newGrade.name || !newGrade.fullName || !newGrade.stream || newGrade.section === undefined || newGrade.section === null) {
      toast.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields (Grade Name, Full Name, Stream, Section)',
        life: 3000
      })
      return
    }

    // Prepare grade data
    const gradeData = {
      ...newGrade,
      studentCount: 0, // Default value
      createdAt: new Date().toISOString()
    }
    
    // Call API to save grade
    const savedGrade = await gradeService.create(gradeData)
    
    // Add to local grades array
    grades.value.push(savedGrade)
    
    // Close dialog
    addGradeDialogVisible.value = false
    
    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Grade "${newGrade.name}${newGrade.stream ? ' ' + newGrade.stream : ''}" has been created successfully`,
      life: 3000
    })
    
    // Refresh grades list
    await loadGrades()
    
  } catch (error) {
    console.error('Error saving grade:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create grade. Please try again.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Computed properties
const filteredGrades = computed(() => {
  let filtered = grades.value

  // Filter by active status
  if (!includeInactive.value) {
    filtered = filtered.filter(grade => grade.isActive)
  }

  // Filter by section
  if (selectedSection.value !== null) {
    filtered = filtered.filter(grade => grade.section === selectedSection.value)
  }

  // Apply global text search filter
  if (globalFilter.value && globalFilter.value.trim()) {
    const searchTerm = globalFilter.value.toLowerCase().trim()
    
    filtered = filtered.filter(grade => {
      // Check all searchable fields
      const searchableFields = [
        grade.name || '',
        grade.fullName || '',
        grade.stream || '',
        grade.section?.toString() || '',
        grade.level?.toString() || ''
      ]
      
      return searchableFields.some(field => 
        field.toString().toLowerCase().includes(searchTerm)
      )
    })
  }

  return filtered
})

const availableSections = computed(() => {
  const sections = [...new Set(grades.value.map(grade => grade.section))]
  return sections.sort()
})

const statistics = computed(() => {
  const activeGrades = grades.value.filter(grade => grade.isActive)
  const totalStudents = grades.value.reduce((sum, grade) => sum + grade.studentCount, 0)
  const sections = new Set(grades.value.map(grade => grade.section)).size

  return {
    total: grades.value.length,
    active: activeGrades.length,
    totalStudents,
    sections
  }
})

// Helper methods
const getSectionCount = (section) => {
  return grades.value.filter(grade => grade.section === section && (!selectedSection.value || grade.isActive || includeInactive.value)).length
}

const getLevelSeverity = (level) => {
  if (level < 0) return 'info'    // Preschool
  if (level <= 6) return 'success' // Elementary
  if (level <= 12) return 'warn'   // High School
  return 'danger'                  // Higher education
}

const getStreamSeverity = (stream) => {
  const colors = ['info', 'success', 'warn', 'danger', 'secondary']
  const hash = stream.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const getRowClass = (data) => {
  return {
    'opacity-60': !data.isActive
  }
}

// Data loading
const loadGrades = async () => {
  loading.value = true
  try {
    const data = await gradeService.getAll(includeInactive.value)
    grades.value = data || []
  } catch (error) {
    console.error('Error loading grades:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load grades',
      life: 3000
    })
    grades.value = []
  } finally {
    loading.value = false
  }
}

// Event handlers
const toggleInactive = async () => {
  includeInactive.value = !includeInactive.value
  await loadGrades()
}

const viewGrade = (grade) => {
  selectedGrade.value = grade
  showDetailsDialog.value = true
}


const toggleGradeStatus = async (grade) => {
  try {
    // Call API to toggle status
    await gradeService.toggleStatus(grade.id)
    
    // Update local state
    grade.isActive = !grade.isActive
    
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Grade ${grade.name} ${grade.stream} has been ${grade.isActive ? 'activated' : 'deactivated'}`,
      life: 3000
    })
  } catch (error) {
    console.error('Error toggling grade status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update grade status',
      life: 3000
    })
  }
}

// Load data on component mount
onMounted(() => {
  loadGrades()
})
</script>
  
  <style scoped>
  .grade-list {
    padding: 1rem;
  }
  
  .card {
   
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .grade-details .field {
    margin-bottom: 1rem;
  }
  
  .grade-details .field label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
  
  .opacity-60 {
    opacity: 0.6;
  }
  
  :deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
  }
  
  :deep(.p-tag) {
    font-size: 0.75rem;
  }
  
  :deep(.p-button-sm) {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  </style>