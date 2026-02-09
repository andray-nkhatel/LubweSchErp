<script setup>
import { examService } from '@/service/api.service';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppMenuItem from './AppMenuItem.vue';

// Get access to the store and router
const store = useStore();
const router = useRouter();

// Logout function
const logout = async () => {
  try {
    await store.dispatch('auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    router.push('/auth/login');
  }
};

// Define all menu items with their role requirements

const allMenuItems = [
    {
        label: 'Dashboard',
        items: [
            { 
                label: 'Overview', 
                icon: 'pi pi-fw pi-home', 
                to: '/app/overview',
                roles: ['Admin', 'Staff']
            },
            { 
                label: 'My Assignments', 
                icon: 'pi pi-fw pi-list-check', 
                to: '/app/my-assignments',
                roles: ['Teacher']
            },
            {
                label: 'Profile', 
                icon: 'pi pi-user', 
                to: '/app/profile',
                roles: ['Admin', 'Teacher', 'Staff']
            },
            {
            label: 'My Entered Marks', 
            icon: 'pi pi-fw pi-chart-bar', 
            to: '/app/scores/entry?openTeacherSummary=1',
            roles: ['Teacher']
            }
        ]
    },
    {
      label: 'Users',
      items: [
          { 
              label: 'Manage Users', 
              icon: 'pi pi-fw pi-users', 
              to: '/app/users',
              roles: ['Admin', 'Staff']
          },
      ]
    },
    {
        label: 'Students',
        items: [
            { 
                label: 'All Students', 
                icon: 'pi pi-fw pi-users', 
                to: '/app/students',
                roles: ['Admin', 'Staff']
            },
            { 
                label: 'Add Student', 
                icon: 'pi pi-fw pi-user-plus', 
                to: '/app/students/add',
                roles: ['Admin','Staff']
            },
            { 
                label: 'Bulk Import', 
                icon: 'pi pi-fw pi-upload', 
                to: '/app/students/import',
                roles: ['Admin']
            },
            // { 
            //     label: 'Student Promotion', 
            //     icon: 'pi pi-fw pi-arrow-up', 
            //     to: '/app/students/promotion',
            //     roles: ['Admin','Staff']
            // },
            { 
                label: 'Secondary Subject Assignment', 
                icon: 'pi pi-fw pi-graduation-cap', 
                to: '/app/students/secondary-subjects',
                roles: ['Admin','Staff']
            },
        ]
    },
    {
        // label: 'Teachers',
        items: [
            { 
                label: 'My Homeroom Subjects', 
                icon: 'pi pi-fw pi-home', 
                to: '/app/teachers/homeroom-subjects',
                roles: ['Teacher'],
                requiresHomeroom: true,
                requiresSecondaryTeacher: true
            },
            { 
                label: 'Homeroom General Comments', 
                icon: 'pi pi-fw pi-comments', 
                to: '/app/teachers/homeroom-general-comments',
                roles: ['Teacher'],
                requiresHomeroom: true
            },
        ]
    },
    {
        label: 'Academic',
        items: [
            { 
                label: 'Classes', 
                icon: 'pi pi-fw pi-building', 
                to: '/app/grades',
                roles: ['Admin', 'Staff']
            },
            { 
                label: 'Subjects', 
                icon: 'pi pi-fw pi-book', 
                to: '/app/subjects',
                roles: ['Admin','Staff']
            },
            { 
                label: 'Assign Subject to Grade', 
                icon: 'pi pi-fw pi-link', 
                to: '/app/subject-grade/assignments',
                roles: ['Admin', 'Staff']
            },
            { 
                label: 'Bulk Assign to Class', 
                icon: 'pi pi-fw pi-users', 
                to: '/app/subject-grade/bulk-assign',
                roles: ['Admin', 'Staff']
            },
            { 
                label: 'Teacher Assignments', 
                icon: 'pi pi-fw pi-user-edit', 
                to: '/app/teacher-subject/assignments',
                roles: ['Admin','Staff']
            },
        ]
    },
    {
        label: 'Exams',
        items: [
            { 
                label: 'Mark Entry', 
                icon: 'pi pi-fw pi-pencil', 
                to: '/app/scores/entry',
                roles: ['Teacher']
            },
            { 
                label: 'Teacher Entered Marks Review', 
                icon: 'pi pi-fw pi-search', 
                to: '/app/scores/entry?openAdminSubjectReview=1',
                roles: ['Admin','Staff']
            },
            { 
                label: 'Exam Types', 
                icon: 'pi pi-fw pi-list', 
                to: '/app/manage-exams',
                roles: ['Admin']
            },
            // Academic Year creation (reference: Bluebird-Vue) — same label, icon, path, roles
            { 
                label: 'Academic Years', 
                icon: 'pi pi-fw pi-graduation-cap', 
                to: '/app/manage-years',
                roles: ['Admin']
            },
        ]
    },
    // {
    //     label: 'Reports',
    //     items: [
    //         { 
    //             label: 'Report Cards', 
    //             icon: 'pi pi-fw pi-file-pdf', 
    //             to: '/app/report-cards',
    //             roles: ['Admin','Staff']
    //         },
    //     ]
    // },
    {
        label: 'Settings',
        items: [
            // { 
            //     label: 'Settings', 
            //     icon: 'pi pi-fw pi-cog', 
            //     to: '/app/settings/system',
            //     roles: ['Admin','Staff']
            // },
            { 
                label: 'SMS Management', 
                icon: 'pi pi-fw pi-send', 
                to: '/app/settings/sms',
                roles: ['Admin','Staff']
            },
        ]
    },
];


// Check if user is authenticated
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Get current user info
const currentUser = computed(() => store.getters['auth/user']);
const userRoles = computed(() => store.getters['auth/userRoles']);
const isHomeroomTeacher = computed(() => store.getters['auth/isHomeroomTeacher']);
const isSecondaryTeacher = ref(false);

// Helper function to check if user has any of the required roles
const hasAnyRole = (requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return store.getters['auth/hasAnyRole'](requiredRoles);
};

// Create a computed property that filters menu items based on user's roles
const model = computed(() => {
  // If not authenticated, show minimal menu or login option
  if (!isAuthenticated.value) {
    return [
      {
        label: 'Menu',
        items: [
          { label: 'Login', icon: 'pi pi-fw pi-sign-in', to: '/auth/login' }
        ]
      }
    ];
  }

  // Filter menu sections and items based on user role
  const filteredMenuItems = allMenuItems
    .map(section => {
      // Check if entire section should be shown
      if (section.roles && !hasAnyRole(section.roles)) {
        return null;
      }

      // Filter items within the section
      const filteredItems = section.items.filter(item => {
        if (!hasAnyRole(item.roles)) return false;
        // If item is the homeroom page, also require homeroom assignment
        if (item.to === '/app/teachers/homeroom-subjects') {
          const needsSecondary = item.requiresSecondaryTeacher === true;
          return isHomeroomTeacher.value === true && (!needsSecondary || isSecondaryTeacher.value === true);
        }
        if (item.requiresHomeroom === true) {
          return isHomeroomTeacher.value === true;
        }
        // Only show for secondary teachers if flag is set
        if (item.requiresSecondaryTeacher === true) {
          if (!isSecondaryTeacher.value) return false;
        }
        return true;
      });

      // Only return section if it has visible items
      if (filteredItems.length > 0) {
        return {
          ...section,
          items: filteredItems
        };
      }

      return null;
    })
    .filter(section => section !== null);

  // Add logout item for all authenticated users
  filteredMenuItems.push({
    items: [{ 
      label: 'Logout', 
      icon: 'pi pi-fw pi-sign-out', 
      command: logout
    }]
  });

  return filteredMenuItems;
});

// Get current user info for display
const userDisplayInfo = computed(() => {
  if (!currentUser.value) return null;
  
  // Get user role - handle both array and string format
  const roles = userRoles.value;
  const displayRole = Array.isArray(roles) && roles.length > 0 
    ? roles[0] 
    : currentUser.value.role || 'User';
  
  return {
    name: currentUser.value.fullName || store.getters['auth/userName'] || currentUser.value.username,
    role: displayRole,
    email: store.getters['auth/userEmail'] || currentUser.value.email
  };
});

// Highlight effect for new feature
const highlightCheckReportCard = ref(true);
onMounted(() => {
  setTimeout(() => {
    highlightCheckReportCard.value = false;
  }, 5000);
  // Warm the homeroom status for teachers so menu can react
  const isTeacher = hasAnyRole(['Teacher']);
  if (isTeacher) {
    store.dispatch('auth/checkHomeroomStatus');
    // Try determine if secondary teacher using assignments
    examService.getTeacherAssignments().then(list => {
      const arr = Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : []);
      isSecondaryTeacher.value = arr.some(a => {
        const section = (a.gradeSection || a.GradeSection || '').toString().toLowerCase();
        if (section === 'secondary') return true;
        const g = (a.gradeName || a.GradeName || '').toString().toLowerCase();
        if (g.includes('secondary')) return true;
        if (/\bform\s*\d*/i.test(g)) return true;
        if (/\bjss?\s*\d+/i.test(g)) return true;
        if (/\bss\s*\d+/i.test(g)) return true;
        const m = g.match(/\b(grade|g)\s*(\d{1,2})\b/);
        if (m) { const num = parseInt(m[2], 10); if (!isNaN(num) && num >= 8) return true; }
        const nOnly = g.match(/\b(\d{1,2})\b/);
        if (nOnly) { const n = parseInt(nOnly[1], 10); if (!isNaN(n) && n >= 8) return true; }
        return false;
      });
    }).catch(() => {
      isSecondaryTeacher.value = false;
    });
  }
});
</script>

<template>
  <div>
    <!-- User info display -->
    <div v-if="isAuthenticated && userDisplayInfo" class="user-info-card">
      <div class="user-avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="user-details">
        <div class="user-name">{{ userDisplayInfo.name }}</div>
        <div class="user-role">{{ userDisplayInfo.role }}</div>
      </div>
    </div>
    
    <!-- Role-based menu -->
    <ul class="layout-menu">
      <template v-for="(item, i) in model" :key="i">
        <template v-if="!item.separator">
          <app-menu-item
            :item="item"
            :index="i"
            v-bind="item.label === 'Dashboard' ? { highlightCheckReportCard } : {}"
          >
            <template #default="{ item: menuItem }">
              <template v-for="subItem in menuItem.items">
                <li
                  v-if="subItem.label === 'Check Report Cards'"
                  :class="['new-feature-highlight', { 'active-highlight': highlightCheckReportCard }]"
                >
                  <app-menu-item :item="subItem" />
                </li>
                <template v-else>
                  <app-menu-item :item="subItem" />
                </template>
              </template>
            </template>
          </app-menu-item>
        </template>
        <li v-if="item.separator" class="menu-separator"></li>
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.user-info-card {
  display: flex;
  align-items: center;
  padding: 12px;
  margin: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    
    i {
      font-size: 18px;
    }
  }

  .user-details {
    flex: 1;
    
    .user-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }
    
    .user-role {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.layout-menu {
  margin-top: 8px;
}

.new-feature-highlight {
  position: relative;
  animation: shake-ring 0.5s cubic-bezier(.36,.07,.19,.97) both 0s 5;
  box-shadow: 0 0 0 3px #ffe066, 0 0 8px 2px #ffe066;
  border-radius: 8px;
  z-index: 2;
  transition: box-shadow 0.3s;
}
.active-highlight {
  animation: shake-ring 0.5s cubic-bezier(.36,.07,.19,.97) both 0s 5;
  box-shadow: 0 0 0 3px #ffe066, 0 0 8px 2px #ffe066;
}
@keyframes shake-ring {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
</style>