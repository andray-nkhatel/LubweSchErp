<template>
  <DataTable
    :value="assignments"
    :rows="3"
    stripedRows
    :paginator="assignments.length > 10"
    responsiveLayout="scroll"
    class="p-datatable-sm"
  >
    <Column field="teacherName" sortable header="Teacher" />
    <Column field="subjectName" header="Subject" />
    <Column header="Grade">
      <template #body="slotProps">
        {{ slotProps.data.gradeFullName || slotProps.data.fullName || [slotProps.data.gradeName, slotProps.data.gradeStream].filter(Boolean).join(' ') }}
      </template>
    </Column>
    <Column field="assignedDate" header="Assigned Date">
      <template #body="slotProps">
        {{ formatDate(slotProps.data.assignedDate) }}
      </template>
    </Column>
    <Column header="Actions">
      <template #body="slotProps">
        <Button
          icon="pi pi-trash"
          severity="danger"
          size="small"
          text
          @click="$emit('delete', slotProps.data.id)"
          v-tooltip="'Remove Assignment'"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
const props = defineProps({
  assignments: Array
})

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}
</script> 