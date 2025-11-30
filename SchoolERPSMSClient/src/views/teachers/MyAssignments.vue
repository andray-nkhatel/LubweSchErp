<template>
 
  <Panel toggleable class="mb-4">
    <template #header>
      <h3>You are Grade teacher for:</h3>
    </template>
    <div v-if="myHomeroomGrades.length">
      <ul>
        <li class="text-red-600" v-for="grade in myHomeroomGrades" :key="grade.id">
          {{ grade.fullName }}
        </li>
      </ul>
    </div>
    <div v-else>
      <span>You are not a Grade teacher for any grade.</span>
    </div>
  </Panel>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- DataTable Column -->
    <div>
      <Divider class="my-4" />
      <DataTable
        :value="assignments"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        :loading="loading"
      >
        <Column field="subjectName" header="Subject" sortable></Column>
        <Column field="gradeName" header="Class" sortable></Column>
        <Column field="assignedAt" header="Assigned At" sortable>
          <template #body="slotProps">
            {{ formatDate(slotProps.data) }}
          </template>
        </Column>
      </DataTable>
    </div>
    <!-- Radar Chart Column -->
    <div>
      <Divider class="my-4" />
      <Panel toggleable="">
        <template #header>
          <h3>Assignments by Subject</h3>
        </template>
        <Chart
          type="radar"
          :data="radarChartData"
          :options="radarChartOptions"
          style="max-width: 100%;"
        />
      </Panel>
    </div>
  </div>
</template>

<script setup>
import { authService, examService, gradeService } from '@/service/api.service';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Divider from 'primevue/divider';
import Panel from 'primevue/panel';
import { computed, onMounted, ref } from 'vue';


const assignments = ref([]);
const loading = ref(false);
const userProfile = ref(null);
const allGrades = ref([]);

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const response = await examService.getTeacherAssignments();
    assignments.value = response;
  } catch (error) {
    console.error('Error fetching assignments:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAssignments();
  fetchUserProfile();
  fetchAllGrades();


  // const response = gradeService.getAll()
});

const fetchUserProfile = async () => {
  try {
    // Replace with your actual user service or API call
    userProfile.value = await authService.getProfile();
  } catch (error) {
    console.error('Failed to fetch user profile', error);
  }
};

const myHomeroomGrades = computed(() => {
  if (!userProfile.value) return [];
  return allGrades.value.filter(
    g => g.homeroomTeacherId != null && g.homeroomTeacherId == userProfile.value.id
  );
});

const fetchAllGrades = async () => {
  try {
    allGrades.value = await gradeService.getAll();
  } catch (error) {
    console.error('Failed to fetch grades', error);
  }
};

// Format date for display
function formatDate(row) {
  if (!row.assignedAt) return '';
  const date = new Date(row.assignedAt);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

// Radar Chart Data: Count assignments per subject (from the same assignments array as DataTable)
const radarChartData = computed(() => {
  // Group assignments by subjectName
  const subjectCounts = {};
  assignments.value.forEach(a => {
    if (!subjectCounts[a.subjectName]) subjectCounts[a.subjectName] = 0;
    subjectCounts[a.subjectName]++;
  });
  const labels = Object.keys(subjectCounts);
  const data = Object.values(subjectCounts);

  return {
    labels,
    datasets: [
      {
        label: 'Assignments',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: '#36A2EB',
        pointBackgroundColor: '#36A2EB',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#36A2EB',
        data
      }
    ]
  };
});

// Make suggestedMax reactive to the data
const radarChartOptions = computed(() => {
  const data = radarChartData.value.datasets[0]?.data || [];
  const max = Math.max(5, ...data, 1);
  return {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: max
      }
    }
  };
});
</script>