<template>
    <div class="assign-subject-grade">
      <Card>
        <template #title>
          <i class="pi pi-book mr-2"></i>
          Assign Subject to Grade
        </template>
        
        <template #content>
          <form @submit.prevent="handleSubmit" class="p-fluid">
            <div class="field">
              <label for="subject" class="block font-medium mb-2">Subject *</label>
              <Dropdown
                id="subject"
                v-model="selectedSubject"
                :options="subjects"
                optionLabel="name"
                optionValue="id"
                placeholder="Select a subject"
                :loading="loadingSubjects"
                :class="{ 'p-invalid': submitted && !selectedSubject }"
                class="w-full"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <span class="font-medium">{{ slotProps.option.name }}</span>
                    <span class="text-sm text-500 ml-2">({{ slotProps.option.code }})</span>
                  </div>
                </template>
              </Dropdown>
              <small v-if="submitted && !selectedSubject" class="p-error">
                Subject is required.
              </small>
            </div>
  
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
  
            <div class="field-checkbox">
              <Checkbox
                id="optional"
                v-model="isOptional"
                :binary="true"
              />
              <label for="optional" class="ml-2">This subject is optional for this grade</label>
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
                If unchecked, only new students will get this subject
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
                label="Assign Subject"
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
  import { gradeService, subjectService, examService } from '@/service/api.service'; // Assuming you have a grade service

  
  export default {
    name: 'AssignSubjectToGrade',
    
    data() {
      return {
        selectedSubject: null,
        selectedGrade: null,
        isOptional: false,
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
        submitted: false
      }
    },
  
    async mounted() {
      await this.loadData()
    },
  
    methods: {
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
          // Assuming you have a gradeService
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
  
        if (!this.selectedSubject || !this.selectedGrade) {
          return
        }
  
        try {
          this.loading = true
          
          const assignmentData = {
            isOptional: this.isOptional,
            autoAssignToStudents: this.autoAssignToStudents,
            assignToExistingStudents: this.assignToExistingStudents,
            academicYearId: this.selectedAcademicYear || null
          }
  
          const response = await subjectService.assignToGrade(
            this.selectedSubject,
            this.selectedGrade,
            assignmentData
          )

          let detailMessage = 'Subject assigned to grade successfully'
          if (this.autoAssignToStudents && response?.data) {
            const data = response.data
            if (data.studentsAssigned > 0) {
              detailMessage += `. ${data.studentsAssigned} student(s) assigned`
              if (data.studentsSkipped > 0) {
                detailMessage += `, ${data.studentsSkipped} skipped`
              }
            }
          }
  
          this.$toast.add({
            severity: 'success',
            summary: 'Success',
            detail: detailMessage,
            life: 5000
          })
  
          this.resetForm()
          this.$emit('assignment-created')
          
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to assign subject to grade'
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
        this.selectedSubject = null
        this.selectedGrade = null
        this.isOptional = false
        this.autoAssignToStudents = false
        this.assignToExistingStudents = false
        this.selectedAcademicYear = this.academicYears.find(y => y.isActive)?.id || null
        this.submitted = false
      }
    }
  }
  </script>
  
  <style scoped>
  .assign-subject-grade {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .field {
    margin-bottom: 1.5rem;
  }
  
  .field-checkbox {
    margin-bottom: 1.5rem;
  }
  </style>