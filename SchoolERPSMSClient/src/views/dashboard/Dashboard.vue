<template>
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <Panel>
      <h2 class="text-lg font-semibold text-blue-900 dark:text-white ">Total Teachers</h2>
      <p class="text-2xl text-blue-900 dark:text-white ">{{ teacherCount }}</p>
    </Panel>
    <Panel>
      <h2 class="text-lg font-semibold text-blue-900 dark:text-white ">Active Teachers</h2>
      <p class="text-2xl text-blue-900 dark:text-white ">{{ activeTeacherCount }}</p>
    </Panel>
    <Panel>
      <h2 class="text-lg font-semibold text-blue-900 dark:text-white ">Students</h2>
      <p class="text-2xl text-blue-900 dark:text-white ">{{ students }}</p>
    </Panel>
    <Panel>
      <h2 class="text-lg font-semibold text-blue-900 dark:text-white ">Classes</h2>
      <p class="text-2xl text-blue-900 dark:text-white ">{{ grades.length }}</p>
    </Panel>
    <Panel>
      <h2 class="text-lg font-semibold text-blue-900 dark:text-white ">Active Assignments</h2>
      <p class="text-2xl text-blue-900 dark:text-white ">{{ teacherAssignmentStats.totalActiveAssignments }}</p>
    </Panel>
  </div>

  <Divider class="my-10" />

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Panel toggleable>
      <Chart
        type="bar"
        :data="gradeChartData"
        :options="gradeChartOptions"
        class="w-full md:w-[30rem] h-[28rem]"
      />
    </Panel>
    <Panel>
      <Chart
        type="radar"
        :data="examRadarChartData"
        :options="examRadarChartOptions"
        class="w-full md:w-[30rem] h-[28rem]"
      />
    </Panel>
    <Panel>
      <Chart
        type="doughnut"
        :data="assignmentDoughnutChartData"
        :options="assignmentDoughnutChartOptions"
        class="w-full md:w-[30rem] h-[28rem]"
      />
    </Panel>

   
  </div>
  <Divider class="my-10" />
  <Panel>
      <template #header>
        <h2>Teacher Assignments</h2>
      </template>
      <DataTable
        :value="assignments"
        :loading="loading"
        dataKey="assignmentId"
        responsiveLayout="scroll"
        class="p-datatable-sm"
        stripedRows
        paginator 
        :rows="8"
        sortable
        :selection-mode="single"
      >
        <!-- <Column field="assignmentId" header="ID" style="width: 80px" /> -->
        <Column field="teacherName" header="Teacher" />
        <Column field="subjectName" header="Subject"  class="mx-auto" />
        <Column field="subjectCode" header="Code" />
        <Column field="gradeName" header="Grade" />
        <Column
          field="isActive"
          header="Active"
          style="width: 20px"
          :body="activeStatusTemplate"
        />
      </DataTable>
    </Panel>

  <Divider class="my-10" />
  <h3>Class Overview</h3>
  <div class="grid grid-cols-2 md:grid-cols-8 gap-4">
    <Panel
      v-for="grade in grades"
      :key="grade.id"
      class="cursor-pointer"
      @click="openLearnersDialog(grade)"
    >
      <h2 class="text-lg font-semibold">{{ grade.fullName }}</h2>
      <small class="pi pi-user">
        <span class="ml-3">{{ grade.studentCount }} students</span>
      </small>
      <p class="text-sm">{{ grade.homeroomTeacherName || 'N/A' }}</p>
    </Panel>
  </div>

  <!-- Learners Dialog -->
  <Dialog v-model:visible="showLearnersDialog" :header="selectedGrade?.fullName || 'Students'" modal style="min-width: 350px; max-width: 90vw;">
    <template #default>
      <div v-if="selectedGrade && learnersByGrade[selectedGrade.id] && learnersByGrade[selectedGrade.id].length">
        <DataTable 
          :value="learnersByGrade[selectedGrade.id]" 
          dataKey="id" 
          class="mt-2 text-xs"
          responsiveLayout="scroll"
        >
          <Column 
            field="fullName" 
            header="Student Name" 
          />
          <Column 
            field="studentNumber" 
            header="Student Number" 
          />
        </DataTable>
      </div>
      <div v-else class="text-gray-400 text-xs mt-2">No students found.</div>
    </template>
    <template #footer>
      <Button label="Close" @click="showLearnersDialog = false" />
    </template>
  </Dialog>
</template>



<script setup>
import { examService, gradeService, studentService, subjectService, userService } from '@/service/api.service';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { computed, h, onMounted, ref, watch } from 'vue';

// Props
const props = defineProps({
  teacherId: {
    type: Number,
    required: false,
    default: null
  },
  includeInactive: {
    type: Boolean,
    default: false
  }
});

const assignments = ref([]);
const loading = ref(false);
const toast = useToast();

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const params = props.includeInactive ? '?includeInactive=true' : '';
    // If teacherId is provided, fetch assignments for that teacher
    if (props.teacherId !== null && props.teacherId !== undefined) {
      const response = await subjectService.getTeacherAssignments(props.teacherId, params);
      if (response.ok) {
        assignments.value = await response.json();
      } else if (Array.isArray(response)) {
        assignments.value = response;
      } else if (response.data) {
        assignments.value = response.data;
      } else {
        assignments.value = response;
      }
    } else {
      // No teacherId provided: fetch all teachers, then fetch assignments for each
      const users = await userService.getAll();
      const teachers = users.filter(user => user.role === 'Teacher');
      let allAssignments = [];
      for (const teacher of teachers) {
        try {
          const response = await subjectService.getTeacherAssignments(teacher.id, params);
          let teacherAssignments = [];
          if (response.ok) {
            teacherAssignments = await response.json();
          } else if (Array.isArray(response)) {
            teacherAssignments = response;
          } else if (response.data) {
            teacherAssignments = response.data;
          } else {
            teacherAssignments = response;
          }
          // Optionally, add teacher name to each assignment for display
          teacherAssignments = teacherAssignments.map(a => ({
            ...a,
            teacherName: teacher.fullName || teacher.name || `${teacher.firstName} ${teacher.lastName}` || 'Teacher'
          }));
          allAssignments = allAssignments.concat(teacherAssignments);
        } catch (err) {
          // Optionally, handle per-teacher errors
          // toast.add({ severity: 'warn', summary: 'Warning', detail: `Failed to fetch assignments for ${teacher.fullName || teacher.id}` });
        }
      }
      assignments.value = allAssignments;
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to fetch assignments' });
    assignments.value = [];
  } finally {
    loading.value = false;
  }
};

// Only fetch assignments if teacherId is provided or if you want to show all assignments
watch(
  () => [props.teacherId, props.includeInactive],
  fetchAssignments,
  { immediate: true }
);

// Custom cell template for isActive (returns VNode, not string)
function activeStatusTemplate(row) {
  return row.isActive
    ? h('span', { class: 'p-tag p-tag-success' }, 'Active')
    : h('span', { class: 'p-tag p-tag-secondary' }, 'Inactive');
}

// PrimeVue Dialog and Button
const teacherCount = ref(0);
const activeTeacherCount = ref(0);
const students = ref(0);
const grades = ref([]);
const learners = ref([]);

const teacherAssignmentStats = ref({
  totalActiveAssignments: 0,
  totalTeachersWithAssignments: 0,
  assignmentsBySubjectAndGrade: []
});

const examStats = ref({
  Count: 0,
  Average: 0,
  Minimum: 0,
  Maximum: 0,
  PassingRate: 0,
  GradeDistribution: {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0
  }
});

const colorPalette = [
  'bg-blue-50',
  'bg-blue-100',
  'bg-blue-200',
  'bg-blue-300',
  'bg-blue-400',
  'bg-blue-500',
  'bg-blue-600',
  'bg-blue-700',
  'bg-blue-800',
  'bg-blue-900'
];

const chartColors = [
  '#eff6ff', // blue-50
  '#dbeafe', // blue-100
  '#bfdbfe', // blue-200
  '#93c5fd', // blue-300
  '#60a5fa', // blue-400
  '#3b82f6', // blue-500
  '#2563eb', // blue-600
  '#1d4ed8', // blue-700
  '#1e40af', // blue-800
  '#1e3a8a'  // blue-900
];

// Dialog state
const showLearnersDialog = ref(false);
const selectedGrade = ref(null);

function openLearnersDialog(grade) {
  selectedGrade.value = grade;
  showLearnersDialog.value = true;
}

// Map students by gradeId for quick lookup
const learnersByGrade = computed(() => {
  const map = {};
  for (const grade of grades.value) {
    map[grade.id] = [];
  }
  for (const learner of learners.value) {
    if (map[learner.gradeId]) {
      map[learner.gradeId].push(learner);
    }
  }
  return map;
});

// 1. Bar Chart: Grade Distribution (students per grade)
const gradeChartData = computed(() => {
  if (!grades.value.length) return { labels: [], datasets: [] };
  return {
    labels: grades.value.map(g => g.fullName),
    datasets: [
      {
        label: 'Students per Grade',
        data: grades.value.map(g => g.studentCount),
        backgroundColor: grades.value.map((_, idx) => chartColors[idx % chartColors.length]),
        borderColor: grades.value.map((_, idx) => chartColors[(idx + 2) % chartColors.length]),
        borderWidth: 2,
      }
    ]
  };
});

const gradeChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: 0.75,
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
         font: { size: 14 }
      }
    },
    title: {
      display: true,
      text: 'Student Distribution by Grade',
       font: { size: 18 }
    }
  },
  scales: {
    x: {
       grid: { color: '#dbeafe' }
    },
    y: {
       grid: { color: '#dbeafe' }
    }
  }
}));

// 2. Doughnut Chart: Teacher Assignment Stats (by subject)
const assignmentDoughnutChartData = computed(() => {
  const data = teacherAssignmentStats.value.assignmentsBySubjectAndGrade || [];
  if (!data.length) return { labels: [], datasets: [] };
  // Group by subject and sum teacherCount per subject
  const subjectMap = {};
  data.forEach(item => {
    if (!subjectMap[item.subject]) subjectMap[item.subject] = 0;
    subjectMap[item.subject] += item.teacherCount;
  });
  const labels = Object.keys(subjectMap);
  const values = Object.values(subjectMap);
  return {
    labels,
    datasets: [
      {
        label: 'Teachers per Subject',
        data: values,
        backgroundColor: labels.map((_, idx) => chartColors[idx % chartColors.length]),
        borderColor: labels.map((_, idx) => chartColors[(idx + 2) % chartColors.length]),
        borderWidth: 2,
      }
    ]
  };
});

const assignmentDoughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: 0.75,
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
         font: { size: 14 }
      }
    },
    title: {
      display: true,
      text: 'Teachers with Assignments by Subject',
       font: { size: 18 }
    }
  }
}));

// 3. Radar Chart: Exam Stats (Grade Distribution)
const examRadarChartData = computed(() => {
  const dist = examStats.value.GradeDistribution || {};
  const labels = ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'];
  const data = [
    dist.A || 0,
    dist.B || 0,
    dist.C || 0,
    dist.D || 0,
    dist.F || 0
  ];
  return {
    labels,
    datasets: [
      {
        label: 'Grade Distribution',
        data,
        backgroundColor: 'rgba(59,130,246,0.2)', // blue-500 with opacity
        borderColor: '#1e40af', // blue-800
      }
    ]
  };
});

const examRadarChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: 0.75,
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
        font: { size: 14 }
      }
    },
    title: {
      display: true,
      text: 'Exam Grade Distribution',
      font: { size: 18 }
    }
  },
  scales: {
    r: {
      angleLines: { color: '#dbeafe' }, // blue-100
      grid: { color: '#dbeafe' },
      pointLabels: { color: '#1e3a8a', font: { size: 14 } },
      ticks: { color: '#1e3a8a', font: { size: 12 }, stepSize: 1 }
    }
  }
}));

onMounted(() => {
  userService.getAll()
    .then(response => {
      teacherCount.value = response.filter(user => user.role === 'Teacher').length;
      activeTeacherCount.value = response.filter(user => user.role === 'Teacher' && user.isActive).length;
    })
    .catch(error => {
      toast.add({ severity: 'error', summary: 'Error fetching users', detail: error.message || String(error) });
      teacherCount.value = 0;
      activeTeacherCount.value = 0;
    });

  studentService.getAll()
    .then(response => {
      const studentsData = response?.data || [];
      students.value = studentsData.length;
      learners.value = studentsData;
    })
    .catch(error => {
      toast.add({ severity: 'error', summary: 'Error fetching students', detail: error.message || String(error) });
      students.value = 0;
      learners.value = [];
    });

  gradeService.getAll()
    .then(response => {
      grades.value = response;
    })
    .catch(error => {
      toast.add({ severity: 'error', summary: 'Error fetching grades', detail: error.message || String(error) });
      grades.value = [];
    });

  // Fetch teacher assignment stats for doughnut chart
  examService.getTeacherAssignmentsStats()
    .then(response => {
      teacherAssignmentStats.value = response;
    })
    .catch(error => {
      toast.add({ severity: 'error', summary: 'Error fetching teacher assignment stats', detail: error.message || String(error) });
      teacherAssignmentStats.value = {
        totalActiveAssignments: 0,
        totalTeachersWithAssignments: 0,
        assignmentsBySubjectAndGrade: []
      };
    });

  // Fetch exam stats for radar chart
  examService.statistics()
    .then(response => {
      examStats.value = response;
    })
    .catch(error => {
      toast.add({ severity: 'error', summary: 'Error fetching exam stats', detail: error.message || String(error) });
      examStats.value = {
        Count: 0,
        Average: 0,
        Minimum: 0,
        Maximum: 0,
        PassingRate: 0,
        GradeDistribution: {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          F: 0
        }
      };
    });
});
</script>