<template>
  <!-- <div class="score-entry bg-surface-0 p-4 md:p-8 rounded-xl shadow-md"> -->
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0 border-b pb-4">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center bg-blue-100 text-blue-700 rounded-full w-10 h-10">
          <i class="pi pi-pencil text-2xl"></i>
        </span>
        <h2 class="text-2xl md:text-3xl font-bold text-900 m-0">
          {{ isBabyClass ? 'Baby Class Skill Assessment' : 'Mark Entry' }}
        </h2>
      </div>
      <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Button
          v-if="!isBabyMode && !isSecondaryClass"
          id="mark-schedule-btn"
          label="Mark-Schedule"
          icon="pi pi-file-pdf"
          class="p-button-warning w-full md:w-auto shadow-sm"
          @click="exportMarkSchedulePdf"
          :disabled="!canLoadStudents"
          v-tooltip.top="{ value: 'Done entering results for particular test in your class? - you can download the grade book', class: 'max-w-xs', showDelay: 200, hideDelay: 100 }"
          aria-label="Download Markschedule"
        />
        <Button
          v-if="!isBabyMode && isSecondaryClass"
          label="My Subject Summary"
          icon="pi pi-chart-bar"
          class="p-button-info w-full md:w-auto shadow-sm"
          @click="openTeacherSummaryFilterDialog"
          v-tooltip.top="'Select filters to view a summary of your entries'"
          aria-label="View my subject summary"
        />
        <Button
          v-if="!isBabyMode"
          label="Class Scoreboard"
          icon="pi pi-table"
          class="p-button-secondary w-full md:w-auto shadow-sm"
          @click="openClassScoreboard"
          :disabled="students.length === 0"
          v-tooltip.top="'View a pivot of all students by subject (T1/T2/T3/End)'"
          aria-label="Open class scoreboard"
        />
        <Button
          v-if="false"
          label="Export Skills Report"
          icon="pi pi-file-pdf"
          class="p-button-warning w-full md:w-auto shadow-sm"
          @click="exportSkillsReport"
          :disabled="!canLoadStudents"
          v-tooltip.top="'Export skill assessment report for the class'"
        />
      </div>
    </div>

    <!-- Filters Card -->
    <Card v-if="!isBabyMode" class="mb-6 bg-surface-50 border-0 shadow-none rounded-lg">
      <template #content>
        <div class="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6">
          <!-- <div class="flex-1 min-w-[220px]">
            <label for="assignment" class="block font-semibold mb-2 text-900">Subject & Grade *</label>
            <Select
              id="assignment"
              v-model="selectedAssignment"
              :options="teacherAssignments"
              optionLabel="displayName"
              placeholder="Select assignment"
              :loading="loadingAssignments"
              class="w-full"
              @change="onAssignmentChange"
            >
              <template #option="slotProps">
                <div>
                  <div class="font-medium">{{ slotProps.option.subjectName }}</div>
                  <small class="text-500">{{ slotProps.option.gradeName }}</small>
                </div>
              </template>
            </Select>
          </div> -->
          <!-- Subject & Grade dropdown - HIDDEN for Baby Class teachers -->
          <div v-if="!isBabyClass" class="flex-1 min-w-[220px]">
            <label for="assignment" class="block font-semibold mb-2 text-900">Subject & Grade</label>
            <Select
              id="assignment"
              v-model="selectedAssignment"
              :options="teacherAssignments"
              optionLabel="displayName"
              placeholder="Select assignment"
              :loading="loadingAssignments"
              class="w-full"
              @change="onAssignmentChange"
            >
              <template #option="slotProps">
                <div>
                  <div class="font-medium">{{ slotProps.option.subjectName }}</div>
                  <small class="text-500">{{ slotProps.option.gradeName }}</small>
                </div>
              </template>
            </Select>
          </div>
          <div class="flex-1 min-w-[180px]">
            <label for="academicYear" class="block font-semibold mb-2 text-900">Academic Year *</label>
            <Select
              id="academicYear"
              v-model="selectedAcademicYear"
              :options="academicYears"
              optionLabel="name"
              optionValue="id"
              placeholder="Select year"
              :loading="loadingYears"
              class="w-full"
              @change="onFiltersChange"
            />
          </div>
          <div class="flex-1 min-w-[140px]">
            <label for="term" class="block font-semibold mb-2 text-900">Term *</label>
            <Select
              id="term"
              v-model="selectedTerm"
              :options="terms"
              optionLabel="name"
              optionValue="id"
              placeholder="Select term"
              :loading="loadingTerms"
              class="w-full"
              @change="onFiltersChange"
            />
          </div>
          <div v-if="!isBabyClass" class="flex-1 min-w-[160px]">
            <label for="examType" class="block font-semibold mb-2 text-900">Exam Type *</label>
            <Select
              id="examType"
              v-model="selectedExamType"
              :options="examTypes"
              optionLabel="name"
              optionValue="id"
              placeholder="Select exam type"
              :loading="loadingExamTypes"
              class="w-full"
              @change="onFiltersChange"
            />
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-center items-center mt-6 gap-2">
          <Button
            :label="isBabyClass ? 'Load Students for Skill Assessment' : 'Load Students'"
            icon="pi pi-search"
            class="w-full md:w-auto p-button-primary shadow-sm"
            :disabled="!canLoadStudents"
            @click="loadStudentScores"
            :loading="loadingScores"
          />
        </div>
      </template>
    </Card>

    <!-- Baby Class Skill Assessment Interface -->
    <div v-if="isBabyMode">
      <Card class="mb-6 shadow-lg border-0 rounded-xl">
        <template #content>
          <div class="overflow-x-auto">
            <DataTable
              :value="students"
              :striped-rows="true"
              :row-hover="true"
              :show-gridlines="false"
              dataKey="studentId"
              :loading="loadingScores"
              responsiveLayout="scroll"
              :scrollable="true"
              scrollHeight="60vh"
              class="p-datatable-sm modern-table"
            >
              <Column field="studentName" header="Student" style="width: 70%">
                <template #body="slotProps">
                  <button class="text-left w-full flex items-center gap-2 hover:underline"
                          @click.stop="openStudentAssessmentDialog(slotProps.data)">
                    <span class="inline-flex items-center justify-center bg-surface-200 text-blue-700 rounded-full w-8 h-8 font-bold">
                      {{ getInitials(slotProps.data.studentName) }}
                    </span>
                    <span class="font-medium text-900">{{ slotProps.data.studentName }}</span>
                  </button>
                </template>
              </Column>
              <Column header="Status" style="width: 30%">
                <template #body="slotProps">
                  <span :class="['text-sm', getBabyAssessmentStatus(slotProps.data.studentId).class]">
                    {{ getBabyAssessmentStatus(slotProps.data.studentId).label }}
                  </span>
                </template>
              </Column>
              <template #footer>
                <div class="flex justify-between items-center text-600 text-sm w-full">
                  <div>Total students: {{ students.length }}</div>
                  <div>Completed: {{ getCompletedBabyCount() }}</div>
                </div>
              </template>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>

    <!-- Regular Score Entry Interface (Non-BabyClass) -->
    <div v-if="!isBabyMode">
      <!-- Existing score entry interface remains the same -->
      <!-- Scores DataTable (Desktop) -->
      <Card v-if="students.length > 0 && !isMobile" class="shadow-lg border-0 rounded-xl">
        <template #content>
          <!-- Search Bar -->
          <div class="mb-3 flex flex-col md:flex-row md:items-center gap-2">
            <input
              v-model="studentSearch"
              type="text"
              placeholder="Search student by name..."
              class="p-2 border border-gray-300 rounded w-full md:w-1/3"
            />
            <!-- Quick Stats -->
            <div class="flex gap-4 text-sm">
              <span class="text-green-600">Present: {{ presentCount }}</span>
              <span class="text-red-600">Absent: {{ absentCount }}</span>
              <span class="text-blue-600">Total: {{ students.length }}</span>
            </div>
            <Button
              label="Add Students"
              icon="pi pi-user-plus"
              class="p-button-primary p-button-sm ml-auto"
              @click="openAddStudentsDialog"
              :disabled="!selectedAssignment || loadingScores"
              v-tooltip.top="'Add students to this exam entry'"
            />
          </div>
          <div class="overflow-x-auto">
            <DataTable
              v-model:editingRows="editingRows"
              :value="filteredStudents"
              :striped-rows="true"
              :row-hover="true"
              :show-gridlines="false"
              editMode="row"
              dataKey="studentId"
              :loading="loadingScores"
              responsiveLayout="scroll"
              :scrollable="true"
              scrollHeight="60vh"
              class="p-datatable-sm min-w-[700px] md:min-w-0 modern-table"
              @row-edit-save="onRowEditSave"
              @row-edit-cancel="onRowEditCancel"
              @row-click="onRowClick"
              style="cursor:pointer"
            >
              <Column field="studentName" header="Student Name" style="width: 25%">
                <template #body="slotProps">
                  <div class="flex items-center gap-2" :class="{ 'opacity-60': slotProps.data.isAbsent }">
                    <span class="inline-flex items-center justify-center bg-surface-200 text-blue-700 rounded-full w-8 h-8 font-bold">
                      {{ getInitials(slotProps.data.studentName) }}
                    </span>
                    <span class="font-medium text-900">{{ slotProps.data.studentName }}</span>
                    <Button
                      icon="pi pi-pencil"
                      class="p-button-text p-button-sm p-button-rounded"
                      @click.stop="openEditNameDialog(slotProps.data)"
                      v-tooltip.top="'Edit student name'"
                      size="small"
                    />
                    <i v-if="slotProps.data.isAbsent" class="pi pi-minus-circle text-red-500 text-sm" 
                       v-tooltip="'Student marked as absent'"></i>
                  </div>
                </template>
              </Column>
              <Column field="currentScore" header="Current Score" style="width: 18%" bodyStyle="text-align:center;">
                <template #body="slotProps">
                  <div v-if="slotProps.data.isAbsent" class="flex items-center justify-center gap-2">
                    <Tag value="ABSENT" severity="danger" class="text-sm font-semibold" />
                    <small class="text-400">(Score: 0)</small>
                  </div>
                  <Tag
                    v-else-if="slotProps.data.currentScore !== null && slotProps.data.currentScore !== undefined"
                    :value="slotProps.data.currentScore"
                    class="align-items-center justify-content-center text-base font-semibold px-3 py-1"
                    :severity="getScoreSeverity(slotProps.data.currentScore)"
                  />
                  <span v-else class="text-400">No score</span>
                </template>
                <template #editor="slotProps">
                  <InputNumber
                    v-model="slotProps.data.currentScore"
                    :min="0"
                    :max="150"
                    :maxFractionDigits="1"
                    :disabled="slotProps.data.isAbsent"
                    class="w-full"
                    :class="{ 'opacity-50': slotProps.data.isAbsent }"
                    placeholder="Enter score"
                    :inputStyle="{ width: '100%' }"
                  />
                </template>
              </Column>
              <Column field="isAbsent" header="Attendance" style="width: 15%" bodyStyle="text-align:center;">
                <template #body="slotProps">
                  <Button
                    :label="slotProps.data.isAbsent ? 'Absent' : 'Present'"
                    :icon="slotProps.data.isAbsent ? 'pi pi-times' : 'pi pi-check'"
                    :class="slotProps.data.isAbsent ? 'p-button-danger p-button-sm' : 'p-button-success p-button-sm'"
                    @click="toggleAbsentStatus(slotProps.data)"
                    :loading="slotProps.data.toggleLoading"
                    size="small"
                  />
                </template>
              </Column>
              <Column v-if="selectedExamType === 4" field="comments" header="Comments" style="width: 25%" bodyStyle="text-align:center;">
                <template #body="slotProps">
                  <div v-if="slotProps.data.comments" class="flex items-center gap-2">
                    <i class="pi pi-comment text-blue-500"></i>
                    <span class="text-sm text-700 line-height-3 truncate max-w-[120px] md:max-w-[200px]">
                      {{ slotProps.data.comments }}
                    </span>
                    <Button
                      icon="pi pi-eye"
                      size="small"
                      text
                      rounded
                      class="ml-2"
                      @click.stop="viewComment(slotProps.data)"
                      v-tooltip.top="'View full comment'"
                    />
                  </div>
                  <span v-else class="text-400 text-sm">No comments</span>
                </template>
                <template #editor="slotProps">
                  <transition name="fade-slide">
                    <div v-show="selectedExamType === 4">
                      <label class="block text-xs font-semibold mb-1 text-900 flex items-center gap-1">
                        Comments
                        <i class="pi pi-info-circle text-yellow-600" v-tooltip.top="'Comments are only required for End-of-Term exams.'"></i>
                      </label>
                      <Textarea
                        v-model="slotProps.data.comments"
                        :maxlength="100"
                        rows="3"
                        :disabled="slotProps.data.isAbsent"
                        class="w-full mt-2 comment-highlight"
                        :class="{ 'opacity-50': slotProps.data.isAbsent }"
                        placeholder="Enter comment."
                        :autoResize="true"
                      />
                      <div class="text-right text-xs text-gray-500 mt-1">
                        {{ 100 - (slotProps.data.comments?.length || 0) }} characters left
                      </div>
                    </div>
                  </transition>
                </template>
              </Column>
              <Column :rowEditor="true" style="width: 12%" bodyStyle="text-align:center;">
                <template #roweditoriniticon>
                  <i class="pi pi-pencil"></i>
                </template>
                <template #roweditorsaveicon>
                  <i class="pi pi-check"></i>
                </template>
                <template #roweditorcancelicon>
                  <i class="pi pi-times"></i>
                </template>
              </Column>
              <template #footer> 
                <div class="text-right text-700 font-medium">
                  In total there are {{ students ? students.length : 0 }} students.
                  Present: {{ presentCount }}, Absent: {{ absentCount }}
                </div> 
              </template>
            </DataTable>
          </div>
        </template>
      </Card>

      <!-- Mobile Card Layout for Regular Scores -->
      <div v-if="students.length > 0 && isMobile" class="flex flex-col gap-4 mt-2">
        <!-- Search Bar and Stats -->
        <div class="mb-3 flex flex-col gap-2">
          <input
            v-model="studentSearch"
            type="text"
            placeholder="Search student by name..."
            class="p-2 border border-gray-300 rounded w-full"
          />
          <div class="flex justify-between items-center gap-2">
            <div class="flex justify-center gap-4 text-sm">
              <span class="text-green-600">Present: {{ presentCount }}</span>
              <span class="text-red-600">Absent: {{ absentCount }}</span>
              <span class="text-blue-600">Total: {{ students.length }}</span>
            </div>
            <Button
              label="Add Students"
              icon="pi pi-user-plus"
              class="p-button-primary p-button-sm"
              @click="openAddStudentsDialog"
              :disabled="!selectedAssignment || loadingScores"
            />
          </div>
        </div>
        
        <Panel
          v-for="(student, idx) in filteredStudents"
          :key="student.studentId"
          :header="student.studentName"
          :toggleable="true"
          class="w-full student-mobile-card border-0 shadow-md rounded-lg"
          :class="{ 'absent-card': student.isAbsent }"
        >
          <template #icons>
            <div class="flex items-center gap-2">
              <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-sm p-button-rounded"
                @click.stop="openEditNameDialog(student)"
                v-tooltip.top="'Edit student name'"
                size="small"
              />
              <Button
                :label="student.isAbsent ? 'Absent' : 'Present'"
                :icon="student.isAbsent ? 'pi pi-times' : 'pi pi-check'"
                :class="student.isAbsent ? 'p-button-danger p-button-sm' : 'p-button-success p-button-sm'"
                @click="toggleAbsentStatus(student)"
                :loading="student.toggleLoading"
                size="small"
              />
              <span v-if="!student.isAbsent && student.currentScore !== null" 
                    :class="['badge', getScoreSeverityClass(student.currentScore)]">
                {{ student.currentScore }}
              </span>
              <span v-else-if="student.isAbsent" class="badge bg-red-100 text-red-800">ABSENT</span>
              <span v-else class="text-gray-400 text-sm">No score</span>
            </div>
          </template>
          
          <div class="mb-2">
            <label class="block text-xs font-semibold mb-1 text-900">Score</label>
            <InputNumber
              v-model="student.currentScore"
              :min="0"
              :max="150"
              :maxFractionDigits="1"
              :disabled="student.isAbsent"
              class="w-full"
              :class="{ 'opacity-50': student.isAbsent }"
              placeholder="Enter score"
              @blur="onMobileScoreEdit(idx)"
              @change="onMobileScoreEdit(idx)"
            />
          </div>
          
          <div v-if="selectedExamType === 4" class="mb-2">
            <label class="block text-xs font-semibold mb-1 text-900 flex items-center gap-1">
              Comments
              <i class="pi pi-info-circle text-yellow-600" v-tooltip.top="'Comments are only required for End-of-Term exams.'"></i>
            </label>
            <transition name="fade-slide">
              <div v-show="selectedExamType === 4">
                <Textarea
                  v-model="student.comments"
                  :maxlength="100"
                  rows="2"
                  :disabled="student.isAbsent"
                  class="w-full comment-highlight"
                  :class="{ 'opacity-50': student.isAbsent }"
                  placeholder="Enter comment"
                  :autoResize="true"
                  @blur="onMobileScoreEdit(idx)"
                  @change="onMobileScoreEdit(idx)"
                />
                <div class="text-right text-xs text-gray-400">
                  {{ 100 - (student.comments?.length || 0) }} left
                </div>
              </div>
            </transition>
          </div>
          
          <div class="flex justify-between items-center gap-2 mt-2">
            <div>
              <Button
                v-if="selectedExamType === 4 && student.comments"
                icon="pi pi-eye"
                size="small"
                text
                rounded
                @click="viewComment(student)"
                v-tooltip.top="'View full comment'"
              />
              <Button
                icon="pi pi-list"
                label="All Subject Scores"
                size="small"
                text
                rounded
                class="ml-2"
                @click="onRowClick({ data: student })"
                v-tooltip.top="'View/edit all subject scores'"
              />
            </div>
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-save"
                size="small"
                class="p-button-success p-button-sm"
                @click="onMobileScoreEdit(idx)"
                :disabled="saving"
                v-tooltip.top="'Save changes for this student'"
              />
              <span v-if="mobileSaveStatus[student.studentId] === 'saving'" class="text-xs text-blue-500 ml-1">Saving...</span>
              <span v-else-if="mobileSaveStatus[student.studentId] === 'saved'" class="text-xs text-green-600 ml-1">Saved!</span>
              <span v-else-if="mobileSaveStatus[student.studentId] === 'error'" class="text-xs text-red-500 ml-1">Error</span>
            </div>
          </div>
          <div v-if="student.lastUpdated" class="text-xs text-gray-400 mt-1">
            <i class="pi pi-clock mr-1"></i>
            Last updated: {{ formatDate(student.lastUpdated) }}
            <span v-if="student.recordedBy">by {{ student.recordedBy }}</span>
          </div>
        </Panel>
      </div>
    </div>

    <!-- General Comments Section for End-of-Term Exams and Baby Class -->
    <Card v-if="students.length > 0 && (selectedExamType === 4 && (!isSecondaryClass || isHomeroomForSelectedGrade))" class="mt-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-comment text-blue-600"></i>
          <span>General Comments for End-of-Term Report Cards</span>
          <Badge 
            :value="students.filter(s => s.generalComment).length + '/' + students.length" 
            severity="info" 
            class="ml-2"
          />
          <div v-if="loadingComments" class="ml-2">
            <i class="pi pi-spin pi-spinner text-blue-600"></i>
            <span class="text-sm text-blue-600 ml-1">Loading comments...</span>
          </div>
        </div>
      </template>
      <template #content>
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            <span class="font-semibold text-blue-800">General Comment Guidelines</span>
          </div>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• General comments appear on the student's report card</li>
            <li>• Provide constructive feedback about the student's overall performance</li>
            <li>• Focus on academic progress, behavior, and areas for improvement</li>
            <li>• Keep comments professional and encouraging</li>
          </ul>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="student in students" 
            :key="student.studentId" 
            class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            :class="{ 'bg-green-50 border-green-200': student.generalComment, 'bg-gray-50': !student.generalComment }"
            @click="openGeneralCommentDialog(student)"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-800">{{ student.studentName }}</h4>
              <div class="flex items-center gap-2">
                <i v-if="student.generalComment" class="pi pi-check-circle text-green-600" v-tooltip.top="'Comment added'"></i>
                <i v-else class="pi pi-exclamation-circle text-orange-500" v-tooltip.top="'Comment needed'"></i>
                <Button 
                  icon="pi pi-comment" 
                  size="small" 
                  text 
                  rounded
                  :class="student.generalComment ? 'p-button-success' : 'p-button-warning'"
                  @click.stop="openGeneralCommentDialog(student)"
                  v-tooltip.top="student.generalComment ? 'Edit comment' : 'Add comment'"
                />
              </div>
            </div>
            <div v-if="student.generalComment" class="text-sm text-gray-700 bg-white p-2 rounded border">
              {{ student.generalComment.length > 100 ? student.generalComment.substring(0, 100) + '...' : student.generalComment }}
            </div>
            <div v-else class="text-sm text-gray-500 italic bg-white p-2 rounded border">
              <i class="pi pi-info-circle mr-1"></i>
              Click to add general comment for report card
            </div>
          </div>
        </div>
        
        <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            <i class="pi pi-check-circle text-green-600 mr-1"></i>
            {{ students.filter(s => s.generalComment).length }} students with comments
          </div>
          <div>
            <i class="pi pi-exclamation-circle text-orange-500 mr-1"></i>
            {{ students.filter(s => !s.generalComment).length }} students need comments
          </div>
        </div>
      </template>
    </Card>

    <!-- Skill Comment Dialog -->
    <Dialog
      v-model:visible="skillCommentDialog.visible"
      :header="`Add Comment for ${skillCommentDialog.student?.studentName} - ${skillCommentDialog.skillItem?.name}`"
      :style="{ width: '90vw', maxWidth: '600px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div class="mb-4">
        <label class="block font-semibold mb-2 text-900">Teacher Comment:</label>
        <Textarea
          v-model="skillCommentDialog.comment"
          :maxlength="200"
          rows="4"
          class="w-full"
          placeholder="Enter your assessment comment..."
          :autoResize="true"
        />
        <div class="text-right text-xs text-gray-500 mt-1">
          {{ 200 - (skillCommentDialog.comment?.length || 0) }} characters left
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="skillCommentDialog.visible = false"
            class="p-button-secondary" 
          />
          <Button 
            label="Save Comment" 
            icon="pi pi-check" 
            @click="saveSkillComment"
            class="p-button-primary" 
          />
        </div>
      </template>
    </Dialog>

    <!-- Admin Subject Summary Filter Dialog -->
    <Dialog
      v-model:visible="showAdminSummaryFilterDialog"
      header="Review Teacher Entered Marks"
      :style="{ width: '90vw', maxWidth: '560px' }"
      modal
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block font-semibold mb-2 text-900">Grade</label>
          <Select
            v-model="adminSummaryFilters.gradeId"
            :options="gradesForAdmin"
            optionLabel="name"
            optionValue="id"
            placeholder="Select grade"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Subject</label>
          <Select
            v-model="adminSummaryFilters.subjectId"
            :options="subjectsForAdmin"
            optionLabel="name"
            optionValue="id"
            placeholder="Select subject"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Academic Year</label>
          <Select
            v-model="adminSummaryFilters.academicYear"
            :options="academicYears"
            optionLabel="name"
            optionValue="id"
            placeholder="Select year"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Term</label>
          <Select
            v-model="adminSummaryFilters.term"
            :options="terms"
            optionLabel="name"
            optionValue="id"
            placeholder="Select term"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Filter by Teacher (optional)</label>
          <InputNumber v-model="adminSummaryFilters.teacherId" class="w-full" placeholder="Enter teacher ID (optional)" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" class="p-button-secondary" @click="showAdminSummaryFilterDialog = false" />
          <Button label="View Summary" class="p-button-primary" :loading="adminSummaryLoading" @click="applyAdminSummaryFilters" />
        </div>
      </template>
    </Dialog>

    <!-- Class Scoreboard Dialog -->
    <Dialog
      v-model:visible="showClassScoreboardDialog"
      header="Class Scoreboard"
      :style="{ width: '95vw', maxWidth: '1100px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div v-if="classScoreboard.loading" class="text-center py-6 text-600">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <div class="mt-2">Building scoreboard…</div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm border-collapse border border-gray-300 min-w-[900px]">
          <thead class="bg-gray-100">
            <tr>
              <th class="border border-gray-300 px-3 py-2 text-left">Student</th>
              <th v-for="sub in classScoreboard.subjects" :key="sub" class="border border-gray-300 px-3 py-2 text-center">
                {{ sub }}
              </th>
            </tr>
            <tr>
              <th class="border border-gray-300 px-3 py-1 text-left text-600">&nbsp;</th>
              <th v-for="sub in classScoreboard.subjects" :key="sub + '-legend'" class="border border-gray-300 px-3 py-1 text-center text-600">
                T1 / T2<TEMPLATE v-if="isGrade7ForSelectedAssignment"> / T3</TEMPLATE> / End
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in classScoreboard.rows" :key="row.studentId" class="hover:bg-gray-50">
              <td class="border border-gray-300 px-3 py-2 font-medium">{{ row.studentName }}</td>
              <td v-for="sub in classScoreboard.subjects" :key="row.studentId + '-' + sub" class="border border-gray-300 px-3 py-2 text-center">
                <span v-if="row.cells[sub]">
                  {{ formatScoreCell(row.cells[sub]) }}
                </span>
                <span v-else class="text-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <Button label="Close" class="p-button-secondary" @click="showClassScoreboardDialog = false" />
        </div>
      </template>
    </Dialog>

    <!-- Initial State -->
    <Card v-if="!selectedAssignment && !isBabyMode">
      <template #content>
        <div class="text-center py-6">
          <i class="pi pi-info-circle text-6xl text-400 mb-3"></i>
          <h3 class="text-lg md:text-xl text-600 mb-2">Select Assignment</h3>
          <p class="text-500">
            Please select a subject, academic year, term{{ isBabyClass ? '' : ', and exam type' }} to begin {{ isBabyClass ? 'skill assessment' : 'entering scores' }}.
          </p>
        </div>
      </template>
    </Card>

    <!-- General Comment Dialog -->
    <Dialog
      v-model:visible="showGeneralCommentDialog"
      :header="`General Comment for ${generalCommentStudent?.studentName}`"
      :style="{ width: '95vw', maxWidth: '900px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div class="mb-4">

        <!-- Scoreboard Display -->
        <div v-if="scoreboardData && scoreboardData.subjects && scoreboardData.subjects.length > 0" class="mb-4 p-4 bg-white rounded-lg border">
          <div class="flex items-center gap-2 mb-3">
            <i class="pi pi-table text-blue-600"></i>
            <span class="font-semibold text-gray-800">Academic Performance Scoreboard</span>
          </div>
          
          <!-- Scoreboard Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse border border-gray-300">
              <thead class="bg-gray-100">
                <tr>
                  <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Subject</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 1</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 2</th>
                  <th v-if="isGrade7ForSelectedAssignment" class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 3</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">End Term</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Average</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="subject in scoreboardData.subjects" :key="subject.subjectName" class="hover:bg-gray-50">
                  <td class="border border-gray-300 px-3 py-2 font-medium">{{ subject.subjectName }}</td>
                  <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(subject.test1Score)">
                    {{ subject.test1Score > 0 ? subject.test1Score : '-' }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(subject.midTermScore)">
                    {{ subject.midTermScore > 0 ? subject.midTermScore : '-' }}
                  </td>
                  <td v-if="isGrade7ForSelectedAssignment" class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(subject.test3Score)">
                    {{ subject.test3Score > 0 ? subject.test3Score : '-' }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(subject.endTermScore)">
                    {{ subject.endTermScore > 0 ? subject.endTermScore : '-' }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-center font-semibold" :class="getScoreColor(subject.termAverage)">
                    {{ subject.termAverage.toFixed(1) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td class="border border-gray-300 px-3 py-2 font-bold">Overall Average</td>
                  <td class="border border-gray-300 px-3 py-2"></td>
                  <td class="border border-gray-300 px-3 py-2"></td>
                  <td v-if="isGrade7ForSelectedAssignment" class="border border-gray-300 px-3 py-2"></td>
                  <td class="border border-gray-300 px-3 py-2"></td>
                  <td class="border border-gray-300 px-3 py-2 text-center font-bold text-lg" :class="getScoreColor(scoreboardData.overallAverage)">
                    {{ scoreboardData.overallAverage.toFixed(1) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div class="mb-3 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            <span class="font-semibold text-blue-800">General Comment Guidelines</span>
          </div>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• General comments appear on the student's report card</li>
            <li>• Provide constructive feedback about the student's overall performance</li>
            <li>• Focus on academic progress, behavior, and areas for improvement</li>
            <li>• Keep comments professional and encouraging</li>
          </ul>
        </div>
        
        <label class="block font-semibold mb-2 text-900">General Comment:</label>
        <Textarea
          v-model="generalCommentText"
          :maxlength="2000"
          rows="6"
          class="w-full"
          placeholder="Enter a general comment about this student's overall performance..."
          :autoResize="true"
          :disabled="generalCommentLoading"
        />
        <div class="flex justify-between items-center mt-2">
          <div class="text-xs text-gray-500">
            {{ 2000 - (generalCommentText?.length || 0) }} characters remaining
          </div>
          <div v-if="generalCommentLoading" class="text-xs text-blue-600">
            <i class="pi pi-spin pi-spinner mr-1"></i>
            Saving...
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-between items-center">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="closeGeneralCommentDialog"
            class="p-button-secondary" 
            :disabled="generalCommentLoading"
          />
          <div class="flex gap-2">
            <Button 
              label="Clear Comment" 
              icon="pi pi-trash" 
              @click="clearGeneralComment"
              class="p-button-danger p-button-outlined" 
              :disabled="generalCommentLoading || !generalCommentText"
            />
            <Button 
              label="Save Comment" 
              icon="pi pi-check" 
              @click="saveGeneralComment"
              class="p-button-primary" 
              :loading="generalCommentLoading"
              :disabled="!generalCommentText.trim()"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Multi-Subject Student Scores Dialog -->
    <Dialog
      v-model:visible="showStudentDialog"
      :header="selectedStudent ? selectedStudent.studentName + ' - All Subject Scores' : 'Student Scores'"
      :modal="true"
      :closable="true"
      :style="{ width: '95vw', maxWidth: '600px' }"
      class="rounded-xl shadow-lg"
      @hide="onDialogCancel"
    >
      <div v-if="selectedStudent">
        <div class="mb-4 bg-surface-100 p-3 rounded-lg">
          <strong>Exam Type:</strong> {{ getExamTypeName(selectedExamType) }}<br />
          <strong>Term:</strong> {{ getTermName(selectedTerm) }}
        </div>
        <div class="flex flex-col gap-4">
          <div v-for="subject in dialogSubjects" :key="subject.id" class="mb-2">
            <label class="block mb-1 font-semibold text-900">{{ subject.name }}</label>
            <div class="flex items-center gap-2 mb-2">
              <Button
                :label="dialogStudentScores[subject.id]?.isAbsent ? 'Absent' : 'Present'"
                :icon="dialogStudentScores[subject.id]?.isAbsent ? 'pi pi-times' : 'pi pi-check'"
                :class="dialogStudentScores[subject.id]?.isAbsent ? 'p-button-danger p-button-sm' : 'p-button-success p-button-sm'"
                @click="toggleDialogAbsent(subject.id)"
                size="small"
              />
            </div>
            <InputNumber
              v-model="dialogStudentScores[subject.id].score"
              :min="0"
              :max="150"
              :maxFractionDigits="1"
              :disabled="dialogStudentScores[subject.id]?.isAbsent"
              class="w-full"
              :class="{ 'opacity-50': dialogStudentScores[subject.id]?.isAbsent }"
              placeholder="Enter score"
            />
            <div v-if="selectedExamType === 4" class="mt-2">
              <label class="block mb-1 font-semibold text-900 flex items-center gap-1">
                Comments
                <i class="pi pi-info-circle text-yellow-600" v-tooltip.top="'Comments are only required for End-of-Term exams.'"></i>
              </label>
              <transition name="fade-slide">
                <div v-show="selectedExamType === 4">
                  <Textarea
                    v-model="dialogStudentScores[subject.id].comments"
                    :maxlength="100"
                    rows="2"
                    :disabled="dialogStudentScores[subject.id]?.isAbsent"
                    class="w-full comment-highlight"
                    :class="{ 'opacity-50': dialogStudentScores[subject.id]?.isAbsent }"
                    placeholder="Enter comment."
                    :autoResize="true"
                  />
                  <div class="text-right text-xs text-gray-500 mt-1">
                    {{ 100 - (dialogStudentScores[subject.id].comments?.length || 0) }} characters left
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" icon="pi pi-times" text @click="onDialogCancel" class="p-button-secondary" />
          <Button label="Save" icon="pi pi-check" @click="onDialogSave" :disabled="!dialogHasChanges" class="p-button-primary" />
        </div>
      </template>
    </Dialog>

    <!-- Edit Name Dialog -->
    <Dialog 
      v-model:visible="editName.visible" 
      :header="`Edit Name: ${editName.student?.studentName || ''}`" 
      :style="{ width: '90vw', maxWidth: '520px' }" 
      modal
      class="rounded-xl shadow-lg"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-900 font-semibold mb-1">First Name</label>
          <InputText v-model="editName.firstName" class="w-full" />
        </div>
        <div>
          <label class="block text-900 font-semibold mb-1">Middle Name</label>
          <InputText v-model="editName.middleName" class="w-full" />
        </div>
        <div>
          <label class="block text-900 font-semibold mb-1">Last Name</label>
          <InputText v-model="editName.lastName" class="w-full" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            class="p-button-secondary" 
            :disabled="editName.saving" 
            @click="editName.visible = false" 
          />
          <Button 
            label="Save" 
            icon="pi pi-check" 
            class="p-button-primary" 
            :loading="editName.saving" 
            :disabled="!isEditNameValid" 
            @click="saveEditedName" 
          />
        </div>
      </template>
    </Dialog>

    <Toast ref="toast" />
    <ConfirmDialog />

    <!-- Teacher Subject Summary Dialog (Secondary) -->
    <Dialog
      v-model:visible="showTeacherSummaryDialog"
      :header="`My Subject Summary - ${selectedAssignment?.subjectName || ''}`"
      :style="{ width: '95vw', maxWidth: '900px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div v-if="teacherSummaryLoading" class="text-center py-6 text-600">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <div class="mt-2">Loading summary…</div>
      </div>
      <div v-else-if="teacherSummary && Array.isArray(teacherSummary.students)" class="space-y-3">
        <div class="flex flex-wrap gap-3 text-sm text-700">
          <span><b>Grade:</b> {{ teacherSummary.gradeName }}</span>
          <span><b>Year:</b> {{ teacherSummary.academicYear }}</span>
          <span><b>Term:</b> {{ teacherSummary.term }}</span>
          <span><b>Entries:</b> {{ teacherSummary.totalEntries }}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse border border-gray-300 min-w-[700px]">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-3 py-2 text-left">Student</th>
                <th class="border border-gray-300 px-3 py-2 text-center">Test 1</th>
                <th class="border border-gray-300 px-3 py-2 text-center">Test 2</th>
                <th v-if="isGrade7ForTeacherSummary" class="border border-gray-300 px-3 py-2 text-center">Test 3</th>
                <th class="border border-gray-300 px-3 py-2 text-center">End Term</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Last Recorded</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in teacherSummary.students" :key="student.studentId" class="hover:bg-gray-50">
                <td class="border border-gray-300 px-3 py-2 font-medium">{{ student.studentName }}</td>
                <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(getTeacherSummaryScore(student.entries, 'test1'))">
                  {{ displayTeacherSummaryScore(student.entries, 'test1') }}
                </td>
                <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(getTeacherSummaryScore(student.entries, 'mid'))">
                  {{ displayTeacherSummaryScore(student.entries, 'mid') }}
                </td>
                <td v-if="isGrade7ForTeacherSummary" class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(getTeacherSummaryScore(student.entries, 'test3'))">
                  {{ displayTeacherSummaryScore(student.entries, 'test3') }}
                </td>
                <td class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(getTeacherSummaryScore(student.entries, 'end'))">
                  {{ displayTeacherSummaryScore(student.entries, 'end') }}
                </td>
                <td class="border border-gray-300 px-3 py-2">{{ getTeacherSummaryLatestRecorded(student.entries) }}</td>
              </tr>
              <tr v-if="teacherSummary.students.length === 0">
                <td :colspan="isGrade7ForTeacherSummary ? 6 : 5" class="text-center text-600 px-3 py-4">No entries found for this selection.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <Button label="Close" class="p-button-secondary" @click="showTeacherSummaryDialog = false" />
        </div>
      </template>
    </Dialog>

    <!-- Teacher Summary Filter Dialog (Secondary) -->
    <Dialog
      v-model:visible="showTeacherSummaryFilterDialog"
      header="Select Filters"
      :style="{ width: '90vw', maxWidth: '520px' }"
      modal
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block font-semibold mb-2 text-900">Assignment</label>
          <Select
            v-model="teacherSummaryFilters.assignment"
            :options="teacherAssignments"
            optionLabel="displayName"
            placeholder="Select assignment"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Academic Year</label>
          <Select
            v-model="teacherSummaryFilters.academicYear"
            :options="academicYears"
            optionLabel="name"
            optionValue="id"
            placeholder="Select year"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Term</label>
          <Select
            v-model="teacherSummaryFilters.term"
            :options="terms"
            optionLabel="name"
            optionValue="id"
            placeholder="Select term"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" class="p-button-secondary" @click="showTeacherSummaryFilterDialog = false" />
          <Button label="View Summary" class="p-button-primary" @click="applyTeacherSummaryFilters" />
        </div>
      </template>
    </Dialog>

    <!-- BabyClass Per-Student Full Assessment Dialog -->
    <Dialog
      v-model:visible="studentAssessmentDialog.visible"
      :header="studentAssessmentDialog.student ? `Assess ${studentAssessmentDialog.student.studentName} - Baby Class Skills` : 'Assess Student'"
      :style="{ width: '95vw', maxWidth: '900px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div class="mb-4">
        <div v-if="studentAssessmentDialog.loading" class="text-center py-6 text-600">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
          <div class="mt-2">Loading assessments…</div>
        </div>
        <div v-else>
          <div v-for="skill in studentAssessmentDialog.skills" :key="skill.id" class="mb-5 border rounded-lg bg-white">
            <div class="px-4 py-3 border-b bg-surface-50 rounded-t-lg flex items-center justify-between">
              <div>
                <div class="font-semibold text-900">{{ skill.name }}</div>
                <div class="text-600 text-sm">{{ skill.description }}</div>
              </div>
              <div class="text-600 text-sm">{{ (skill.skillItems || []).length }} items</div>
            </div>
            <div class="p-4 space-y-4">
              <div v-for="item in (skill.skillItems || [])" :key="item.id" class="">
                <div class="font-medium text-900 mb-1">{{ item.name }}</div>
                <div class="text-600 text-sm mb-2" v-if="item.description">{{ item.description }}</div>
                <Textarea
                  v-model="studentAssessmentDialog.assessments[item.id]"
                  :maxlength="200"
                  rows="3"
                  class="w-full"
                  placeholder="Enter your assessment for this item…"
                  :autoResize="true"
                />
                <div class="text-right text-xs text-gray-500 mt-1">
                  {{ 200 - ((studentAssessmentDialog.assessments[item.id] || '').length) }} characters left
                </div>
              </div>
            </div>
          </div>
          <!-- General Comment -->
          <div class="mb-5 border rounded-lg bg-white">
            <div class="px-4 py-3 border-b bg-surface-50 rounded-t-lg flex items-center justify-between">
              <div>
                <div class="font-semibold text-900">General Comment</div>
                <div class="text-600 text-sm">Appears on the student's report card</div>
              </div>
            </div>
            <div class="p-4">
              <Textarea
                v-model="studentAssessmentDialog.generalComment"
                :maxlength="2000"
                rows="5"
                class="w-full"
                placeholder="Enter an overall general comment for this student…"
                :autoResize="true"
              />
              <div class="text-right text-xs text-gray-500 mt-1">
                {{ 2000 - ((studentAssessmentDialog.generalComment || '').length) }} characters left
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-600 text-sm" v-if="studentAssessmentDialog.saving"><i class="pi pi-spin pi-spinner mr-2"></i>Saving…</div>
          <div class="flex gap-2">
            <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" :disabled="studentAssessmentDialog.saving" @click="studentAssessmentDialog.visible = false" />
            <Button label="Save" icon="pi pi-check" class="p-button-primary" :loading="studentAssessmentDialog.saving" @click="saveStudentAssessments" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Baby Class Quick Select (Year & Term) Dialog -->
    <Dialog
      v-model:visible="showQuickSelectDialog"
      header="Select Academic Year and Term"
      :style="{ width: '90vw', maxWidth: '520px' }"
      modal
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block font-semibold mb-2 text-900">Academic Year</label>
          <Select
            v-model="selectedAcademicYear"
            :options="academicYears"
            optionLabel="name"
            optionValue="id"
            placeholder="Select year"
            class="w-full"
          />
        </div>
        <div>
          <label class="block font-semibold mb-2 text-900">Term</label>
          <Select
            v-model="selectedTerm"
            :options="terms"
            optionLabel="name"
            optionValue="id"
            placeholder="Select term"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" class="p-button-secondary" @click="showQuickSelectDialog = false" />
          <Button label="Continue" class="p-button-primary" @click="onQuickSelectContinue" />
        </div>
      </template>
    </Dialog>

    <!-- Add Students Dialog -->
    <Dialog
      v-model:visible="addStudentsDialog.visible"
      header="Add Students to Exam Entry"
      :style="{ width: '90vw', maxWidth: '700px' }"
      modal
      class="rounded-xl shadow-lg"
    >
      <div v-if="addStudentsDialog.loading" class="text-center py-6 text-600">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <div class="mt-2">Loading available students…</div>
      </div>
      <div v-else>
        <div class="mb-4">
          <div class="mb-3">
            <label class="block font-semibold mb-2 text-900">Search Students</label>
            <InputText
              v-model="addStudentsDialog.searchQuery"
              placeholder="Search by name or student number..."
              class="w-full"
            />
          </div>
          <div class="text-sm text-600 mb-3">
            <span class="font-semibold">{{ addStudentsDialog.availableStudents.length }}</span> student(s) available to add
          </div>
        </div>

        <div class="border rounded-lg" style="max-height: 400px; overflow-y: auto;">
          <div v-if="addStudentsDialog.filteredAvailableStudents.length === 0" class="text-center py-6 text-600">
            <i class="pi pi-info-circle text-2xl mb-2"></i>
            <div>No students available to add</div>
            <div class="text-sm mt-2" v-if="addStudentsDialog.searchQuery">
              Try adjusting your search criteria
            </div>
          </div>
          <div v-else class="p-2">
            <div
              v-for="student in addStudentsDialog.filteredAvailableStudents"
              :key="student.id"
              class="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-surface-50 cursor-pointer"
              :class="{ 'bg-blue-50 border-blue-300': addStudentsDialog.selectedStudentIds.includes(student.id) }"
              @click="toggleStudentSelection(student.id)"
            >
              <div class="flex items-center gap-3">
                <Checkbox
                  :modelValue="addStudentsDialog.selectedStudentIds.includes(student.id)"
                  @change="toggleStudentSelection(student.id)"
                  :binary="true"
                />
                <div>
                  <div class="font-semibold text-900">{{ student.fullName }}</div>
                  <div class="text-sm text-600" v-if="student.studentNumber">
                    Student #: {{ student.studentNumber }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isSecondaryClass && addStudentsDialog.selectedStudentIds.length > 0" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
            <div class="text-sm text-yellow-800">
              <strong>Note:</strong> For secondary classes, selected students will be enrolled in the subject
              <strong>{{ selectedAssignment?.subjectName }}</strong> if they are not already enrolled.
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-sm text-600">
            <span v-if="addStudentsDialog.selectedStudentIds.length > 0">
              {{ addStudentsDialog.selectedStudentIds.length }} student(s) selected
            </span>
          </div>
          <div class="flex gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-secondary"
              @click="closeAddStudentsDialog"
              :disabled="addStudentsDialog.saving"
            />
            <Button
              label="Add Students"
              icon="pi pi-check"
              class="p-button-primary"
              @click="addSelectedStudents"
              :loading="addStudentsDialog.saving"
              :disabled="addStudentsDialog.selectedStudentIds.length === 0"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script>
import { examService, gradeService, homeroomService, markScheduleService, reportService, secondarySubjectService } from '@/service/api.service';
import { babyClassSkillService } from '@/service/BabyClassSkillService';

export default {
  name: 'ScoreEntryWithAbsent',

  data() {
    return {
      // Selection data
      selectedAssignment: null,
      selectedAcademicYear: null,
      selectedTerm: null,
      selectedExamType: null,
      autoSaveTimeout: null,

      // Options
      teacherAssignments: [],
      academicYears: [],
      terms: [
        { id: 1, name: 'Term 1' },
        { id: 2, name: 'Term 2' },
        { id: 3, name: 'Term 3' }
      ],
      examTypes: [],

      // Student data
      students: [],
      originalStudents: [],
      editingRows: [],
      studentSearch: '',

      // Prefetched class-wide term summary (by studentId)
      gradeTermSummaryByStudent: {},

      // Teacher subject summary dialog state
      showTeacherSummaryDialog: false,
      teacherSummaryLoading: false,
      teacherSummary: null,
      // Admin subject review
      showAdminSummaryFilterDialog: false,
      adminSummaryLoading: false,
      adminSummary: null,
      adminSummaryFilters: {
        gradeId: null,
        subjectId: null,
        academicYear: null,
        term: null,
        teacherId: null
      },
      gradesForAdmin: [],
      subjectsForAdmin: [],
      // Class Scoreboard
      showClassScoreboardDialog: false,
      classScoreboard: { loading: false, subjects: [], rows: [] },
      showTeacherSummaryFilterDialog: false,
      teacherSummaryFilters: {
        assignment: null,
        academicYear: null,
        term: null,
        examType: null
      },

      // Loading states
      loading: false,
      saving: false,
      loadingAssignments: false,
      loadingYears: false,
      loadingTerms: false,
      loadingExamTypes: false,
      loadingScores: false,
      loadingComments: false,

      // Change tracking
      pendingChanges: [],

      // Comment dialog
      commentDialog: {
        visible: false,
        student: null
      },

      // Multi-subject dialog state
      showStudentDialog: false,
      selectedStudent: null,
      dialogSubjects: [],
      dialogStudentScores: {}, // { [subjectId]: { score, comments, scoreId, isAbsent } }
      dialogOriginalScores: {},

      // Add Students dialog state
      addStudentsDialog: {
        visible: false,
        loading: false,
        saving: false,
        availableStudents: [],
        selectedStudentIds: [],
        searchQuery: ''
      },

      // Mobile detection
      isMobile: false,
      // Per-student save status for mobile
      mobileSaveStatus: {}, // { [studentId]: 'idle' | 'saving' | 'saved' | 'error' }

      // Absent management
      showBulkAbsentDialog: false,
      selectedStudents: [],
      bulkAbsentLoading: false,

      // General comment management
      showGeneralCommentDialog: false,
      generalCommentStudent: null,
      generalCommentText: '',
      generalCommentLoading: false,
      isHomeroomForSelectedGrade: false,

      // Edit name dialog
      editName: {
        visible: false,
        student: null,
        firstName: '',
        middleName: '',
        lastName: '',
        saving: false
      },

      // BabyClass skill assessment data
      babyClassSkills: [
        {
          id: 1,
          name: 'COMMUNICATION SKILLS',
          description: 'Language and communication development',
          icon: 'pi pi-comments',
          itemsCount: 2
        },
        {
          id: 2,
          name: 'SOCIAL EMOTIONAL SKILLS',
          description: 'Social interaction and emotional development',
          icon: 'pi pi-users',
          itemsCount: 3
        },
        {
          id: 3,
          name: 'READING & WRITING',
          description: 'Early literacy and writing skills',
          icon: 'pi pi-book',
          itemsCount: 2
        },
        {
          id: 4,
          name: 'COLOUR & SHAPES',
          description: 'Visual recognition and spatial awareness',
          icon: 'pi pi-circle',
          itemsCount: 2
        },
        {
          id: 5,
          name: 'NUMBERS',
          description: 'Early numeracy and counting skills',
          icon: 'pi pi-calculator',
          itemsCount: 2
        },
        {
          id: 6,
          name: 'FINE-MOTOR SKILLS',
          description: 'Hand-eye coordination and fine motor control',
          icon: 'pi pi-pencil',
          itemsCount: 3
        },
        {
          id: 7,
          name: 'GROSS MOTOR SKILLS',
          description: 'Large muscle movement and coordination',
          icon: 'pi pi-play',
          itemsCount: 1
        }
      ],
      selectedSkillId: null,
      skillItems: [], // Will be loaded from API
      studentAssessments: {}, // { [studentId]: { [skillItemId]: { status, comment, assessmentId } } }
      skillCommentDialog: {
        visible: false,
        student: null,
        skillItem: null,
        comment: ''
      },
      assessmentLoading: {} // { [studentId_skillItemId]: boolean }
      ,

      // BabyClass per-student full assessment dialog
      studentAssessmentDialog: {
        visible: false,
        student: null,
        loading: false,
        saving: false,
        skills: [], // [{ id, name, description, skillItems: [{id, name, description}] }]
        assessments: {}, // { [skillItemId]: comment }
        generalComment: '',
        reportCardId: null
      },

      // Baby Class detection mode (assignment or homeroom)
      isBabyMode: false,

      // Baby Class: all skill item ids to determine completion
      babyAllSkillItemIds: [],
      // Baby Class: map of studentId -> has general comment
      babyGeneralCommentPresent: {},
      // Debug: target name (lowercase substring) to inspect Baby Class completion issues
      babyDebugTargetName: 'chaboota',

      // BabyClass quick select for term/year on entry
      showQuickSelectDialog: false,
      quickSelectShown: false
      ,
      // Defer opening teacher summary dialog until data is ready
      openTeacherSummaryRequested: false
    }
  },

  computed: {
    isBabyClass() {
  // Apply Baby Class layout ONLY when the currently selected assignment is Baby Class
  if (this.selectedAssignment && this.selectedAssignment.gradeName) {
    const gradeName = String(this.selectedAssignment.gradeName).toLowerCase();
    return gradeName.includes('baby');
  }
  return false;
},

    isSecondaryClass() {
      if (!this.selectedAssignment) return false;
      // Prefer explicit backend-provided section when available
      const sec = this.selectedAssignment.gradeSection ?? this.selectedAssignment.GradeSection;
      if (typeof sec === 'string' && sec.toLowerCase() === 'secondary') return true;
      // Try to resolve from teacherAssignments by gradeId
      if (this.selectedAssignment.gradeId && Array.isArray(this.teacherAssignments)) {
        const matchA = this.teacherAssignments.find(a => (a.gradeId ?? a.GradeId) === this.selectedAssignment.gradeId);
        const secA = matchA && (matchA.gradeSection ?? matchA.GradeSection);
        if (typeof secA === 'string' && String(secA).toLowerCase() === 'secondary') return true;
      }
      // Heuristics fallback using grade name
      const name = String(this.selectedAssignment.gradeName || '').toLowerCase();
      if (name.includes('secondary')) return true;
      if (/\bform\s*\d*/i.test(name)) return true;
      if (/\bjss?\s*\d+/i.test(name)) return true;
      if (/\bss\s*\d+/i.test(name)) return true;
      const match = name.match(/\b(grade|g)\s*(\d{1,2})\b/);
      if (match) {
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num >= 8) return true;
      }
      const numOnly = name.match(/\b(\d{1,2})\b/);
      if (numOnly) {
        const n = parseInt(numOnly[1], 10);
        if (!isNaN(n) && n >= 8) return true;
      }
      return false;
    },

    isGrade7ForSelectedAssignment() {
      if (!this.selectedAssignment || !this.selectedAssignment.gradeName) return false;
      const name = String(this.selectedAssignment.gradeName).toLowerCase();
      if (name.includes('grade 7') || name.includes('grade7') || name.includes('g7') || name.includes('seven')) return true;
      const match = name.match(/\b(grade|g)\s*(\d{1,2})\b/);
      if (match) {
        const num = parseInt(match[2], 10);
        return num === 7;
      }
      return false;
    },

    isEditNameValid() {
      return !!(
        this.editName.firstName?.trim() && 
        this.editName.lastName?.trim()
      );
    },

    // For teacher summary dialog, infer Grade 7 from current summary payload or selected assignment
    isGrade7ForTeacherSummary() {
      // Prefer teacherSummary.gradeName if available
      const gName = this.teacherSummary && this.teacherSummary.gradeName
        ? String(this.teacherSummary.gradeName).toLowerCase()
        : (this.selectedAssignment && this.selectedAssignment.gradeName
            ? String(this.selectedAssignment.gradeName).toLowerCase()
            : '');
      if (!gName) return false;
      if (gName.includes('grade 7') || gName.includes('grade7') || gName.includes('g7') || gName.includes('seven')) return true;
      const m = gName.match(/\b(grade|g)\s*(\d{1,2})\b/);
      if (m) {
        const n = parseInt(m[2], 10);
        return n === 7;
      }
      return false;
    },

  
    

    canLoadStudents() {
      if (this.isBabyMode) {
        return this.selectedAcademicYear && this.selectedTerm;
      }
      return this.selectedAssignment &&
             this.selectedAcademicYear &&
             this.selectedTerm &&
             this.selectedExamType;
    },

    showCommentsField() {
      return this.selectedExamType === 3;
    },

    hasUnsavedChanges() {
      return this.pendingChanges.length > 0
    },

    isDevelopment() {
      return process.env.NODE_ENV === 'development'
    },

    dialogHasChanges() {
      if (!this.dialogSubjects || !this.dialogOriginalScores) return false;
      return this.dialogSubjects.some(subject => {
        const orig = this.dialogOriginalScores[subject.id];
        const curr = this.dialogStudentScores[subject.id];
        return curr && orig && (
          curr.score !== orig.score || 
          curr.comments !== orig.comments ||
          curr.isAbsent !== orig.isAbsent
        );
      });
    },

    filteredStudents() {
      if (!this.studentSearch) return this.students;
      return this.students.filter(s =>
        s.studentName && s.studentName.toLowerCase().includes(this.studentSearch.toLowerCase())
      );
    },

    filteredAvailableStudents() {
      const query = (this.addStudentsDialog.searchQuery || '').toLowerCase().trim();
      if (!query) return this.addStudentsDialog.availableStudents;
      
      return this.addStudentsDialog.availableStudents.filter(student => {
        const name = (student.fullName || '').toLowerCase();
        const number = (student.studentNumber || '').toLowerCase();
        return name.includes(query) || number.includes(query);
      });
    },

    presentCount() {
      return this.students.filter(s => !s.isAbsent).length;
    },

    absentCount() {
      return this.students.filter(s => s.isAbsent).length;
    }
  },

  watch: {
    selectedAcademicYear() {
      this.onBabyFilterWatch()
    },
    selectedTerm() {
      this.onBabyFilterWatch()
    },
    // Once assignments/years load and we are in secondary, open dialog if requested
    teacherAssignments(newVal) {
      this.maybeOpenTeacherSummaryFromQuery()
    },
    academicYears(newVal) {
      this.maybeOpenTeacherSummaryFromQuery()
    },
    // Load subjects when admin selects a grade in the admin dialog
    'adminSummaryFilters.gradeId'(newVal) {
      if (newVal) {
        this.loadAdminSubjectsForGrade(newVal)
      } else {
        this.subjectsForAdmin = []
      }
    },
    // React to route query changes (e.g., navigating from menu again)
    $route(to, from) {
      try {
        const q = to?.query || {}
        if (q.openTeacherSummary === '1' || q.openTeacherSummary === 'true') {
          this.openTeacherSummaryFilterDialog()
        }
        if (q.openAdminSubjectReview === '1' || q.openAdminSubjectReview === 'true') {
          this.prepareAdminFilters()
          this.showAdminSummaryFilterDialog = true
        }
      } catch (_) {}
    }
  },

  mounted() {
    // Prompt Baby Class teachers immediately (based on homeroom) without waiting for assignment selection
    this.maybeShowBabyClassQuickSelect()
    this.initializeData()
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    // Open teacher summary filter dialog if requested via menu link
    try {
      const q = this.$route?.query || {}
      if (q.openTeacherSummary === '1' || q.openTeacherSummary === 'true') {
        this.openTeacherSummaryFilterDialog()
      }
      if (q.openAdminSubjectReview === '1' || q.openAdminSubjectReview === 'true') {
        this.prepareAdminFilters()
        this.showAdminSummaryFilterDialog = true
      }
    } catch (_) {}
  },

  beforeUnmount() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('resize', this.handleResize)
    if (this.hasUnsavedChanges) {
      const answer = confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!answer) {
        return false
      }
    }
  },

  methods: {
    maybeOpenTeacherSummaryFromQuery() {
      if (!this.openTeacherSummaryRequested) return
      // Require secondary section and options to be available
      if (!this.isSecondaryClass) return
      const haveAssignments = Array.isArray(this.teacherAssignments) && this.teacherAssignments.length > 0
      const haveYears = Array.isArray(this.academicYears) && this.academicYears.length > 0
      if (!haveAssignments || !haveYears) return
      this.openTeacherSummaryRequested = false
      this.openTeacherSummaryFilterDialog()
    },
    async openTeacherSubjectSummary() {
      if (!this.selectedAssignment || !this.selectedAcademicYear || !this.selectedTerm) {
        this.showWarn('Please select assignment, year and term first.');
        return;
      }
      try {
        this.teacherSummaryLoading = true;
        const payload = await examService.getTeacherSubjectSummary(
          this.selectedAssignment.subjectId,
          this.selectedAssignment.gradeId,
          this.selectedAcademicYear,
          this.selectedTerm
        );
        this.teacherSummary = payload;
        this.showTeacherSummaryDialog = true;
      } catch (e) {
        this.showError('Failed to load subject summary');
      } finally {
        this.teacherSummaryLoading = false;
      }
    },

    openTeacherSummaryFilterDialog() {
      // seed defaults from current selection if available
      this.teacherSummaryFilters.assignment = this.selectedAssignment || null;
      this.teacherSummaryFilters.academicYear = this.selectedAcademicYear || null;
      this.teacherSummaryFilters.term = this.selectedTerm || null;
      this.showTeacherSummaryFilterDialog = true;
    },
    openClassScoreboard() {
      this.buildClassScoreboard()
    },
    async buildClassScoreboard() {
      if (!this.selectedAssignment || !this.selectedAcademicYear || !this.selectedTerm) {
        this.showWarn('Please select assignment, academic year and term.');
        return;
      }
      try {
        this.classScoreboard.loading = true
        // Pull class-wide summary once
        const summary = await examService.getGradeTermSummary(
          this.selectedAssignment.gradeId,
          this.selectedAcademicYear,
          this.selectedTerm
        )
        const rows = Array.isArray(summary) ? summary : []
        // Subjects sorted
        const subjectSet = new Set(rows.map(r => r.subjectName).filter(Boolean))

        // Build per-student cells from summary
        const byStudent = new Map()
        rows.forEach(r => {
          const sid = r.studentId
          if (!byStudent.has(sid)) {
            byStudent.set(sid, { studentId: sid, studentName: r.studentName, cells: {} })
          }
          const rec = byStudent.get(sid)
          rec.cells[r.subjectName] = {
            t1: r.test1Score || 0,
            t2: r.midTermScore || 0,
            t3: r.test3Score || 0,
            end: r.endTermScore || 0
          }
        })

        // If many subjects lack Test1/Mid (or Test3 for Grade 7), enrich from raw grade scores
        const needsEnrichment = () => {
          for (const st of byStudent.values()) {
            for (const subj of Object.keys(st.cells)) {
              const c = st.cells[subj] || {}
              const hasT1 = (c.t1 || 0) > 0
              const hasT2 = (c.t2 || 0) > 0
              const hasEnd = (c.end || 0) > 0
              const needT3 = this.isGrade7ForSelectedAssignment
              const hasT3 = (c.t3 || 0) > 0
              if (!hasT1 || !hasT2 || (!hasT3 && needT3)) {
                // Only consider enrichment if at least one value is missing while there is some data present (like End)
                if (hasEnd || hasT1 || hasT2 || hasT3) return true
              }
            }
          }
          return false
        }

        if (needsEnrichment()) {
          try {
            const raw = await examService.getGradeScores(
              this.selectedAssignment.gradeId,
              this.selectedAcademicYear,
              this.selectedTerm
            )
            const arr = Array.isArray(raw) ? raw : []
            arr.forEach(rec => {
              const sid = rec.studentId ?? rec.StudentId
              const sname = rec.studentName ?? rec.StudentName ?? ''
              const subj = rec.subjectName ?? rec.SubjectName
              if (!sid || !subj) return
              if (!byStudent.has(sid)) {
                byStudent.set(sid, { studentId: sid, studentName: sname, cells: {} })
              }
              const st = byStudent.get(sid)
              if (!st.cells[subj]) st.cells[subj] = { t1: 0, t2: 0, t3: 0, end: 0 }
              const kind = this.normalizeExamKind(this.pickExamTypeName(rec))
              const val = (rec.isAbsent ?? rec.IsAbsent) ? 0 : (rec.score ?? rec.Score ?? 0)
              if (kind === 'test1' && st.cells[subj].t1 === 0) st.cells[subj].t1 = val
              if (kind === 'mid' && st.cells[subj].t2 === 0) st.cells[subj].t2 = val
              if (kind === 'test3' && st.cells[subj].t3 === 0) st.cells[subj].t3 = val
              if (kind === 'end' && st.cells[subj].end === 0) st.cells[subj].end = val
              subjectSet.add(subj)
            })
          } catch (_) {
            // ignore enrichment errors, show whatever we have
          }
        }

        const subjects = Array.from(subjectSet).sort((a,b) => a.localeCompare(b))
        const rowList = Array.from(byStudent.values()).sort((a,b) => a.studentName.localeCompare(b.studentName))
        this.classScoreboard = { loading: false, subjects, rows: rowList }
        this.showClassScoreboardDialog = true
      } catch (e) {
        this.classScoreboard.loading = false
        this.showError('Failed to build scoreboard')
      }
    },
    formatScoreCell(cell) {
      if (!cell) return '-'
      const parts = [cell.t1||0, cell.t2||0]
      if (this.isGrade7ForSelectedAssignment) parts.push(cell.t3||0)
      parts.push(cell.end||0)
      // Display zeros as '-' for readability
      const fmt = v => (v && v > 0 ? v : '-')
      if (this.isGrade7ForSelectedAssignment) {
        return `${fmt(parts[0])}/${fmt(parts[1])}/${fmt(parts[2])}/${fmt(parts[3])}`
      } else {
        return `${fmt(parts[0])}/${fmt(parts[1])}/${fmt(parts[3])}`
      }
    },
    async prepareAdminFilters() {
      try {
        // Load grades list for admin selection
        if (!Array.isArray(this.gradesForAdmin) || this.gradesForAdmin.length === 0) {
          try {
            const grades = await gradeService.getAll(true)
            const arr = Array.isArray(grades?.data) ? grades.data : (Array.isArray(grades) ? grades : [])
            this.gradesForAdmin = arr.map(g => ({ id: g.id ?? g.Id ?? g.gradeId, name: g.fullName ?? g.FullName ?? g.name }))
          } catch (_) { this.gradesForAdmin = [] }
        }
        // If a grade was preselected earlier, refresh subjects for it
        if (this.adminSummaryFilters.gradeId) {
          await this.loadAdminSubjectsForGrade(this.adminSummaryFilters.gradeId)
        }
      } catch (_) {}
    },
    async loadAdminSubjectsForGrade(gradeId) {
      try {
        // Fetch subjects assigned to the selected grade (independent of teacher)
        const { subjectService } = await import('@/service/api.service')
        const resp = await subjectService.getByGrade(gradeId)
        const arr = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
        this.subjectsForAdmin = arr.map(s => ({ id: s.id ?? s.Id, name: s.name ?? s.Name }))
      } catch (_) {
        this.subjectsForAdmin = []
      }
    },
    async applyAdminSummaryFilters() {
      const gradeId = this.adminSummaryFilters.gradeId;
      const subjectId = this.adminSummaryFilters.subjectId;
      const year = this.adminSummaryFilters.academicYear;
      const term = this.adminSummaryFilters.term;
      const teacherId = this.adminSummaryFilters.teacherId;
      if (!gradeId || !subjectId || !year || !term) {
        this.showWarn('Please select grade, subject, year and term.');
        return;
      }
      try {
        this.adminSummaryLoading = true;
        const payload = await examService.getAdminSubjectSummary(subjectId, gradeId, year, term, teacherId || null);
        this.adminSummary = payload;
        this.showAdminSummaryFilterDialog = false;
        // Reuse teacher summary dialog to display the table if shape matches
        this.teacherSummary = payload;
        this.showTeacherSummaryDialog = true;
      } catch (e) {
        this.showError('Failed to load admin subject summary');
      } finally {
        this.adminSummaryLoading = false;
      }
    },
    async applyTeacherSummaryFilters() {
      const a = this.teacherSummaryFilters.assignment;
      const year = this.teacherSummaryFilters.academicYear;
      const term = this.teacherSummaryFilters.term;
      if (!a || !year || !term) {
        this.showWarn('Please select assignment, year and term.');
        return;
      }
      try {
        this.teacherSummaryLoading = true;
        const payload = await examService.getTeacherSubjectSummary(
          a.subjectId,
          a.gradeId,
          year,
          term
        );
        this.teacherSummary = payload;
        this.showTeacherSummaryDialog = true;
        this.showTeacherSummaryFilterDialog = false;
      } catch (e) {
        this.showError('Failed to load subject summary');
      } finally {
        this.teacherSummaryLoading = false;
      }
    },
    // Auto-select first Baby Class assignment for Baby Class teachers
    autoSelectBabyClassAssignment() {
      if (!this.selectedAssignment && Array.isArray(this.teacherAssignments) && this.teacherAssignments.length === 1) {
        const onlyAssignment = this.teacherAssignments[0];
        if (onlyAssignment && onlyAssignment.gradeName && String(onlyAssignment.gradeName).toLowerCase().includes('baby')) {
          this.selectedAssignment = onlyAssignment;
          console.log('🔍 Auto-selected Baby Class assignment:', onlyAssignment);
        }
      }
    },

    async checkHomeroomForSelectedGrade() {
      try {
        this.isHomeroomForSelectedGrade = false
        if (!this.selectedAssignment) return

        // Prefer robust status endpoint (may include homeroom grade ids)
        try {
          const status = await homeroomService.getHomeroomStatus()
          const payload = status?.data ?? status
          const homeroomGrades = Array.isArray(payload?.homeroomGrades) ? payload.homeroomGrades : []
          // Support arrays of ids or objects with id/gradeId/name
          const ids = new Set(
            homeroomGrades.map(g => (
              typeof g === 'number' ? g : (g?.gradeId ?? g?.id)
            )).filter(v => v !== undefined && v !== null)
          )
          if (ids.has(this.selectedAssignment.gradeId)) {
            this.isHomeroomForSelectedGrade = true
            return
          }
          // Name-based fallback from status
          const names = new Set(
            homeroomGrades.map(g => String(g?.gradeName || g?.name || '').toLowerCase()).filter(Boolean)
          )
          const normalize = (s) => s.replace(/grade\s*/g, '').replace(/\s+/g, ' ').trim()
          const selectedName = normalize(String(this.selectedAssignment.gradeName || '').toLowerCase())
          for (const n of names) {
            if (normalize(n) === selectedName) {
              this.isHomeroomForSelectedGrade = true
              return
            }
          }
        } catch (_) {
          // ignore and try grade-info fallback
        }

        // Fallback: grade-info endpoint (may not include ids)
        try {
          const info = await homeroomService.getHomeroomGradeInfo()
          const gradeData = info?.data ?? info
          const myGradeId = gradeData?.gradeId ?? gradeData?.id
          if (myGradeId && myGradeId === this.selectedAssignment.gradeId) {
            this.isHomeroomForSelectedGrade = true
            return
          }
          const myGradeName = String(gradeData?.gradeName || gradeData?.name || '').toLowerCase()
          const normalize = (s) => s.replace(/grade\s*/g, '').replace(/\s+/g, ' ').trim()
          const selectedGradeName = normalize(String(this.selectedAssignment.gradeName || '').toLowerCase())
          if (myGradeName && normalize(myGradeName) === selectedGradeName) {
            this.isHomeroomForSelectedGrade = true
          }
        } catch (_) {
          // swallow
        }
      } catch (e) {
        this.isHomeroomForSelectedGrade = false
      }
    },
    // General Comment methods
    async loadGeneralCommentsForStudents() {
      try {
        console.log('🔄 Loading general comments for all students...');
        
        // Get report cards for the entire class
        const classReportCards = await reportService.getClassReportCardIds(
          this.selectedAssignment.gradeId,
          this.selectedAcademicYear,
          this.selectedTerm
        );
        
        console.log('📋 Found report cards:', classReportCards);
        
        // Create a map for faster lookup
        const reportCardMap = new Map();
        classReportCards.forEach(rc => {
          reportCardMap.set(rc.studentName, rc);
        });
        
        // Prepare all API calls in parallel
        const commentPromises = this.students.map(async (student) => {
          try {
            const studentReportCard = reportCardMap.get(student.studentName);
            
            if (studentReportCard) {
              console.log(`📝 Loading comment for ${student.studentName} (ReportCard ID: ${studentReportCard.id})`);
              
              // Load the general comment
              const commentData = await examService.getGeneralComment(studentReportCard.id);
              // Handle both string response and object response
              const comment = typeof commentData === 'string' ? commentData : (commentData.comment || '');
              
              return {
                student,
                comment,
                reportCardId: studentReportCard.id,
                success: true
              };
            } else {
              console.log(`⚠️ No report card found for ${student.studentName}`);
              return {
                student,
                comment: '',
                reportCardId: null,
                success: true
              };
            }
          } catch (error) {
            console.log(`❌ Error loading comment for ${student.studentName}:`, error);
            return {
              student,
              comment: '',
              reportCardId: null,
              success: false,
              error
            };
          }
        });
        
        // Wait for all API calls to complete in parallel
        console.log('🚀 Making parallel API calls for all students...');
        const results = await Promise.all(commentPromises);
        
        // Update students with their comments
        results.forEach(result => {
          result.student.generalComment = result.comment;
          if (result.reportCardId) {
            result.student.reportCardId = result.reportCardId;
          }
          
          if (result.success) {
            console.log(`✅ Loaded comment for ${result.student.studentName}:`, result.comment ? 'Has comment' : 'No comment');
          }
        });
        
        console.log('✅ Finished loading general comments for all students');
        
      } catch (error) {
        console.error('❌ Error loading general comments:', error);
        // Don't show error to user as this is not critical
      }
    },

    async openGeneralCommentDialog(student) {
      // Restrict dialog for secondary and baby classes to homeroom teachers only
      if ((this.isSecondaryClass || this.isBabyClass) && !this.isHomeroomForSelectedGrade) {
        this.showWarn('Only the homeroom teacher can add general comments for this class.');
        return;
      }
      this.generalCommentStudent = student;
      this.generalCommentText = '';
      this.scoreboardData = null;
      this.showGeneralCommentDialog = true;
      
      // Load scoreboard data for the report card
      this.scoreboardData = await this.getStudentScoreboardData(student);
      
      // Try to load existing general comment from report card
      try {
        let reportCardId = student.reportCardId;
        
        if (!reportCardId) {
          try {
            // Try to get report cards for the entire class first
            const classReportCards = await reportService.getClassReportCardIds(
              this.selectedAssignment.gradeId,
              this.selectedAcademicYear,
              this.selectedTerm
            );
            
            // Find the report card for this specific student
            const studentReportCard = classReportCards.find(rc => 
              rc.studentName === student.studentName
            );
            
            if (studentReportCard) {
              reportCardId = studentReportCard.id;
              student.reportCardId = reportCardId;
            }
          } catch (error) {
            console.log('No existing report card found for class:', error);
            
            // Fallback: try individual student report cards
            try {
              const reportCards = await examService.getStudentReportCards(student.studentId);
              const currentReportCard = reportCards.find(rc => 
                rc.academicYear === this.selectedAcademicYear && 
                rc.term === this.selectedTerm
              );
              
              if (currentReportCard) {
                reportCardId = currentReportCard.id;
                student.reportCardId = reportCardId;
              }
            } catch (individualError) {
              console.log('No individual report card found:', individualError);
            }
          }
        }
        
        if (reportCardId) {
          // Load existing general comment from the proper API
          const existingComment = await examService.getGeneralComment(reportCardId);
          // Handle both string response and object response
          this.generalCommentText = typeof existingComment === 'string' ? existingComment : (existingComment.comment || '');
        } else {
          // No report card exists yet
          this.generalCommentText = '';
        }
      } catch (error) {
        console.log('No existing general comment found or error loading:', error);
        // Use local comment if available
        this.generalCommentText = student.generalComment || '';
      }
    },




    getScoreColor(score) {
      if (score >= 80) return 'text-green-600';
      if (score >= 70) return 'text-blue-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    },

    getGradeColor(grade) {
      if (grade === 'A+' || grade === 'A') return 'text-green-600';
      if (grade === 'B+' || grade === 'B') return 'text-blue-600';
      if (grade === 'C') return 'text-yellow-600';
      if (grade === 'D') return 'text-orange-600';
      return 'text-red-600';
    },

    // Teacher summary helpers
    normalizeExamKind(name) {
      const n = String(name || '').toLowerCase().trim();
      // End of Term variants
      if (/\b(end\s*-?\s*of\s*-?\s*term|end\s*-?\s*term|endterm|final|eot)\b/.test(n)) return 'end';
      // Test 3 / Term 3 variants (include spelled numbers and hyphens)
      if (/\b(test[-_\s]*three|test\s*3|t3|third|3rd|assessment[-_\s]*3|assessment[-_\s]*three|term\s*three|term\s*3|third\s*term|term\s*iii)\b/.test(n)) return 'test3';
      // Test 2 / Midterm / Term 2 variants (include spelled numbers and hyphens)
      if (/\b(test[-_\s]*two|test\s*2|t2|second|2nd|assessment[-_\s]*2|assessment[-_\s]*two|mid\s*-?\s*term|midterm|mid|term\s*two|term\s*2|second\s*term|term\s*ii)\b/.test(n)) return 'mid';
      // Test 1 / Term 1 variants (include spelled numbers and hyphens)
      if (/\b(test[-_\s]*one|test\s*1|t1|first|1st|assessment[-_\s]*1|assessment[-_\s]*one|term\s*one|term\s*1|first\s*term|term\s*i)\b/.test(n)) return 'test1';
      return '';
    },

    pickExamTypeName(entry) {
      return (
        entry?.examTypeName ?? entry?.ExamTypeName ?? entry?.typeName ?? entry?.TypeName ?? entry?.type ?? entry?.Type ?? ''
      );
    },
    getTeacherSummaryScore(entries, kind) {
      if (!Array.isArray(entries)) return 0;
      // pick latest by recordedAt for given kind
      const filtered = entries.filter(e => this.normalizeExamKind(this.pickExamTypeName(e)) === kind);
      if (filtered.length === 0) return 0;
      const latest = filtered
        .slice()
        .sort((a,b) => new Date(a.recordedAt ?? a.RecordedAt ?? 0) - new Date(b.recordedAt ?? b.RecordedAt ?? 0))
        .pop();
      const isAbsent = latest?.isAbsent ?? latest?.IsAbsent ?? false;
      const val = latest?.score ?? latest?.Score ?? 0;
      return !isAbsent ? (val || 0) : 0;
    },
    displayTeacherSummaryScore(entries, kind) {
      const v = this.getTeacherSummaryScore(entries, kind);
      return v > 0 ? v : '-';
    },
    getTeacherSummaryLatestRecorded(entries) {
      if (!Array.isArray(entries) || entries.length === 0) return '';
      const latest = entries.slice().sort((a,b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0];
      return latest?.recordedAt ? this.formatDate(latest.recordedAt) : '';
    },


    // Method to get student scoreboard data for the report card
    async getStudentScoreboardData(student) {
      try {
        let rows = [];
        const pre = this.gradeTermSummaryByStudent?.[student.studentId];
        if (Array.isArray(pre) && pre.length > 0) {
          rows = pre;
        } else {
          rows = await examService.getStudentTermSummary(
            student.studentId,
            this.selectedAcademicYear,
            this.selectedTerm
          );
        }
        console.log('📊 Term summary rows (ScoresEntry)', {
          studentId: student.studentId,
          academicYear: this.selectedAcademicYear,
          term: this.selectedTerm,
          rows
        });
        const rowsArr = Array.isArray(rows) ? rows : [];
        let subjects = rowsArr.map(r => {
          const avg = this.calculateTermAverage({
            test1Score: r.test1Score,
            midTermScore: r.midTermScore,
            test3Score: r.test3Score,
            endTermScore: r.endTermScore
          });
          return {
            subjectName: r.subjectName,
            test1Score: r.test1Score,
            midTermScore: r.midTermScore,
            test3Score: r.test3Score,
            endTermScore: r.endTermScore,
            termAverage: avg
          };
        });

        // Fallback enrichment: if some subjects are missing Test1/Test2, derive from raw scores with broader name matching
        const needsEnrichment = subjects.some(s => (s.test1Score || 0) === 0 || (s.midTermScore || 0) === 0);
        const shouldEnrich = rowsArr.length === 0 || needsEnrichment;
        if (shouldEnrich) {
          const raw = await examService.getStudentScores(
            student.studentId,
            this.selectedAcademicYear,
            this.selectedTerm
          );
          console.log('📄 Raw student scores (ScoresEntry) before enrichment', raw);
          const normalizeKind = (name) => {
            const n = String(name || '').toLowerCase();
            if (n === 'end-of-term') return 'end';
            if (n === 'test-two' || n === 'term-two') return 'mid';
            if (n === 'test-three' || n === 'test 3' || n === 'test-three ') return 'test3';
            if (n === 'test-one' || n === 'term-one') return 'test1';
            if (/\b(end\s*-?\s*of\s*-?\s*term|end\s*-?\s*term|endterm|final|eot)\b/.test(n)) return 'end';
            if (/\b(test\s*2|t2|second|2nd|assessment\s*2|mid\s*-?\s*term|midterm|mid)\b/.test(n)) return 'mid';
            if (/\b(test\s*3|t3|third|3rd|assessment\s*3)\b/.test(n)) return 'test3';
            if (/\b(test\s*1|t1|first|1st|assessment\s*1)\b/.test(n)) return 'test1';
            return '';
          };
          const bySubj = new Map(subjects.map(s => [s.subjectName, { ...s }]));
          const seenTypes = new Set();
          raw.forEach(rec => {
            const subj = rec.subjectName;
            if (!subj) return;
            const kind = normalizeKind(rec.examTypeName);
            seenTypes.add(String(rec.examTypeName));
            if (!kind) return;
            const val = rec.isAbsent ? 0 : (rec.score ?? 0);
            if (!bySubj.has(subj)) {
              bySubj.set(subj, { subjectName: subj, test1Score: 0, midTermScore: 0, test3Score: 0, endTermScore: 0, termAverage: 0 });
            }
            const obj = bySubj.get(subj);
            if (kind === 'test1' && (!obj.test1Score || obj.test1Score === 0)) obj.test1Score = val;
            if (kind === 'mid' && (!obj.midTermScore || obj.midTermScore === 0)) obj.midTermScore = val;
            if (kind === 'test3' && (!obj.test3Score || obj.test3Score === 0)) obj.test3Score = val;
            if (kind === 'end' && (!obj.endTermScore || obj.endTermScore === 0)) obj.endTermScore = val;
          });
          console.log('🔎 Detected exam type names (ScoresEntry):', Array.from(seenTypes));
          subjects = Array.from(bySubj.values()).map(rec => {
            const avg = this.calculateTermAverage({ test1Score: rec.test1Score, midTermScore: rec.midTermScore, test3Score: rec.test3Score, endTermScore: rec.endTermScore });
            return { ...rec, termAverage: avg };
          }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
          console.log('✅ Enriched subjects (ScoresEntry):', subjects);
        }
        return {
          studentName: student.studentName,
          gradeName: this.selectedAssignment?.gradeName || 'Unknown Grade',
          academicYear: this.selectedAcademicYear,
          term: this.selectedTerm,
          subjects,
          overallAverage: this.calculateOverallAverage(subjects)
        };
      } catch (error) {
        console.error('Error loading scoreboard data:', error);
        return null;
      }
    },

    // Calculate term average for a subject
    calculateTermAverage(score) {
      const test1 = score.test1Score || 0;
      const midTerm = score.midTermScore || 0;
      const test3 = score.test3Score || 0;
      const endTerm = score.endTermScore || 0;
      
      // Calculate average of all available scores
      const scores = this.isGrade7ForSelectedAssignment ? [test1, midTerm, test3, endTerm].filter(s => s > 0) : [test1, midTerm, endTerm].filter(s => s > 0);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    },

    // Calculate overall average for all subjects
    calculateOverallAverage(scoreboardData) {
      if (!scoreboardData || scoreboardData.length === 0) return 0;
      
      const totalAverage = scoreboardData.reduce((sum, subject) => sum + subject.termAverage, 0);
      return totalAverage / scoreboardData.length;
    },

    // Calculate grade based on average
    calculateGrade(average) {
      if (average >= 90) return 'A+';
      if (average >= 80) return 'A';
      if (average >= 70) return 'B+';
      if (average >= 60) return 'B';
      if (average >= 50) return 'C';
      if (average >= 40) return 'D';
      return 'F';
    },

    closeGeneralCommentDialog() {
      this.showGeneralCommentDialog = false;
      this.generalCommentStudent = null;
      this.generalCommentText = '';
      this.generalCommentLoading = false;
      this.scoreboardData = null;
    },

    clearGeneralComment() {
      this.generalCommentText = '';
    },

    async saveGeneralComment() {
      if ((this.isSecondaryClass || this.isBabyClass) && !this.isHomeroomForSelectedGrade) {
        this.showWarn('Only the homeroom teacher can save general comments for this class.');
        return;
      }
      if (!this.generalCommentStudent || !this.generalCommentText.trim()) {
        return;
      }

      this.generalCommentLoading = true;
      
      try {
        // First, try to get existing report card for this student
        let reportCardId = this.generalCommentStudent.reportCardId;
        
        if (!reportCardId) {
          try {
            // Try to get report cards for the entire class first
            const classReportCards = await reportService.getClassReportCardIds(
              this.selectedAssignment.gradeId,
              this.selectedAcademicYear,
              this.selectedTerm
            );
            
            // Find the report card for this specific student
            const studentReportCard = classReportCards.find(rc => 
              rc.studentName === this.generalCommentStudent.studentName
            );
            
            if (studentReportCard) {
              reportCardId = studentReportCard.id;
              this.generalCommentStudent.reportCardId = reportCardId;
            }
          } catch (error) {
            console.log('No existing report card found for class:', error);
            
            // Fallback: try individual student report cards
            try {
              const reportCards = await examService.getStudentReportCards(this.generalCommentStudent.studentId);
              const currentReportCard = reportCards.find(rc => 
                rc.academicYear === this.selectedAcademicYear && 
                rc.term === this.selectedTerm
              );
              
              if (currentReportCard) {
                reportCardId = currentReportCard.id;
                this.generalCommentStudent.reportCardId = reportCardId;
              }
            } catch (individualError) {
              console.log('No individual report card found:', individualError);
            }
          }
        }
        
        if (reportCardId) {
          // Use the proper general comment API
          await examService.updateGeneralComment(
            reportCardId,
            this.generalCommentText.trim()
          );
          
          this.showSuccess('General comment saved successfully!');
        } else {
          // Fallback: Show message that report card needs to be generated first
          this.showWarn('General comment cannot be saved yet. The report card for this student needs to be generated first by an administrator.');
          return;
        }
        
        // Update local student object
        this.generalCommentStudent.generalComment = this.generalCommentText.trim();
        this.closeGeneralCommentDialog();
      } catch (error) {
        console.error('Error saving general comment:', error);
        this.showError('Failed to save general comment. Please try again.');
      } finally {
        this.generalCommentLoading = false;
      }
    },

    // BabyClass skill assessment methods
    async selectSkill(skillId) {
      this.selectedSkillId = skillId;
      try {
        this.skillItems = await babyClassSkillService.getSkillItems(skillId);
      } catch (error) {
        console.error('Error loading skill items:', error);
        this.showError('Failed to load skill items');
      }
    },

    getSelectedSkillName() {
      const skill = this.babyClassSkills.find(s => s.id === this.selectedSkillId);
      return skill ? skill.name : '';
    },

    getSelectedSkillDescription() {
      const skill = this.babyClassSkills.find(s => s.id === this.selectedSkillId);
      return skill ? skill.description : '';
    },

    getSelectedSkillItems() {
      return this.skillItems || [];
    },

    getAssessmentStatus(studentId, skillItemId) {
      const assessment = this.getStudentAssessment(studentId, skillItemId);
      return assessment ? 'Assessed' : 'Not Assessed';
    },

    getAssessmentIcon(studentId, skillItemId) {
      const assessment = this.getStudentAssessment(studentId, skillItemId);
      return assessment ? 'pi pi-check' : 'pi pi-circle';
    },

    getAssessmentButtonClass(studentId, skillItemId) {
      const assessment = this.getStudentAssessment(studentId, skillItemId);
      return assessment ? 'p-button-success p-button-sm' : 'p-button-secondary p-button-sm';
    },

    getAssessmentLoading(studentId, skillItemId) {
      const key = `${studentId}_${skillItemId}`;
      return this.assessmentLoading[key] || false;
    },

    getAssessmentComment(studentId, skillItemId) {
      const assessment = this.getStudentAssessment(studentId, skillItemId);
      return assessment ? assessment.comment : '';
    },

    getStudentAssessment(studentId, skillItemId) {
      if (!this.studentAssessments[studentId]) return null;
      return this.studentAssessments[studentId][skillItemId] || null;
    },

    async toggleAssessment(student, skillItem) {
      const key = `${student.studentId}_${skillItem.id}`;
      this.assessmentLoading[key] = true;

      try {
        const assessment = this.getStudentAssessment(student.studentId, skillItem.id);
        
        if (assessment) {
          // Update existing assessment
          const updateData = {
            AssessmentId: assessment.assessmentId,
            TeacherComment: assessment.comment || ''
          };
          await babyClassSkillService.updateAssessment(updateData);
        } else {
          // Create new assessment
          const createData = {
            StudentId: student.studentId,
            SkillItemId: skillItem.id,
            AcademicYear: this.selectedAcademicYear,
            Term: this.selectedTerm,
            TeacherComment: ''
          };
          const result = await babyClassSkillService.createOrUpdateAssessment(createData);
          
          // Update local state
          if (!this.studentAssessments[student.studentId]) {
            this.studentAssessments[student.studentId] = {};
          }
          this.studentAssessments[student.studentId][skillItem.id] = {
            status: 'assessed',
            comment: '',
            assessmentId: result.Id
          };
        }
        
        this.showSuccess('Assessment updated successfully');
      } catch (error) {
        console.error('Error updating assessment:', error);
        this.showError('Failed to update assessment');
      } finally {
        this.assessmentLoading[key] = false;
      }
    },

    openCommentDialog(student, skillItem) {
      this.skillCommentDialog = {
        visible: true,
        student: student,
        skillItem: skillItem,
        comment: this.getAssessmentComment(student.studentId, skillItem.id) || ''
      };
    },

    async saveSkillComment() {
      if (!this.skillCommentDialog.student || !this.skillCommentDialog.skillItem) return;
      const key = `${this.skillCommentDialog.student.studentId}_${this.skillCommentDialog.skillItem.id}`;
      this.assessmentLoading[key] = true;
      try {
        const existing = this.getStudentAssessment(
          this.skillCommentDialog.student.studentId, 
          this.skillCommentDialog.skillItem.id
        );

        if (existing && existing.assessmentId) {
          const updateData = {
            AssessmentId: existing.assessmentId,
            TeacherComment: this.skillCommentDialog.comment
          };
          await babyClassSkillService.updateAssessment(updateData);
        } else {
          const createData = {
            StudentId: this.skillCommentDialog.student.studentId,
            SkillItemId: this.skillCommentDialog.skillItem.id,
            AcademicYear: this.selectedAcademicYear,
            Term: this.selectedTerm,
            TeacherComment: this.skillCommentDialog.comment
          };
          const result = await babyClassSkillService.createOrUpdateAssessment(createData);
          if (!this.studentAssessments[this.skillCommentDialog.student.studentId]) {
            this.studentAssessments[this.skillCommentDialog.student.studentId] = {};
          }
          this.studentAssessments[this.skillCommentDialog.student.studentId][this.skillCommentDialog.skillItem.id] = {
            status: 'assessed',
            comment: this.skillCommentDialog.comment,
            assessmentId: result.Id
          };
        }

        this.$toast.add({ severity: 'success', summary: 'Success', detail: 'Comment saved.', life: 3000 });
        this.skillCommentDialog.visible = false;
      } catch (error) {
        console.error('Error saving teacher comment:', error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save comment.', life: 5000 });
      } finally {
        this.assessmentLoading[key] = false;
      }
    },

    async exportSkillsReport() {
      if (!this.selectedAssignment || !this.selectedAcademicYear || !this.selectedTerm) {
        this.showWarn('Please select all required fields.');
        return;
      }

      try {
        const gradeId = this.selectedAssignment?.gradeId || (await this.resolveHomeroomGradeId());
        const academicYearId = this.selectedAcademicYear;
        const term = this.selectedTerm;

        // Get class assessments
        const assessments = await babyClassSkillService.getClassAssessments(gradeId, academicYearId, term);
        
        // Generate report (you can implement PDF generation here)
        console.log('Skills Report Data:', assessments);
        this.showSuccess('Skills report exported successfully!');
      } catch (error) {
        console.error('Error exporting skills report:', error);
        this.showError('Failed to export skills report. Please try again.');
      }
    },

    async resolveHomeroomGradeId() {
      try {
        const info = await homeroomService.getHomeroomGradeInfo()
        const data = info?.data ?? info
        return data?.gradeId ?? data?.id ?? null
      } catch (_) {
        return null
      }
    },

    // Existing methods remain the same but with BabyClass detection
    async loadStudentScores() {
      // For Baby Class, allow load with just Year/Term
      if (!this.canLoadStudents && !this.isBabyMode) {
        this.showError('Please select all required fields before loading students')
        return
      }
 
       try {
         this.loadingScores = true
         this.students = []
         this.originalStudents = []
         this.pendingChanges = []
 
         // Determine gradeId for Baby Class via homeroom when assignment is not selected
         const gradeId = this.isBabyMode
           ? (this.selectedAssignment?.gradeId || (await this.resolveHomeroomGradeId()))
           : this.selectedAssignment.gradeId
 
         if (!gradeId) {
           // If gradeId still not found, show a friendly warning and return silently
           this.showWarn('Could not determine your homeroom grade. Please try again or contact admin.')
           return
         }
 
         // Ensure Baby Class skill items are loaded (to compute completion status)
         if (this.isBabyMode) {
           await this.loadBabySkillItemsIfNeeded()
         }
 
         const gradeStudents = await examService.getStudentsByGrade(gradeId)
 
         if (gradeStudents.length === 0) {
           this.showInfo('No students found in the selected grade')
           // Secondary classes: show guidance toast to contact homeroom teacher/admin
          if (this.isSecondaryClass) {
            let homeroomName = 'Homeroom Teacher'
            try {
              // Prefer precise grade info to get homeroom teacher name
              const grade = await gradeService.getById(this.selectedAssignment.gradeId)
              const g = grade?.data ?? grade
              homeroomName = g?.homeroomTeacherName || g?.HomeroomTeacherName || homeroomName
            } catch (_) {
              try {
                // Fallback to homeroom grade info if accessible
                const info = await homeroomService.getHomeroomGradeInfo()
                const data = info?.data ?? info
                homeroomName = data?.homeroomTeacherName || data?.homeroomTeacher || homeroomName
              } catch (_) {}
            }
             this.$toast.add({
               severity: 'warn',
               summary: 'No students assigned',
               detail: `Contact admin or ${homeroomName} to assign students to your subject for this class.`,
               life: 8000
             })
           }
           return
         }
 
         if (this.isBabyMode) {
           // Load skill assessments for BabyClass
           await this.loadBabyClassAssessments(gradeStudents, gradeId);
           // Load general comment presence for Baby Class students (does not block UI)
           try { await this.loadBabyGeneralCommentsForClass(gradeId) } catch (_) {}
           // Debug: inspect target student's completion state
           this.debugBabyStudentByName(this.babyDebugTargetName)
         } else {
         // Load regular scores for other grades
         // Also prefetch class-wide term summary for quick per-student scoreboards
         try {
           const clsSummary = await examService.getGradeTermSummary(
             this.selectedAssignment.gradeId,
             this.selectedAcademicYear,
             this.selectedTerm
           )
           const grouped = {}
           if (Array.isArray(clsSummary)) {
             for (const r of clsSummary) {
               const sid = r.studentId
               if (!grouped[sid]) grouped[sid] = []
               grouped[sid].push(r)
             }
           }
           this.gradeTermSummaryByStudent = grouped
         } catch (_) {
           this.gradeTermSummaryByStudent = {}
         }

          const scores = await examService.getGradeScores(
            this.selectedAssignment.gradeId,
            this.selectedAcademicYear,
            this.selectedTerm
          )

          const relevantScores = scores.filter(score =>
            score.subjectId === this.selectedAssignment.subjectId &&
            score.examTypeId === this.selectedExamType
          )

          // For secondary classes, filter students to only those enrolled in the selected subject
          let enrolledIdSet = null;
          if (this.isSecondaryClass) {
            try {
              const checks = await Promise.all(
                gradeStudents.map(async s => {
                  try {
                    const subs = await secondarySubjectService.getStudentSubjects(s.id);
                    const list = Array.isArray(subs) ? subs : (subs?.data ?? []);
                    const enrolled = list.some(sub => (sub.subjectId ?? sub.id) === this.selectedAssignment.subjectId);
                    return { id: s.id, enrolled };
                  } catch (_) {
                    return { id: s.id, enrolled: false };
                  }
                })
              );
              enrolledIdSet = new Set(checks.filter(c => c.enrolled).map(c => c.id));
            } catch (e) {
              // If enrollment check fails, fall back to showing all
              enrolledIdSet = null;
            }
          }

          this.students = gradeStudents
            .filter(s => !this.isSecondaryClass || (enrolledIdSet ? enrolledIdSet.has(s.id) : true))
            .map(student => {
            const existingScore = relevantScores.find(score => score.studentId === student.id)
            return {
              studentId: student.id,
              studentName: student.fullName,
              studentNumber: student.studentNumber,
              currentScore: existingScore ? existingScore.score : null,
              scoreId: existingScore ? existingScore.id : null,
              isAbsent: existingScore ? existingScore.isAbsent : false,
              lastUpdated: existingScore ? existingScore.recordedAt : null,
              recordedBy: existingScore ? existingScore.recordedByName : null,
              comments: existingScore ? existingScore.comments : null,
              commentsUpdatedAt: existingScore ? existingScore.commentsUpdatedAt : null,
              commentsUpdatedBy: existingScore ? existingScore.commentsUpdatedByName : null,
              toggleLoading: false
            }
            })

          // If secondary class filtering resulted in zero students, show guidance toast
          if (this.isSecondaryClass && this.students.length === 0) {
            let homeroomName = 'Homeroom Teacher'
            try {
              const grade = await gradeService.getById(this.selectedAssignment.gradeId)
              const g = grade?.data ?? grade
              homeroomName = g?.homeroomTeacherName || g?.HomeroomTeacherName || homeroomName
            } catch (_) {
              try {
                const info = await homeroomService.getHomeroomGradeInfo()
                const data = info?.data ?? info
                homeroomName = data?.homeroomTeacherName || data?.homeroomTeacher || homeroomName
              } catch (_) {}
            }
            this.$toast.add({
              severity: 'warn',
              summary: 'No students assigned',
              detail: `Contact admin or ${homeroomName} to assign students to your subject for this class.`,
              life: 8000
            })
          }
        }

        this.students.sort((a, b) => a.studentName.localeCompare(b.studentName))
        this.originalStudents = JSON.parse(JSON.stringify(this.students))
        
        // Load general comments for End-of-Term exams and Baby Class
        if (this.selectedExamType === 4) {
          this.loadingComments = true
          try {
            await this.loadGeneralCommentsForStudents()
          } finally {
            this.loadingComments = false
          }
        }
        
        this.showSuccess(`Loaded ${this.students.length} students`)

      } catch (error) {
        console.error('Failed to load student scores:', error)
        this.showError('Failed to load student scores')
      } finally {
        this.loadingScores = false
      }
    },

    async loadBabyClassAssessments(gradeStudents, gradeId) {
      try {
        // Load all skill assessments for the class
        const classAssessmentsResp = await babyClassSkillService.getClassAssessments(
          gradeId,
          this.selectedAcademicYear,
          this.selectedTerm
        );
        const classAssessments = classAssessmentsResp?.data ?? classAssessmentsResp ?? [];

        // Process assessments into student data
        this.students = gradeStudents.map(student => {
          return {
            studentId: student.id,
            studentName: student.fullName,
            studentNumber: student.studentNumber,
            isAbsent: false, // BabyClass doesn't use absent status
            toggleLoading: false
          };
        });

        // Normalize to a per-student array of assessments
        // Two possible shapes:
        // 1) Grouped: [{ StudentId, StudentName, Assessments: [{ StudentId, SkillItemId, ...}, ...] }, ...]
        // 2) Flat:    [{ StudentId, SkillItemId, ... }, ...]
        if (Array.isArray(classAssessments) && classAssessments.length > 0 && (classAssessments[0].Assessments || classAssessments[0].assessments)) {
          // Grouped shape
          classAssessments.forEach(group => {
            const sid = group.StudentId ?? group.studentId;
            const arr = group.Assessments ?? group.assessments ?? [];
            if (sid == null) return;
            if (!this.studentAssessments[sid]) this.studentAssessments[sid] = {};
            arr.forEach(a => {
              const itemId = a.SkillItemId ?? a.skillItemId ?? a.SkillItemID ?? a.skillItemID;
              const comment = a.TeacherComment ?? a.teacherComment ?? '';
              const aId = a.Id ?? a.id;
              if (itemId == null) return;
              this.studentAssessments[sid][itemId] = {
                status: 'assessed',
                comment: comment,
                assessmentId: aId
              };
            });
          });
        } else {
          // Flat shape
          classAssessments.forEach(assessment => {
            const sid = assessment.StudentId ?? assessment.studentId ?? assessment.StudentID ?? assessment.studentID;
            const itemId = assessment.SkillItemId ?? assessment.skillItemId ?? assessment.SkillItemID ?? assessment.skillItemID;
            const comment = assessment.TeacherComment ?? assessment.teacherComment ?? '';
            const aId = assessment.Id ?? assessment.id;
            if (sid == null || itemId == null) return;
            if (!this.studentAssessments[sid]) {
              this.studentAssessments[sid] = {};
            }
            this.studentAssessments[sid][itemId] = {
              status: 'assessed',
              comment: comment,
              assessmentId: aId
            };
          });
        }

        // Debug: verify target student's mapped assessments count
        try {
          const tgt = this.students.find(s => String(s.studentName || '').toLowerCase().includes(String(this.babyDebugTargetName || '').toLowerCase()))
          if (tgt) {
            const m = this.studentAssessments[tgt.studentId] || {}
            console.log('[DEBUG][BabyClass] mapped assessments for', tgt.studentName, '→ keys:', Object.keys(m).length, 'ids:', Object.keys(m))
          }
        } catch (_) {}

      } catch (error) {
        console.error('Error loading BabyClass assessments (continuing with student list only):', error);
        // Fall back to showing students even if assessments fail to load
        this.students = gradeStudents.map(student => ({
          studentId: student.id,
          studentName: student.fullName,
          studentNumber: student.studentNumber,
          isAbsent: false,
          toggleLoading: false
        }));
        // Do NOT throw; allow UI to render
      }
    },

    // All existing methods remain the same...
    // (I'll include the key existing methods in the next part)
  // Absent management methods
    async toggleAbsentStatus(student) {
      if (student.toggleLoading) return;
      
      student.toggleLoading = true;
      
      try {
        let response;
        
        // If no scoreId exists, we need to create a score record first
        if (!student.scoreId) {
          console.log('No scoreId found, creating score record first');
          
          // Create initial score record
          const scoreData = {
            studentId: student.studentId,
            subjectId: this.selectedAssignment.subjectId,
            examTypeId: this.selectedExamType,
            academicYear: this.selectedAcademicYear,
            term: this.selectedTerm,
            score: 0, // Default score for new absent student
            isAbsent: !student.isAbsent, // Toggle the current status
            gradeId: this.selectedAssignment.gradeId,
            comments: '',
          };
          
          const createResponse = await examService.submitScore(scoreData);
          
          // Update student with new scoreId and absent status
          student.scoreId = createResponse.id;
          student.isAbsent = createResponse.isAbsent;
          student.currentScore = createResponse.score;
          student.lastUpdated = createResponse.recordedAt;
          student.recordedBy = createResponse.recordedByName;
          
          response = createResponse;
        } else {
          try {
            // Score exists, use toggle API
            response = await examService.toggleAbsentStatus(student.scoreId, student.isAbsent);
            
            // Update the student data
            student.isAbsent = response.isAbsent;
            student.currentScore = response.score;
            student.lastUpdated = response.recordedAt;
            student.recordedBy = response.recordedByName;
          } catch (toggleError) {
            // If toggle fails with 404, the score record might have been deleted
            // Fall back to creating a new score record
            if (toggleError.response && toggleError.response.status === 404) {
              console.log('Score record not found, creating new score record');
              
              const scoreData = {
                studentId: student.studentId,
                subjectId: this.selectedAssignment.subjectId,
                examTypeId: this.selectedExamType,
                academicYear: this.selectedAcademicYear,
                term: this.selectedTerm,
                score: 0,
                isAbsent: !student.isAbsent, // Toggle the current status
                gradeId: this.selectedAssignment.gradeId,
                comments: '',
              };
              
              const createResponse = await examService.submitScore(scoreData);
              
              // Update student with new scoreId and absent status
              student.scoreId = createResponse.id;
              student.isAbsent = createResponse.isAbsent;
              student.currentScore = createResponse.score;
              student.lastUpdated = createResponse.recordedAt;
              student.recordedBy = createResponse.recordedByName;
              
              response = createResponse;
            } else {
              // Re-throw other errors
              throw toggleError;
            }
          }
        }
        
        // Update original data to reflect the change
        const originalIndex = this.originalStudents.findIndex(s => s.studentId === student.studentId);
        if (originalIndex !== -1) {
          this.originalStudents[originalIndex].isAbsent = response.isAbsent;
          this.originalStudents[originalIndex].currentScore = response.score;
          this.originalStudents[originalIndex].scoreId = student.scoreId;
        }
        
        this.showSuccess(`Student marked as ${response.isAbsent ? 'absent' : 'present'}`);
      } catch (error) {
        console.error('Error toggling absent status:', error);
        this.showError('Failed to update absent status');
      } finally {
        student.toggleLoading = false;
      }
    },

    async bulkMarkAbsent(isAbsent) {
      if (this.selectedStudents.length === 0) return;
      
      this.bulkAbsentLoading = true;
      
      try {
        const studentIds = this.selectedStudents.map(s => s.studentId);
        
        const response = await examService.bulkMarkAbsent({
          StudentIds: studentIds,
          SubjectId: this.selectedAssignment.subjectId,
          ExamTypeId: this.selectedExamType,
          AcademicYear: this.selectedAcademicYear,
          Term: this.selectedTerm,
          IsAbsent: isAbsent
        });
        
        // Update local data
        this.students.forEach(student => {
          if (studentIds.includes(student.studentId)) {
            student.isAbsent = isAbsent;
            if (isAbsent) {
              student.currentScore = 0;
            }
          }
        });
        
        // Update original data
        this.originalStudents.forEach(student => {
          if (studentIds.includes(student.studentId)) {
            student.isAbsent = isAbsent;
            if (isAbsent) {
              student.currentScore = 0;
            }
          }
        });
        
        this.selectedStudents = [];
        this.showBulkAbsentDialog = false;
        this.showSuccess(response.Message || `Successfully marked ${studentIds.length} students as ${isAbsent ? 'absent' : 'present'}`);
      } catch (error) {
        console.error('Error bulk marking absent:', error);
        this.showError('Failed to bulk update absent status');
      } finally {
        this.bulkAbsentLoading = false;
      }
    },

    selectAllStudents() {
      this.selectedStudents = [...this.students];
    },

    clearStudentSelection() {
      this.selectedStudents = [];
    },

    toggleDialogAbsent(subjectId) {
      if (this.dialogStudentScores[subjectId]) {
        this.dialogStudentScores[subjectId].isAbsent = !this.dialogStudentScores[subjectId].isAbsent;
        
        // Set score to 0 if marking as absent
        if (this.dialogStudentScores[subjectId].isAbsent) {
          this.dialogStudentScores[subjectId].score = 0;
        }
      }
    },

    handleResize() {
      this.isMobile = window.innerWidth < 768
    },

    openEditNameDialog(student) {
      this.editName.student = student;
      const parts = (student.studentName || '').split(' ');
      this.editName.firstName = parts[0] || '';
      this.editName.lastName = parts.slice(1).join(' ') || '';
      this.editName.middleName = '';
      this.editName.visible = true;
    },

    async saveEditedName() {
      if (!this.editName.student || !this.isEditNameValid) return;
      this.editName.saving = true;
      try {
        const resp = await homeroomService.updateStudentName(this.editName.student.studentId, {
          firstName: this.editName.firstName,
          middleName: this.editName.middleName,
          lastName: this.editName.lastName
        });
        // Normalize response wrapper { success, data }
        const updated = resp?.data || resp;
        const fullName = updated?.fullName || `${this.editName.firstName} ${this.editName.lastName}`.trim();
        
        // Update local student data
        this.editName.student.studentName = fullName;
        
        // Update in students array
        const studentIndex = this.students.findIndex(s => s.studentId === this.editName.student.studentId);
        if (studentIndex !== -1) {
          this.students[studentIndex].studentName = fullName;
        }
        
        // Update in originalStudents array
        const originalIndex = this.originalStudents.findIndex(s => s.studentId === this.editName.student.studentId);
        if (originalIndex !== -1) {
          this.originalStudents[originalIndex].studentName = fullName;
        }
        
        this.showSuccess('Name updated successfully');
        this.editName.visible = false;
      } catch (e) {
        console.error('Error updating student name:', e);
        this.showError('Failed to update name. ' + (e.message || ''));
      } finally {
        this.editName.saving = false;
      }
    },

    async saveSingleChange(change) {
      const scoreData = {
        ...change,
        studentId: change.studentId,
        subjecId: change.subjectId,
        examTypeId: change.examTypeId,
        academicYearId: change.academicYear,
        term: change.term,
        score: change.score,
        isAbsent: change.isAbsent || false,
        gradeId: this.selectedAssignment.gradeId,
        comments: change.comments || '',
      };
      return await examService.submitScore(scoreData);
    },

    onRowEditSave(event) {
      const { newData, index } = event
      if (this.saving) {
        this.showInfo('Please wait for current save to complete')
        return
      }
      this.students[index] = { ...newData }
      const student = this.students[index]
      const originalStudent = this.originalStudents[index]
      const scoreChanged = student.currentScore !== originalStudent.currentScore
      const commentsChanged = student.comments !== originalStudent.comments
      const absentChanged = student.isAbsent !== originalStudent.isAbsent

      if (scoreChanged || commentsChanged || absentChanged) {
        const pendingChange = {
          studentId: student.studentId,
          subjectId: this.selectedAssignment.subjectId,
          examTypeId: this.selectedExamType,
          score: student.currentScore,
          isAbsent: student.isAbsent,
          academicYear: this.selectedAcademicYear,
          term: this.selectedTerm,
          comments: student.comments || ''
        }
        this.pendingChanges = this.pendingChanges.filter(change => change.studentId !== student.studentId)
        this.pendingChanges.push(pendingChange)
        this.scheduleAutoSave()
      } else {
        this.pendingChanges = this.pendingChanges.filter(change => change.studentId !== student.studentId)
      }
    },

    async onRowClick(event) {
      const student = event.data;
      this.selectedStudent = student;

      // 1. Get all subjects for the grade
      const gradeId = this.selectedAssignment.gradeId;
      let subjects = [];
      if (this.teacherAssignments && this.teacherAssignments.length > 0) {
        const subjectMap = {};
        this.teacherAssignments.forEach(a => {
          if (a.gradeId === gradeId && !subjectMap[a.subjectId]) {
            subjects.push({ id: a.subjectId, name: a.subjectName });
            subjectMap[a.subjectId] = true;
          }
        });
      }
      this.dialogSubjects = subjects;

      // 2. Get all scores for this student, examType, term, academicYear
      const scores = await examService.getStudentScores(
        student.studentId,
        this.selectedAcademicYear,
        this.selectedTerm
      );

      // 3. Build dialogStudentScores: { [subjectId]: { score, comments, scoreId, isAbsent } }
      this.dialogStudentScores = {};
      subjects.forEach(subject => {
        const s = scores.find(
          sc =>
            sc.subjectId === subject.id &&
            sc.examTypeId === this.selectedExamType
        );
        this.dialogStudentScores[subject.id] = {
          score: s ? s.score : null,
          comments: s ? s.comments : '',
          scoreId: s ? s.id : null,
          isAbsent: s ? s.isAbsent : false
        };
      });

      // 4. Save original for change detection
      this.dialogOriginalScores = JSON.parse(JSON.stringify(this.dialogStudentScores));
      this.showStudentDialog = true;
    },

    async onDialogSave() {
      if (!this.selectedStudent) return;
      const studentId = this.selectedStudent.studentId;
      const academicYear = this.selectedAcademicYear;
      const term = this.selectedTerm;
      const examTypeId = this.selectedExamType;
      const gradeId = this.selectedAssignment.gradeId;

      // For each subject, if changed, add to pendingChanges and update students array
      for (const subject of this.dialogSubjects) {
        const orig = this.dialogOriginalScores[subject.id];
        const curr = this.dialogStudentScores[subject.id];
        if (
          curr.score !== orig.score ||
          curr.comments !== orig.comments ||
          curr.isAbsent !== orig.isAbsent
        ) {
          // Update students array if this is the current subject
          if (subject.id === this.selectedAssignment.subjectId) {
            const idx = this.students.findIndex(s => s.studentId === studentId);
            if (idx !== -1) {
              this.students[idx].currentScore = curr.score;
              this.students[idx].isAbsent = curr.isAbsent;
              if ('comments' in this.students[idx]) {
                this.students[idx].comments = curr.comments;
              }
            }
          }
          // Add to pendingChanges (replace if exists)
          this.pendingChanges = this.pendingChanges.filter(
            ch =>
              !(
                ch.studentId === studentId &&
                ch.subjectId === subject.id &&
                ch.examTypeId === examTypeId &&
                ch.academicYear === academicYear &&
                ch.term === term
              )
          );
          this.pendingChanges.push({
            studentId,
            subjectId: subject.id,
            examTypeId,
            score: curr.score,
            isAbsent: curr.isAbsent,
            academicYear,
            term,
            comments: curr.comments || '',
            gradeId
          });
        }
      }
      this.scheduleAutoSave();
      this.showStudentDialog = false;
      this.selectedStudent = null;
      this.dialogSubjects = [];
      this.dialogStudentScores = {};
      this.dialogOriginalScores = {};
    },

    async initializeData() {
      try {
        await Promise.all([
          this.loadTeacherAssignments(),
          this.loadAcademicYears(),
          this.loadExamTypes()
        ])

        if (this.academicYears.length > 0) {
          const currentYear = this.academicYears.find(y => y.isActive && !y.isClosed)
          this.selectedAcademicYear = currentYear ? currentYear.id : this.academicYears[0].id
        }
        if (this.terms.length > 0) {
          this.selectedTerm = this.terms[0].id
        }

        // Prompt Baby Class teachers to pick term/year quickly
        this.maybeShowBabyClassQuickSelect()
      } catch (error) {
        this.showError('Failed to initialize data. Please refresh the page.')
      }
    },

    async loadTeacherAssignments() {
      try {
        this.loadingAssignments = true
        if (this.isDevelopment) {
          try {
            const debugResult = await examService.debugAuth()
            console.log('🔍 Auth Debug Result:', debugResult)
          } catch (debugError) {
            console.warn('⚠️ Debug endpoint failed:', debugError.message)
          }
        }
        const assignments = await examService.getTeacherAssignments()
        console.log('🔍 All teacher assignments:', assignments);
        this.teacherAssignments = assignments.map(assignment => ({
          ...assignment,
          displayName: `${assignment.subjectName} - ${assignment.gradeName}`
        }))
        console.log('🔍 Mapped teacher assignments:', this.teacherAssignments);

        this.autoSelectBabyClassAssignment()
        // Ensure homeroom status is evaluated once an assignment is available
        if (this.selectedAssignment) {
          await this.checkHomeroomForSelectedGrade()
        }

        // Update Baby mode if assignment indicates Baby Class
        if (this.isBabyClass) {
          this.isBabyMode = true
        }

        // Prompt Baby Class teachers to pick term/year quickly after assignments load
        this.maybeShowBabyClassQuickSelect()

        // If no assignments, remain silent (no toast)
      } catch (error) {
        const msg = (error?.message || '').toLowerCase()
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('session expired')) {
          this.showError('Authentication required. Please log in again.')
        } else if (msg.includes('network error')) {
          this.showError('Cannot connect to server. Please check if the backend is running.')
        } else {
          // Suppress toasts for 403/permission or no-assignments scenarios
          console.warn('Assignments not available yet or insufficient permissions:', error)
        }
      } finally {
        this.loadingAssignments = false
      }
    },

    async loadAcademicYears() {
      try {
        this.loadingYears = true
        this.academicYears = await examService.getAcademicYears()
      } catch (error) {
        if (error.message.includes('Network error')) {
          this.showError('Cannot connect to server. Please check if the backend is running.')
        } else {
          this.showError('Failed to load academic years')
        }
      } finally {
        this.loadingYears = false
      }
    },

    async loadExamTypes() {
      try {
        this.loadingExamTypes = true
        this.examTypes = await examService.getExamTypes()
      } catch (error) {
        if (error.message.includes('Network error')) {
          this.showError('Cannot connect to server. Please check if the backend is running.')
        } else {
          this.showError('Failed to load exam types')
        }
      } finally {
        this.loadingExamTypes = false
      }
    },

    async onAssignmentChange() {
      this.students = []
      this.originalStudents = []
      this.pendingChanges = []
      await this.checkHomeroomForSelectedGrade()
    },

    async onFiltersChange() {
      this.students = []
      this.originalStudents = []
      this.pendingChanges = []
      if (this.selectedAssignment) {
        await this.checkHomeroomForSelectedGrade()
      }
    },

    scheduleAutoSave() {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout)
      }
      this.autoSaveTimeout = setTimeout(async () => {
        if (this.hasUnsavedChanges && !this.saving) {
          try {
            await this.saveAllChanges(true)
            this.showSuccess('Changes auto-saved. ZESCO got nothing on you!', 5000)
          } catch (error) {
            this.showError('Auto-save failed - please save manually')
          }
        }
      }, 2000)
    },

    onRowEditCancel(event) {
      const { index } = event
      const student = this.students[index]
      this.pendingChanges = this.pendingChanges.filter(change => change.studentId !== student.studentId)
      if (this.pendingChanges.length === 0 && this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout)
        this.autoSaveTimeout = null
      }
      this.students[index] = { ...this.originalStudents[index] }
    },

    async saveChangesManually() {
      if (!this.hasUnsavedChanges) {
        this.showInfo('No changes to save')
        return
      }
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout)
        this.autoSaveTimeout = null
      }
      await this.saveAllChanges(false)
    },

    async saveAllChanges() {
      if (this.pendingChanges.length === 0) return;
      if (!this.selectedAssignment) {
        this.showError('Please select a subject and grade before saving scores.');
        return;
      }
      if (!this.selectedExamType) {
        this.showError('Please select an exam type before saving scores.');
        return;
      }
      if (!this.selectedAcademicYear) {
        this.showError('Please select an academic year before saving scores.');
        return;
      }
      if (!this.selectedTerm) {
        this.showError('Please select a term before saving scores.');
        return;
      }
      try {
        this.saving = true;
        const promises = this.pendingChanges.map(async change => {
          const scoreData = {
            ...change,
            studentId: change.studentId,
            subjectId: change.subjectId,
            examTypeId: this.selectedExamType,
            academicYearId: this.selectedAcademicYear,
            term: this.selectedTerm,
            score: change.score,
            isAbsent: change.isAbsent || false,
            gradeId: this.selectedAssignment.gradeId,
            comments: change.comments || '',
          };
          return examService.submitScore(scoreData);
        });
        const results = await Promise.all(promises);
        this.updateStudentsWithSavedData(results);
        this.pendingChanges = [];
        this.originalStudents = JSON.parse(JSON.stringify(this.students));
        this.showSuccess(`Successfully saved ${results.length} score(s)`);
      } catch (error) {
        this.showError('Failed to save scores. Please try again.');
      } finally {
        this.saving = false;
      }
    },

    updateStudentsWithSavedData(savedScores) {
      savedScores.forEach(savedScore => {
        if (savedScore.subjectId === this.selectedAssignment.subjectId) {
          const studentIndex = this.students.findIndex(s => s.studentId === savedScore.studentId)
          if (studentIndex !== -1) {
            this.students[studentIndex] = {
              ...this.students[studentIndex],
              scoreId: savedScore.id,
              lastUpdated: savedScore.recordedAt,
              recordedBy: savedScore.recordedByName,
              commentsUpdatedAt: savedScore.commentsUpdatedAt,
              commentsUpdatedBy: savedScore.commentsUpdatedByName,
              currentScore: savedScore.score,
              isAbsent: savedScore.isAbsent,
              comments: savedScore.comments
            }
          }
        }
      })
    },

    handleVisibilityChange() {
      if (document.hidden && this.hasUnsavedChanges && !this.saving) {
        this.saveAllChanges(true)
      }
    },

    resetChanges() {
      this.$confirm.require({
        message: 'Are you sure you want to reset all unsaved changes?',
        header: 'Reset Changes',
        icon: 'pi pi-info-circle',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: () => {
          if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout)
            this.autoSaveTimeout = null
          }
          this.students = JSON.parse(JSON.stringify(this.originalStudents))
          this.pendingChanges = []
          this.showInfo('All changes have been reset')
        }
      })
    },

    async exportMarkSchedulePdf() {
      if (!this.selectedAssignment || !this.selectedAcademicYear || !this.selectedTerm || !this.selectedExamType) {
        this.showWarn('Please select all required fields.');
        return;
      }

      try {
        const gradeId = this.selectedAssignment.gradeId;
        const academicYearId = this.selectedAcademicYear;
        const term = this.selectedTerm;
        const examTypeObj = this.examTypes.find(e => e.id === this.selectedExamType);
        const examTypeName = examTypeObj ? examTypeObj.name : '';

        const pdfBlob = await markScheduleService.getMarkSchedulePdfForGrade(gradeId, academicYearId, term, examTypeName);
        
        if (pdfBlob.type === 'application/json') {
          const errorText = await pdfBlob.text();
          console.error('Backend error response:', errorText);
          this.showError('No scores found for this grade, academic year, term, and exam type. Please ensure you have entered and saved scores before exporting.');
          return;
        }
        
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MarkSchedule_${this.selectedAssignment.gradeName}_Year${academicYearId}_Term${term}_${examTypeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.showSuccess('Mark Schedule PDF exported successfully!');
      } catch (error) {
        console.error('Error exporting PDF:', error);
        if (!(error && error.message && error.message.includes('No scores found for this grade'))) {
          this.showError('Failed to export Mark Schedule PDF. Please try again.');
        }
      }
    },

    viewComment(student) {
      this.commentDialog.student = student
      this.commentDialog.visible = true
    },

    getInitials(name) {
      if (!name) return '??'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    },

    getScoreSeverity(score) {
      if (score >= 80) return 'success'
      if (score >= 70) return 'info'
      if (score >= 60) return 'warning'
      return 'danger'
    },

    getScoreSeverityClass(score) {
      if (score >= 80) return 'bg-green-100 text-green-800';
      if (score >= 70) return 'bg-blue-100 text-blue-800';
      if (score >= 60) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const utcDate = new Date(dateString)
      const zambiaTime = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000))
      const day = zambiaTime.getUTCDate()
      const month = zambiaTime.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
      const hours = zambiaTime.getUTCHours().toString().padStart(2, '0')
      const minutes = zambiaTime.getUTCMinutes().toString().padStart(2, '0')
      return `${month} ${day}, ${hours}:${minutes} hrs`
    },

    showSuccess(message, duration = 3000) {
      this.$toast.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: duration
      })
    },

    showError(message) {
      this.$toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
    },

    showInfo(message) {
      this.$toast.add({
        severity: 'info',
        summary: 'Info',
        detail: message,
        life: 4000
      })
    },

    showWarn(message) {
      this.$toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: message,
        life: 4000
      })
    },

    async onMobileScoreEdit(idx) {
      const student = this.students[idx];
      const originalStudent = this.originalStudents[idx];
      const scoreChanged = student.currentScore !== originalStudent.currentScore;
      const commentsChanged = student.comments !== originalStudent.comments;
      const absentChanged = student.isAbsent !== originalStudent.isAbsent;

      this.mobileSaveStatus[student.studentId] = 'saving';

      if (scoreChanged || commentsChanged || absentChanged) {
        const pendingChange = {
          studentId: student.studentId,
          subjectId: this.selectedAssignment.subjectId,
          examTypeId: this.selectedExamType,
          score: student.currentScore,
          isAbsent: student.isAbsent,
          academicYear: this.selectedAcademicYear,
          term: this.selectedTerm,
          comments: student.comments || ''
        };

        this.pendingChanges = this.pendingChanges.filter(change => change.studentId !== student.studentId);
        this.pendingChanges.push(pendingChange);

        try {
          this.saving = true;
          const result = await this.$options.methods.saveSingleChange.call(this, pendingChange);
          this.originalStudents[idx] = { ...student };
          this.pendingChanges = this.pendingChanges.filter(change => change.studentId !== student.studentId);
          this.mobileSaveStatus[student.studentId] = 'saved';
          setTimeout(() => {
            if (this.mobileSaveStatus[student.studentId] === 'saved') {
              this.mobileSaveStatus[student.studentId] = 'idle';
            }
          }, 1500);
          this.showSuccess('Score saved!');
        } catch (e) {
          this.mobileSaveStatus[student.studentId] = 'error';
          this.showError('Failed to save score');
        } finally {
          this.saving = false;
        }
      } else {
        this.mobileSaveStatus[student.studentId] = 'idle';
      }
    },

    onDialogCancel() {
      this.showStudentDialog = false;
      this.selectedStudent = null;
      this.dialogSubjects = [];
      this.dialogStudentScores = {};
      this.dialogOriginalScores = {};
    },

    getExamTypeName(typeId) {
      const found = this.examTypes.find(e => e.id === typeId);
      return found ? found.name : '';
    },
    
    getTermName(termId) {
      const found = this.terms.find(t => t.id === termId);
      return found ? found.name : '';
    },
    
    getAcademicYearNameById(id) {
      const year = this.academicYears.find(y => y.id === id);
      return year ? year.name : id;
    },

    openStudentAssessmentDialog(student) {
      this.studentAssessmentDialog = {
        visible: true,
        student: student,
        loading: true,
        saving: false,
        skills: [], // [{ id, name, description, skillItems: [{id, name, description}] }]
        assessments: {}, // { [skillItemId]: comment }
        generalComment: '',
        reportCardId: null
      };
      this.loadStudentAssessments(student);
    },

    async loadStudentAssessments(student) {
      try {
        this.studentAssessmentDialog.loading = true;
        // Load all skills
        const skillsResponse = await babyClassSkillService.getAllSkills();
        const skills = Array.isArray(skillsResponse) ? skillsResponse : (skillsResponse?.data ?? []);
        // Load items for each skill in parallel
        const skillItemsBySkill = await Promise.all(
          skills.map(async (s) => {
            try {
              const items = await babyClassSkillService.getSkillItems(s.id);
              return { skillId: s.id, items: Array.isArray(items) ? items : (items?.data ?? []) };
            } catch (_) {
              return { skillId: s.id, items: [] };
            }
          })
        );
        const itemsMap = new Map(skillItemsBySkill.map(x => [x.skillId, x.items]));
        this.studentAssessmentDialog.skills = skills.map(s => ({ ...s, skillItems: itemsMap.get(s.id) || [] }));

        // Initialize per-item assessments to empty
        this.studentAssessmentDialog.assessments = {};
        this.studentAssessmentDialog.skills.forEach(skill => {
          (skill.skillItems || []).forEach(item => {
            this.studentAssessmentDialog.assessments[item.id] = '';
          });
        });

        // Load existing assessments for student/year/term
        const existingResp = await babyClassSkillService.getStudentAssessments(
          student.studentId,
          this.selectedAcademicYear,
          this.selectedTerm
        );
        const existing = Array.isArray(existingResp) ? existingResp : (existingResp?.data ?? []);
        existing.forEach(a => {
          const key = a.SkillItemId ?? a.skillItemId;
          const comment = a.TeacherComment ?? a.teacherComment ?? '';
          if (key != null) this.studentAssessmentDialog.assessments[key] = comment;
        });

        // Resolve report card id for general comment (do not generate at load time)
        this.studentAssessmentDialog.reportCardId = await this.resolveReportCardIdForStudent(student, false);

        // Load general comment if report card id is available
        if (this.studentAssessmentDialog.reportCardId) {
          try {
            const gc = await examService.getGeneralComment(this.studentAssessmentDialog.reportCardId);
            this.studentAssessmentDialog.generalComment = typeof gc === 'string' ? gc : (gc?.comment || '');
          } catch (_) {
            this.studentAssessmentDialog.generalComment = '';
          }
        } else {
          this.studentAssessmentDialog.generalComment = '';
        }
        this.studentAssessmentDialog.loading = false;
      } catch (error) {
        console.error('Error loading student assessments:', error);
        this.showError('Failed to load student assessments');
        this.studentAssessmentDialog.loading = false;
      }
    },

    async resolveReportCardIdForStudent(student, allowGenerate = false) {
      // Try to determine gradeId
      let gradeId = this.selectedAssignment?.gradeId;
      if (!gradeId) {
        try {
          const info = await homeroomService.getHomeroomGradeInfo();
          const gradeData = info?.data ?? info;
          gradeId = gradeData?.gradeId ?? gradeData?.id;
        } catch (_) {
          gradeId = null;
        }
      }

      // Try class report cards when gradeId is known
      if (gradeId) {
        try {
          const classReportCards = await reportService.getClassReportCardIds(
            gradeId,
            this.selectedAcademicYear,
            this.selectedTerm
          );
          const rc = (classReportCards || []).find(rc => rc.studentName === student.studentName);
          if (rc) return rc.id;
        } catch (_) { /* ignore */ }
      }

      // Fallback to per-student cards
      try {
        const reportCards = await examService.getStudentReportCards(student.studentId);
        const current = (reportCards || []).find(rc => rc.academicYear === this.selectedAcademicYear && rc.term === this.selectedTerm);
        if (current) return current.id;
      } catch (_) { /* ignore */ }

      // Generate on demand if allowed
      if (allowGenerate) {
        try {
          const created = await reportService.generateReportCard(student.studentId, this.selectedAcademicYear, this.selectedTerm);
          return created?.id ?? created?.Id ?? null;
        } catch (_) { /* ignore */ }
      }
      return null;
    },

    async saveStudentAssessments() {
      if (!this.studentAssessmentDialog.student) return;
      this.studentAssessmentDialog.saving = true;
      try {
        const studentId = this.studentAssessmentDialog.student.studentId;
        const payloads = Object.entries(this.studentAssessmentDialog.assessments)
          .map(([skillItemId, comment]) => ({
            studentId,
            skillItemId: parseInt(skillItemId, 10),
            academicYear: this.selectedAcademicYear,
            term: this.selectedTerm,
            teacherComment: String(comment || '').trim()
          }))
          .filter(p => p.teacherComment.length > 0);

        await Promise.all(payloads.map(p => babyClassSkillService.createOrUpdateAssessment(p)));

        // Save general comment if possible (ensure report card exists)
        const commentText = String(this.studentAssessmentDialog.generalComment || '').trim();
        if (commentText) {
          // Resolve or generate report card id if missing
          if (!this.studentAssessmentDialog.reportCardId) {
            this.studentAssessmentDialog.reportCardId = await this.resolveReportCardIdForStudent(this.studentAssessmentDialog.student, true);
          }
          try {
            if (this.studentAssessmentDialog.reportCardId) {
              await examService.updateGeneralComment(this.studentAssessmentDialog.reportCardId, commentText);
              // Mark general comment present for this student
              this.babyGeneralCommentPresent[studentId] = true
            } else {
              this.showWarn('Report card not found; general comment not saved.');
            }
          } catch (_) {
            // ignore
          }
        }

        // Reflect changes into table model
        if (!this.studentAssessments[studentId]) this.studentAssessments[studentId] = {};
        this.studentAssessmentDialog.skills.forEach(skill => {
          (skill.skillItems || []).forEach(item => {
            const comment = this.studentAssessmentDialog.assessments[item.id] || '';
            if (comment) {
              this.studentAssessments[studentId][item.id] = {
                status: 'assessed',
                comment,
                assessmentId: this.studentAssessments[studentId][item.id]?.assessmentId || undefined
              };
            }
          });
        });

        // Debug: re-check target student's status after save
        this.debugBabyStudentByName(this.babyDebugTargetName)

        this.showSuccess('Assessments saved successfully!');
         this.studentAssessmentDialog.visible = false;
      } catch (e) {
        this.showError('Failed to save assessments');
      } finally {
        this.studentAssessmentDialog.saving = false;
      }
    },

    async maybeShowBabyClassQuickSelect() {
      if (this.quickSelectShown) return
      // Detect Baby Class via selected assignment or homeroom grade name
      let isBaby = this.isBabyClass
      if (!isBaby) {
        try {
          const info = await homeroomService.getHomeroomGradeInfo()
          const data = info?.data ?? info
          const name = String(data?.gradeName || data?.name || '').toLowerCase()
          if (name.includes('baby')) isBaby = true
        } catch (_) {
          // ignore
        }
      }
      if (isBaby) {
        this.isBabyMode = true
        // Ensure academic years are available before showing
        if (!Array.isArray(this.academicYears) || this.academicYears.length === 0) {
          try { await this.loadAcademicYears() } catch (_) {}
        }
        this.showQuickSelectDialog = true
        this.quickSelectShown = true
      }
    },

    onQuickSelectContinue() {
      console.log('[BabyClass] Quick select Continue clicked', {
        selectedAcademicYear: this.selectedAcademicYear,
        selectedTerm: this.selectedTerm,
        isBabyMode: this.isBabyMode
      })
      this.showQuickSelectDialog = false
      // Auto-load students for Baby Class after selecting year/term
      if (this.isBabyMode && this.selectedAcademicYear && this.selectedTerm) {
        this.loadStudentScores()
      }
    },

    async onBabyFilterWatch() {
      if (this.isBabyClass && this.selectedAcademicYear && this.selectedTerm) {
        console.log('[BabyClass] Year/Term changed → auto-loading students', {
          selectedAcademicYear: this.selectedAcademicYear,
          selectedTerm: this.selectedTerm
        })
        if (this.showQuickSelectDialog) this.showQuickSelectDialog = false
        try {
          await this.loadStudentScores()
        } catch (e) {
          // ignore; loadStudentScores handles toasts
        }
      }
    },

    async loadBabySkillItemsIfNeeded() {
      if (this.babyAllSkillItemIds && this.babyAllSkillItemIds.length > 0) return
      try {
        const skillsResp = await babyClassSkillService.getAllSkills()
        const skills = Array.isArray(skillsResp) ? skillsResp : (skillsResp?.data ?? [])
        const itemsBySkill = await Promise.all(
          skills.map(async s => {
            try {
              const items = await babyClassSkillService.getSkillItems(s.id)
              const list = Array.isArray(items) ? items : (items?.data ?? [])
              return list.map(i => i.id)
            } catch (_) {
              return []
            }
          })
        )
        this.babyAllSkillItemIds = itemsBySkill.flat()
      } catch (e) {
        this.babyAllSkillItemIds = []
      }
    },

    getBabyAssessmentStatus(studentId) {
      const total = this.babyAllSkillItemIds?.length || 0
      const map = this.studentAssessments[studentId] || {}
      // Count assessed items (existence of assessment record is sufficient)
      const assessed = total > 0
        ? this.babyAllSkillItemIds.filter(id => !!map[id]).length
        : Object.values(map).length
      const hasGeneral = !!this.babyGeneralCommentPresent[studentId]
      // Primary path: we know the total number of skill items
      if (total > 0 && assessed >= total && hasGeneral) {
        return { label: 'Completed', class: 'text-green-600' }
      }
      // Fallback path: total not known; consider completed if student has at least one assessment and general comment
      if (total === 0 && assessed > 0 && hasGeneral) {
        return { label: 'Completed', class: 'text-green-600' }
      }
      if (assessed > 0) {
        return { label: 'In Progress', class: 'text-orange-600' }
      }
      return { label: 'Pending', class: 'text-600' }
    },

    getCompletedBabyCount() {
      if (!Array.isArray(this.students) || this.students.length === 0) return 0
      return this.students.filter(s => this.getBabyAssessmentStatus(s.studentId).label === 'Completed').length
    },

    async loadBabyGeneralCommentsForClass(gradeId) {
      try {
        const classReportCards = await reportService.getClassReportCardIds(
          gradeId,
          this.selectedAcademicYear,
          this.selectedTerm
        )
        const rcMap = new Map((classReportCards || []).map(rc => [rc.studentName, rc.id]))
        const tasks = this.students.map(async s => {
          const rcId = rcMap.get(s.studentName)
          if (!rcId) {
            this.babyGeneralCommentPresent[s.studentId] = false
            return
          }
          try {
            const gc = await examService.getGeneralComment(rcId)
            const text = typeof gc === 'string' ? gc : (gc?.comment || '')
            this.babyGeneralCommentPresent[s.studentId] = !!(text && String(text).trim().length > 0)
          } catch (_) {
            this.babyGeneralCommentPresent[s.studentId] = false
          }
        })
        await Promise.all(tasks)
      } catch (e) {
        // Default to false if loading fails
        this.students.forEach(s => { this.babyGeneralCommentPresent[s.studentId] = this.babyGeneralCommentPresent[s.studentId] || false })
      }
      // Debug: inspect target student's completion state after loading comments
      this.debugBabyStudentByName(this.babyDebugTargetName)
    },

    // Debug helper: logs detailed Baby Class status for a named student (case-insensitive substring)
    async debugBabyStudentByName(nameLower) {
      try {
        if (!this.isBabyMode || !Array.isArray(this.students) || this.students.length === 0) return
        const target = this.students.find(s => String(s.studentName || '').toLowerCase().includes(String(nameLower || '').toLowerCase()))
        if (!target) return
        const sid = target.studentId
        const map = this.studentAssessments[sid] || {}
        const total = this.babyAllSkillItemIds?.length || 0
        const assessedIds = total > 0 ? this.babyAllSkillItemIds.filter(id => !!map[id]) : Object.keys(map).map(x => parseInt(x, 10)).filter(Boolean)
        const hasGeneral = !!this.babyGeneralCommentPresent[sid]
        const status = this.getBabyAssessmentStatus(sid)
        console.groupCollapsed('[DEBUG][BabyClass] Student status check', target.studentName)
        console.log('studentId:', sid)
        console.log('totalSkillItems:', total)
        console.log('assessedIds:', assessedIds)
        console.log('assessedCount:', assessedIds.length)
        console.log('hasGeneralComment:', hasGeneral)
        console.log('computedStatus:', status)
        // Compare with student-specific API as tie-breaker
        try {
          const resp = await babyClassSkillService.getStudentAssessments(sid, this.selectedAcademicYear, this.selectedTerm)
          const arr = Array.isArray(resp) ? resp : (resp?.data ?? [])
          console.log('API getStudentAssessments count:', arr.length)
          if (arr.length > 0) {
            console.log('Sample assessment rows (first 3):', arr.slice(0, 3))
          }
        } catch (e) {
          console.log('API getStudentAssessments failed:', e)
        }
        console.groupEnd()
      } catch (_) {
        // swallow debug errors
      }
    },

    // Add Students Dialog Methods
    async openAddStudentsDialog() {
      if (!this.selectedAssignment) {
        this.showError('Please select a subject and grade first')
        return
      }

      this.addStudentsDialog.visible = true
      this.addStudentsDialog.loading = true
      this.addStudentsDialog.selectedStudentIds = []
      this.addStudentsDialog.searchQuery = ''
      
      try {
        const gradeId = this.selectedAssignment.gradeId
        if (!gradeId) {
          this.showError('Could not determine grade. Please try again.')
          this.addStudentsDialog.visible = false
          return
        }

        // Get all students in the grade
        const gradeStudents = await examService.getStudentsByGrade(gradeId)
        
        // Get current student IDs that are already in the list
        const currentStudentIds = new Set(this.students.map(s => s.studentId))
        
        // For secondary classes, also check enrollment
        let enrolledIdSet = null
        if (this.isSecondaryClass) {
          try {
            const checks = await Promise.all(
              gradeStudents.map(async s => {
                try {
                  const subs = await secondarySubjectService.getStudentSubjects(s.id)
                  const list = Array.isArray(subs) ? subs : (subs?.data ?? [])
                  const enrolled = list.some(sub => (sub.subjectId ?? sub.id) === this.selectedAssignment.subjectId)
                  return { id: s.id, enrolled }
                } catch (_) {
                  return { id: s.id, enrolled: false }
                }
              })
            )
            enrolledIdSet = new Set(checks.filter(c => c.enrolled).map(c => c.id))
          } catch (e) {
            console.warn('Error checking enrollment:', e)
            enrolledIdSet = null
          }
        }

        // Filter to only show students not already in the list
        // For secondary, also include unenrolled students (they'll be enrolled when added)
        this.addStudentsDialog.availableStudents = gradeStudents.filter(student => {
          // Exclude if already in the list
          if (currentStudentIds.has(student.id)) return false
          
          // For secondary, include all students (even if not enrolled - they'll be enrolled)
          return true
        })
        
        this.addStudentsDialog.availableStudents.sort((a, b) => 
          (a.fullName || '').localeCompare(b.fullName || '')
        )

      } catch (error) {
        console.error('Error loading available students:', error)
        this.showError('Failed to load available students')
        this.addStudentsDialog.visible = false
      } finally {
        this.addStudentsDialog.loading = false
      }
    },

    closeAddStudentsDialog() {
      this.addStudentsDialog.visible = false
      this.addStudentsDialog.selectedStudentIds = []
      this.addStudentsDialog.searchQuery = ''
    },

    toggleStudentSelection(studentId) {
      const index = this.addStudentsDialog.selectedStudentIds.indexOf(studentId)
      if (index > -1) {
        this.addStudentsDialog.selectedStudentIds.splice(index, 1)
      } else {
        this.addStudentsDialog.selectedStudentIds.push(studentId)
      }
    },

    async addSelectedStudents() {
      if (this.addStudentsDialog.selectedStudentIds.length === 0) {
        return
      }

      this.addStudentsDialog.saving = true
      
      try {
        const gradeId = this.selectedAssignment.gradeId
        const subjectId = this.selectedAssignment.subjectId
        const examTypeId = this.selectedExamType
        const academicYear = this.selectedAcademicYear
        const term = this.selectedTerm

        // For secondary classes, enroll students in the subject if not already enrolled
        if (this.isSecondaryClass) {
          for (const studentId of this.addStudentsDialog.selectedStudentIds) {
            try {
              // Check if already enrolled
              const subs = await secondarySubjectService.getStudentSubjects(studentId)
              const list = Array.isArray(subs) ? subs : (subs?.data ?? [])
              const alreadyEnrolled = list.some(sub => (sub.subjectId ?? sub.id) === subjectId)
              
              if (!alreadyEnrolled) {
                // Enroll the student in the subject
                await secondarySubjectService.assignSubject(studentId, {
                  subjectId: subjectId,
                  assignedBy: 'System' // Could get from user context
                })
                console.log(`Enrolled student ${studentId} in subject ${subjectId}`)
              }
            } catch (error) {
              console.warn(`Error enrolling student ${studentId}:`, error)
              // Continue with adding even if enrollment fails
            }
          }
        }

        // Get the full student details for the selected students
        const selectedStudentsData = this.addStudentsDialog.availableStudents.filter(s =>
          this.addStudentsDialog.selectedStudentIds.includes(s.id)
        )

        // Load existing scores to check if any of these students already have scores
        let relevantScores = []
        try {
          const scores = await examService.getGradeScores(gradeId, academicYear, term)
          relevantScores = scores.filter(score =>
            score.subjectId === subjectId &&
            score.examTypeId === examTypeId &&
            this.addStudentsDialog.selectedStudentIds.includes(score.studentId)
          )
        } catch (_) {
          // If loading scores fails, we'll just add students without existing scores
        }

        // Add students to the list
        const newStudents = selectedStudentsData.map(student => {
          const existingScore = relevantScores.find(score => score.studentId === student.id)
          return {
            studentId: student.id,
            studentName: student.fullName,
            studentNumber: student.studentNumber,
            currentScore: existingScore ? existingScore.score : null,
            scoreId: existingScore ? existingScore.id : null,
            isAbsent: existingScore ? existingScore.isAbsent : false,
            lastUpdated: existingScore ? existingScore.recordedAt : null,
            recordedBy: existingScore ? existingScore.recordedByName : null,
            comments: existingScore ? existingScore.comments : null,
            commentsUpdatedAt: existingScore ? existingScore.commentsUpdatedAt : null,
            commentsUpdatedBy: existingScore ? existingScore.commentsUpdatedByName : null,
            toggleLoading: false
          }
        })

        // Add to students array and sort
        this.students.push(...newStudents)
        this.students.sort((a, b) => a.studentName.localeCompare(b.studentName))
        
        // Update originalStudents for change tracking
        this.originalStudents = JSON.parse(JSON.stringify(this.students))

        // Load general comments if this is an End-of-Term exam
        if (examTypeId === 4) {
          await this.loadGeneralCommentsForStudents()
        }

        // For Baby Class, load skill assessments
        if (this.isBabyMode) {
          try {
            await this.loadBabyClassAssessments(this.students, gradeId)
          } catch (_) {}
        }

        this.showSuccess(`Added ${newStudents.length} student(s) to the exam entry`)
        this.closeAddStudentsDialog()

      } catch (error) {
        console.error('Error adding students:', error)
        this.showError('Failed to add students. Please try again.')
      } finally {
        this.addStudentsDialog.saving = false
      }
    }
  }
}
</script>






<style scoped>
/* Existing styles */
.modern-table .p-datatable-tbody > tr:hover {
  background: #f3f6fa !important;
  transition: background 0.2s;
}

.modern-table .p-datatable-tbody > tr > td {
  vertical-align: middle;
  font-size: 1rem;
  padding-top: 0.7rem;
  padding-bottom: 0.7rem;
}

.modern-table .p-datatable-thead > tr > th {
  font-size: 1.05rem;
  font-weight: 600;
  background: #f8fafc;
  border-bottom: 2px solid #e5e7eb;
}

.student-mobile-card {
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  background: #f8fafc;
  padding: 1.2rem 1rem 1rem 1rem;
  transition: all 0.3s ease;
}

/* Absent-specific styles */
.absent-card {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.score-entry {
  background: #f8fafc;
  border-radius: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  min-height: 90vh;
}

.comment-highlight {
  background: #fffbe6 !important;
  border: 1.5px solid #ffe58f !important;
  border-radius: 0.5rem;
  transition: background 0.3s, border 0.3s;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-enter-to, .fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Badge styles for mobile */
.badge {
  display: inline-block;
  padding: 0.25em 0.75em;
  border-radius: 9999px;
  font-size: 0.95em;
  font-weight: 600;
  min-width: 2.5em;
  text-align: center;
}

/* Responsive styles */
@media (max-width: 768px) {
  .score-entry {
    padding: 0.5rem !important;
    border-radius: 0.75rem;
  }
  
  .student-mobile-card {
    border-radius: 0.75rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 1rem 0.5rem 0.5rem 0.5rem;
  }
  
  .absent-card {
    background: #fef2f2;
    border-left: 4px solid #ef4444;
  }
}
</style> 