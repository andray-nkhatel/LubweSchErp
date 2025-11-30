<template>
    <DataTable :value="academicYears" class="p-datatable-striped">
        <template #header>
            <div class="flex justify-between items-center">
                <h5>Academic Years</h5>
                <Button label="Add Academic Year" icon="pi pi-plus" @click="showAddDialog = true" />
            </div>
        </template>

        <Column field="name" header="Name" />
        <Column field="startDate" header="Start Date">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.startDate) }}
            </template>
        </Column>
        <Column field="endDate" header="End Date">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.endDate) }}
            </template>
        </Column>
        <Column header="Status" style="min-width:6rem">
            <template #body="slotProps">
                <Tag 
                    :value="getStatusText(slotProps.data)" 
                    :severity="getStatusSeverity(slotProps.data)"
                />
            </template>
        </Column>
        <Column header="Actions" :exportable="false" style="min-width:12rem">
            <template #body="slotProps">
                <!-- Edit and Delete buttons -->
                <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-text p-button-success mr-2" 
                    @click="editAcademicYear(slotProps.data)"
                    v-tooltip.top="'Edit'"
                />
                <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-text p-button-danger mr-2" 
                    @click="confirmDeleteAcademicYear(slotProps.data)"
                    v-tooltip.top="'Delete'"
                    :disabled="slotProps.data.isActive"
                />
                
                <!-- Year-end management buttons (only for active years) -->
                <template v-if="slotProps.data.isActive && !slotProps.data.isClosed">
                    <Button 
                        icon="pi pi-users" 
                        class="p-button-rounded p-button-text p-button-info mr-2" 
                        @click="confirmArchiveGraduates(slotProps.data)"
                        v-tooltip.top="'Archive Graduates'"
                    />
                    <Button 
                        icon="pi pi-arrow-up" 
                        class="p-button-rounded p-button-text p-button-warning mr-2" 
                        @click="confirmPromoteStudents(slotProps.data)"
                        v-tooltip.top="'Promote All Students'"
                    />
                    <Button 
                        icon="pi pi-lock" 
                        class="p-button-rounded p-button-text p-button-secondary" 
                        @click="confirmCloseAcademicYear(slotProps.data)"
                        v-tooltip.top="'Close Academic Year'"
                    />
                </template>
            </template>
        </Column>
    </DataTable>

    <!-- Add Dialog -->
    <Dialog 
        v-model:visible="showAddDialog" 
        :style="{width: '450px'}" 
        header="Add New Academic Year" 
        :modal="true"
        class="p-fluid"
    >
        <div class="field mb-3">
            <label for="name">Academic Year Name</label>
            <InputText 
                id="name" 
                v-model.trim="academicYearForm.name" 
                required="true" 
                autofocus
                class="w-full" 
                :class="{'p-invalid': submitted && !academicYearForm.name}" 
                placeholder="e.g., 2024-2025"
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.name">Name is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="startDate">Start Date</label>
            <DatePicker 
                id="startDate" 
                v-model="academicYearForm.startDate" 
                :showIcon="true"
                class="w-full"
                dateFormat="yy-mm-dd"
                :class="{'p-invalid': submitted && !academicYearForm.startDate}"
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.startDate">Start date is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="endDate">End Date</label>
            <DatePicker 
                id="endDate" 
                v-model="academicYearForm.endDate" 
                :showIcon="true"
                class="w-full"
                dateFormat="yy-mm-dd"
                :class="{'p-invalid': submitted && !academicYearForm.endDate}"
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.endDate">End date is required.</small>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveAcademicYear" />
        </template>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog 
        v-model:visible="showEditDialog" 
        :style="{width: '450px'}" 
        header="Edit Academic Year" 
        :modal="true"
        class="p-fluid"
    >
        <div class="field mb-3">
            <label for="editName">Academic Year Name</label>
            <InputText 
                id="editName" 
                v-model.trim="academicYearForm.name" 
                required="true" 
                autofocus
                class="w-full" 
                :class="{'p-invalid': submitted && !academicYearForm.name}" 
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.name">Name is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="editStartDate">Start Date</label>
            <DatePicker 
                id="editStartDate" 
                v-model="academicYearForm.startDate" 
                :showIcon="true"
                class="w-full"
                dateFormat="yy-mm-dd"
                :class="{'p-invalid': submitted && !academicYearForm.startDate}"
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.startDate">Start date is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="editEndDate">End Date</label>
            <DatePicker 
                id="editEndDate" 
                v-model="academicYearForm.endDate" 
                :showIcon="true"
                class="w-full"
                dateFormat="yy-mm-dd"
                :class="{'p-invalid': submitted && !academicYearForm.endDate}"
            />
            <small class="p-invalid" v-if="submitted && !academicYearForm.endDate">End date is required.</small>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
            <Button label="Update" icon="pi pi-check" class="p-button-text" @click="updateAcademicYear" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
        v-model:visible="deleteAcademicYearDialog" 
        :style="{width: '450px'}" 
        header="Confirm Delete" 
        :modal="true"
    >
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span v-if="selectedAcademicYear">
                Are you sure you want to delete <b>{{ selectedAcademicYear.name }}</b>?
            </span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteAcademicYearDialog = false" />
            <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteAcademicYear" />
        </template>
    </Dialog>

    <!-- Archive Graduates Confirmation Dialog -->
    <Dialog 
        v-model:visible="archiveGraduatesDialog" 
        :style="{width: '500px'}" 
        header="Archive Graduates" 
        :modal="true"
    >
        <div class="confirmation-content">
            <i class="pi pi-graduation-cap mr-3" style="font-size: 2rem; color: #3B82F6" />
            <div>
                <p><strong>Archive all Grade 12 graduates?</strong></p>
                <p class="text-sm text-gray-600 mt-2">
                    This will archive all students in Grade 12 for the academic year 
                    <strong>{{ selectedAcademicYear?.name }}</strong>. 
                    Archived students will no longer appear in active student lists but their records will be preserved.
                </p>
                <div class="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <p class="text-sm text-yellow-800">
                        <i class="pi pi-exclamation-triangle mr-2"></i>
                        <strong>Warning:</strong> This action cannot be easily undone. Make sure all graduation requirements are complete.
                    </p>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="archiveGraduatesDialog = false" />
            <Button 
                label="Archive Graduates" 
                icon="pi pi-check" 
                class="p-button-primary" 
                @click="archiveGraduates"
                :loading="isProcessing"
            />
        </template>
    </Dialog>

    <!-- Promote Students Confirmation Dialog -->
    <Dialog 
        v-model:visible="promoteStudentsDialog" 
        :style="{width: '500px'}" 
        header="Promote All Students" 
        :modal="true"
    >
        <div class="confirmation-content">
            <i class="pi pi-arrow-up mr-3" style="font-size: 2rem; color: #10B981" />
            <div>
                <p><strong>Promote all students to the next grade?</strong></p>
                <p class="text-sm text-gray-600 mt-2">
                    This will promote ALL students in grades 1-11 to the next grade level for the academic year 
                    <strong>{{ selectedAcademicYear?.name }}</strong>. 
                    Grade 12 students should be archived separately before promotion.
                </p>
                <div class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
                    <p class="text-sm text-blue-800">
                        <i class="pi pi-info-circle mr-2"></i>
                        <strong>Recommended Order:</strong> Archive graduates first, then promote remaining students.
                    </p>
                </div>
                <div class="mt-2 p-3 bg-red-50 border-l-4 border-red-400">
                    <p class="text-sm text-red-800">
                        <i class="pi pi-exclamation-triangle mr-2"></i>
                        <strong>Warning:</strong> This affects all students and cannot be easily undone.
                    </p>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="promoteStudentsDialog = false" />
            <Button 
                label="Promote All Students" 
                icon="pi pi-check" 
                class="p-button-warning" 
                @click="promoteAllStudents"
                :loading="isProcessing"
            />
        </template>
    </Dialog>

    <!-- Close Academic Year Confirmation Dialog -->
    <Dialog 
        v-model:visible="closeAcademicYearDialog" 
        :style="{width: '500px'}" 
        header="Close Academic Year" 
        :modal="true"
    >
        <div class="confirmation-content">
            <i class="pi pi-lock mr-3" style="font-size: 2rem; color: #6B7280" />
            <div>
                <p><strong>Close the academic year {{ selectedAcademicYear?.name }}?</strong></p>
                <p class="text-sm text-gray-600 mt-2">
                    This will officially close the academic year and mark it as inactive. 
                    You should complete all student promotions and graduate archiving before closing the year.
                </p>
                <div class="mt-3 p-3 bg-gray-50 border-l-4 border-gray-400">
                    <p class="text-sm text-gray-700">
                        <i class="pi pi-info-circle mr-2"></i>
                        <strong>After closing:</strong> The academic year will be marked as closed and inactive.
                    </p>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="closeAcademicYearDialog = false" />
            <Button 
                label="Close Academic Year" 
                icon="pi pi-check" 
                class="p-button-secondary" 
                @click="closeAcademicYear"
                :loading="isProcessing"
            />
        </template>
    </Dialog>

    <Toast />
</template>

<script lang="ts" setup>
import { examService } from '@/service/api.service';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';

const academicYears = ref([]);
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const deleteAcademicYearDialog = ref(false);
const archiveGraduatesDialog = ref(false);
const promoteStudentsDialog = ref(false);
const closeAcademicYearDialog = ref(false);
const submitted = ref(false);
const selectedAcademicYear = ref(null);
const isProcessing = ref(false);

const academicYearForm = ref({
    id: null,
    name: '',
    startDate: null,
    endDate: null,
});

const toast = useToast();

onMounted(() => {
    loadAcademicYears();
});

const loadAcademicYears = () => {
    examService.getAcademicYears().then((data) => {
        academicYears.value = data;
        console.log('Academic Years:', academicYears.value);
    }).catch((error) => {
        console.error('Error loading academic years:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load academic years',
            life: 3000
        });
    });
};

const hideDialog = () => {
    showAddDialog.value = false;
    showEditDialog.value = false;
    submitted.value = false;
    resetForm();
};

const resetForm = () => {
    academicYearForm.value = {
        id: null,
        name: '',
        startDate: null,
        endDate: null,
    };
};

// Status helpers
const getStatusText = (academicYear) => {
    if (academicYear.isClosed) return 'Closed';
    if (academicYear.isActive) return 'Active';
    return 'Inactive';
};

const getStatusSeverity = (academicYear) => {
    if (academicYear.isClosed) return 'secondary';
    if (academicYear.isActive) return 'success';
    return 'warning';
};

// Existing CRUD operations
const saveAcademicYear = () => {
    submitted.value = true;
    
    if (validateForm()) {
        const formData = {
            ...academicYearForm.value,
            startDate: formatDateForAPI(academicYearForm.value.startDate),
            endDate: formatDateForAPI(academicYearForm.value.endDate)
        };

        examService.createAcademicYear(formData).then(() => {
            loadAcademicYears();
            toast.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Academic Year Created',
                life: 3000
            });
            hideDialog();
        }).catch((error) => {
            console.error('Error creating academic year:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to create academic year',
                life: 3000
            });
        });
    }
};

const editAcademicYear = (academicYear) => {
    academicYearForm.value = {
        ...academicYear,
        startDate: parseDate(academicYear.startDate),
        endDate: parseDate(academicYear.endDate)
    };
    showEditDialog.value = true;
};

const updateAcademicYear = () => {
    submitted.value = true;
    
    if (validateForm()) {
        const formData = {
            ...academicYearForm.value,
            startDate: formatDateForAPI(academicYearForm.value.startDate),
            endDate: formatDateForAPI(academicYearForm.value.endDate)
        };

        examService.updateAcademicYear(academicYearForm.value.id, formData).then(() => {
            loadAcademicYears();
            toast.add({
                severity: 'success',
                summary: 'Successful',
                detail: 'Academic Year Updated',
                life: 3000
            });
            hideDialog();
        }).catch((error) => {
            console.error('Error updating academic year:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to update academic year',
                life: 3000
            });
        });
    }
};

const confirmDeleteAcademicYear = (academicYear) => {
    selectedAcademicYear.value = academicYear;
    deleteAcademicYearDialog.value = true;
};

const deleteAcademicYear = () => {
    examService.deleteAcademicYear(selectedAcademicYear.value.id).then(() => {
        loadAcademicYears();
        toast.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'Academic Year Deleted',
            life: 3000
        });
        deleteAcademicYearDialog.value = false;
        selectedAcademicYear.value = null;
    }).catch((error) => {
        console.error('Error deleting academic year:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete academic year',
            life: 3000
        });
    });
};

// New year-end management functions
const confirmArchiveGraduates = (academicYear) => {
    selectedAcademicYear.value = academicYear;
    archiveGraduatesDialog.value = true;
};

const archiveGraduates = async () => {
    isProcessing.value = true;
    try {
        await examService.archiveGraduates(selectedAcademicYear.value.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Graduates archived successfully',
            life: 5000
        });
        archiveGraduatesDialog.value = false;
        loadAcademicYears();
    } catch (error) {
        console.error('Error archiving graduates:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to archive graduates',
            life: 5000
        });
    } finally {
        isProcessing.value = false;
        selectedAcademicYear.value = null;
    }
};

const confirmPromoteStudents = (academicYear) => {
    selectedAcademicYear.value = academicYear;
    promoteStudentsDialog.value = true;
};

const promoteAllStudents = async () => {
    isProcessing.value = true;
    try {
        await examService.promoteAllStudents(selectedAcademicYear.value.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'All students promoted successfully',
            life: 5000
        });
        promoteStudentsDialog.value = false;
        loadAcademicYears();
    } catch (error) {
        console.error('Error promoting students:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to promote students',
            life: 5000
        });
    } finally {
        isProcessing.value = false;
        selectedAcademicYear.value = null;
    }
};

const confirmCloseAcademicYear = (academicYear) => {
    selectedAcademicYear.value = academicYear;
    closeAcademicYearDialog.value = true;
};

const closeAcademicYear = async () => {
    isProcessing.value = true;
    try {
        await examService.closeAcademicYear(selectedAcademicYear.value.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Academic year closed successfully',
            life: 5000
        });
        closeAcademicYearDialog.value = false;
        loadAcademicYears();
    } catch (error) {
        console.error('Error closing academic year:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to close academic year',
            life: 5000
        });
    } finally {
        isProcessing.value = false;
        selectedAcademicYear.value = null;
    }
};

// Utility functions
const validateForm = () => {
    return academicYearForm.value.name?.trim() && 
           academicYearForm.value.startDate && 
           academicYearForm.value.endDate;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
};

const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const parseDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
};
</script>

<style scoped>
.confirmation-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.confirmation-content div {
    flex: 1;
}

.p-datatable .p-button {
    margin: 0 0.25rem;
}
</style>