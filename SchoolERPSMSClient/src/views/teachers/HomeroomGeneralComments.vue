<template>
  <div class="p-4 md:p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-comments text-blue-600 text-xl"></i>
        <h2 class="text-xl md:text-2xl font-bold text-900 m-0">Homeroom General Comments</h2>
      </div>
      <div class="text-sm text-600" v-if="gradeInfo">
        <i class="pi pi-building mr-1"></i>
        {{ gradeInfo.gradeName }}
      </div>
    </div>

    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-900 font-semibold mb-2">Academic Year</label>
            <Select v-model="selectedAcademicYear" :options="academicYears" optionLabel="name" optionValue="id" placeholder="Select year" class="w-full" />
          </div>
          <div>
            <label class="block text-900 font-semibold mb-2">Term</label>
            <Select v-model="selectedTerm" :options="terms" optionLabel="name" optionValue="id" placeholder="Select term" class="w-full" />
          </div>
          <div class="flex items-end">
            <Button label="Load Students" icon="pi pi-search" class="w-full md:w-auto" :disabled="!canLoad" :loading="loading" @click="loadHomeroomData" />
          </div>
        </div>
      </template>
    </Card>

    <Card v-if="students.length > 0">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-users text-blue-600"></i>
          <span>Students</span>
          <Badge :value="students.filter(s => s.generalComment).length + '/' + students.length" severity="info" class="ml-2" />
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="student in students" :key="student.studentId" class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
               :class="{ 'bg-green-50 border-green-200': student.generalComment, 'bg-gray-50': !student.generalComment }"
               @click="openGeneralCommentDialog(student)">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-800">{{ student.studentName }}</h4>
              <div class="flex items-center gap-2">
                <i v-if="student.generalComment" class="pi pi-check-circle text-green-600"></i>
                <i v-else class="pi pi-exclamation-circle text-orange-500"></i>
                <Button icon="pi pi-comment" size="small" text rounded @click.stop="openGeneralCommentDialog(student)" />
                <Button icon="pi pi-pencil" size="small" text rounded @click.stop="openEditNameDialog(student)" v-tooltip.top="'Edit student name'" />
              </div>
            </div>
            <div v-if="student.generalComment" class="text-sm text-gray-700 bg-white p-2 rounded border">
              {{ student.generalComment.length > 100 ? student.generalComment.substring(0, 100) + '...' : student.generalComment }}
            </div>
            <div v-else class="text-sm text-gray-500 italic bg-white p-2 rounded border">
              Click to add general comment for report card
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- General Comment Dialog -->
    <Dialog v-model:visible="showDialog" :header="`General Comment for ${activeStudent?.studentName || ''}`" :style="{ width: '95vw', maxWidth: '900px' }" modal>
      <div class="mb-4">
        <!-- Scoreboard Display -->
        <div v-if="scoreboardData && scoreboardData.subjects && scoreboardData.subjects.length > 0" class="mb-4 p-4 bg-white rounded-lg border">
          <div class="flex items-center gap-2 mb-3">
            <i class="pi pi-table text-blue-600"></i>
            <span class="font-semibold text-gray-800">Academic Performance Scoreboard</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse border border-gray-300">
              <thead class="bg-gray-100">
                <tr>
                  <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Subject</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 1</th>
                  <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 2</th>
                  <th v-if="isGrade7" class="border border-gray-300 px-3 py-2 text-center font-semibold">Test 3</th>
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
                  <td v-if="isGrade7" class="border border-gray-300 px-3 py-2 text-center" :class="getScoreColor(subject.test3Score)">
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
                  <td v-if="isGrade7" class="border border-gray-300 px-3 py-2"></td>
                  <td class="border border-gray-300 px-3 py-2"></td>
                  <td class="border border-gray-300 px-3 py-2 text-center font-bold text-lg" :class="getScoreColor(scoreboardData.overallAverage)">
                    {{ scoreboardData.overallAverage.toFixed(1) }}
                  </td>
                  
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <label class="block font-semibold mb-2 text-900">General Comment:</label>
        <Textarea v-model="commentText" :maxlength="2000" rows="6" class="w-full" placeholder="Enter a general comment..." :autoResize="true" :disabled="saving" />
        <div class="flex justify-between items-center mt-2">
          <div class="text-xs text-gray-500">{{ 2000 - (commentText?.length || 0) }} characters remaining</div>
          <div v-if="saving" class="text-xs text-blue-600"><i class="pi pi-spin pi-spinner mr-1"></i>Saving...</div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center">
          <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" :disabled="saving" @click="closeDialog" />
          <div class="flex gap-2">
            <Button label="Clear" icon="pi pi-trash" class="p-button-danger p-button-outlined" :disabled="saving || !commentText" @click="commentText = ''" />
            <Button label="Save" icon="pi pi-check" class="p-button-primary" :disabled="saving || !commentText?.trim()" :loading="saving" @click="saveComment" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Edit Name Dialog -->
    <Dialog v-model:visible="editName.visible" :header="`Edit Name: ${editName.student?.studentName || ''}`" :style="{ width: '90vw', maxWidth: '520px' }" modal>
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
          <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" :disabled="editName.saving" @click="editName.visible = false" />
          <Button label="Save" icon="pi pi-check" class="p-button-primary" :loading="editName.saving" :disabled="!isEditNameValid" @click="saveEditedName" />
        </div>
      </template>
    </Dialog>
  </div>
  <Toast ref="toast" />
  <ConfirmDialog />
</template>

<script>
import { examService, homeroomService, reportService } from '@/service/api.service';

export default {
  name: 'HomeroomGeneralComments',
  data() {
    return {
      academicYears: [],
      selectedAcademicYear: null,
      terms: [
        { id: 1, name: 'Term 1' },
        { id: 2, name: 'Term 2' },
        { id: 3, name: 'Term 3' }
      ],
      selectedTerm: null,
      gradeInfo: null,
      students: [],
      loading: false,
      showDialog: false,
      activeStudent: null,
      commentText: '',
      saving: false,
      scoreboardData: null,
      editName: {
        visible: false,
        student: null,
        firstName: '',
        middleName: '',
        lastName: '',
        saving: false
      },
    }
  },
  computed: {
    canLoad() {
      return !!(this.selectedAcademicYear && this.selectedTerm);
    },
    isEditNameValid() {
      return this.editName.firstName.trim().length > 0 && this.editName.lastName.trim().length > 0;
    },
    isGrade7() {
      const name = String(this.gradeInfo?.gradeName || '').toLowerCase();
      if (!name) return false;
      if (name.includes('grade 7') || name.includes('grade7') || name.includes('g7') || name.includes('seven')) return true;
      const match = name.match(/\b(grade|g)\s*(\d{1,2})\b/);
      if (match) {
        const num = parseInt(match[2], 10);
        return num === 7;
      }
      return false;
    }
  },
  async mounted() {
    await this.initialize();
  },
  methods: {
    async initialize() {
      try {
        this.academicYears = await examService.getAcademicYears();
        if (this.academicYears?.length) {
          const currentYear = this.academicYears.find(y => y.isActive && !y.isClosed);
          this.selectedAcademicYear = currentYear ? currentYear.id : this.academicYears[0].id;
        }
        this.selectedTerm = this.terms[0].id;
        const info = await homeroomService.getHomeroomGradeInfo();
        // API returns { success, message, data } – normalize to the inner data object
        this.gradeInfo = info?.data ?? info;
      } catch (e) {
        // silent
      }
    },
    async loadHomeroomData() {
      if (!this.canLoad) return;
      this.loading = true;
      try {
        const gradeId = this.gradeInfo?.gradeId || this.gradeInfo?.id;
        if (!gradeId) {
          this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not determine homeroom grade.', life: 4000 });
          return;
        }
        const gradeStudents = await examService.getStudentsByGrade(gradeId);
        const classReportCards = await reportService.getClassReportCardIds(gradeId, this.selectedAcademicYear, this.selectedTerm);
        const rcMap = new Map(classReportCards.map(rc => [rc.studentName, rc]));

        // Prefetch comments in parallel
        const commentPromises = gradeStudents.map(async (s) => {
          const rc = rcMap.get(s.fullName);
          if (!rc) return { id: s.id, name: s.fullName, comment: '' };
          try {
            const c = await examService.getGeneralComment(rc.id);
            const comment = typeof c === 'string' ? c : (c.comment || '');
            return { id: s.id, name: s.fullName, comment, reportCardId: rc.id };
          } catch {
            return { id: s.id, name: s.fullName, comment: '' };
          }
        });

        const results = await Promise.all(commentPromises);
        this.students = results.map(r => ({
          studentId: r.id,
          studentName: r.name,
          generalComment: r.comment,
          reportCardId: r.reportCardId
        })).sort((a, b) => a.studentName.localeCompare(b.studentName));
      } finally {
        this.loading = false;
      }
    },
    async openGeneralCommentDialog(student) {
      this.activeStudent = student;
      this.commentText = student.generalComment || '';
      this.scoreboardData = await this.getStudentScoreboardData(student);
      this.showDialog = true;
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
        // Update local student
        this.editName.student.studentName = fullName;
        this.$toast.add({ severity: 'success', summary: 'Success', detail: 'Name updated.', life: 3000 });
        this.editName.visible = false;
      } catch (e) {
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update name.', life: 5000 });
      } finally {
        this.editName.saving = false;
      }
    },
    closeDialog() {
      this.showDialog = false;
      this.activeStudent = null;
      this.commentText = '';
    },
    async saveComment() {
      if (!this.activeStudent || !this.commentText.trim()) return;
      this.saving = true;
      try {
        let reportCardId = this.activeStudent.reportCardId;
        if (!reportCardId) {
          // Try to get class report cards again
          const gradeId = this.gradeInfo?.gradeId || this.gradeInfo?.id;
          const classReportCards = await reportService.getClassReportCardIds(gradeId, this.selectedAcademicYear, this.selectedTerm);
          const rc = classReportCards.find(rc => rc.studentName === this.activeStudent.studentName);
          if (rc) {
            reportCardId = rc.id;
            this.activeStudent.reportCardId = reportCardId;
          }
        }
        if (!reportCardId) {
          this.$toast.add({ severity: 'warn', summary: 'Warning', detail: 'Report card not yet generated for this student.', life: 4000 });
          return;
        }
        await examService.updateGeneralComment(reportCardId, this.commentText.trim());
        this.$toast.add({ severity: 'success', summary: 'Success', detail: 'Comment saved.', life: 3000 });
        this.activeStudent.generalComment = this.commentText.trim();
        this.closeDialog();
      } catch (e) {
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save comment.', life: 5000 });
      } finally {
        this.saving = false;
      }
    }
    ,
    // Scoreboard helpers
    async getStudentScoreboardData(student) {
      try {
        if (!student) return null;
        const rows = await examService.getStudentTermSummary(
          student.studentId,
          this.selectedAcademicYear,
          this.selectedTerm
        );
        console.log('📊 Term summary rows (Homeroom)', {
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

        const needsEnrichment = subjects.some(s => (s.test1Score || 0) === 0 || (s.midTermScore || 0) === 0);
        const shouldEnrich = rowsArr.length === 0 || needsEnrichment;
        if (shouldEnrich) {
          const raw = await examService.getStudentScores(
            student.studentId,
            this.selectedAcademicYear,
            this.selectedTerm
          );
          console.log('📄 Raw student scores (Homeroom) before enrichment', raw);
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
          console.log('🔎 Detected exam type names (Homeroom):', Array.from(seenTypes));
          subjects = Array.from(bySubj.values()).map(rec => {
            const avg = this.calculateTermAverage({ test1Score: rec.test1Score, midTermScore: rec.midTermScore, test3Score: rec.test3Score, endTermScore: rec.endTermScore });
            return { ...rec, termAverage: avg };
          }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
          console.log('✅ Enriched subjects (Homeroom):', subjects);
        }

        return {
          studentName: student.studentName,
          gradeName: this.gradeInfo?.gradeName || 'Unknown Grade',
          academicYear: this.selectedAcademicYear,
          term: this.selectedTerm,
          subjects,
          overallAverage: this.calculateOverallAverage(subjects)
        };
      } catch (e) {
        return null;
      }
    },
    calculateTermAverage(score) {
      const test1 = score.test1Score || 0;
      const midTerm = score.midTermScore || 0;
      const test3 = score.test3Score || 0;
      const endTerm = score.endTermScore || 0;
      const vals = this.isGrade7 ? [test1, midTerm, test3, endTerm] : [test1, midTerm, endTerm];
      const present = vals.filter(v => v > 0);
      return present.length > 0 ? present.reduce((a, b) => a + b, 0) / present.length : 0;
    },
    calculateOverallAverage(subjects) {
      if (!subjects || subjects.length === 0) return 0;
      const total = subjects.reduce((sum, s) => sum + s.termAverage, 0);
      return total / subjects.length;
    },
    calculateGrade(average) {
      if (average >= 90) return 'A+';
      if (average >= 80) return 'A';
      if (average >= 70) return 'B+';
      if (average >= 60) return 'B';
      if (average >= 50) return 'C';
      if (average >= 40) return 'D';
      return 'F';
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
    }
  }
}
</script>

<style scoped>
</style>


