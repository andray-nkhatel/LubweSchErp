<template>
    <div class="card">
        <h1 class="text-3xl font-bold mb-6">SMS Management</h1>
        
        <TabView>
            <!-- Single SMS Tab - Hidden from student management -->
            <TabPanel v-if="false" header="Send SMS">
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Send Single SMS</h2>
                    <form @submit.prevent="handleSendSms" class="space-y-4">
                        <div class="field">
                            <label for="phoneNumber" class="block text-sm font-medium mb-2">
                                Phone Number <span class="text-red-500">*</span>
                            </label>
                            <InputText
                                id="phoneNumber"
                                v-model="singleSmsForm.phoneNumber"
                                placeholder="260xxxxxxxxx"
                                class="w-full"
                                :class="{ 'p-invalid': singleSmsFormErrors.phoneNumber }"
                                maxlength="12"
                                @input="formatPhoneNumber($event, 'single')"
                            />
                            <small class="text-600">Format: 260 followed by 9 digits (e.g., 260950003929)</small>
                            <small v-if="singleSmsFormErrors.phoneNumber" class="p-error block">
                                {{ singleSmsFormErrors.phoneNumber }}
                            </small>
                        </div>

                        <div class="field">
                            <label for="message" class="block text-sm font-medium mb-2">
                                Message <span class="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="message"
                                v-model="singleSmsForm.message"
                                rows="5"
                                placeholder="Enter your message here..."
                                class="w-full"
                                :class="{ 'p-invalid': singleSmsFormErrors.message }"
                                :maxlength="160"
                            />
                            <small class="text-600">{{ singleSmsForm.message.length }}/160 characters</small>
                            <small v-if="singleSmsFormErrors.message" class="p-error block">
                                {{ singleSmsFormErrors.message }}
                            </small>
                        </div>

                        <Button
                            type="submit"
                            label="Send SMS"
                            icon="pi pi-send"
                            :loading="sendingSms"
                            :disabled="sendingSms"
                            class="w-full md:w-auto"
                        />
                    </form>
                </div>
            </TabPanel>

            <!-- Bulk SMS Tab (Admin only) - Hidden from student management -->
            <TabPanel v-if="false && canSendBulkSms" header="Bulk SMS">
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Send Bulk SMS</h2>
                    <form @submit.prevent="handleSendBulkSms" class="space-y-4">
                        <div class="field">
                            <label for="phoneNumbers" class="block text-sm font-medium mb-2">
                                Phone Numbers <span class="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="phoneNumbers"
                                v-model="bulkSmsForm.phoneNumbersText"
                                rows="5"
                                placeholder="Enter phone numbers, one per line&#10;e.g.,&#10;260950003929&#10;260950003930&#10;260950003931"
                                class="w-full"
                                :class="{ 'p-invalid': bulkSmsFormErrors.phoneNumbers }"
                            />
                            <small class="text-600">
                                Enter phone numbers, one per line. Format: 260 followed by 9 digits (e.g., 260950003929)
                            </small>
                            <small v-if="bulkSmsFormErrors.phoneNumbers" class="p-error block">
                                {{ bulkSmsFormErrors.phoneNumbers }}
                            </small>
                        </div>

                        <div class="field">
                            <label for="bulkMessage" class="block text-sm font-medium mb-2">
                                Message <span class="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="bulkMessage"
                                v-model="bulkSmsForm.message"
                                rows="5"
                                placeholder="Enter your message here..."
                                class="w-full"
                                :class="{ 'p-invalid': bulkSmsFormErrors.message }"
                                :maxlength="160"
                            />
                            <small class="text-600">{{ bulkSmsForm.message.length }}/160 characters</small>
                            <small v-if="bulkSmsFormErrors.message" class="p-error block">
                                {{ bulkSmsFormErrors.message }}
                            </small>
                        </div>

                        <div class="flex items-center gap-2 mb-4">
                            <i class="pi pi-info-circle text-blue-500"></i>
                            <small class="text-600">
                                This will send the same message to {{ parsedPhoneNumbers.length }} recipient(s)
                            </small>
                        </div>

                        <Button
                            type="submit"
                            label="Send Bulk SMS"
                            icon="pi pi-send"
                            :loading="sendingBulkSms"
                            :disabled="sendingBulkSms || parsedPhoneNumbers.length === 0"
                            class="w-full md:w-auto"
                        />
                    </form>
                </div>
            </TabPanel>

            <!-- Student Marks SMS Tab -->
            <TabPanel header="Student Marks SMS">
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">Send Student Marks via SMS</h2>
                    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <p class="text-sm text-700 dark:text-300">
                            <i class="pi pi-info-circle mr-2"></i>
                            This will send all three exam types (Test1, Test2, End-of-Term) for the selected term in a single SMS.
                        </p>
                    </div>
                    
                    <!-- Send Mode Toggle -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Send Mode</label>
                        <div class="flex gap-2">
                            <Button
                                :label="'Single Student'"
                                :icon="'pi pi-user'"
                                :class="{ 'p-button-primary': sendMode === 'single', 'p-button-outlined': sendMode !== 'single' }"
                                @click="sendMode = 'single'"
                            />
                            <Button
                                :label="'Bulk by Grade'"
                                :icon="'pi pi-users'"
                                :class="{ 'p-button-primary': sendMode === 'bulk', 'p-button-outlined': sendMode !== 'bulk' }"
                                @click="sendMode = 'bulk'"
                            />
                        </div>
                    </div>

                    <form @submit.prevent="handleSendStudentMarksSms" @keydown.enter.prevent="handleSendStudentMarksSms" @keydown.esc="resetForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Single Student Mode -->
                            <template v-if="sendMode === 'single'">
                                <div class="field">
                                    <label for="studentId" class="block text-sm font-medium mb-2">
                                        Student <span class="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        id="studentId"
                                        v-model="studentMarksForm.studentId"
                                        :options="students"
                                        optionLabel="fullName"
                                        optionValue="id"
                                        placeholder="Select student"
                                        filter
                                        class="w-full"
                                        :class="{ 'p-invalid': studentMarksFormErrors.studentId }"
                                        :loading="loadingStudents"
                                        @change="onStudentChange"
                                    />
                                    <small v-if="studentMarksFormErrors.studentId" class="p-error block">
                                        {{ studentMarksFormErrors.studentId }}
                                    </small>
                                    <!-- Show selected student info -->
                                    <div v-if="selectedStudentInfo" class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                        <div class="text-sm">
                                            <div class="font-medium text-green-800 dark:text-green-200">
                                                <i class="pi pi-user mr-1"></i>{{ selectedStudentInfo.fullName }}
                                            </div>
                                            <div class="text-green-700 dark:text-green-300 mt-1">
                                                <span v-if="selectedStudentInfo.gradeName" class="mr-3">
                                                    <i class="pi pi-book mr-1"></i>Grade: {{ selectedStudentInfo.gradeName }}
                                                </span>
                                            </div>
                                            <div class="text-green-700 dark:text-green-300 mt-1" v-if="selectedStudentInfo.phoneNumber">
                                                <i class="pi pi-phone mr-1"></i>Phone: {{ selectedStudentInfo.phoneNumber }}
                                            </div>
                                            <div class="text-green-700 dark:text-green-300 mt-1" v-if="selectedStudentInfo.guardianPhone">
                                                <i class="pi pi-phone mr-1"></i>Guardian: {{ selectedStudentInfo.guardianPhone }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <!-- Bulk by Grade Mode -->
                            <template v-else>
                                <div class="field">
                                    <label for="gradeId" class="block text-sm font-medium mb-2">
                                        Grade/Class <span class="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        id="gradeId"
                                        v-model="studentMarksForm.gradeId"
                                        :options="grades"
                                        optionLabel="fullName"
                                        optionValue="id"
                                        placeholder="Select grade"
                                        filter
                                        class="w-full"
                                        :class="{ 'p-invalid': studentMarksFormErrors.gradeId }"
                                        :loading="loadingGrades"
                                        @change="onGradeChange"
                                    />
                                    <small v-if="studentMarksFormErrors.gradeId" class="p-error block">
                                        {{ studentMarksFormErrors.gradeId }}
                                    </small>
                                </div>
                            </template>

                            <div class="field">
                                <label for="term" class="block text-sm font-medium mb-2">
                                    Term <span class="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="term"
                                    v-model="studentMarksForm.term"
                                    :options="terms"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select term"
                                    class="w-full"
                                    :class="{ 'p-invalid': studentMarksFormErrors.term }"
                                />
                                <small v-if="studentMarksFormErrors.term" class="p-error block">
                                    {{ studentMarksFormErrors.term }}
                                </small>
                            </div>

                            <div class="field">
                                <label for="academicYear" class="block text-sm font-medium mb-2">
                                    Academic Year
                                </label>
                                <Dropdown
                                    id="academicYear"
                                    v-model="studentMarksForm.academicYear"
                                    :options="academicYears"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select academic year (optional)"
                                    class="w-full"
                                    :loading="loadingAcademicYears"
                                />
                                <small class="text-600">Optional - defaults to current year</small>
                            </div>

                            <!-- Phone Number Override (only in single mode) -->
                            <div v-if="sendMode === 'single'" class="field">
                                <label for="phoneNumberOverride" class="block text-sm font-medium mb-2">
                                    Phone Number (Optional)
                                </label>
                                <InputText
                                    id="phoneNumberOverride"
                                    v-model="studentMarksForm.phoneNumber"
                                    placeholder="260xxxxxxxxx"
                                    class="w-full"
                                    :class="{ 'p-invalid': studentMarksFormErrors.phoneNumber }"
                                    maxlength="12"
                                    @input="formatPhoneNumber($event, 'studentMarks')"
                                />
                                <small class="text-600">
                                    Optional - Format: 260 followed by 9 digits (e.g., 260950003929). If not provided, will use student's phone or guardian phone
                                </small>
                                <small v-if="studentMarksFormErrors.phoneNumber" class="p-error block">
                                    {{ studentMarksFormErrors.phoneNumber }}
                                </small>
                            </div>
                        </div>

                        <!-- Preview Section -->
                        <div v-if="showPreview" class="col-span-2 mt-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                            <div class="flex justify-content-between align-items-center mb-3">
                                <h4 class="font-semibold m-0 text-900 dark:text-100">
                                    <i class="pi pi-eye mr-2"></i>Message Preview
                                </h4>
                                <Button
                                    label="Refresh Preview"
                                    icon="pi pi-refresh"
                                    size="small"
                                    outlined
                                    severity="secondary"
                                    @click="loadMessagePreview"
                                    :loading="loadingPreview"
                                    :disabled="loadingPreview"
                                    v-tooltip.top="'Load message preview'"
                                />
                            </div>
                            
                            <!-- Message Content - Single Mode -->
                            <div v-if="sendMode === 'single' && messagePreview" class="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-900 dark:text-100 whitespace-pre-wrap font-mono text-xs max-h-60 overflow-auto">
                                {{ messagePreview }}
                            </div>
                            
                            <!-- Message Content - Bulk Mode (Multiple Previews) -->
                            <div v-else-if="sendMode === 'bulk' && messagePreviews.length > 0" class="space-y-3">
                                <div 
                                    v-for="(preview, index) in messagePreviews" 
                                    :key="preview.studentId || index"
                                    class="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                                >
                                    <div class="font-semibold text-sm mb-2 text-900 dark:text-100 flex align-items-center">
                                        <i class="pi pi-user mr-2"></i>
                                        {{ preview.studentName || `Student ${index + 1}` }}
                                    </div>
                                    <div class="text-900 dark:text-100 whitespace-pre-wrap font-mono text-xs max-h-40 overflow-auto">
                                        {{ preview.message }}
                                    </div>
                                    <div class="mt-2 text-xs text-600">
                                        <i class="pi pi-info-circle mr-1"></i>{{ preview.message.length }} characters
                                    </div>
                                </div>
                                <div v-if="selectedStudentIds.length > messagePreviews.length" class="text-xs text-600 italic p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                    <i class="pi pi-info-circle mr-1"></i>
                                    Showing preview for {{ messagePreviews.length }} of {{ selectedStudentIds.length }} selected student(s). Each student will receive a personalized message.
                                </div>
                            </div>
                            
                            <div v-else-if="loadingPreview" class="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-center">
                                <i class="pi pi-spin pi-spinner mr-2"></i>Loading preview{{ sendMode === 'bulk' && selectedStudentIds.length > 1 ? 's' : '' }}...
                            </div>
                            <div v-else class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200">
                                <i class="pi pi-info-circle mr-2"></i>Click "Refresh Preview" to see the message content
                            </div>
                            
                            <!-- Message Length - Single Mode -->
                            <div v-if="sendMode === 'single' && messagePreview" class="mt-2 text-xs text-600">
                                <i class="pi pi-info-circle mr-1"></i>Message length: {{ messagePreview.length }} characters
                            </div>
                        </div>

                        <!-- Bulk Mode: Student Selection -->
                        <div v-if="sendMode === 'bulk' && studentMarksForm.gradeId" class="col-span-2 mt-4">
                            <div class="field">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <label class="block text-sm font-medium">
                                        Select Students <span class="text-red-500">*</span>
                                    </label>
                                    <div class="flex gap-2 align-items-center">
                                        <Button
                                            type="button"
                                            label="Select All"
                                            icon="pi pi-check-square"
                                            size="small"
                                            outlined
                                            severity="secondary"
                                            @click="selectAllStudents"
                                            :disabled="!gradeStudents.length || loadingGradeStudents"
                                        />
                                        <Button
                                            type="button"
                                            label="Clear All"
                                            icon="pi pi-times"
                                            size="small"
                                            outlined
                                            severity="secondary"
                                            @click="clearAllStudents"
                                            :disabled="!selectedStudentIds.length"
                                        />
                                    </div>
                                </div>
                                <MultiSelect
                                    v-model="selectedStudentIds"
                                    :options="gradeStudents"
                                    optionLabel="fullName"
                                    optionValue="id"
                                    placeholder="Select students (or use Select All)"
                                    filter
                                    :loading="loadingGradeStudents"
                                    class="w-full"
                                    :class="{ 'p-invalid': studentMarksFormErrors.selectedStudents }"
                                    :maxSelectedLabels="3"
                                >
                                    <template #option="slotProps">
                                        <div class="flex align-items-center">
                                            <div>
                                                <div>{{ slotProps.option.fullName }}</div>
                                                <small class="text-600">
                                                    {{ slotProps.option.gradeName || 'No grade' }} | 
                                                    {{ slotProps.option.guardianPhone || slotProps.option.phoneNumber || 'No phone' }}
                                                </small>
                                            </div>
                                        </div>
                                    </template>
                                </MultiSelect>
                                <small v-if="studentMarksFormErrors.selectedStudents" class="p-error block">
                                    {{ studentMarksFormErrors.selectedStudents }}
                                </small>
                                <small v-else class="text-600">
                                    {{ selectedStudentIds.length }} of {{ gradeStudents.length }} students selected
                                </small>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="col-span-2 flex gap-2 justify-content-end mt-4">
                            <Button
                                type="button"
                                label="Reset"
                                icon="pi pi-refresh"
                                severity="secondary"
                                outlined
                                @click="resetForm"
                                :disabled="sendingStudentMarksSms"
                                v-tooltip.top="'Clear form (Esc)'"
                            />
                            <Button
                                type="submit"
                                :label="sendMode === 'single' ? 'Send Student Marks SMS' : `Send to ${selectedStudentIds.length} Student(s)`"
                                icon="pi pi-send"
                                :loading="sendingStudentMarksSms"
                                :disabled="sendingStudentMarksSms || !isFormValid"
                                v-tooltip.top="'Send SMS (Enter)'"
                            />
                        </div>
                    </form>
                </div>
            </TabPanel>

            <!-- SMS Logs Tab -->
            <TabPanel header="SMS Logs & Reports">
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">SMS Activity Logs & Reports</h2>
                    
                    <!-- Statistics Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <div class="flex align-items-center justify-content-between">
                                <div>
                                    <div class="text-sm text-600 dark:text-400 mb-1">Total SMS</div>
                                    <div class="text-2xl font-bold text-900 dark:text-100">{{ statistics.totalCount || 0 }}</div>
                                </div>
                                <i class="pi pi-envelope text-3xl text-blue-500"></i>
                            </div>
                        </div>
                        <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <div class="flex align-items-center justify-content-between">
                                <div>
                                    <div class="text-sm text-600 dark:text-400 mb-1">Sent</div>
                                    <div class="text-2xl font-bold text-900 dark:text-100">{{ statistics.sentCount || 0 }}</div>
                                </div>
                                <i class="pi pi-check-circle text-3xl text-green-500"></i>
                            </div>
                        </div>
                        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <div class="flex align-items-center justify-content-between">
                                <div>
                                    <div class="text-sm text-600 dark:text-400 mb-1">Failed</div>
                                    <div class="text-2xl font-bold text-900 dark:text-100">{{ statistics.failedCount || 0 }}</div>
                                </div>
                                <i class="pi pi-times-circle text-3xl text-red-500"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                        <div class="flex justify-content-between align-items-center mb-3">
                            <h3 class="text-lg font-semibold m-0">Filters</h3>
                            <div v-if="hasActiveFilters" class="flex align-items-center gap-2">
                                <Badge :value="activeFilterCount" severity="info" />
                                <span class="text-sm text-600">active filter(s)</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Status</label>
                                <Dropdown
                                    v-model="logsFilters.status"
                                    :options="statusOptions"
                                    placeholder="All Statuses"
                                    class="w-full"
                                    showClear
                                    @change="handleFilterChange"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Message Type</label>
                                <Dropdown
                                    v-model="logsFilters.messageType"
                                    :options="messageTypeOptions"
                                    placeholder="All Types"
                                    class="w-full"
                                    showClear
                                    @change="handleFilterChange"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Start Date</label>
                                <Calendar
                                    v-model="logsFilters.startDate"
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    class="w-full"
                                    showButtonBar
                                    @update:modelValue="handleFilterChange"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">End Date</label>
                                <Calendar
                                    v-model="logsFilters.endDate"
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    class="w-full"
                                    showButtonBar
                                    @update:modelValue="handleFilterChange"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Phone Number</label>
                                <InputText
                                    v-model="logsFilters.phoneNumber"
                                    placeholder="Search phone number..."
                                    class="w-full"
                                    @input="debounceLoadLogs"
                                    @clear="handleFilterChange"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Student</label>
                                <Dropdown
                                    v-model="logsFilters.studentId"
                                    :options="students"
                                    optionLabel="fullName"
                                    optionValue="id"
                                    placeholder="All Students"
                                    filter
                                    class="w-full"
                                    showClear
                                    :loading="loadingStudents"
                                    @change="handleFilterChange"
                                />
                            </div>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <Button
                                label="Clear Filters"
                                icon="pi pi-filter-slash"
                                severity="secondary"
                                outlined
                                @click="clearLogsFilters"
                                :disabled="!hasActiveFilters"
                            />
                            <Button
                                label="Export CSV"
                                icon="pi pi-download"
                                severity="secondary"
                                outlined
                                @click="exportLogsToCsv"
                                :disabled="loadingLogs"
                            />
                        </div>
                    </div>

                    <!-- Logs DataGrid -->
                    <div class="card">
                        <DataTable
                            :value="smsLogs"
                            :loading="loadingLogs"
                            paginator
                            :rows="logsFilters.pageSize"
                            :totalRecords="totalLogsCount"
                            :first="(logsFilters.page - 1) * logsFilters.pageSize"
                            @page="onLogsPageChange"
                            :rowsPerPageOptions="[10, 20, 50, 100]"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} SMS logs"
                            stripedRows
                            showGridlines
                            responsiveLayout="scroll"
                            class="p-datatable-sm"
                            :emptyMessage="loadingLogs ? 'Loading...' : 'No SMS logs found'"
                            dataKey="id"
                            sortMode="multiple"
                            removableSort
                        >
                            <template #header>
                                <div class="flex justify-content-between align-items-center">
                                    <span class="text-xl font-semibold">
                                        SMS Activity Logs
                                    </span>
                                    <span class="text-sm text-600">
                                        Total: {{ totalLogsCount }} record(s)
                                    </span>
                                </div>
                            </template>

                            <Column field="sentAt" header="Date & Time" sortable style="min-width: 160px">
                                <template #body="{ data }">
                                    <div class="flex flex-column">
                                        <span class="font-medium text-900 dark:text-100">{{ formatDateTime(data.sentAt) }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="phoneNumber" header="Phone Number" sortable style="min-width: 140px">
                                <template #body="{ data }">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-phone text-600"></i>
                                        <span class="font-mono text-sm">{{ data.phoneNumber }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="studentName" header="Student" sortable style="min-width: 150px">
                                <template #body="{ data }">
                                    <div v-if="data.studentName" class="flex align-items-center gap-2">
                                        <i class="pi pi-user text-600"></i>
                                        <span>{{ data.studentName }}</span>
                                    </div>
                                    <span v-else class="text-500 italic">-</span>
                                </template>
                            </Column>

                            <Column field="messageType" header="Type" sortable style="min-width: 120px">
                                <template #body="{ data }">
                                    <Tag 
                                        :value="data.messageType || 'N/A'" 
                                        :severity="getMessageTypeSeverity(data.messageType)"
                                        class="text-xs"
                                    />
                                </template>
                            </Column>

                            <Column field="status" header="Status" sortable style="min-width: 100px">
                                <template #body="{ data }">
                                    <Tag 
                                        :value="data.status" 
                                        :severity="getStatusSeverity(data.status)"
                                        class="font-semibold"
                                    />
                                </template>
                            </Column>

                            <Column field="messageContent" header="Message" style="min-width: 250px; max-width: 400px">
                                <template #body="{ data }">
                                    <div 
                                        class="text-sm text-900 dark:text-100 cursor-pointer hover:text-primary transition-colors" 
                                        :title="data.messageContent"
                                        @click="viewLogDetails(data)"
                                    >
                                        <div class="truncate">
                                            {{ truncateText(data.messageContent, 60) }}
                                        </div>
                                    </div>
                                </template>
                            </Column>

                            <Column field="sentByUserName" header="Sent By" sortable style="min-width: 120px">
                                <template #body="{ data }">
                                    <div v-if="data.sentByUserName" class="flex align-items-center gap-2">
                                        <i class="pi pi-user-edit text-600"></i>
                                        <span>{{ data.sentByUserName }}</span>
                                    </div>
                                    <span v-else class="text-500 italic">-</span>
                                </template>
                            </Column>

                            <Column field="cost" header="Cost" sortable style="min-width: 100px">
                                <template #body="{ data }">
                                    <div v-if="data.cost" class="text-right">
                                        <span class="font-semibold text-900 dark:text-100">
                                            {{ formatCurrency(data.cost) }}
                                        </span>
                                    </div>
                                    <span v-else class="text-500 italic">-</span>
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 80px" :exportable="false">
                                <template #body="{ data }">
                                    <div class="flex gap-1">
                                        <Button
                                            icon="pi pi-eye"
                                            severity="secondary"
                                            outlined
                                            size="small"
                                            @click="viewLogDetails(data)"
                                            v-tooltip.top="'View Full Details'"
                                            class="p-button-sm"
                                        />
                                    </div>
                                </template>
                            </Column>

                            <template #empty>
                                <div class="text-center p-6">
                                    <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                                    <p class="text-600">No SMS logs found</p>
                                    <p class="text-sm text-500 mt-2">Try adjusting your filters</p>
                                </div>
                            </template>

                            <template #loading>
                                <div class="text-center p-6">
                                    <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
                                    <p class="text-600">Loading SMS logs...</p>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </TabPanel>
        </TabView>

        <!-- Confirmation Dialog -->
        <Dialog
            v-model:visible="showConfirmDialog"
            modal
            header="Confirm Send SMS"
            :style="{ width: '600px' }"
        >
            <div class="flex flex-column gap-3">
                <div class="flex align-items-center">
                    <i class="pi pi-exclamation-triangle text-3xl text-yellow-500 mr-3"></i>
                    <div>
                        <p class="mb-2 font-semibold">Are you sure you want to send the student marks SMS?</p>
                        <div class="text-sm text-600">
                            <div><strong>Student:</strong> {{ previewData.studentName }}</div>
                            <div><strong>Term:</strong> {{ previewData.termName }}</div>
                            <div><strong>Phone:</strong> {{ previewData.phoneNumber || 'Student\'s phone/guardian phone' }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Message Preview in Dialog - Single Mode -->
                <div v-if="sendMode === 'single' && messagePreview" class="mt-3 pt-3 border-top-1 border-gray-300">
                    <div class="font-semibold mb-2 text-sm">Message Preview:</div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-900 dark:text-100 whitespace-pre-wrap font-mono text-xs max-h-40 overflow-auto">
                        {{ messagePreview }}
                    </div>
                    <div class="text-xs text-600 mt-2">
                        <i class="pi pi-info-circle mr-1"></i>{{ messagePreview.length }} characters
                    </div>
                </div>
                
                <!-- Message Preview in Dialog - Bulk Mode (Sample) -->
                <div v-else-if="sendMode === 'bulk' && messagePreviews.length > 0" class="mt-3 pt-3 border-top-1 border-gray-300">
                    <div class="font-semibold mb-2 text-sm">Message Preview (Sample):</div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                        <div class="text-xs text-600 mb-2">
                            <i class="pi pi-info-circle mr-1"></i>Showing preview for: {{ messagePreviews[0].studentName }}
                        </div>
                        <div class="text-900 dark:text-100 whitespace-pre-wrap font-mono text-xs max-h-40 overflow-auto">
                            {{ messagePreviews[0].message }}
                        </div>
                        <div class="text-xs text-600 mt-2">
                            <i class="pi pi-info-circle mr-1"></i>{{ messagePreviews[0].message.length }} characters
                        </div>
                        <div v-if="selectedStudentIds.length > 1" class="text-xs text-600 mt-2 italic">
                            <i class="pi pi-info-circle mr-1"></i>Each of the {{ selectedStudentIds.length }} selected student(s) will receive a personalized message.
                        </div>
                    </div>
                </div>
                
                <div v-else class="mt-3 pt-3 border-top-1 border-gray-300">
                    <div class="text-sm text-600 italic">
                        <i class="pi pi-info-circle mr-2"></i>Message preview not loaded. Click "Refresh Preview" in the form to see the message content.
                    </div>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    @click="showConfirmDialog = false"
                    outlined
                />
                <Button
                    label="Send SMS"
                    icon="pi pi-check"
                    @click="confirmSendSms"
                    :loading="sendingStudentMarksSms"
                />
            </template>
        </Dialog>

        <!-- SMS Log Details Dialog -->
        <Dialog
            v-model:visible="showLogDetailsDialog"
            modal
            header="SMS Log Details"
            :style="{ width: '700px' }"
        >
            <div v-if="selectedLog" class="flex flex-column gap-3">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="font-semibold text-sm">Date & Time:</label>
                        <div class="text-900 dark:text-100">{{ formatDateTime(selectedLog.sentAt) }}</div>
                    </div>
                    <div>
                        <label class="font-semibold text-sm">Status:</label>
                        <div>
                            <Tag 
                                :value="selectedLog.status" 
                                :severity="getStatusSeverity(selectedLog.status)" 
                            />
                        </div>
                    </div>
                    <div>
                        <label class="font-semibold text-sm">Phone Number:</label>
                        <div class="text-900 dark:text-100">{{ selectedLog.phoneNumber }}</div>
                    </div>
                    <div>
                        <label class="font-semibold text-sm">Message Type:</label>
                        <div>
                            <Tag 
                                :value="selectedLog.messageType || 'N/A'" 
                                :severity="getMessageTypeSeverity(selectedLog.messageType)" 
                            />
                        </div>
                    </div>
                    <div>
                        <label class="font-semibold text-sm">Student:</label>
                        <div class="text-900 dark:text-100">{{ selectedLog.studentName || 'N/A' }}</div>
                    </div>
                    <div>
                        <label class="font-semibold text-sm">Sent By:</label>
                        <div class="text-900 dark:text-100">{{ selectedLog.sentByUserName || 'N/A' }}</div>
                    </div>
                    <div v-if="selectedLog.term">
                        <label class="font-semibold text-sm">Term:</label>
                        <div class="text-900 dark:text-100">Term {{ selectedLog.term }}</div>
                    </div>
                    <div v-if="selectedLog.academicYearName || selectedLog.academicYear">
                        <label class="font-semibold text-sm">Academic Year:</label>
                        <div class="text-900 dark:text-100">{{ selectedLog.academicYearName || selectedLog.academicYear }}</div>
                    </div>
                    <div v-if="selectedLog.cost">
                        <label class="font-semibold text-sm">Cost:</label>
                        <div class="text-900 dark:text-100">{{ formatCurrency(selectedLog.cost) }}</div>
                    </div>
                    <div v-if="selectedLog.retryCount > 0">
                        <label class="font-semibold text-sm">Retry Count:</label>
                        <div class="text-900 dark:text-100">{{ selectedLog.retryCount }}</div>
                    </div>
                </div>
                
                <div>
                    <label class="font-semibold text-sm block mb-2">Message Content:</label>
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-900 dark:text-100 whitespace-pre-wrap font-mono text-xs max-h-60 overflow-auto">
                        {{ selectedLog.messageContent }}
                    </div>
                </div>
                
                <div v-if="selectedLog.errorMessage">
                    <label class="font-semibold text-sm block mb-2 text-red-600 dark:text-red-400">Error Message:</label>
                    <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200">
                        {{ selectedLog.errorMessage }}
                    </div>
                </div>
                
                <div v-if="selectedLog.providerResponse">
                    <label class="font-semibold text-sm block mb-2">Provider Response:</label>
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-200 text-xs">
                        {{ selectedLog.providerResponse }}
                    </div>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    @click="showLogDetailsDialog = false"
                    outlined
                />
            </template>
        </Dialog>

        <!-- Toast Component -->
        <Toast />
    </div>
</template>

<script setup>
import { examService, getCurrentUser, gradeService, hasAnyRole, smsService, studentService } from '@/service/api.service';
import { formatDateForApi as formatDateForApiUtil, formatDateTime as formatDateTimeUtil } from '@/service/dateUtils';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Toast
const toast = useToast();

// User permissions
const currentUser = getCurrentUser();
const canSendBulkSms = computed(() => hasAnyRole(['Admin']));

// Form data
const singleSmsForm = ref({
    phoneNumber: '',
    message: ''
});

const bulkSmsForm = ref({
    phoneNumbersText: '',
    message: ''
});

const studentMarksForm = ref({
    studentId: null,
    gradeId: null,
    term: null,
    academicYear: null,
    phoneNumber: ''
});

// Send mode: 'single' or 'bulk'
const sendMode = ref('single');

// Bulk mode: selected student IDs
const selectedStudentIds = ref([]);

// Grades for bulk mode
const grades = ref([]);
const loadingGrades = ref(false);

// Students filtered by grade
const gradeStudents = ref([]);
const loadingGradeStudents = ref(false);

// Form errors
const singleSmsFormErrors = ref({});
const bulkSmsFormErrors = ref({});
const studentMarksFormErrors = ref({});

// Loading states
const sendingSms = ref(false);
const sendingBulkSms = ref(false);
const sendingStudentMarksSms = ref(false);
const loadingStudents = ref(false);
const loadingAcademicYears = ref(false);
const loadingPreview = ref(false);

// Data
const students = ref([]);
const academicYears = ref([]);

// Confirmation dialog
const showConfirmDialog = ref(false);
const pendingSendRequest = ref(null);

// Selected student info
const selectedStudentInfo = ref(null);

// Message preview - can be a string (single mode) or array of objects (bulk mode)
const messagePreview = ref('');
const messagePreviews = ref([]); // Array of { studentId, studentName, message } for bulk mode

// SMS Logs
const smsLogs = ref([]);
const loadingLogs = ref(false);
const totalLogsCount = ref(0);
const statistics = ref({
    totalCount: 0,
    sentCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalCost: 0
});
const logsFilters = ref({
    page: 1,
    pageSize: 20,
    status: null,
    messageType: null,
    studentId: null,
    sentByUserId: null,
    startDate: null,
    endDate: null,
    phoneNumber: null
});
const statusOptions = ['Sent', 'Failed', 'Pending'];
const messageTypeOptions = ['Single', 'Bulk', 'StudentMarks'];
let logsDebounceTimer = null;
const showLogDetailsDialog = ref(false);
const selectedLog = ref(null);

// Preview data
const showPreview = computed(() => {
    if (sendMode.value === 'single') {
        return !!(studentMarksForm.value.studentId && studentMarksForm.value.term);
    } else {
        return !!(studentMarksForm.value.gradeId && studentMarksForm.value.term && selectedStudentIds.value.length > 0);
    }
});

// Preview data for confirmation dialog
const previewData = computed(() => {
    if (sendMode.value === 'single') {
        const student = students.value.find(s => s.id === studentMarksForm.value.studentId);
        const term = terms.find(t => t.id === studentMarksForm.value.term);
        
        return {
            studentName: student?.fullName || null,
            termName: term?.name || null,
            phoneNumber: studentMarksForm.value.phoneNumber || student?.guardianPhone || student?.phoneNumber || null
        };
    } else {
        const term = terms.find(t => t.id === studentMarksForm.value.term);
        const selectedCount = selectedStudentIds.value.length;
        const grade = grades.value.find(g => g.id === studentMarksForm.value.gradeId);
        
        return {
            studentName: `${selectedCount} student(s)`,
            termName: term?.name || null,
            phoneNumber: `Multiple recipients`,
            gradeName: grade?.fullName || null,
            selectedCount: selectedCount
        };
    }
});

// Form validation
const isFormValid = computed(() => {
    if (sendMode.value === 'single') {
        return !!(studentMarksForm.value.studentId && studentMarksForm.value.term);
    } else {
        return !!(studentMarksForm.value.gradeId && 
                 studentMarksForm.value.term && 
                 selectedStudentIds.value.length > 0);
    }
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
    return !!(logsFilters.value.status || 
              logsFilters.value.messageType || 
              logsFilters.value.studentId || 
              logsFilters.value.sentByUserId || 
              logsFilters.value.startDate || 
              logsFilters.value.endDate || 
              (logsFilters.value.phoneNumber && logsFilters.value.phoneNumber.trim()));
});

// Count active filters
const activeFilterCount = computed(() => {
    let count = 0;
    if (logsFilters.value.status) count++;
    if (logsFilters.value.messageType) count++;
    if (logsFilters.value.studentId) count++;
    if (logsFilters.value.sentByUserId) count++;
    if (logsFilters.value.startDate) count++;
    if (logsFilters.value.endDate) count++;
    if (logsFilters.value.phoneNumber && logsFilters.value.phoneNumber.trim()) count++;
    return count;
});

// Terms
const terms = [
    { id: 1, name: 'Term 1' },
    { id: 2, name: 'Term 2' },
    { id: 3, name: 'Term 3' }
];

// Computed
const parsedPhoneNumbers = computed(() => {
    if (!bulkSmsForm.value.phoneNumbersText) return [];
    return bulkSmsForm.value.phoneNumbersText
        .split('\n')
        .map(line => {
            // Remove non-digits and limit to 12 digits
            const cleaned = line.trim().replace(/\D/g, '').slice(0, 12);
            return cleaned;
        })
        .filter(line => line.length > 0);
});

// Methods
// Format phone number input (remove non-digits and limit to 12 digits)
const formatPhoneNumber = (event, formType) => {
    let value = event.target.value;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Limit to 12 digits
    value = value.slice(0, 12);
    
    if (formType === 'single') {
        singleSmsForm.value.phoneNumber = value;
    } else if (formType === 'studentMarks') {
        studentMarksForm.value.phoneNumber = value;
    }
};

const validateSingleSms = () => {
    singleSmsFormErrors.value = {};
    let isValid = true;

    const phoneNumber = singleSmsForm.value.phoneNumber?.trim() || '';
    if (!phoneNumber) {
        singleSmsFormErrors.value.phoneNumber = 'Phone number is required';
        isValid = false;
    } else if (phoneNumber.length < 12) {
        singleSmsFormErrors.value.phoneNumber = `Phone number must be exactly 12 digits. Currently ${phoneNumber.length} digit(s). Format: 260 followed by 9 digits (e.g., 260950003929)`;
        isValid = false;
    } else if (!/^260\d{9}$/.test(phoneNumber)) {
        singleSmsFormErrors.value.phoneNumber = 'Phone number must be 12 digits starting with 260 (e.g., 260950003929)';
        isValid = false;
    }

    if (!singleSmsForm.value.message || singleSmsForm.value.message.trim() === '') {
        singleSmsFormErrors.value.message = 'Message is required';
        isValid = false;
    }

    return isValid;
};

const validateBulkSms = () => {
    bulkSmsFormErrors.value = {};
    let isValid = true;

    const phoneNumbers = parsedPhoneNumbers.value;
    if (phoneNumbers.length === 0) {
        bulkSmsFormErrors.value.phoneNumbers = 'At least one phone number is required';
        isValid = false;
    } else {
        // Validate each phone number format
        const invalidNumbers = [];
        phoneNumbers.forEach((num, index) => {
            if (num.length < 12) {
                invalidNumbers.push(`Line ${index + 1}: ${num.length} digit(s) (needs 12)`);
            } else if (!/^260\d{9}$/.test(num)) {
                invalidNumbers.push(`Line ${index + 1}: Invalid format`);
            }
        });
        
        if (invalidNumbers.length > 0) {
            const errorDetails = invalidNumbers.slice(0, 3).join('; ');
            bulkSmsFormErrors.value.phoneNumbers = `Invalid phone number(s): ${errorDetails}${invalidNumbers.length > 3 ? '...' : ''}. Each number must be exactly 12 digits starting with 260 (e.g., 260950003929)`;
            isValid = false;
        }
    }

    if (!bulkSmsForm.value.message || bulkSmsForm.value.message.trim() === '') {
        bulkSmsFormErrors.value.message = 'Message is required';
        isValid = false;
    }

    return isValid;
};

const validateStudentMarksSms = (silent = false) => {
    if (!silent) {
        studentMarksFormErrors.value = {};
    }
    let isValid = true;

    if (sendMode.value === 'single') {
        if (!studentMarksForm.value.studentId) {
            if (!silent) studentMarksFormErrors.value.studentId = 'Student is required';
            isValid = false;
        }
    } else {
        if (!studentMarksForm.value.gradeId) {
            if (!silent) studentMarksFormErrors.value.gradeId = 'Grade is required';
            isValid = false;
        }
        
        if (!selectedStudentIds.value || selectedStudentIds.value.length === 0) {
            if (!silent) studentMarksFormErrors.value.selectedStudents = 'At least one student must be selected';
            isValid = false;
        }
    }

    if (!studentMarksForm.value.term) {
        if (!silent) studentMarksFormErrors.value.term = 'Term is required';
        isValid = false;
    }

    // Validate phone number if provided (it's optional, but if provided must be valid format)
    // Note: In bulk mode, phone number override doesn't make sense, so we skip validation
    if (sendMode.value === 'single') {
        const phoneNumber = studentMarksForm.value.phoneNumber?.trim() || '';
        if (phoneNumber) {
            if (phoneNumber.length < 12) {
                if (!silent) studentMarksFormErrors.value.phoneNumber = `Phone number must be exactly 12 digits. Currently ${phoneNumber.length} digit(s). Format: 260 followed by 9 digits (e.g., 260950003929)`;
                isValid = false;
            } else if (!/^260\d{9}$/.test(phoneNumber)) {
                if (!silent) studentMarksFormErrors.value.phoneNumber = 'Phone number must be 12 digits starting with 260 (e.g., 260950003929)';
                isValid = false;
            }
        }
    }

    return isValid;
};

const handleSendSms = async () => {
    if (!validateSingleSms()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields correctly',
            life: 3000
        });
        return;
    }

    sendingSms.value = true;

    try {
        const response = await smsService.sendSms(
            singleSmsForm.value.phoneNumber.trim(),
            singleSmsForm.value.message.trim()
        );

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `SMS sent successfully to ${response.phoneNumber}`,
                life: 3000
            });
            singleSmsForm.value = { phoneNumber: '', message: '' };
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'Failed to send SMS',
                life: 5000
            });
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || error.message || 'Failed to send SMS. Please try again.',
            life: 5000
        });
    } finally {
        sendingSms.value = false;
    }
};

const handleSendBulkSms = async () => {
    if (!validateBulkSms()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields correctly',
            life: 3000
        });
        return;
    }

    sendingBulkSms.value = true;

    try {
        const response = await smsService.sendBulkSms(
            parsedPhoneNumbers.value,
            bulkSmsForm.value.message.trim()
        );

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `Bulk SMS sent successfully to ${response.count} recipient(s)`,
                life: 3000
            });
            bulkSmsForm.value = { phoneNumbersText: '', message: '' };
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: response.message || 'Failed to send bulk SMS',
                life: 5000
            });
        }
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || error.message || 'Failed to send bulk SMS. Please try again.',
            life: 5000
        });
    } finally {
        sendingBulkSms.value = false;
    }
};

const handleSendStudentMarksSms = async () => {
    if (!validateStudentMarksSms()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields correctly',
            life: 3000
        });
        return;
    }

    // Show confirmation dialog
    showConfirmDialog.value = true;
};

const confirmSendSms = async () => {
    if (sendMode.value === 'single') {
        // Single student mode
        if (!pendingSendRequest.value) {
            pendingSendRequest.value = {
                studentId: studentMarksForm.value.studentId,
                term: studentMarksForm.value.term,
                ...(studentMarksForm.value.academicYear && { academicYear: studentMarksForm.value.academicYear }),
                ...(studentMarksForm.value.phoneNumber && { phoneNumber: studentMarksForm.value.phoneNumber.trim() })
            };
        }

        sendingStudentMarksSms.value = true;
        showConfirmDialog.value = false;

        let retryCount = 0;
        const maxRetries = 2;

        try {
            while (retryCount <= maxRetries) {
                try {
                    const response = await smsService.sendStudentMarksSms(pendingSendRequest.value);

                    if (response.success) {
                        toast.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Student marks SMS sent successfully to ${response.phoneNumber} for ${response.studentName} (Term ${response.term} - All Exam Types)`,
                            life: 5000
                        });
                        
                        // Reset form after success
                        try {
                            resetForm();
                        } catch (resetError) {
                            console.error('Error resetting form:', resetError);
                        }
                        pendingSendRequest.value = null;
                        return;
                    } else {
                        throw new Error(response.message || 'Failed to send student marks SMS');
                    }
                } catch (error) {
                    console.error('Error sending student marks SMS:', error);
                    
                    if (retryCount < maxRetries) {
                        retryCount++;
                        toast.add({
                            severity: 'warn',
                            summary: 'Retrying',
                            detail: `Attempt ${retryCount + 1} of ${maxRetries + 1}. Please wait...`,
                            life: 2000
                        });
                        
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        const errorMessage = error.response?.data?.message || error.message || 'Failed to send student marks SMS. Please try again.';
                        toast.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                            life: 5000
                        });
                        pendingSendRequest.value = null;
                        break; // Exit the while loop
                    }
                }
            }
        } finally {
            // Always reset loading state
            sendingStudentMarksSms.value = false;
        }
    } else {
        // Bulk mode - send to multiple students
        sendingStudentMarksSms.value = true;
        showConfirmDialog.value = false;

        const studentIds = selectedStudentIds.value;
        const term = studentMarksForm.value.term;
        const academicYear = studentMarksForm.value.academicYear;

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        try {
            // Send SMS to each selected student
            for (const studentId of studentIds) {
                try {
                    const request = {
                        studentId: studentId,
                        term: term,
                        ...(academicYear && { academicYear: academicYear })
                    };

                    const response = await smsService.sendStudentMarksSms(request);

                    if (response.success) {
                        successCount++;
                    } else {
                        failCount++;
                        const student = gradeStudents.value.find(s => s.id === studentId);
                        errors.push(`${student?.fullName || studentId}: ${response.message || 'Failed'}`);
                    }

                    // Small delay between sends to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    failCount++;
                    const student = gradeStudents.value.find(s => s.id === studentId);
                    const errorMsg = error.response?.data?.message || error.message || 'Failed to send';
                    errors.push(`${student?.fullName || studentId}: ${errorMsg}`);
                    console.error(`Error sending SMS to student ${studentId}:`, error);
                }
            }

            // Show summary
            if (successCount > 0 && failCount === 0) {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Student marks SMS sent successfully to ${successCount} student(s)`,
                    life: 5000
                });
                resetForm();
            } else if (successCount > 0 && failCount > 0) {
                toast.add({
                    severity: 'warn',
                    summary: 'Partial Success',
                    detail: `Sent to ${successCount} student(s), failed for ${failCount} student(s). Check console for details.`,
                    life: 7000
                });
                console.warn('Failed sends:', errors);
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to send SMS to all ${failCount} student(s). Check console for details.`,
                    life: 7000
                });
                console.error('All sends failed:', errors);
            }
        } catch (error) {
            console.error('Error in bulk send:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'An error occurred while sending bulk SMS',
                life: 5000
            });
        } finally {
            sendingStudentMarksSms.value = false;
        }
    }
};

// Load data
const loadStudents = async () => {
    loadingStudents.value = true;
    try {
        students.value = await studentService.getAll();
    } catch (error) {
        console.error('Error loading students:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load students. Please refresh the page.',
            life: 5000
        });
    } finally {
        loadingStudents.value = false;
    }
};

// Load grades for bulk mode
const loadGrades = async () => {
    loadingGrades.value = true;
    try {
        const data = await gradeService.getAll();
        grades.value = Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
        console.error('Error loading grades:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load grades',
            life: 5000
        });
        grades.value = [];
    } finally {
        loadingGrades.value = false;
    }
};

const loadAcademicYears = async () => {
    loadingAcademicYears.value = true;
    try {
        const years = await examService.getAcademicYears();
        academicYears.value = years;
        
        // Auto-select current academic year if available
        if (years && years.length > 0) {
            // Try to find current year (usually marked as current or is the latest)
            const currentYear = years.find(y => y.isCurrent) || years[years.length - 1];
            if (currentYear) {
                studentMarksForm.value.academicYear = currentYear.id;
            }
        }
    } catch (error) {
        console.error('Error loading academic years:', error);
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Failed to load academic years. You can still proceed.',
            life: 3000
        });
    } finally {
        loadingAcademicYears.value = false;
    }
};

// Handle student selection change
const onStudentChange = async () => {
    if (!studentMarksForm.value.studentId) {
        selectedStudentInfo.value = null;
        // Clear phone number override when no student is selected
        studentMarksForm.value.phoneNumber = '';
        return;
    }

    // Find the student from the cached list first (for quick display)
    const student = students.value.find(s => s.id === studentMarksForm.value.studentId);
    
    // Fetch full student details to ensure we have guardianPhone and other fields
    try {
        const fullDetails = await studentService.getById(studentMarksForm.value.studentId);
        // Handle ApiResponse wrapper
        const studentData = fullDetails?.data || fullDetails;
        
        // Merge the full details with the cached student data
        const completeStudent = {
            ...student,
            ...studentData,
            // Ensure we have the phone fields with proper fallbacks
            guardianPhone: studentData.guardianPhone || studentData.guardianPhoneNumber || student?.guardianPhone || null,
            phoneNumber: studentData.phoneNumber || studentData.phone || student?.phoneNumber || null,
            fullName: studentData.fullName || student?.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            gradeName: studentData.gradeName || student?.gradeName || null
        };
        
        selectedStudentInfo.value = {
            fullName: completeStudent.fullName,
            gradeName: completeStudent.gradeName,
            phoneNumber: completeStudent.phoneNumber,
            guardianPhone: completeStudent.guardianPhone
        };
        
        // Clear phone number override when switching students, then auto-fill if available
        studentMarksForm.value.phoneNumber = '';
        if (completeStudent.guardianPhone || completeStudent.phoneNumber) {
            studentMarksForm.value.phoneNumber = completeStudent.guardianPhone || completeStudent.phoneNumber || '';
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
        // Fallback to cached student data if fetch fails
        if (student) {
            selectedStudentInfo.value = {
                fullName: student.fullName,
                gradeName: student.gradeName,
                phoneNumber: student.phoneNumber,
                guardianPhone: student.guardianPhone
            };
            
            // Clear phone number override when switching students
            studentMarksForm.value.phoneNumber = '';
            if (student.guardianPhone || student.phoneNumber) {
                studentMarksForm.value.phoneNumber = student.guardianPhone || student.phoneNumber || '';
            }
        } else {
            selectedStudentInfo.value = null;
            studentMarksForm.value.phoneNumber = '';
        }
    }
};

// Handle grade selection change (bulk mode)
const onGradeChange = async () => {
    if (!studentMarksForm.value.gradeId) {
        gradeStudents.value = [];
        selectedStudentIds.value = [];
        return;
    }

    loadingGradeStudents.value = true;
    try {
        console.log('Loading students for grade:', studentMarksForm.value.gradeId);
        
        // The getByGrade endpoint returns limited fields, so we need to fetch full details
        // First get the student IDs from the grade
        const response = await studentService.getByGrade(studentMarksForm.value.gradeId);
        console.log('Raw API response:', response);
        
        // Handle ApiResponse wrapper if present
        let studentsArray = [];
        if (Array.isArray(response)) {
            studentsArray = response;
        } else if (response?.data && Array.isArray(response.data)) {
            studentsArray = response.data;
        } else if (response?.data && typeof response.data === 'object') {
            studentsArray = Object.values(response.data).find(v => Array.isArray(v)) || [];
        }
        
        console.log('Students from grade endpoint:', studentsArray.length);
        
        // Now fetch full details for each student to get phone numbers
        // Use Promise.all to fetch all students in parallel
        const studentsWithDetails = await Promise.all(
            studentsArray.map(async (student) => {
                try {
                    const fullDetails = await studentService.getById(student.id);
                    // Handle ApiResponse wrapper
                    const studentData = fullDetails?.data || fullDetails;
                    
                    return {
                        ...student,
                        ...studentData,
                        // Ensure we have the phone fields
                        guardianPhone: studentData.guardianPhone || studentData.guardianPhoneNumber || null,
                        phoneNumber: studentData.phoneNumber || studentData.phone || null,
                        fullName: studentData.fullName || student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()
                    };
                } catch (error) {
                    console.error(`Error fetching details for student ${student.id}:`, error);
                    // Return the basic student info if we can't fetch details
                    return {
                        ...student,
                        guardianPhone: null,
                        phoneNumber: null,
                        fullName: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()
                    };
                }
            })
        );
        
        gradeStudents.value = studentsWithDetails;
        console.log('Loaded students with full details:', gradeStudents.value.length);
        if (gradeStudents.value.length > 0) {
            console.log('First student with details:', gradeStudents.value[0]);
            console.log('First student guardianPhone:', gradeStudents.value[0].guardianPhone);
            console.log('First student phoneNumber:', gradeStudents.value[0].phoneNumber);
        }
        
        // Clear selection when grade changes
        selectedStudentIds.value = [];
    } catch (error) {
        console.error('Error loading students by grade:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load students for selected grade. ' + (error.message || ''),
            life: 5000
        });
        gradeStudents.value = [];
    } finally {
        loadingGradeStudents.value = false;
    }
};

// Select all students
const selectAllStudents = () => {
    selectedStudentIds.value = gradeStudents.value.map(s => s.id);
};

// Clear all selected students
const clearAllStudents = () => {
    selectedStudentIds.value = [];
};

// Reset form
const resetForm = () => {
    studentMarksForm.value = {
        studentId: null,
        gradeId: null,
        term: null,
        academicYear: null,
        phoneNumber: ''
    };
    selectedStudentInfo.value = null;
    selectedStudentIds.value = [];
    gradeStudents.value = [];
    studentMarksFormErrors.value = {};
    messagePreview.value = ''; // Clear message preview
    messagePreviews.value = []; // Clear bulk previews
    pendingSendRequest.value = null;
    
    // Reset to current academic year if available
    if (academicYears.value.length > 0) {
        const currentYear = academicYears.value.find(y => y.isCurrent) || academicYears.value[academicYears.value.length - 1];
        if (currentYear) {
            studentMarksForm.value.academicYear = currentYear.id;
        }
    }
    
    toast.add({
        severity: 'info',
        summary: 'Form Reset',
        detail: 'Form has been cleared',
        life: 2000
    });
};

// Load message preview
const loadMessagePreview = async () => {
    // Validate based on mode
    if (sendMode.value === 'single') {
        if (!studentMarksForm.value.studentId || !studentMarksForm.value.term) {
            toast.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select student and term first',
                life: 3000
            });
            return;
        }
    } else {
        if (!studentMarksForm.value.gradeId || !studentMarksForm.value.term || selectedStudentIds.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select grade, term, and at least one student first',
                life: 3000
            });
            return;
        }
    }

    loadingPreview.value = true;
    messagePreview.value = '';
    messagePreviews.value = [];

    try {
        if (sendMode.value === 'single') {
            // Single mode: fetch preview for one student
            const previewRequest = {
                studentId: studentMarksForm.value.studentId,
                term: studentMarksForm.value.term,
                ...(studentMarksForm.value.academicYear && { academicYear: studentMarksForm.value.academicYear })
            };

            const response = await smsService.previewStudentMarksSms(previewRequest);
            
            // Extract the actual message content from the response
            if (response) {
                messagePreview.value = response.message || 
                                      response.preview || 
                                      response.content || 
                                      response.smsContent || 
                                      response.smsMessage ||
                                      response.text ||
                                      response.body ||
                                      (response.data && (response.data.message || response.data.content || response.data.preview)) ||
                                      (typeof response === 'string' ? response : '');
                
                if (!messagePreview.value || messagePreview.value.trim() === '') {
                    console.log('Preview response structure:', response);
                    throw new Error('Preview response did not contain message content. Response: ' + JSON.stringify(response).substring(0, 200));
                }
            } else {
                throw new Error('No preview data received from API');
            }
        } else {
            // Bulk mode: fetch previews for multiple students
            // Limit to first 5 students to avoid too many API calls, but show all if 5 or fewer
            const studentsToPreview = selectedStudentIds.value.slice(0, Math.min(5, selectedStudentIds.value.length));
            
            const previewPromises = studentsToPreview.map(async (studentId) => {
                try {
                    const student = gradeStudents.value.find(s => s.id === studentId);
                    const studentName = student?.fullName || `Student ${studentId}`;
                    
                    const previewRequest = {
                        studentId: studentId,
                        term: studentMarksForm.value.term,
                        ...(studentMarksForm.value.academicYear && { academicYear: studentMarksForm.value.academicYear })
                    };

                    const response = await smsService.previewStudentMarksSms(previewRequest);
                    
                    // Extract the message content
                    const message = response?.message || 
                                   response?.preview || 
                                   response?.content || 
                                   response?.smsContent || 
                                   response?.smsMessage ||
                                   response?.text ||
                                   response?.body ||
                                   (response?.data && (response.data.message || response.data.content || response.data.preview)) ||
                                   (typeof response === 'string' ? response : '');
                    
                    return {
                        studentId: studentId,
                        studentName: studentName,
                        message: message || '⚠️ Unable to load preview for this student'
                    };
                } catch (error) {
                    console.error(`Error loading preview for student ${studentId}:`, error);
                    const student = gradeStudents.value.find(s => s.id === studentId);
                    const studentName = student?.fullName || `Student ${studentId}`;
                    return {
                        studentId: studentId,
                        studentName: studentName,
                        message: `⚠️ Error loading preview: ${error.response?.data?.message || error.message || 'Unknown error'}`
                    };
                }
            });
            
            // Fetch all previews in parallel
            messagePreviews.value = await Promise.all(previewPromises);
            
            if (messagePreviews.value.length === 0) {
                throw new Error('No previews were loaded');
            }
        }
    } catch (error) {
        console.error('Error loading message preview:', error);
        
        toast.add({
            severity: 'error',
            summary: 'Preview Error',
            detail: error.response?.data?.message || error.message || 'Failed to load message preview. The message will still be sent when you confirm.',
            life: 5000
        });
        
        if (sendMode.value === 'single') {
            messagePreview.value = '⚠️ Unable to load message preview. Please try again or proceed to send the SMS.';
        } else {
            messagePreviews.value = [{
                studentId: null,
                studentName: 'Error',
                message: '⚠️ Unable to load message previews. Please try again or proceed to send the SMS.'
            }];
        }
    } finally {
        loadingPreview.value = false;
    }
};

// Generate a preview description when API preview is not available
const generatePreviewDescription = () => {
    const student = students.value.find(s => s.id === studentMarksForm.value.studentId);
    const term = terms.find(t => t.id === studentMarksForm.value.term);
    const academicYear = academicYears.value.find(y => y.id === studentMarksForm.value.academicYear);
    
    messagePreview.value = `📊 STUDENT MARKS REPORT\n\n` +
        `Student: ${student?.fullName || 'N/A'}\n` +
        `Term: ${term?.name || 'N/A'}\n` +
        `Academic Year: ${academicYear?.name || 'Current Year'}\n\n` +
        `EXAM TYPES INCLUDED:\n` +
        `• Test1\n` +
        `• Test2\n` +
        `• End-of-Term\n\n` +
        `The SMS will contain:\n` +
        `- Subject names and codes\n` +
        `- Scores for each exam type\n` +
        `- Overall performance summary\n` +
        `- Total marks and percentage\n\n` +
        `Note: This is a preview. The actual message format may vary based on the student's marks data.`;
};

// Watch for form changes to update preview
watch(() => [studentMarksForm.value.studentId, studentMarksForm.value.term, studentMarksForm.value.academicYear], async () => {
    if (studentMarksForm.value.studentId) {
        await onStudentChange();
    }
    // Clear preview when form changes
    messagePreview.value = '';
    messagePreviews.value = [];
}, { deep: true });

// Watch for send mode changes to reset form
watch(sendMode, () => {
    resetForm();
});

// Watch for selected students changes in bulk mode to clear previews
watch(selectedStudentIds, () => {
    if (sendMode.value === 'bulk') {
        messagePreviews.value = [];
    }
}, { deep: true });

// Watch for filter changes to reload logs (with debounce for date changes)
watch(() => [
    logsFilters.value.status,
    logsFilters.value.messageType,
    logsFilters.value.studentId,
    logsFilters.value.phoneNumber
], () => {
    if (logsFilters.value.status !== undefined || 
        logsFilters.value.messageType !== undefined || 
        logsFilters.value.studentId !== undefined ||
        logsFilters.value.phoneNumber !== undefined) {
        handleFilterChange();
    }
}, { deep: true });

// Watch date filters separately with debounce
let dateFilterTimer = null;
watch(() => [logsFilters.value.startDate, logsFilters.value.endDate], () => {
    if (dateFilterTimer) {
        clearTimeout(dateFilterTimer);
    }
    dateFilterTimer = setTimeout(() => {
        handleFilterChange();
    }, 300);
});

// Helper to format date for API - use utility function
const formatDateForApi = formatDateForApiUtil;

// Load SMS logs
const loadSmsLogs = async () => {
    loadingLogs.value = true;
    try {
        // Build filters object, converting dates and removing empty strings
        const filters = {
            page: logsFilters.value.page || 1,
            pageSize: logsFilters.value.pageSize || 20,
            status: logsFilters.value.status && logsFilters.value.status.trim() ? logsFilters.value.status : null,
            messageType: logsFilters.value.messageType && logsFilters.value.messageType.trim() ? logsFilters.value.messageType : null,
            studentId: logsFilters.value.studentId || null,
            sentByUserId: logsFilters.value.sentByUserId || null,
            startDate: formatDateForApi(logsFilters.value.startDate),
            endDate: formatDateForApi(logsFilters.value.endDate),
            phoneNumber: logsFilters.value.phoneNumber && logsFilters.value.phoneNumber.trim() ? logsFilters.value.phoneNumber.trim() : null
        };
        
        console.log('Loading SMS logs with filters:', filters);
        
        const response = await smsService.getSmsLogs(filters);
        smsLogs.value = response.logs || [];
        totalLogsCount.value = response.totalCount || 0;
        statistics.value = response.statistics || {
            totalCount: 0,
            sentCount: 0,
            failedCount: 0,
            pendingCount: 0,
            totalCost: 0
        };
        
        console.log('SMS logs loaded:', smsLogs.value.length, 'Total:', totalLogsCount.value);
    } catch (error) {
        console.error('Error loading SMS logs:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || error.message || 'Failed to load SMS logs',
            life: 5000
        });
        smsLogs.value = [];
        totalLogsCount.value = 0;
    } finally {
        loadingLogs.value = false;
    }
};

// Debounced load logs for search input
const debounceLoadLogs = () => {
    if (logsDebounceTimer) {
        clearTimeout(logsDebounceTimer);
    }
    logsDebounceTimer = setTimeout(() => {
        logsFilters.value.page = 1; // Reset to first page when searching
        loadSmsLogs();
    }, 500);
};

// Handle filter changes - reset to page 1
const handleFilterChange = () => {
    logsFilters.value.page = 1;
    loadSmsLogs();
};

// Handle pagination change
const onLogsPageChange = (event) => {
    logsFilters.value.page = (event.page || 0) + 1;
    logsFilters.value.pageSize = event.rows || 20;
    loadSmsLogs();
};

// Clear filters
const clearLogsFilters = () => {
    logsFilters.value = {
        page: 1,
        pageSize: 20,
        status: null,
        messageType: null,
        studentId: null,
        sentByUserId: null,
        startDate: null,
        endDate: null,
        phoneNumber: null
    };
    loadSmsLogs();
};

// Format currency
const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-ZM', {
        style: 'currency',
        currency: 'ZMW',
        minimumFractionDigits: 2
    }).format(amount);
};

// Format date and time - use utility function with Zambia timezone
const formatDateTime = formatDateTimeUtil;

// Truncate text
const truncateText = (text, maxLength) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Get status severity for Tag
const getStatusSeverity = (status) => {
    switch (status?.toLowerCase()) {
        case 'sent':
            return 'success';
        case 'failed':
            return 'danger';
        case 'pending':
            return 'warning';
        default:
            return 'secondary';
    }
};

// Get message type severity for Tag
const getMessageTypeSeverity = (messageType) => {
    switch (messageType) {
        case 'StudentMarks':
            return 'info';
        case 'Bulk':
            return 'warning';
        case 'Single':
            return 'success';
        default:
            return 'secondary';
    }
};

// View log details
const viewLogDetails = (log) => {
    selectedLog.value = log;
    showLogDetailsDialog.value = true;
};

// Export logs to CSV
const exportLogsToCsv = async () => {
    try {
        // Load all logs without pagination for export
        const filters = {
            ...logsFilters.value,
            page: 1,
            pageSize: 10000, // Large number to get all records
            startDate: logsFilters.value.startDate ? new Date(logsFilters.value.startDate).toISOString().split('T')[0] : null,
            endDate: logsFilters.value.endDate ? new Date(logsFilters.value.endDate).toISOString().split('T')[0] : null
        };
        
        const response = await smsService.getSmsLogs(filters);
        const logs = response.logs || [];
        
        // Create CSV content
        const headers = ['Date & Time', 'Phone Number', 'Student', 'Message Type', 'Status', 'Sent By', 'Term', 'Academic Year', 'Cost', 'Message Content', 'Error Message'];
        const rows = logs.map(log => [
            formatDateTime(log.sentAt),
            log.phoneNumber,
            log.studentName || '',
            log.messageType || '',
            log.status,
            log.sentByUserName || '',
            log.term || '',
            log.academicYearName || log.academicYear || '',
            log.cost || '',
            `"${(log.messageContent || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
            log.errorMessage || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sms-logs-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: `Exported ${logs.length} SMS log(s) to CSV`,
            life: 3000
        });
    } catch (error) {
        console.error('Error exporting SMS logs:', error);
        toast.add({
            severity: 'error',
            summary: 'Export Error',
            detail: error.response?.data?.message || error.message || 'Failed to export SMS logs',
            life: 5000
        });
    }
};

onMounted(() => {
    loadStudents();
    loadGrades();
    loadAcademicYears();
    loadSmsLogs(); // Load SMS logs on mount
});
</script>

<style scoped>
.field {
    margin-bottom: 1rem;
}
</style>
