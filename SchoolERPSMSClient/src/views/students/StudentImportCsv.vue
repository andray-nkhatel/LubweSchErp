<template>
  <div class="student-import">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-semibold text-900 m-0">Import Students from CSV</h2>
        <div class="flex gap-2 ml-auto">
          <Button 
            label="Download Template" 
            icon="pi pi-download"
            @click="downloadTemplate"
            :loading="downloadingTemplate"
            outlined
            severity="help"
          />
          <Button 
            label="Back to List" 
            icon="pi pi-arrow-left" 
            @click="navigateToList"
            outlined
          />
        </div>
      </div>

      <div class="mb-4 p-3 surface-50 border-round">
        <p class="text-600 m-0">
          <i class="pi pi-info-circle mr-2"></i>
          Download the template file for detailed instructions and column format. Only <strong>FirstName</strong>, <strong>LastName</strong>, and <strong>GradeId</strong> are required.
        </p>
      </div>

      <!-- File Upload Section -->
      <div 
        class="border-2 border-dashed border-300 border-round p-6 text-center mb-4"
        :class="{ 'border-primary': dragActive, 'bg-primary-50': dragActive }"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="handleDrop"
        role="button"
        tabindex="0"
        :aria-label="selectedFile ? `Selected file: ${selectedFile.name}` : 'Drop CSV file here or click to browse'"
        @keydown.enter.prevent="!selectedFile && document.querySelector('.p-fileupload-choose')?.click()"
      >
        
        <div v-if="!selectedFile">
          <i class="pi pi-cloud-upload text-6xl text-400 mb-3"></i>
          <h3 class="text-900 font-medium mb-2">Drop your CSV file here</h3>
          <p class="text-600 mb-3">or click to browse</p>
          <FileUpload 
            mode="basic" 
            :customUpload="true"
            @select="handleFileSelect"
            accept=".csv"
            :maxFileSize="MAX_FILE_SIZE"
            chooseLabel="Select CSV File"
            class="p-button-outlined mr-3"
            :disabled="processingFile"
          />
          <p class="text-sm text-500 mt-2">Maximum file size: {{ formatFileSize(MAX_FILE_SIZE) }}</p>
          <div v-if="processingFile" class="mt-3" role="status" aria-label="Processing file">
            <ProgressSpinner />
            <p class="text-sm text-600 mt-2">Processing file...</p>
          </div>
        </div>

        <div v-else class="text-left">
          <div class="flex align-items-center justify-content-between bg-white border-round p-3">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-file text-2xl text-green-600"></i>
              <div>
                <p class="font-medium text-900 mb-1">{{ selectedFile.name }}</p>
                <p class="text-sm text-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <Button 
              icon="pi pi-times" 
              @click="clearFile"
              text
              rounded
              severity="danger"
            />
          </div>
        </div>
      </div>

      <!-- File Analysis -->
      <div v-if="fileAnalysis" class="mb-4">
        <div class="surface-100 border-round p-4">
          <h4 class="font-medium text-900 mb-3">
            <i class="pi pi-chart-line mr-2"></i>
            File Analysis
          </h4>
          <div class="grid">
            <div class="col-12 sm:col-6 md:col-3">
              <div class="text-center">
                <div class="text-2xl font-bold text-900">{{ fileAnalysis.totalRows }}</div>
                <div class="text-sm text-600">Total Rows</div>
              </div>
            </div>
            <div class="col-12 sm:col-6 md:col-3">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ fileAnalysis.validRows }}</div>
                <div class="text-sm text-600">Valid Rows</div>
              </div>
            </div>
            <div class="col-12 sm:col-6 md:col-3">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ fileAnalysis.invalidRows }}</div>
                <div class="text-sm text-600">Invalid Rows</div>
              </div>
            </div>
            <div class="col-12 sm:col-6 md:col-3">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ fileAnalysis.originalColumns.length }}</div>
                <div class="text-sm text-600">Columns Found</div>
              </div>
            </div>
          </div>
          
          <!-- Column Mapping -->
          <div class="mt-4">
            <h5 class="font-medium text-900 mb-2">Detected Columns:</h5>
            <div class="flex flex-wrap gap-2">
              <Tag 
                v-for="column in fileAnalysis.originalColumns" 
                :key="column"
                :value="column"
                :severity="isRequiredColumnMatched(column) ? 'success' : 'info'"
              />
            </div>
            
            <!-- Missing Required Columns -->
            <div v-if="missingColumns.length > 0" class="mt-3">
              <h5 class="font-medium text-red-600 mb-2">Missing Required Columns:</h5>
              <div class="flex flex-wrap gap-2">
                <Tag 
                  v-for="column in missingColumns" 
                  :key="column"
                  :value="column"
                  severity="danger"
                />
              </div>
            </div>

            <!-- Column Mapping Info -->
            <div v-if="fileAnalysis.columnMapping && Object.keys(fileAnalysis.columnMapping).length > 0" class="mt-3">
              <h5 class="font-medium text-900 mb-2">Column Mapping:</h5>
              <div class="grid">
                <div v-for="(originalCol, normalizedCol) in fileAnalysis.columnMapping" :key="normalizedCol" class="col-12 md:col-6 lg:col-4">
                  <div class="text-sm p-2 bg-green-50 border-round">
                    <strong>{{ originalCol }}</strong> → {{ normalizedCol }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Errors -->
            <div v-if="fileAnalysis.validationErrors && fileAnalysis.validationErrors.length > 0" class="mt-3">
              <h5 class="font-medium text-red-600 mb-2">Row Validation Errors:</h5>
              <div class="max-h-20rem overflow-auto">
                <div 
                  v-for="(errorInfo, index) in fileAnalysis.validationErrors.slice(0, 10)" 
                  :key="index"
                  class="bg-red-50 border-l-4 border-red-400 p-2 mb-2"
                >
                  <p class="text-sm text-red-800 font-medium mb-1">Row {{ errorInfo.row }}:</p>
                  <ul class="text-sm text-red-700 ml-4">
                    <li v-for="(error, errIndex) in errorInfo.errors" :key="errIndex">{{ error }}</li>
                  </ul>
                </div>
                <p v-if="fileAnalysis.validationErrors.length > 10" class="text-sm text-600 mt-2">
                  ... and {{ fileAnalysis.validationErrors.length - 10 }} more error(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Data -->
      <div v-if="previewData.length > 0" class="mb-4">
        <h4 class="font-medium text-900 mb-3">
          <i class="pi pi-table mr-2"></i>
          Data Preview (First 5 rows)
        </h4>
        <DataTable 
          :value="previewData.slice(0, PREVIEW_ROW_LIMIT)" 
          class="p-datatable-sm"
          showGridlines
          :loading="processingFile"
        >
          <Column 
            v-for="column in fileAnalysis.originalColumns" 
            :key="column"
            :field="column" 
            :header="column"
            style="min-width: 120px"
          >
            <template #body="{ data }">
              <span :class="{ 'text-red-600': !data[column] && isRequiredColumnMatched(column) }">
                {{ data[column] || '-' }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Import Actions -->
      <div class="flex gap-2 justify-content-end">
        <Button 
          label="Clear File" 
          icon="pi pi-times"
          @click="clearFile"
          outlined
          severity="secondary"
          :disabled="!selectedFile || importing"
        />
        <Button 
          label="Import Students" 
          icon="pi pi-upload"
          @click="importStudents"
          :disabled="!canImport"
          :loading="importing"
        />
      </div>

      <!-- Debug Information (remove this in production) -->
      <!-- <div v-if="fileAnalysis" class="mt-4 p-3 bg-yellow-50 border-round">
        <h5 class="font-medium text-900 mb-2">Debug Information:</h5>
        <div class="text-sm">
          <p><strong>Selected File:</strong> {{ !!selectedFile }}</p>
          <p><strong>File Analysis:</strong> {{ !!fileAnalysis }}</p>
          <p><strong>Missing Columns:</strong> {{ missingColumns.length }} ({{ missingColumns.join(', ') }})</p>
          <p><strong>Valid Rows:</strong> {{ fileAnalysis.validRows }}</p>
          <p><strong>Can Import:</strong> {{ canImport }}</p>
          <p><strong>Required Columns:</strong> {{ requiredColumns.join(', ') }}</p>
          <p><strong>Detected Columns (normalized):</strong> {{ fileAnalysis.originalColumns.map(col => normalizeColumnName(col)).join(', ') }}</p>
        </div>
      </div>
      -->

      <!-- Import Results -->
      <div v-if="importResults" class="mt-4">
        <div class="surface-100 border-round p-4">
          <h4 class="font-medium text-900 mb-3">
            <i class="pi pi-check-circle mr-2 text-green-600"></i>
            Import Results
          </h4>
          <div class="grid">
            <div class="col-12 sm:col-6 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ importResults.successful }}</div>
                <div class="text-sm text-600">Successfully Imported</div>
              </div>
            </div>
            <div class="col-12 sm:col-6 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ importResults.failed }}</div>
                <div class="text-sm text-600">Failed to Import</div>
              </div>
            </div>
            <div class="col-12 sm:col-6 md:col-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ importResults.total }}</div>
                <div class="text-sm text-600">Total Processed</div>
              </div>
            </div>
          </div>

          <!-- Error Details -->
          <div v-if="importResults.errors?.length > 0" class="mt-4">
            <h5 class="font-medium text-red-600 mb-2">Import Errors:</h5>
            <div class="max-h-20rem overflow-auto">
              <div 
                v-for="(error, index) in importResults.errors" 
                :key="index"
                class="bg-red-50 border-l-4 border-red-400 p-3 mb-2"
              >
                <p class="text-sm text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { studentService, gradeService } from '@/service/api.service';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 4000,
  LONG: 5000
};
const PREVIEW_ROW_LIMIT = 5;
const REQUIRED_COLUMNS = ['firstname', 'lastname', 'gradeid'];
const OPTIONAL_COLUMNS = [
  'middlename', 'studentnumber', 'dateofbirth', 
  'gender', 'address', 'phonenumber', 'guardianname', 'guardianphone'
];

const router = useRouter();
const emit = defineEmits(['back', 'studentsImported']);
const toast = useToast();

// Component state
const selectedFile = ref(null);
const dragActive = ref(false);
const importing = ref(false);
const downloadingTemplate = ref(false);
const fileAnalysis = ref(null);
const previewData = ref([]);
const importResults = ref(null);
const processingFile = ref(false);

// Navigation
function navigateToList() {
  router.push({ name: 'AddBulkStudent' });
}

// Utility functions
const normalizeColumnName = (columnName) => {
  return columnName.toLowerCase().trim();
};

const createColumnMapping = (originalHeaders) => {
  const mapping = {};
  originalHeaders.forEach(header => {
    const normalized = normalizeColumnName(header);
    mapping[normalized] = header;
  });
  return mapping;
};

const isRequiredColumnMatched = (originalColumnName) => {
  const normalized = normalizeColumnName(originalColumnName);
  return REQUIRED_COLUMNS.includes(normalized);
};

const isValidFileType = (file) => {
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const validExtensions = ['.csv'];
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

const validateFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

// Computed properties
const missingColumns = computed(() => {
  if (!fileAnalysis.value) return [];
  
  const normalizedDetectedColumns = fileAnalysis.value.originalColumns.map(col => 
    normalizeColumnName(col)
  );
  return REQUIRED_COLUMNS.filter(requiredCol => 
    !normalizedDetectedColumns.includes(requiredCol)
  );
});

const canImport = computed(() => {
  if (!selectedFile.value || !fileAnalysis.value || importing.value) {
    return false;
  }
  
  return missingColumns.value.length === 0 && 
         fileAnalysis.value.validRows > 0;
});

// File handling methods
const extractFileFromEvent = (event) => {
  if (event.files && event.files.length > 0) {
    return event.files[0];
  }
  if (event.target?.files?.length > 0) {
    return event.target.files[0];
  }
  if (Array.isArray(event) && event.length > 0) {
    return event[0];
  }
  return null;
};

const validateFile = (file) => {
  if (!file) {
    toast.add({
      severity: 'error',
      summary: 'File Error',
      detail: 'No file was selected',
      life: TOAST_DURATION.SHORT
    });
    return false;
  }

  if (!isValidFileType(file)) {
    toast.add({
      severity: 'error',
      summary: 'Invalid File Type',
      detail: 'Please select a CSV file (.csv)',
      life: TOAST_DURATION.SHORT
    });
    return false;
  }

  if (!validateFileSize(file)) {
    toast.add({
      severity: 'error',
      summary: 'File Too Large',
      detail: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
      life: TOAST_DURATION.MEDIUM
    });
    return false;
  }

  return true;
};

const handleFileSelect = (event) => {
  const file = extractFileFromEvent(event);
  if (validateFile(file)) {
    processFile(file);
  }
};

const handleDrop = (event) => {
  dragActive.value = false;
  const files = event.dataTransfer?.files;
  
  if (files && files.length > 0) {
    const file = files[0];
    if (validateFile(file)) {
      processFile(file);
    }
  }
};

const processFile = async (file) => {
  processingFile.value = true;
  selectedFile.value = file;
  importResults.value = null;
  fileAnalysis.value = null;
  previewData.value = [];
  
  try {
    const text = await readFileAsText(file);
    analyzeCSV(text);
  } catch (error) {
    selectedFile.value = null;
    const errorMessage = error.message || 'Failed to read the CSV file';
    toast.add({
      severity: 'error',
      summary: 'File Error',
      detail: errorMessage,
      life: TOAST_DURATION.MEDIUM
    });
  } finally {
    processingFile.value = false;
  }
};

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Handle UTF-8 BOM if present
      let text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file. Please ensure the file is not corrupted.'));
    };
    // Try UTF-8 first, fallback to default encoding
    reader.readAsText(file, 'UTF-8');
  });
};

// Improved CSV parsing that handles edge cases
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
};

const validateRowData = (row, originalHeaders) => {
  const errors = [];
  
  // Check required fields
  REQUIRED_COLUMNS.forEach(requiredCol => {
    const originalColumnName = originalHeaders.find(originalCol => 
      normalizeColumnName(originalCol) === requiredCol
    );
    
    if (!originalColumnName) {
      errors.push(`Missing required column: ${requiredCol}`);
      return;
    }
    
    const value = row[originalColumnName]?.trim();
    if (!value) {
      errors.push(`Required field ${originalColumnName} is empty`);
    }
    
    // Validate gradeId is numeric
    if (requiredCol === 'gradeid' && value && isNaN(Number(value))) {
      errors.push(`gradeId must be a number, got: ${value}`);
    }
  });
  
  // Validate dateOfBirth format if present
  const dobColumn = originalHeaders.find(col => 
    normalizeColumnName(col) === 'dateofbirth'
  );
  if (dobColumn && row[dobColumn]) {
    const dobValue = row[dobColumn].trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dobValue)) {
      errors.push(`Invalid dateOfBirth format: ${dobValue}. Expected YYYY-MM-DD`);
    }
  }
  
  return errors;
};

const analyzeCSV = (csvText) => {
  if (!csvText || !csvText.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Invalid File',
      detail: 'The CSV file appears to be empty',
      life: TOAST_DURATION.MEDIUM
    });
    return;
  }

  // Normalize line endings and split
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    toast.add({
      severity: 'error',
      summary: 'Invalid File',
      detail: 'CSV file must contain at least a header row and one data row',
      life: TOAST_DURATION.MEDIUM
    });
    return;
  }

  // Parse header
  const headerLine = lines[0];
  const originalHeaders = parseCSVLine(headerLine);
  
  if (originalHeaders.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'Invalid File',
      detail: 'Could not parse CSV headers',
      life: TOAST_DURATION.MEDIUM
    });
    return;
  }

  // Create column mapping
  const columnMapping = createColumnMapping(originalHeaders);
  
  // Parse data rows with validation
  const dataRows = [];
  const rowErrors = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    
    // Ensure we have the right number of columns
    if (values.length !== originalHeaders.length) {
      rowErrors.push({
        row: i + 1,
        error: `Row ${i + 1} has ${values.length} columns, expected ${originalHeaders.length}`
      });
      continue;
    }
    
    const row = {};
    originalHeaders.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    dataRows.push(row);
  }

  // Validate rows
  let validRows = 0;
  const validationErrors = [];
  
  dataRows.forEach((row, index) => {
    const errors = validateRowData(row, originalHeaders);
    if (errors.length === 0) {
      validRows++;
    } else {
      validationErrors.push({
        row: index + 2, // +2 because index is 0-based and we skip header
        errors
      });
    }
  });

  // Store analysis results
  fileAnalysis.value = {
    totalRows: dataRows.length,
    validRows,
    invalidRows: dataRows.length - validRows,
    originalColumns: originalHeaders,
    columnMapping,
    rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined
  };

  previewData.value = dataRows;
  
  // Show appropriate message
  if (missingColumns.value.length === 0 && originalHeaders.length > 0) {
    const message = validRows === dataRows.length
      ? `All ${validRows} rows are valid and ready to import.`
      : `Found ${validRows} valid rows out of ${dataRows.length} total rows.`;
    
    toast.add({
      severity: validRows > 0 ? 'success' : 'warn',
      summary: 'File Validated',
      detail: message,
      life: TOAST_DURATION.MEDIUM
    });
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Missing Columns',
      detail: `Missing required columns: ${missingColumns.value.join(', ')}`,
      life: TOAST_DURATION.LONG
    });
  }
};

const clearFile = () => {
  selectedFile.value = null
  fileAnalysis.value = null
  previewData.value = []
  importResults.value = null
  dragActive.value = false
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate CSV template client-side: headers + 2 sample rows only (grades = optional for sample GradeIds)
const generateTemplateCSV = (grades = []) => {
  const headers = ['FirstName', 'LastName', 'GradeId', 'GuardianPhone'];

  const g1 = grades.length > 0 ? String(grades[0].id) : '1';
  const g2 = grades.length > 1 ? String(grades[1].id) : '2';

  const sampleRows = [
    ['John', 'Doe', g1, '555-0124'],
    ['Sarah', 'Smith', g2, '555-0126']
  ];

  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvRows = [
    headers.map(escapeCSVValue).join(','),
    ...sampleRows.map(row => row.map(escapeCSVValue).join(','))
  ];
  return csvRows.join('\n');
};

// Download template
const downloadTemplate = async () => {
  downloadingTemplate.value = true;
  let blob = null;
  
  try {
    // Try to download from API first
    try {
      blob = await studentService.downloadTemplate();
      
      // Validate blob
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('Invalid response from server');
      }
      
      if (blob.size === 0) {
        throw new Error('Received empty file');
      }
    } catch (apiError) {
      // If API fails, generate template client-side (expected behavior)
      if (import.meta.env.DEV) {
        console.log('Template API unavailable, using client-side generation');
      }
      let grades = [];
      try {
        const list = await gradeService.getAll(true);
        grades = Array.isArray(list) ? list : (list?.data ?? []);
      } catch (_) {
        // ignore; template will still include GradeId column and generic instructions
      }
      const csvContent = generateTemplateCSV(grades);
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Don't show info toast for expected fallback behavior
      // The success toast will be shown after download
    }
    
    // Download the blob
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template downloaded successfully',
      life: TOAST_DURATION.SHORT
    });
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to download template';
    toast.add({
      severity: 'error',
      summary: 'Download Error',
      detail: errorMessage,
      life: TOAST_DURATION.MEDIUM
    });
  } finally {
    downloadingTemplate.value = false;
  }
};

// Import students
const importStudents = async () => {
  if (!selectedFile.value || !canImport.value) return;

  importing.value = true;
  try {
    const result = await studentService.importFromCsv(selectedFile.value);
    
    // Backend returns ImportResult structure: { successful, failed, total, errors, imported }
    // The result is already extracted from response.data.data in the service
    importResults.value = {
      successful: result.successful || result.successCount || 0,
      failed: result.failed || result.errorCount || 0,
      total: result.total || result.totalProcessed || 0,
      errors: result.errors || []
    };

    const successCount = importResults.value.successful;
    const failedCount = importResults.value.failed;
    const errorCount = importResults.value.errors?.length || 0;
    
    // Show appropriate message based on results
    if (failedCount === 0 && successCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Import Complete',
        detail: `Successfully imported ${successCount} student${successCount !== 1 ? 's' : ''}`,
        life: TOAST_DURATION.LONG
      });
    } else if (successCount > 0 && failedCount > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Import Partially Complete',
        detail: `Imported ${successCount} student${successCount !== 1 ? 's' : ''}, ${failedCount} failed${errorCount > 0 ? ` (${errorCount} error${errorCount !== 1 ? 's' : ''} shown below)` : ''}`,
        life: TOAST_DURATION.LONG
      });
    } else {
      // All failed
      toast.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: `All ${failedCount} student${failedCount !== 1 ? 's' : ''} failed to import${errorCount > 0 ? `. Check errors below.` : '.'}`,
        life: TOAST_DURATION.LONG
      });
    }

    // Emit event to parent component
    emit('studentsImported', importResults.value);

  } catch (error) {
    // Handle different error scenarios
    let errorMessage = 'Failed to import students';
    let errors = [];
    
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      
      if (status === 404) {
        errorMessage = 'Import endpoint not found. Please contact the administrator to enable CSV import functionality.';
        errors = ['The /students/import/csv endpoint is not available on the server.'];
      } else if (status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request. Please check your CSV file format.';
        errors = error.response.data?.errors || [errorMessage];
      } else if (status === 401 || status === 403) {
        errorMessage = 'You do not have permission to import students.';
        errors = ['Authentication or authorization failed.'];
      } else if (status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
        errors = ['The server encountered an error while processing your request.'];
      } else {
        errorMessage = error.response.data?.message || error.message || 'Import failed';
        errors = error.response.data?.errors || [errorMessage];
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      errors = ['Network error or server is unreachable.'];
    } else {
      // Error setting up the request
      errorMessage = error.message || 'An unexpected error occurred';
      errors = [errorMessage];
    }
    
    importResults.value = {
      successful: 0,
      failed: fileAnalysis.value?.totalRows || 0,
      total: fileAnalysis.value?.totalRows || 0,
      errors: Array.isArray(errors) ? errors : [errors]
    };

    toast.add({
      severity: 'error',
      summary: 'Import Failed',
      detail: errorMessage,
      life: TOAST_DURATION.LONG
    });
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.student-import {
  padding: 1rem;
}

.card {
  /* background: white; */
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.border-dashed {
  border-style: dashed;
}

.drag-active {
  border-color: var(--primary-color);
  background-color: var(--primary-50);
}

pre {
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.max-h-20rem {
  max-height: 20rem;
}

:deep(.p-fileupload-basic) {
  display: inline-block;
}

:deep(.p-tag) {
  font-size: 0.75rem;
}
</style>