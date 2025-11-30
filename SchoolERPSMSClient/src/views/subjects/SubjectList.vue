<template>
 <!--Invisible Dialog-->
 <Dialog 
  v-model:visible="subjectDialogVisible" 
  modal 
  :header="isEditMode ? 'Edit Subject' : 'Add New Subject'"  
  :style="{ width: '35rem' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
>
  <div class="">
    <!-- Subject form fields -->
    <div class="mb-4">
      <div class="mb-3">
        <label for="name" class="font-semibold text-base block mb-1">Subject Name <span class="text-red-500">*</span></label>
        <InputText 
          id="subjectName" 
          class="w-full"
          v-model="subjectForm.name" 
          :class="{'p-invalid': validationErrors.name}"
          placeholder="Enter subject name"
        />
        <small v-if="validationErrors.name" class="p-error">{{ validationErrors.name }}</small>
      </div>
      <div class="mb-3">
        <label for="code" class="font-semibold text-base block mb-1">Subject Code <span class="text-red-500">*</span></label>
        <InputText 
          class="w-full"
          id="code" 
          v-model="subjectForm.code" 
          :class="{'p-invalid': validationErrors.code}"
          placeholder="Enter subject code"
        />
        <small v-if="validationErrors.code" class="p-error">{{ validationErrors.code }}</small>
      </div>
      <div class="mb-3">
        <label for="description" class="font-semibold text-base block mb-1">Description</label>
        <InputText
          id="description" 
          class="w-full"
          v-model="subjectForm.description" 
          placeholder="Enter subject description"
        />
      </div>
      <div class="mb-2" v-if="isEditMode">
        <div class="flex align-items-center">
          <Checkbox 
            id="isActive" 
            v-model="subjectForm.isActive" 
            :binary="true" 
          />
          <label for="isActive" class="ml-2 font-semibold">Active</label>
        </div>
      </div>
    </div>
  </div>
  
    <template #footer>
    <div class="flex justify-end gap-2">
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        @click="cancelDialog" 
        text 
      />
      <Button 
        :label="isEditMode ? 'Update' : 'Save'" 
        :icon="isEditMode ? 'pi pi-pencil' : 'pi pi-check'" 
        @click="saveSubject" 
        :loading="saving"
      />
    </div>
  </template>
</Dialog>


    <div class="subject-list">
      <div class="card">
        <!-- Responsive Header and Actions -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 class="text-2xl font-semibold text-900 m-0 text-center sm:text-left">Subjects</h2>
          <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center sm:items-stretch">
            <Button 
              :label="includeInactive ? 'Hide Inactive' : 'Show Inactive'" 
              :icon="includeInactive ? 'pi pi-eye-slash' : 'pi pi-eye'"
              @click="toggleInactive"
              :outlined="!includeInactive"
              class="w-full sm:w-auto"
            />
            <Button 
              label="Add Subject" 
              icon="pi pi-plus" 
              @click="openAddDialog"
              class="w-full sm:w-auto"
            />
            <Button 
              label="Refresh" 
              icon="pi pi-refresh" 
              @click="loadSubjects"
              outlined
              class="w-full sm:w-auto"
            />
          </div>
        </div>
        <!-- Responsive Stats Row -->
        <div class="stats-row flex gap-4 mb-4 overflow-x-auto px-1 sm:px-0">
          <div class="stat-card surface-100 border-round p-3 text-center min-w-[160px] flex-shrink-0 hover:shadow-lg transition-all">
            <i class="pi pi-book text-2xl text-blue-400 mb-2 block"></i>
            <div class="text-2xl font-bold text-blue-600">{{ statistics.total }}</div>
            <div class="text-sm text-600">Total Subjects</div>
          </div>
          <div class="stat-card surface-100 border-round p-3 text-center min-w-[160px] flex-shrink-0 hover:shadow-lg transition-all">
            <i class="pi pi-check-circle text-2xl text-green-400 mb-2 block"></i>
            <div class="text-2xl font-bold text-green-600">{{ statistics.active }}</div>
            <div class="text-sm text-600">Active Subjects</div>
          </div>
          <div class="stat-card surface-100 border-round p-3 text-center min-w-[160px] flex-shrink-0 hover:shadow-lg transition-all">
            <i class="pi pi-ban text-2xl text-orange-400 mb-2 block"></i>
            <div class="text-2xl font-bold text-orange-600">{{ statistics.inactive }}</div>
            <div class="text-sm text-600">Inactive Subjects</div>
          </div>
          <div class="stat-card surface-100 border-round p-3 text-center min-w-[160px] flex-shrink-0 hover:shadow-lg transition-all">
            <i class="pi pi-align-left text-2xl text-purple-400 mb-2 block"></i>
            <div class="text-2xl font-bold text-purple-600">{{ statistics.withDescription }}</div>
            <div class="text-sm text-600">With Description</div>
          </div>
        </div>
  
        <!-- Subject Cards View -->
        <div v-if="viewMode === 'cards'" class="mb-4">
          <div class="grid">
            <div 
              v-for="subject in filteredSubjects" 
              :key="subject.id"
              class="col-12 sm:col-6 md:col-4 lg:col-3"
            >
              <div 
                class="subject-card surface-card border-round p-4 h-full cursor-pointer transition-all transition-duration-200 group relative"
                :class="{ 'opacity-60': !subject.isActive }"
                @click="viewSubject(subject)"
                tabindex="0"
              >
                <div v-if="!subject.isActive" class="absolute top-0 left-0 w-full h-full bg-gray-200 bg-opacity-60 flex items-center justify-center z-10 rounded">
                  <span class="text-xs text-danger font-bold">Inactive</span>
                </div>
                <div class="flex justify-content-between align-items-start mb-3">
                  <div class="flex align-items-center gap-2">
                    <Avatar 
                      :label="getSubjectInitials(subject.name)" 
                      size="large"
                      :style="{ backgroundColor: getSubjectColor(subject.code), color: 'white' }"
                    />
                    <Tag 
                      :value="subject.isActive ? 'Active' : 'Inactive'" 
                      :severity="subject.isActive ? 'success' : 'danger'"
                      class="text-xs"
                    />
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button 
                      icon="pi pi-pencil" 
                      @click.stop="openEditDialog(subject)"
                      size="small"
                      text
                      rounded
                      v-tooltip.top="'Edit Subject'"
                    />
                    <Button 
                      :icon="subject.isActive ? 'pi pi-ban' : 'pi pi-check'" 
                      @click.stop="toggleSubjectStatus(subject)"
                      size="small"
                      text
                      rounded
                      :severity="subject.isActive ? 'danger' : 'success'"
                      :v-tooltip.top="subject.isActive ? 'Deactivate' : 'Activate'"
                    />
                  </div>
                </div>
                
                <h4 class="font-medium text-900 mb-2 truncate" :title="subject.name">{{ subject.name }}</h4>
                <div class="mb-2">
                  <Tag :value="subject.code" severity="info" class="text-xs w-fit" />
                </div>
                <p class="text-sm text-600 line-height-3 mb-0 truncate" :title="subject.description">
                  {{ subject.description || 'No description available' }}
                </p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Subject Table View -->
        <div v-else>
          <!-- View Mode Toggle -->
          <div class="flex justify-content-between align-items-center mb-3">
            <div class="flex gap-2 ml-auto">
              <Button 
                label="Cards" 
                icon="pi pi-th-large"
                @click="viewMode = 'cards'"
                :outlined="viewMode !== 'cards'"
                size="small"
              />
              <Button 
                label="Table" 
                icon="pi pi-table"
                @click="viewMode = 'table'"
                :outlined="viewMode !== 'table'"
                size="small"
              />
            </div>
            <span class="p-input-icon-left">
              <!-- <i class="pi pi-search" /> -->
              <InputText 
                v-model="globalFilter" 
                placeholder="Search subjects..." 
                class="w-20rem ml-2"
              />
            </span>
          </div>
  
          <DataTable 
            :value="filteredSubjects" 
            :loading="loading"
            :paginator="true" 
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            :globalFilterFields="['name', 'code', 'description']"
            :sortField="sortField"
            :sortOrder="sortOrder"
            showGridlines
            stripedRows
            responsiveLayout="scroll"
            filterDisplay="menu"
            v-model:globalFilter="globalFilter"
            class="p-datatable-sm sticky-header compact-table"
            :rowClass="getRowClass"
          >
            <template #header>
              <div class="flex justify-content-between align-items-center">
                <span class="text-xl font-semibold">
                  {{ filteredSubjects.length }} subject{{ filteredSubjects.length !== 1 ? 's' : '' }} found
                </span>
              </div>
            </template>
  
            <Column style="width: 60px">
              <template #body="{ data }">
                <Avatar 
                  :label="getSubjectInitials(data.name)" 
                  size="normal"
                  :style="{ backgroundColor: getSubjectColor(data.code), color: 'white' }"
                />
              </template>
            </Column>
  
            <Column field="name" header="Subject Name" sortable style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex flex-column gap-1">
                  <span class="font-medium text-900">{{ data.name }}</span>
                  <Tag :value="data.code" severity="info" class="text-xs w-fit" />
                </div>
              </template>
            </Column>
  
            <Column field="code" header="Code" sortable style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.code" severity="secondary" />
              </template>
            </Column>
  
            <Column field="description" header="Description" style="min-width: 300px">
              <template #body="{ data }">
                <span class="text-600">
                  {{ data.description || 'No description available' }}
                </span>
              </template>
            </Column>
  
            <Column field="isActive" header="Status" sortable style="width: 100px">
              <template #body="{ data }">
                <Tag 
                  :value="data.isActive ? 'Active' : 'Inactive'" 
                  :severity="data.isActive ? 'success' : 'danger'"
                />
              </template>
            </Column>
  
            <Column header="Actions" style="width: 150px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-eye" 
                    @click="viewSubject(data)"
                    size="small"
                    outlined
                    severity="info"
                    v-tooltip.top="'View Details'"
                  />
                  <Button 
                    icon="pi pi-pencil" 
                    @click="openEditDialog(data)"
                    size="small"
                    outlined
                    v-tooltip.top="'Edit Subject'"
                  />
                  <Button 
                    :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'" 
                    @click="toggleSubjectStatus(data)"
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
                <i class="pi pi-book text-4xl text-400 mb-2"></i>
                <p class="text-500 mt-2">No subjects found</p>
                <Button label="Add Subject" icon="pi pi-plus" @click="openAddDialog" class="mt-2" />
              </div>
            </template>
          </DataTable>
        </div>
  
        <!-- View Mode Toggle for Cards View -->
        <div v-if="viewMode === 'cards'" class="flex justify-content-center mt-4">
          <div class="flex gap-2">
            <Button 
              label="Cards" 
              icon="pi pi-th-large"
              @click="viewMode = 'cards'"
              :outlined="viewMode !== 'cards'"
              size="small"
            />
            <Button 
              label="Table" 
              icon="pi pi-table"
              @click="viewMode = 'table'"
              :outlined="viewMode !== 'table'"
              size="small"
            />
          </div>
        </div>
      </div>
  
      <!-- Subject Details Dialog -->
      <Dialog 
        v-model:visible="showDetailsDialog" 
        modal 
        header="Subject Details"
        :style="{ width: '500px' }"
      >
        <div v-if="selectedSubject" class="subject-details">
          <div class="text-center mb-4">
            <Avatar 
              :label="getSubjectInitials(selectedSubject.name)" 
              size="xlarge"
              :style="{ backgroundColor: getSubjectColor(selectedSubject.code), color: 'white' }"
              class="mb-3"
            />
            <h3 class="text-900 font-medium mb-2">{{ selectedSubject.name }}</h3>
            <Tag 
              :value="selectedSubject.isActive ? 'Active' : 'Inactive'" 
              :severity="selectedSubject.isActive ? 'success' : 'danger'"
            />
          </div>
  
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-medium text-900">Subject Code</label>
                <div class="text-600">{{ selectedSubject.code }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-medium text-900">Subject ID</label>
                <div class="text-600">#{{ selectedSubject.id }}</div>
              </div>
            </div>
            <div class="col-12">
              <div class="field">
                <label class="font-medium text-900">Description</label>
                <div class="text-600">
                  {{ selectedSubject.description || 'No description provided' }}
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
            label="Edit Subject" 
            icon="pi pi-pencil" 
            @click="editSelectedSubject"
          />
        </template>
      </Dialog>
    </div>
  </template>
  
  <script setup>
  import { subjectService } from '@/service/api.service'; // Adjust path as needed
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, reactive, ref } from 'vue';
  
  // Emits
  const emit = defineEmits(['addSubject', 'editSubject', 'viewSubject'])
  
  // Toast for notifications
  const toast = useToast()
  
  // Component state
  const subjects = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const includeInactive = ref(false)
  const globalFilter = ref('')
  const sortField = ref('name')
  const sortOrder = ref(1)
  const viewMode = ref('table') // 'table' or 'cards'
  const showDetailsDialog = ref(false)
  const selectedSubject = ref(null)
  //const addSubjectDialogVisible = ref(false)
  const subjectDialogVisible = ref(false)

  const subjectForm = reactive({
    name: '',
    code: '',
    description: ''
  })
  // Computed property to determine if we're in edit mode
const isEditMode = computed(() => selectedSubject.value !== null)

// Methods
const openAddDialog = () => {
  resetForm()
  selectedSubject.value = null
  subjectDialogVisible.value = true
}

const openEditDialog = (subject) => {
  selectedSubject.value = subject
  subjectForm.id = subject.id
  subjectForm.name = subject.name
  subjectForm.code = subject.code
  subjectForm.description = subject.description
  subjectForm.isActive = subject.isActive
  subjectDialogVisible.value = true
}

const resetForm = () => {
  subjectForm.id = null
  subjectForm.name = ''
  subjectForm.code = ''
  subjectForm.description = ''
  subjectForm.isActive = true
}

const cancelDialog = () => {
  subjectDialogVisible.value = false
  resetForm()
  selectedSubject.value = null
}

//   const showAddSubjectDialog = () => {
//   addSubjectDialogVisible.value = true
  
//   // Reset form
//   Object.assign(newSubject, {
//     name: '',
//     code: '',
//     description: ''
//   })
// }
// const cancelAdd = () => {
//   addSubjectDialogVisible.value = false
// }

const validationErrors = reactive({ name: '', code: '' })

const validateForm = () => {
  validationErrors.name = subjectForm.name.trim() ? '' : 'Subject name is required.'
  validationErrors.code = subjectForm.code.trim() ? '' : 'Subject code is required.'
  return !validationErrors.name && !validationErrors.code
}

const saveSubject = async () => {
  if (!validateForm()) return
  try {
    saving.value = true
    
    if (isEditMode.value) {
      // Update existing subject
      await subjectService.update(subjectForm.id, {
        name: subjectForm.name,
        code: subjectForm.code,
        description: subjectForm.description,
        isActive: subjectForm.isActive
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Subject updated successfully',
        life: 3000
      })
    } else {
      // Create new subject
      await subjectService.create({
        name: subjectForm.name,
        code: subjectForm.code,
        description: subjectForm.description
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Subject created successfully',
        life: 3000
      })
    }
    
    // Refresh the subjects list
    await loadSubjects()
    
    // Close dialog
    cancelDialog()
    
  } catch (error) {
    console.error('Error saving subject:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: isEditMode.value ? 'Failed to update subject' : 'Failed to create subject',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

  
  // Computed properties
  const filteredSubjects = computed(() => {
    let filtered = subjects.value
  
    // Filter by active status
    if (!includeInactive.value) {
      filtered = filtered.filter(subject => subject.isActive)
    }
  
    // Filter by search term
    if (globalFilter.value && globalFilter.value.trim() !== '') {
      const term = globalFilter.value.trim().toLowerCase()
      filtered = filtered.filter(subject =>
        (subject.name && subject.name.toLowerCase().includes(term)) ||
        (subject.code && subject.code.toLowerCase().includes(term)) ||
        (subject.description && subject.description.toLowerCase().includes(term))
      )
    }
  
    return filtered
  })
  
  const statistics = computed(() => {
    const activeSubjects = subjects.value.filter(subject => subject.isActive)
    const inactiveSubjects = subjects.value.filter(subject => !subject.isActive)
    const withDescription = subjects.value.filter(subject => subject.description && subject.description.trim())
  
    return {
      total: subjects.value.length,
      active: activeSubjects.length,
      inactive: inactiveSubjects.length,
      withDescription: withDescription.length
    }
  })
  
  // Helper methods
  const getSubjectInitials = (name) => {
    if (!name) return 'S'
    const words = name.split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()
  }
  
  const getSubjectColor = (code) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ]
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }
  
  const getRowClass = (data) => {
    return {
      'opacity-60': !data.isActive
    }
  }
  
  // Data loading
  const loadSubjects = async () => {
    loading.value = true
    try {
      const data = await subjectService.getAll(includeInactive.value)
      subjects.value = data || []
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load subjects',
        life: 3000
      })
      subjects.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Event handlers
  const toggleInactive = async () => {
    includeInactive.value = !includeInactive.value
    await loadSubjects()
  }
  
  const viewSubject = (subject) => {
    selectedSubject.value = subject
    showDetailsDialog.value = true
  }
  
  const editSubject = (subject) => {
    emit('editSubject', subject)
  }
  
  const editSelectedSubject = () => {
    showDetailsDialog.value = false
    emit('editSubject', selectedSubject.value)
  }
  
  const toggleSubjectStatus = async (subject) => {
  try {
    const updatedSubject = await subjectService.toggleStatus(subject.id)
    
    // Find and update the subject in your subjects array
    const index = subjects.value.findIndex(s => s.id === subject.id)
    if (index !== -1) {
      subjects.value[index] = updatedSubject
    }
    
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Subject "${subject.name}" has been ${updatedSubject.isActive ? 'activated' : 'deactivated'}`,
      life: 3000
    })
    
  } catch (error) {
    console.error('Error toggling subject status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update subject status',
      life: 3000
    })
  }
}
  // Load data on component mount
  onMounted(() => {
    loadSubjects()
  })
  </script>
  
  <style scoped>
  .subject-list {
    padding: 1rem;
  }
  
  .card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .subject-card {
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
  }
  
  .subject-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .subject-details .field {
    margin-bottom: 1rem;
  }
  
  .subject-details .field label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
  
  .opacity-60 {
    opacity: 0.6;
  }
  
  .w-fit {
    width: fit-content;
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
  
  :deep(.p-avatar) {
    font-weight: bold;
  }
  
  .sticky-header :deep(.p-datatable-thead) {
    position: sticky;
    top: 0;
    background: white;
    z-index: 2;
  }
  .compact-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.35rem 0.5rem;
  }
  .stat-card {
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .stat-card:hover {
    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.08);
    transform: translateY(-2px) scale(1.03);
  }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .group:hover .group-hover\:opacity-100 {
    opacity: 1 !important;
  }
  .stats-row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  .stats-row::-webkit-scrollbar {
    height: 8px;
  }
  .stats-row::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .stats-row::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  @media (max-width: 640px) {
    .card {
      padding: 0.75rem;
    }
    .stats-row {
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .stat-card {
      min-width: 140px;
      padding: 0.75rem 0.5rem;
    }
    .subject-list h2 {
      font-size: 1.25rem;
    }
  }
  </style>