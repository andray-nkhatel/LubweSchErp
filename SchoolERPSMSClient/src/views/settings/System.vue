<template>
   



    

    <!-- Report Generation Section -->
    <div class="card mt-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
                <h2 class="text-xl font-semibold text-900 mb-2">MarkSchedule and Analysis</h2>
               
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <!-- Generate All Mark Schedules -->
            <div class="border-1 border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-file-pdf text-2xl text-blue-500"></i>
                    <div>
                        <h3 class="font-semibold text-900">All Mark Schedules</h3>
                        <p class="text-sm text-600">Generate PDF mark schedules for all grades</p>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Academic Year</label>
                        <Dropdown
                            v-model="reportFilters.academicYearId"
                            :options="academicYears"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select academic year"
                            class="w-full"
                            :loading="loadingAcademicYears"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Term</label>
                        <Dropdown
                            v-model="reportFilters.term"
                            :options="terms"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select term"
                            class="w-full"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Exam Type</label>
                        <Dropdown
                            v-model="reportFilters.examTypeId"
                            :options="examTypes"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select exam type"
                            class="w-full"
                            :loading="loadingExamTypes"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Grade/Class (Optional)</label>
                        <Dropdown
                            v-model="reportFilters.gradeId"
                            :options="grades"
                            optionLabel="fullName"
                            optionValue="id"
                            placeholder="All Grades"
                            class="w-full"
                            :loading="loadingGrades"
                            :showClear="true"
                        />
                    </div>
                </div>

                <div class="mt-4 space-y-2">
                    <Button
                        label="Generate All Grades Mark Schedule"
                        icon="pi pi-file-pdf"
                        class="w-full"
                        :disabled="!canGenerateAllMarkSchedules"
                        @click="generateAllMarkSchedules"
                        :loading="generatingAllMarkSchedules"
                    />
                    <Button
                        v-if="reportFilters.gradeId"
                        label="Generate Single Grade Mark Schedule"
                        icon="pi pi-file-pdf"
                        class="w-full p-button-secondary"
                        :disabled="!canGenerateSingleGradeMarkSchedule"
                        @click="generateSingleGradeMarkSchedule"
                        :loading="generatingSingleGradeMarkSchedule"
                        severity="secondary"
                    />
                    <Button
                        label="Debug: Show Exam Types"
                        icon="pi pi-info-circle"
                        class="w-full p-button-outlined"
                        @click="debugExamTypes"
                        severity="info"
                    />
                </div>
            </div>

            <!-- Generate Exam Analysis -->
            <div class="border-1 border-surface-200 dark:border-surface-700 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-chart-line text-2xl text-orange-500"></i>
                    <div>
                        <h3 class="font-semibold text-900">Exam Analysis</h3>
                        <p class="text-sm text-600">Generate comprehensive exam analysis reports</p>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Academic Year</label>
                        <Dropdown
                            v-model="reportFilters.academicYearId"
                            :options="academicYears"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select academic year"
                            class="w-full"
                            :loading="loadingAcademicYears"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Term</label>
                        <Dropdown
                            v-model="reportFilters.term"
                            :options="terms"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select term"
                            class="w-full"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Exam Type</label>
                        <Dropdown
                            v-model="reportFilters.examTypeId"
                            :options="examTypes"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select exam type"
                            class="w-full"
                            :loading="loadingExamTypes"
                        />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-medium">Grade (Optional)</label>
                        <Dropdown
                            v-model="reportFilters.gradeId"
                            :options="grades"
                            optionLabel="fullName"
                            optionValue="id"
                            placeholder="All Secondary Grades"
                            class="w-full"
                            :loading="loadingGrades"
                            :showClear="true"
                        />
                    </div>
                </div>

                <div class="mt-4 space-y-2">
                    <Button
                        label="Generate All Grades Analysis"
                        icon="pi pi-chart-line"
                        class="w-full"
                        :disabled="!canGenerateExamAnalysis"
                        @click="generateExamAnalysis"
                        :loading="generatingExamAnalysis"
                    />
                    <Button
                        v-if="reportFilters.gradeId"
                        label="Generate Grade Analysis"
                        icon="pi pi-chart-bar"
                        class="w-full"
                        :disabled="!canGenerateGradeExamAnalysis"
                        @click="generateGradeExamAnalysis"
                        :loading="generatingGradeExamAnalysis"
                        severity="secondary"
                    />
                </div>
            </div>

           

                
            

            
        </div>
    </div>
</template>

<script setup>
import {
    examAnalysisService,
    examService,
    gradeService,
    markScheduleService,
    subjectService,
    userService
} from '@/service/api.service';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// Props
const props = defineProps({
    academicYearId: {
        type: Number,
        required: false,
        default: null
    }
})

// Emits
const emit = defineEmits(['process-complete', 'create-new-year'])

// Reactive data
const currentStep = ref('1')
const verifying = ref(false)
const activeAcademicYear = ref(null)
const loadingAcademicYear = ref(false)

// Report generation data
const reportFilters = ref({
    academicYearId: null,
    term: null,
    examTypeId: null,
    gradeId: null
})

const academicYears = ref([])
const terms = ref([
    { id: 1, name: 'Term 1' },
    { id: 2, name: 'Term 2' },
    { id: 3, name: 'Term 3' }
])
const examTypes = ref([])
const grades = ref([])

const loadingAcademicYears = ref(false)
const loadingExamTypes = ref(false)
const loadingGrades = ref(false)
const generatingAllMarkSchedules = ref(false)
const generatingSingleGradeMarkSchedule = ref(false)
const generatingClassReports = ref(false)
const generatingExamAnalysis = ref(false)
const generatingGradeExamAnalysis = ref(false)
const refreshingStatistics = ref(false)

const statistics = ref({
    totalStudents: 0,
    activeGrades: 0,
    totalSubjects: 0,
    totalTeachers: 0
})

// Pre-closure checks
const checks = ref({
    gradesFinalized: false,
    assessmentsComplete: false,
    reportsGenerated: false,
    administrativeTasksComplete: false
})

// Step statuses
const steps = ref({
    closeYear: {
        status: 'pending', // pending, loading, completed, error
        loading: false,
        error: null
    },
    promoteStudents: {
        status: 'pending',
        loading: false,
        error: null
    },
    archiveGraduates: {
        status: 'pending',
        loading: false,
        error: null
    }
})

// Computed properties
const allChecksComplete = computed(() => {
    return Object.values(checks.value).every(check => check === true)
})

const currentAcademicYearId = computed(() => {
    return props.academicYearId || activeAcademicYear.value?.id
})

const isAcademicYearLoaded = computed(() => {
    return currentAcademicYearId.value != null
})

const canGenerateAllMarkSchedules = computed(() => {
    const canGenerate = reportFilters.value.academicYearId && 
           reportFilters.value.term && 
           reportFilters.value.examTypeId
    
    console.log('🔍 canGenerateAllMarkSchedules check:', {
        academicYearId: reportFilters.value.academicYearId,
        term: reportFilters.value.term,
        examTypeId: reportFilters.value.examTypeId,
        canGenerate: canGenerate
    })
    
    return canGenerate
})

const canGenerateSingleGradeMarkSchedule = computed(() => {
    return reportFilters.value.academicYearId && 
           reportFilters.value.term && 
           reportFilters.value.examTypeId &&
           reportFilters.value.gradeId
})

const canGenerateExamAnalysis = computed(() => {
    return reportFilters.value.academicYearId && 
           reportFilters.value.term && 
           reportFilters.value.examTypeId
})

const canGenerateGradeExamAnalysis = computed(() => {
    return reportFilters.value.academicYearId && 
           reportFilters.value.term && 
           reportFilters.value.examTypeId &&
           reportFilters.value.gradeId
})

const canGenerateClassReports = computed(() => {
    return reportFilters.value.gradeId && 
           reportFilters.value.academicYearId && 
           reportFilters.value.term
})

// Methods
const loadActiveAcademicYear = async () => {
    if (props.academicYearId) return // Already have ID from props
    
    loadingAcademicYear.value = true
    try {
        const response = await examService.getActiveAcademicYear()
        activeAcademicYear.value = response
    } catch (error) {
        console.error('Error loading active academic year:', error)
        // You might want to show an error message to the user here
    } finally {
        loadingAcademicYear.value = false
    }
}

// Report generation methods
const loadAcademicYears = async () => {
    loadingAcademicYears.value = true
    try {
        const years = await examService.getAcademicYears()
        console.log('🔍 Loaded academic years:', years)
        academicYears.value = years
        if (years.length > 0) {
            const selectedYear = years.find(y => y.isActive)?.id || years[0].id
            reportFilters.value.academicYearId = selectedYear
            console.log('🔍 Selected academic year ID:', selectedYear)
        }
    } catch (error) {
        console.error('Error loading academic years:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load academic years',
            life: 3000
        })
    } finally {
        loadingAcademicYears.value = false
    }
}

const loadExamTypes = async () => {
    loadingExamTypes.value = true
    try {
        console.log('🔍 Loading exam types...')
        const types = await examService.getExamTypes()
        console.log('🔍 Exam types loaded:', types)
        examTypes.value = types
    } catch (error) {
        console.error('Error loading exam types:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load exam types',
            life: 3000
        })
    } finally {
        loadingExamTypes.value = false
    }
}

const loadGrades = async () => {
    loadingGrades.value = true
    try {
        const gradeList = await gradeService.getAll()
        grades.value = gradeList
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

const generateAllMarkSchedules = async () => {
    if (!canGenerateAllMarkSchedules.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select all required fields',
            life: 3000
        })
        return
    }

    generatingAllMarkSchedules.value = true
    try {
        // Validate that all required values are present
        if (!reportFilters.value.academicYearId || !reportFilters.value.term || !reportFilters.value.examTypeId) {
            throw new Error('Missing required parameters: academicYearId, term, or examTypeId');
        }

        const academicYearName = academicYears.value.find(y => y.id === reportFilters.value.academicYearId)?.name || ''
        const termName = terms.value.find(t => t.id === reportFilters.value.term)?.name || ''
        const examTypeObj = examTypes.value.find(e => e.id === reportFilters.value.examTypeId)
        
        if (!examTypeObj || !examTypeObj.name) {
            throw new Error('Selected exam type not found or has no name');
        }
        
        const examTypeName = examTypeObj.name

        console.log('🔍 Debug - Parameters being sent:', {
            academicYearId: reportFilters.value.academicYearId,
            term: reportFilters.value.term,
            examTypeName: examTypeName
        });
        
        // Note: Your working curl uses academicYearId=2, but we're sending academicYearId=1
        // You might need to select the correct academic year in the dropdown
        // Try selecting Academic Year ID 2 in the dropdown to match your working curl example

        // Test backend connection first
        const isBackendConnected = await markScheduleService.testBackendConnection();
        if (!isBackendConnected) {
            throw new Error('Cannot connect to backend server. Please check if the server is running.');
        }

        toast.add({
            severity: 'info',
            summary: 'Processing',
            detail: 'Generating PDF mark schedules. This may take up to 60 seconds...',
            life: 3000
        });

        const pdfBlob = await markScheduleService.getMarkSchedulePdfForAllGrades(
            reportFilters.value.academicYearId,
            reportFilters.value.term,
            examTypeName
        )

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `MarkSchedule_AllGrades_Year${reportFilters.value.academicYearId}_Term${reportFilters.value.term}_${examTypeName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'All mark schedules generated successfully! PDF generation can take up to 60 seconds for large datasets.',
            life: 5000
        })
    } catch (error) {
        console.error('Error generating all mark schedules:', error)
        
        let errorMessage = 'Failed to generate mark schedules. Please try again.'
        
        if (error.message.includes('Missing required parameters')) {
            errorMessage = error.message
        } else if (error.message.includes('Network error')) {
            errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Selected exam type not found')) {
            errorMessage = 'Selected exam type not found. Please refresh the page and try again.'
        } else if (error.message.includes('Backend server is not responding')) {
            errorMessage = 'Backend server is not responding. Please ensure the backend is running on http://localhost:5287'
        }
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        })
    } finally {
        generatingAllMarkSchedules.value = false
    }
}

const generateSingleGradeMarkSchedule = async () => {
    if (!canGenerateSingleGradeMarkSchedule.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select all required fields including grade',
            life: 3000
        })
        return
    }

    generatingSingleGradeMarkSchedule.value = true
    try {
        // Validate that all required values are present
        if (!reportFilters.value.academicYearId || !reportFilters.value.term || !reportFilters.value.examTypeId || !reportFilters.value.gradeId) {
            throw new Error('Missing required parameters: academicYearId, term, examTypeId, or gradeId');
        }

        const academicYearName = academicYears.value.find(y => y.id === reportFilters.value.academicYearId)?.name || ''
        const termName = terms.value.find(t => t.id === reportFilters.value.term)?.name || ''
        const examTypeObj = examTypes.value.find(e => e.id === reportFilters.value.examTypeId)
        const gradeObj = grades.value.find(g => g.id === reportFilters.value.gradeId)
        
        if (!examTypeObj || !examTypeObj.name) {
            throw new Error('Selected exam type not found or has no name');
        }
        
        if (!gradeObj || !gradeObj.fullName) {
            throw new Error('Selected grade not found or has no name');
        }
        
        const examTypeName = examTypeObj.name
        const gradeName = gradeObj.fullName

        console.log('🔍 Debug - Single Grade Parameters being sent:', {
            academicYearId: reportFilters.value.academicYearId,
            term: reportFilters.value.term,
            examTypeName: examTypeName,
            gradeId: reportFilters.value.gradeId,
            gradeName: gradeName
        });

        // Test backend connection first
        const isBackendConnected = await markScheduleService.testBackendConnection();
        if (!isBackendConnected) {
            throw new Error('Cannot connect to backend server. Please check if the server is running.');
        }

        toast.add({
            severity: 'info',
            summary: 'Processing',
            detail: `Generating PDF mark schedule for ${gradeName}. This may take up to 30 seconds...`,
            life: 3000
        });

        const pdfBlob = await markScheduleService.getMarkSchedulePdfForGrade(
            reportFilters.value.gradeId,
            reportFilters.value.academicYearId,
            reportFilters.value.term,
            examTypeName
        )

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `MarkSchedule_${gradeName}_Year${reportFilters.value.academicYearId}_Term${reportFilters.value.term}_${examTypeName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Mark schedule for ${gradeName} generated successfully!`,
            life: 5000
        })
    } catch (error) {
        console.error('Error generating single grade mark schedule:', error)
        
        let errorMessage = 'Failed to generate mark schedule. Please try again.'
        
        if (error.message.includes('Missing required parameters')) {
            errorMessage = error.message
        } else if (error.message.includes('Network error')) {
            errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Selected exam type not found')) {
            errorMessage = 'Selected exam type not found. Please refresh the page and try again.'
        } else if (error.message.includes('Selected grade not found')) {
            errorMessage = 'Selected grade not found. Please refresh the page and try again.'
        } else if (error.message.includes('Backend server is not responding')) {
            errorMessage = 'Backend server is not responding. Please ensure the backend is running on http://localhost:5287'
        }
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        })
    } finally {
        generatingSingleGradeMarkSchedule.value = false
    }
}

const generateExamAnalysis = async () => {
    if (!canGenerateExamAnalysis.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select all required fields',
            life: 3000
        })
        return
    }

    generatingExamAnalysis.value = true
    try {
        const academicYearName = academicYears.value.find(y => y.id === reportFilters.value.academicYearId)?.name || ''
        const termName = terms.value.find(t => t.id === reportFilters.value.term)?.name || ''
        const examTypeName = examTypes.value.find(e => e.id === reportFilters.value.examTypeId)?.name || ''

        const pdfBlob = await examAnalysisService.getExamAnalysisPdf(
            reportFilters.value.academicYearId,
            reportFilters.value.term,
            examTypeName
        )

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ExamAnalysis_${reportFilters.value.academicYearId}_Term${reportFilters.value.term}_${examTypeName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Exam analysis generated successfully!',
            life: 5000
        })
    } catch (error) {
        console.error('Error generating exam analysis:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate exam analysis. Please try again.',
            life: 5000
        })
    } finally {
        generatingExamAnalysis.value = false
    }
}

const generateGradeExamAnalysis = async () => {
    if (!canGenerateGradeExamAnalysis.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select all required fields including grade',
            life: 3000
        })
        return
    }

    generatingGradeExamAnalysis.value = true
    try {
        const academicYearName = academicYears.value.find(y => y.id === reportFilters.value.academicYearId)?.name || ''
        const termName = terms.value.find(t => t.id === reportFilters.value.term)?.name || ''
        const examTypeName = examTypes.value.find(e => e.id === reportFilters.value.examTypeId)?.name || ''
        const gradeName = grades.value.find(g => g.id === reportFilters.value.gradeId)?.name || ''

        const pdfBlob = await examAnalysisService.getExamAnalysisPdfForGrade(
            reportFilters.value.gradeId,
            reportFilters.value.academicYearId,
            reportFilters.value.term,
            examTypeName
        )

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ExamAnalysis_Grade${reportFilters.value.gradeId}_${reportFilters.value.academicYearId}_Term${reportFilters.value.term}_${examTypeName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Exam analysis for ${gradeName} generated successfully!`,
            life: 5000
        })
    } catch (error) {
        console.error('Error generating grade exam analysis:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate grade exam analysis. Please try again.',
            life: 5000
        })
    } finally {
        generatingGradeExamAnalysis.value = false
    }
}

const generateClassReports = async () => {
    if (!canGenerateClassReports.value) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please select all required fields',
            life: 3000
        })
        return
    }

    generatingClassReports.value = true
    try {
        // This would call your backend endpoint for generating class report cards
        // For now, we'll show a placeholder
        toast.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Class report generation feature coming soon!',
            life: 3000
        })
    } catch (error) {
        console.error('Error generating class reports:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate class reports. Please try again.',
            life: 5000
        })
    } finally {
        generatingClassReports.value = false
    }
}

const refreshStatistics = async () => {
    refreshingStatistics.value = true
    try {
        // Load statistics from various services
        const [students, grades, subjects, teachers] = await Promise.all([
            examService.getStudentsByGrade(1), // Get sample data
            gradeService.getAll(),
            subjectService.getAll(),
            userService.getAll()
        ])

        statistics.value = {
            totalStudents: students.length,
            activeGrades: grades.filter(g => g.isActive).length,
            totalSubjects: subjects.filter(s => s.isActive).length,
            totalTeachers: teachers.filter(t => t.role === 'Teacher' && t.isActive).length
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Statistics refreshed successfully!',
            life: 3000
        })
    } catch (error) {
        console.error('Error refreshing statistics:', error)
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to refresh statistics',
            life: 3000
        })
    } finally {
        refreshingStatistics.value = false
    }
}

const verifyPreClosureChecks = async () => {
    verifying.value = true
    try {
        // Simulate API calls to verify each check
        // In a real implementation, these would be actual API calls to check:
        // - All grades submitted and finalized
        // - All assessments completed
        // - Student reports generated
        // - Administrative tasks completed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        checks.value.gradesFinalized = true
        checks.value.assessmentsComplete = true
        checks.value.reportsGenerated = true
        checks.value.administrativeTasksComplete = true
    } catch (error) {
        console.error('Error verifying pre-closure checks:', error)
    } finally {
        verifying.value = false
    }
}

const closeAcademicYear = async () => {
    if (!currentAcademicYearId.value) {
        console.error('No academic year ID available')
        return
    }

    steps.value.closeYear.loading = true
    steps.value.closeYear.status = 'loading'
    
    try {
        await examService.closeAcademicYear(currentAcademicYearId.value)
        steps.value.closeYear.status = 'completed'
        steps.value.closeYear.error = null
    } catch (error) {
        steps.value.closeYear.status = 'error'
        steps.value.closeYear.error = error.message || 'Failed to close academic year'
    } finally {
        steps.value.closeYear.loading = false
    }
}

const promoteAllStudents = async () => {
    if (!currentAcademicYearId.value) {
        console.error('No academic year ID available')
        return
    }

    steps.value.promoteStudents.loading = true
    steps.value.promoteStudents.status = 'loading'
    
    try {
        await examService.promoteAllStudents(currentAcademicYearId.value)
        steps.value.promoteStudents.status = 'completed'
        steps.value.promoteStudents.error = null
    } catch (error) {
        steps.value.promoteStudents.status = 'error'
        steps.value.promoteStudents.error = error.message || 'Failed to promote students'
    } finally {
        steps.value.promoteStudents.loading = false
    }
}

const archiveGraduates = async () => {
    if (!currentAcademicYearId.value) {
        console.error('No academic year ID available')
        return
    }

    steps.value.archiveGraduates.loading = true
    steps.value.archiveGraduates.status = 'loading'
    
    try {
        await examService.archiveGraduates(currentAcademicYearId.value)
        steps.value.archiveGraduates.status = 'completed'
        steps.value.archiveGraduates.error = null
    } catch (error) {
        steps.value.archiveGraduates.status = 'error'
        steps.value.archiveGraduates.error = error.message || 'Failed to archive graduates'
    } finally {
        steps.value.archiveGraduates.loading = false
    }
}

const createNewAcademicYear = () => {
    emit('create-new-year')
}

const debugExamTypes = () => {
    console.log('🔍 Debug Exam Types:', JSON.parse(JSON.stringify(examTypes.value)));
    console.log('🔍 Selected Exam Type ID:', reportFilters.value.examTypeId);
    console.log('🔍 Selected Exam Type Object:', JSON.parse(JSON.stringify(examTypes.value.find(e => e.id === reportFilters.value.examTypeId))));
    console.log('🔍 All Academic Years:', JSON.parse(JSON.stringify(academicYears.value)));
    console.log('🔍 Selected Academic Year ID:', reportFilters.value.academicYearId);
    
    // Show the actual exam type name being sent
    const selectedExamType = examTypes.value.find(e => e.id === reportFilters.value.examTypeId);
    console.log('🔍 Exam Type Name being sent:', selectedExamType?.name);
    
    toast.add({
        severity: 'info',
        summary: 'Debug Info',
        detail: `Exam Types: ${examTypes.value.length}, Selected: ${reportFilters.value.examTypeId}, Name: ${selectedExamType?.name}`,
        life: 5000
    });
}

// Load data on component mount
onMounted(async () => {
    try {
        await Promise.all([
            loadActiveAcademicYear(),
            loadAcademicYears(),
            loadExamTypes(),
            loadGrades(),
            refreshStatistics()
        ]);
    } catch (error) {
        console.error('Error during component initialization:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to initialize component. Please refresh the page.',
            life: 5000
        });
    }
})
</script>