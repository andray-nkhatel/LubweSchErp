<template>
  <div class="student-list">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-semibold text-900 m-0">Students</h2>
        <div class="flex gap-2 ml-auto">
          <Button 
            :label="includeArchived ? 'Hide Archived' : 'Show Archived'" 
            :icon="includeArchived ? 'pi pi-eye-slash' : 'pi pi-eye'"
            @click="toggleArchived"
            :outlined="!includeArchived"
          />
          <Button 
            label="Refresh" 
            icon="pi pi-refresh" 
            @click="loadStudents"
            outlined
          />

          <Button 
            label="Add Student" 
            icon="pi pi-user" 
            @click="navigateToAddStudent"
            outlined
          />
        </div>
      </div>

      <DataTable 
        :value="filteredStudents" 
        :loading="loading"
        :paginator="true"
        :rowHover="true"
        :rows="100"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        showGridlines
        stripedRows
        responsiveLayout="scroll"
        filterDisplay="menu"
        class="p-datatable-sm"
      >
        <template #header>
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <span class="text-xl font-semibold">
              {{ filteredStudents.length }} student{{ filteredStudents.length !== 1 ? 's' : '' }} found
            </span>
            <div class="flex gap-2 align-items-center">
              <Dropdown
                v-model="selectedGradeId"
                :options="gradeOptions"
                optionLabel="fullName"
                optionValue="id"
                placeholder="Filter by Grade"
                class="w-15rem"
                :showClear="true"
                :loading="loadingGrades"
                @change="onGradeFilterChange"
              />
              <span class="p-input-icon-left">
                <InputText 
                  v-model="globalFilter" 
                  placeholder="Search students..." 
                  class="w-20rem"
                />
                <i class="pi pi-search" />
              </span>
            </div>
          </div>
        </template>

        <Column field="studentNumber" header="Student #" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag :value="data.studentNumber" severity="info" />
          </template>
        </Column>

        <Column field="fullName" header="Full Name" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex flex-column gap-1">
              <span class="font-medium">{{ data.fullName}}</span>
              <!-- <small class="text-500">{{ data.firstName }} {{ data.middleName }} {{ data.lastName }}</small> -->
            </div>
          </template>
        </Column>

        <Column field="gradeName" header="Grade" sortable style="min-width: 100px">
          <template #body="{ data }">
            <Tag :value="data.gradeName" severity="success" />
          </template>
        </Column>

        <!-- Actions Column -->
        <Column header="Actions" style="min-width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-pencil" 
                severity="info"
                size="small"
                outlined
                @click="editStudent(data)"
                v-tooltip.top="'Edit Student'"
              />
              <Button 
                icon="pi pi-trash" 
                severity="danger"
                size="small"
                outlined
                @click="confirmDelete(data)"
                v-tooltip.top="'Delete Student'"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-4">
            <i class="pi pi-users text-4xl text-400"></i>
            <p class="text-500 mt-2">No students found</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialog" 
      :style="{ width: '450px' }" 
      header="Confirm Delete" 
      :modal="true"
    >
      <div class="flex align-items-center justify-content-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--red-500)" />
        <span v-if="selectedStudent">
          Are you sure you want to delete <strong>{{ selectedStudent.fullName }}</strong>?
          <br>
          <small class="text-500">This action cannot be undone.</small>
        </span>
      </div>
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          @click="deleteDialog = false" 
          outlined 
        />
        <Button 
          label="Delete" 
          icon="pi pi-check" 
          severity="danger"
          @click="deleteStudent" 
          :loading="deleting"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { gradeService, studentService } from '../../service/api.service';

const router = useRouter();

// Reactive state
const students = ref([])
const loading = ref(false)
const includeArchived = ref(false)
const globalFilter = ref('')
const selectedGradeId = ref(null)
const sortField = ref('fullName')
const sortOrder = ref(1)

// Grade filter state
const grades = ref([])
const loadingGrades = ref(false)

// Delete dialog state
const deleteDialog = ref(false)
const selectedStudent = ref(null)
const deleting = ref(false)

// Computed property for grade options
const gradeOptions = computed(() => {
  // Get unique grades from students, sorted by name
  const gradeMap = new Map();
  students.value.forEach(student => {
    if (student.gradeId && student.gradeName) {
      if (!gradeMap.has(student.gradeId)) {
        gradeMap.set(student.gradeId, {
          id: student.gradeId,
          fullName: student.gradeName,
          name: student.gradeName
        });
      }
    }
  });
  return Array.from(gradeMap.values()).sort((a, b) => 
    a.fullName.localeCompare(b.fullName)
  );
});

// Computed property for filtered students
const filteredStudents = computed(() => {
  let filtered = students.value;

  // Filter by grade if selected
  if (selectedGradeId.value) {
    filtered = filtered.filter(student => 
      Number(student.gradeId) === Number(selectedGradeId.value)
    );
  }

  // Apply global text search filter
  if (globalFilter.value) {
    const searchTerm = globalFilter.value.toLowerCase().trim();
    
    filtered = filtered.filter(student => {
      // Check all searchable fields
      const searchableFields = [
        student.firstName || '',
        student.lastName || '',
        student.fullName || '',
        student.studentNumber || '',
        student.gradeName || '',
        student.guardianName || '',
        student.guardianPhone || '',
        student.gender || '',
        // Also search in optional subjects
        ...(student.optionalSubjects || []).map(subject => subject.name || '')
      ];
      
      return searchableFields.some(field => 
        field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }

  return filtered;
});

// Handle grade filter change
const onGradeFilterChange = () => {
  // Filter is applied automatically via computed property
  // This handler can be used for additional logic if needed
}

function navigateToAddStudent() {
  router.push({ name: 'AddStudent' }) // Adjust the route name as needed
}


// Load students data
const loadStudents = async () => {
  loading.value = true
  try {
    const data = await studentService.getAll(includeArchived.value)
    students.value = (data || []).map(s => ({
      ...s,
      // Ensure all searchable fields exist and are strings
      firstName: String(s.firstName || ''),
      lastName: String(s.lastName || ''),
      fullName: String(s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim()),
      studentNumber: String(s.studentNumber || ''),
      gradeName: String(s.gradeName || ''),
      // Preserve gradeId (might be gradeId or grade?.id)
      gradeId: s.gradeId || s.grade?.id || null,
      guardianPhone: String(s.guardianPhone || s.phoneNumber || ''),
      guardianName: String(s.guardianName || ''),
      gender: String(s.gender || ''),
      // Ensure optionalSubjects is an array
      optionalSubjects: Array.isArray(s.optionalSubjects) ? s.optionalSubjects : []
    }))
    
    // Debug: Log first student to verify data structure
    if (students.value.length > 0) {
      console.log('Sample student data:', students.value[0])
    }
  } catch (error) {
    console.error('Error loading students:', error)
    // You might want to show a toast notification here
    students.value = []
  } finally {
    loading.value = false
  }
}

// Toggle archived students visibility
const toggleArchived = async () => {
  includeArchived.value = !includeArchived.value
  await loadStudents()
}

// Edit student
const editStudent = (student) => {
  // Navigate to edit page with student ID
  router.push({ 
    name: 'EditStudent', // Adjust the route name as needed
    params: { id: student.id }
  })
}

// Show delete confirmation
const confirmDelete = (student) => {
  selectedStudent.value = student
  deleteDialog.value = true
}

// Delete student
const deleteStudent = async () => {
  if (!selectedStudent.value) return
  
  deleting.value = true
  try {
    await studentService.delete(selectedStudent.value.id)
    // Show success message (you might want to use a toast notification)
    console.log('Student deleted successfully')
    
    // Reload the students list
    await loadStudents()
    
    // Close the dialog
    deleteDialog.value = false
    selectedStudent.value = null
  } catch (error) {
    console.error('Error deleting student:', error)
    // Show error message (you might want to use a toast notification)
  } finally {
    deleting.value = false
  }
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

// Load grades (optional - for better UX, but we'll use grades from students)
const loadGrades = async () => {
  loadingGrades.value = true
  try {
    const data = await gradeService.getAll(false)
    // Handle ApiResponse wrapper if present
    const payload = Array.isArray(data) ? data : (data?.data ?? [])
    grades.value = payload
  } catch (error) {
    console.error('Error loading grades:', error)
    grades.value = []
  } finally {
    loadingGrades.value = false
  }
}

// Load data on component mount
onMounted(() => {
  loadStudents()
  // Optionally load grades separately, but we can also derive from students
  // loadGrades()
})
</script>

<style scoped>
.student-list {
  padding: 1rem;
  /* border: 1px solid rebeccapurple; */
}

.card {
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem;
}

:deep(.p-tag) {
  font-size: 0.75rem;
}
</style>