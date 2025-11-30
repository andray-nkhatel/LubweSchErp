<template>
    <div class="exam-type">
        <div class="flex justify-content-between align-items-center mb-4">
            <h1>Exam Type</h1>
            <div class="ml-auto">
                <Button 
                label="Add New Exam" 
                raised
                icon="pi pi-plus" 
                @click="showAddDialog = true"
                class="p-button-success mx-2"
            />
            <!-- <Button label="Add New Exam" severity="info" /> -->
            </div>
            
        </div>
        <p>This is the exam type page.</p>
    </div>

    <div class="card mt-5">
        <DataTable :value="exams" stripedRows scrollable scrollHeight="400px" class="w-full">
            <Column field="name" header="Exam name"></Column>
            <Column field="description" header="Description"></Column>
            <Column header="Actions" :exportable="false" class="w-1/12" style="min-width:12rem">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-pencil" 
                        class="p-button-rounded p-button-success mr-2" 
                        @click="editExam(slotProps.data)"
                        v-tooltip.top="'Edit'"
                        size="small"
                    />
                    <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-warning" 
                        @click="confirmDeleteExam(slotProps.data)"
                        v-tooltip.top="'Delete'"
                        size="small"
                    />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog 
        v-model:visible="showAddDialog" 
        :style="{width: '450px'}" 
        header="Add New Exam Type" 
        :modal="true"
        class="p-fluid"
    >
        <div class="field mb-3">
            <label for="name">Exam Name</label>
            <InputText 
                id="name" 
                v-model.trim="examForm.name" 
                required="true" 
                autofocus
                class="w-full" 
                :class="{'p-invalid': submitted && !examForm.name}" 
            />
            <small class="p-invalid" v-if="submitted && !examForm.name">Name is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="description">Description</label>
            <InputText 
            id="description"
            v-model="examForm.description"
            class="w-full"
            required="true"

            />
        </div>
        
       
        
        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                class="p-button-text" 
                @click="hideDialog"
            />
            <Button 
                label="Save" 
                icon="pi pi-check" 
                class="p-button-text" 
                @click="saveExam" 
            />
        </template>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog 
        v-model:visible="showEditDialog" 
        :style="{width: '450px'}" 
        header="Edit Exam Type" 
        :modal="true"
        class="p-fluid"
    >
        <div class="field mb-3">
            <label for="editName">Exam Name</label>
            <InputText 
                id="editName" 
                v-model.trim="examForm.name" 
                required="true" 
                autofocus
                class="w-full" 
                :class="{'p-invalid': submitted && !examForm.name}" 
            />
            <small class="p-invalid" v-if="submitted && !examForm.name">Name is required.</small>
        </div>
        
        <div class="field mb-3">
            <label for="description">Description</label>
            <InputText 
            id="description"
            v-model="examForm.description"
            class="w-full"
            required="true"

            />
        </div>
        
       
        
        <template #footer>
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                class="p-button-text" 
                @click="hideDialog"
            />
            <Button 
                label="Update" 
                icon="pi pi-check" 
                class="p-button-text" 
                @click="updateExam" 
            />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
        v-model:visible="deleteExamDialog" 
        :style="{width: '450px'}" 
        header="Confirm" 
        :modal="true"
    >
        <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span v-if="selectedExam">Are you sure you want to delete <b>{{selectedExam.name}}</b>?</span>
        </div>
        <template #footer>
            <Button 
                label="No" 
                icon="pi pi-times" 
                class="p-button-text" 
                @click="deleteExamDialog = false"
            />
            <Button 
                label="Yes" 
                icon="pi pi-check" 
                class="p-button-text" 
                @click="deleteExam" 
            />
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import { examService } from '@/service/api.service';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const exams = ref()
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const deleteExamDialog = ref(false)
const submitted = ref(false)
const selectedExam = ref()

const examForm = ref({
    id: null,
    name: '',
    description: '',
    order: 0,
})

onMounted(() => {
    examService.getExamTypes().then((data) => exams.value = data);
});

const hideDialog = () => {
    showAddDialog.value = false
    showEditDialog.value = false
    submitted.value = false
    resetForm()
}

const resetForm = () => {
    examForm.value = {
        id: null,
        name: '',
        description: '',
        order: 0,
      
    }
}

const saveExam = () => {
    submitted.value = true
    
    if (examForm.value.name?.trim() && examForm.value.description?.trim()) {
        const maxOrder = Math.max(...exams.value.map(e => e.order || 0), 0);
        examForm.value.order = maxOrder + 1;


        // Call your API service to create new exam
        examService.createExamType(examForm.value).then(() => {
            // Refresh the data
            examService.getExamTypes().then((data) => exams.value = data);
            
            toast.add({
                severity: 'success', 
                summary: 'Successful', 
                detail: 'Exam Type Created', 
                life: 3000
            });
            
            hideDialog()
        }).catch(() => {
            toast.add({
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to create exam type', 
                life: 3000
            });
        });
    }
}

const editExam = (exam: any) => {
    examForm.value = { ...exam }
    showEditDialog.value = true
}

const updateExam = () => {
    submitted.value = true
    
    if (examForm.value.name?.trim() && examForm.value.description?.trim()) {
        // Call your API service to update exam
        examService.updateExamType(examForm.value.id, examForm.value).then(() => {
            // Refresh the data
            examService.getExamTypes().then((data) => exams.value = data);
            
            toast.add({
                severity: 'success', 
                summary: 'Successful', 
                detail: 'Exam Type Updated', 
                life: 3000
            });
            
            hideDialog()
        }).catch(() => {
            toast.add({
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to update exam type', 
                life: 3000
            });
        });
    }
}

const confirmDeleteExam = (exam: any) => {
    selectedExam.value = exam
    deleteExamDialog.value = true
}

const deleteExam = () => {
    // Call your API service to delete exam
    examService.deleteExamType(selectedExam.value.id).then(() => {
        // Refresh the data
        examService.getExamTypes().then((data) => exams.value = data);
        
        toast.add({
            severity: 'success', 
            summary: 'Successful', 
            detail: 'Exam Type Deleted', 
            life: 3000
        });
        
        deleteExamDialog.value = false
        selectedExam.value = null
    }).catch(() => {
        toast.add({
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to delete exam type', 
            life: 3000
        });
    });
}
</script>