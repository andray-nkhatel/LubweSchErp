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
  import { gradeService, subjectService } from '@/service/api.service'; // Assuming you have a grade service

  
  export default {
    name: 'AssignSubjectToGrade',
    
    data() {
      return {
        selectedSubject: null,
        selectedGrade: null,
        isOptional: false,
        subjects: [],
        grades: [],
        loading: false,
        loadingSubjects: false,
        loadingGrades: false,
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
          this.loadGrades()
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
  
      async handleSubmit() {
        this.submitted = true
  
        if (!this.selectedSubject || !this.selectedGrade) {
          return
        }
  
        try {
          this.loading = true
          
          const assignmentData = {
            isOptional: this.isOptional
          }
  
          await subjectService.assignToGrade(
            this.selectedSubject,
            this.selectedGrade,
            assignmentData
          )
  
          this.$toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Subject assigned to grade successfully',
            life: 3000
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