<template>
  <div class="bulk-assign-subjects">
    <Card>
      <template #title>
        <i class="pi pi-users mr-2"></i>
        Bulk Assign Subjects to Grade
      </template>
      
      <template #content>
        <form @submit.prevent="handleSubmit" class="p-fluid">
          <div class="field">
            <label for="grade" class="block font-medium mb-2">Grade *</label>
            <Dropdown
              id="grade"
              v-model="selectedGrade"
              :options="grades"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Select a grade"
              :loading="loadingGrades"
              :class="{ 'p-invalid': submitted && !selectedGrade }"
              class="w-full"
            />
            <small v-if="submitted && !selectedGrade" class="p-error">
              Grade is required.
            </small>
          </div>

          <div class="field">
            <label for="subjects" class="block font-medium mb-2">Subjects *</label>
            <MultiSelect
              id="subjects"
              v-model="selectedSubjects"
              :options="subjects"
              optionLabel="name"
              optionValue="id"
              placeholder="Select subjects"
              display="chip"
              :loading="loadingSubjects || loadingGradeSubjects"
              :class="{ 'p-invalid': submitted && (!selectedSubjects || selectedSubjects.length === 0) }"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <span class="font-medium">{{ slotProps.option.name }}</span>
                  <span class="text-sm text-500 ml-2">({{ slotProps.option.code }})</span>
                </div>
              </template>
            </MultiSelect>
            <small v-if="submitted && (!selectedSubjects || selectedSubjects.length === 0)" class="p-error">
              At least one subject is required.
            </small>
          </div>

          <div class="field">
            <label for="academicYear" class="block font-medium mb-2">Academic Year</label>
            <Dropdown
              id="academicYear"
              v-model="selectedAcademicYear"
              :options="academicYears"
              optionLabel="name"
              optionValue="id"
              placeholder="Select academic year (optional)"
              :loading="loadingAcademicYears"
              class="w-full"
            />
            <small class="text-500">Leave empty to apply to all academic years</small>
          </div>

          <div class="field-checkbox">
            <Checkbox
              id="autoAssign"
              v-model="autoAssignToStudents"
              :binary="true"
            />
            <label for="autoAssign" class="ml-2">
              Automatically assign to all students in this grade
            </label>
          </div>

          <div v-if="autoAssignToStudents" class="field-checkbox ml-4">
            <Checkbox
              id="assignExisting"
              v-model="assignToExistingStudents"
              :binary="true"
            />
            <label for="assignExisting" class="ml-2">
              Also assign to students already in this grade
            </label>
            <small class="block text-500 mt-1">
              If unchecked, only new students will get these subjects
            </small>
          </div>

          <div class="flex justify-content-end gap-2 mt-4">
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
              label="Assign Subjects"
              icon="pi pi-check"
              :loading="loading"
            />
          </div>
        </form>
      </template>
    </Card>

    <Toast ref="toast" />
  </div>
</template>

<script>
import { examService, gradeService, subjectService } from '@/service/api.service';

export default {
  name: 'BulkAssignSubjectsToGrade',
  
  data() {
    return {
      selectedGrade: null,
      selectedSubjects: [],
      autoAssignToStudents: false,
      assignToExistingStudents: false,
      selectedAcademicYear: null,
      subjects: [],
      grades: [],
      academicYears: [],
      loading: false,
      loadingSubjects: false,
      loadingGrades: false,
      loadingAcademicYears: false,
      loadingGradeSubjects: false,
      submitted: false
    }
  },

  watch: {
    selectedGrade: {
      handler(newVal) {
        if (!newVal) {
          this.selectedSubjects = []
          return
        }
        this.loadExistingGradeSubjects()
      }
    }
  },

  async mounted() {
    await this.loadData()
  },

  methods: {
    async loadExistingGradeSubjects() {
      if (!this.selectedGrade) return
      try {
        this.loadingGradeSubjects = true
        const list = await subjectService.getGradeSubjectsWithInheritance(this.selectedGrade, false)
        const arr = Array.isArray(list) ? list : list?.data || []
        this.selectedSubjects = arr.map((s) => (typeof s === 'object' && s.id != null) ? s.id : s)
      } catch (error) {
        console.error('Error loading grade subjects:', error)
        this.selectedSubjects = []
      } finally {
        this.loadingGradeSubjects = false
      }
    },

    async loadData() {
      await Promise.all([
        this.loadSubjects(),
        this.loadGrades(),
        this.loadAcademicYears()
      ])
    },

    async loadSubjects() {
      try {
        this.loadingSubjects = true
        this.subjects = await subjectService.getAll()
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load subjects',
          life: 3000
        })
      } finally {
        this.loadingSubjects = false
      }
    },

    async loadGrades() {
      try {
        this.loadingGrades = true
        this.grades = await gradeService.getAll()
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load grades',
          life: 3000
        })
      } finally {
        this.loadingGrades = false
      }
    },

    async loadAcademicYears() {
      try {
        this.loadingAcademicYears = true
        const years = await examService.getAcademicYears()
        const yearsArray = Array.isArray(years) ? years : (years?.data || [])
        this.academicYears = yearsArray
          .sort((a, b) => {
            const yearA = parseInt(a.name) || 0
            const yearB = parseInt(b.name) || 0
            return yearB - yearA
          })
        
        // Set active academic year as default
        const activeYear = yearsArray.find(y => y.isActive)
        if (activeYear) {
          this.selectedAcademicYear = activeYear.id
        }
      } catch (error) {
        console.error('Error loading academic years:', error)
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load academic years',
          life: 3000
        })
      } finally {
        this.loadingAcademicYears = false
      }
    },

    async handleSubmit() {
      this.submitted = true

      if (!this.selectedGrade || !this.selectedSubjects || this.selectedSubjects.length === 0) {
        return
      }

      try {
        this.loading = true
        
        const bulkData = {
          subjectIds: this.selectedSubjects,
          autoAssignToStudents: this.autoAssignToStudents,
          assignToExistingStudents: this.assignToExistingStudents,
          academicYearId: this.selectedAcademicYear || null
        }

        const response = await subjectService.bulkAssignSubjectsToGrade(
          this.selectedGrade,
          bulkData
        )

        let detailMessage = `Successfully updated grade subjects`
        if (response) {
          const parts = []
          if (response.subjectsAssigned > 0) parts.push(`${response.subjectsAssigned} assigned`)
          if (response.subjectsUpdated > 0) parts.push(`${response.subjectsUpdated} updated`)
          if (response.subjectsDeassigned > 0) parts.push(`${response.subjectsDeassigned} removed`)
          if (parts.length) detailMessage += `: ${parts.join(', ')}`
          if (this.autoAssignToStudents && response.studentsAssigned > 0) {
            detailMessage += `. ${response.studentsAssigned} student assignment(s) created`
          }
        }

        this.$toast.add({
          severity: 'success',
          summary: 'Success',
          detail: detailMessage,
          life: 5000
        })
        this.$toast.add({
          severity: 'info',
          summary: 'Next step',
          detail: 'Assign teachers to these subject–grade pairs via Academic → Teacher Assignments so they can enter marks.',
          life: 8000
        })

        this.resetForm()
        this.$emit('assignment-created')
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to assign subjects to grade'
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        })
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.selectedGrade = null
      this.selectedSubjects = []
      this.autoAssignToStudents = false
      this.assignToExistingStudents = false
      this.selectedAcademicYear = this.academicYears.find(y => y.isActive)?.id || null
      this.submitted = false
    }
  }
}
</script>

<style scoped>
.bulk-assign-subjects {
  max-width: 800px;
  margin: 0 auto;
}

.field {
  margin-bottom: 1.5rem;
}

.field-checkbox {
  margin-bottom: 1.5rem;
}
</style>

