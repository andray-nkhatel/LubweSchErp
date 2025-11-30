<template>
  <Dialog 
    :visible="localVisible"
    @update:visible="onDialogVisibleUpdate"
    :style="{ width: '50rem' }" 
    header="Assignment Results"
    :modal="true"
  >
    <div v-if="results">
      <div class="mb-3">
        <div class="flex align-items-center gap-2 mb-2">
          <i class="pi pi-check-circle text-green-500"></i>
          <span class="font-medium text-green-700">
            {{ results.successful || results.created || 0 }} assignment(s) created successfully
          </span>
        </div>
        <div v-if="results.errors && results.errors.length > 0" class="mt-3">
          <div class="flex align-items-center gap-2 mb-2">
            <i class="pi pi-exclamation-triangle text-orange-500"></i>
            <span class="font-medium text-orange-700">
              {{ results.errors.length }} assignment(s) skipped
            </span>
          </div>
          <ul class="list-none p-0 m-0">
            <li v-for="error in results.errors" :key="error" class="text-sm text-600 mb-1">
              • {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <template #footer>
      <Button 
        label="Close" 
        icon="pi pi-times" 
        @click="onDialogVisibleUpdate(false)" 
        autofocus 
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  results: Object,
  visible: Boolean
})
const emit = defineEmits(['update:visible'])

const localVisible = ref(props.visible)
watch(() => props.visible, val => { localVisible.value = val })

function onDialogVisibleUpdate(val) {
  localVisible.value = val
  emit('update:visible', val)
}
</script> 