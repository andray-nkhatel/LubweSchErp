<template>
  <Dialog 
    :visible="localVisible"
    @update:visible="onDialogVisibleUpdate"
    :style="{ width: '40rem' }" 
    header="Transfer Teacher Assignments"
    :modal="true"
  >
    <form @submit.prevent="handleTransfer" class="p-fluid">
      <div class="field">
        <label for="fromTeacher" class="block font-medium mb-2">From Teacher *</label>
        <Dropdown
          id="fromTeacher"
          v-model="transferForm.fromTeacherId"
          :options="teachers"
          optionLabel="fullName"
          optionValue="id"
          placeholder="Select teacher to transfer from"
          class="w-full"
        />
      </div>
      <div class="field">
        <label for="toTeacher" class="block font-medium mb-2">To Teacher *</label>
        <Dropdown
          id="toTeacher"
          v-model="transferForm.toTeacherId"
          :options="teachers"
          optionLabel="fullName"
          optionValue="id"
          placeholder="Select teacher to transfer to"
          class="w-full"
        />
      </div>
    </form>
    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        severity="secondary"
        @click="onDialogVisibleUpdate(false)" 
      />
      <Button 
        label="Transfer" 
        icon="pi pi-arrow-right" 
        @click="handleTransfer"
        :loading="transferLoading"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  teachers: Array,
  visible: Boolean
})
const emit = defineEmits(['transfer', 'update:visible'])

const localVisible = ref(props.visible)
watch(() => props.visible, val => { localVisible.value = val })

function onDialogVisibleUpdate(val) {
  localVisible.value = val
  emit('update:visible', val)
}

const transferForm = ref({
  fromTeacherId: null,
  toTeacherId: null
})
const transferLoading = ref(false)

function handleTransfer() {
  if (!transferForm.value.fromTeacherId || !transferForm.value.toTeacherId) {
    window.$toast?.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please select both teachers',
      life: 3000
    })
    return
  }
  if (transferForm.value.fromTeacherId === transferForm.value.toTeacherId) {
    window.$toast?.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Cannot transfer to the same teacher',
      life: 3000
    })
    return
  }
  transferLoading.value = true
  emit('transfer', { ...transferForm.value })
  transferLoading.value = false
  onDialogVisibleUpdate(false)
  transferForm.value = { fromTeacherId: null, toTeacherId: null }
}
</script> 