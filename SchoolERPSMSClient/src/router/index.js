import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import { authGuard } from './guard/auth.guard';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        // Redirect root to login
        {
            path: '/',
            redirect: '/auth/login'
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/register',
            name: 'register',
            component: () => import('@/views/pages/auth/Register.vue')
        },
        // All authenticated routes under /app
        {
            path: '/app',
            component: AppLayout,
            redirect: '/app/overview',
            children: [
                {
                    path: 'overview',
                    name: 'overview',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/dashboard/Dashboard.vue')
                },
                {
                    path: 'my-assignments',
                    name: 'MyAssignments',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/teachers/MyAssignments.vue')
                },
                {   
                    path: 'profile',
                    name: 'profile',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/users/Profile.vue')
                },
                {   
                    path: 'students',
                    name: 'students',
                    meta:{
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/StudentVue.vue')
                },
                {
                    path: 'users',
                    name: 'users',
                    meta: {
                        requiresAuth: true,
                        // roles: ['admin']
                    },
                    component: () => import('@/views/users/Users.vue')
                },
                {
                    path: 'students/add',
                    name: 'AddStudent', 
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/CreateStudent.vue')
                },
                {
                    path: 'students/edit/:id',
                    name: 'EditStudent',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/CreateStudent.vue') // Same component!
                },
                {
                    path: 'students/import',
                    name: 'AddBulkStudent',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/StudentImportCsv.vue')
                },
                {
                    path: 'students/promotion',
                    name: 'PromoteStudent',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/PromoteStudents.vue')
                },
                {
                    path: 'students/secondary-subjects',
                    name: 'SecondarySubjectAssignment',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/students/SecondarySubjectAssignment.vue')
                },
                {
                    path: 'teachers/homeroom-subjects',
                    name: 'HomeroomSubjectAssignment',
                    meta: {
                        requiresAuth: true,
                        roles: ['Teacher'],
                        requiresHomeroom: true
                    },
                    component: () => import('@/views/teachers/HomeroomSubjectAssignment.vue')
                },
                {
                    path: 'teachers/homeroom-general-comments',
                    name: 'HomeroomGeneralComments',
                    meta: {
                        requiresAuth: true,
                        roles: ['Teacher'],
                        requiresHomeroom: true
                    },
                    component: () => import('@/views/teachers/HomeroomGeneralComments.vue')
                },
                {
                    path: 'grades',
                    name: 'GradeList',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/classes/GradeList.vue')
                },
                {
                    path: 'subjects',
                    name: 'SubjectList',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/subjects/SubjectList.vue')
                },
                {
                    path: 'subject-grade/assignments',
                    name: 'AssignSubjectToGrade',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/subjects/AssignSubjectToGrade.vue')
                },
                {
                    path: 'teacher-subject/assignments',
                    name: 'AssignTeacherToSubject',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/subjects/AssignTeacherToSubject.vue')
                },
                {
                    path: 'scores/entry',
                    name: 'ScoresEntry',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/exams/ScoresEntry.vue')
                },
                {
                    path: 'manage-exams',
                    name: 'ManageExams',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/exams/ExamType.vue')
                },
                {
                    path: 'manage-years',
                    name: 'ManageYears',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/years/AcademicYears.vue')
                },
                {
                    path: 'report-cards',
                    name: 'ReportCards',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/report/ReportCard.vue')
                },
                {
                    path: 'settings/system',
                    name: 'SystemSettings',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/settings/System.vue')
                },
                {
                    path: 'settings/sms',
                    name: 'SMS',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/settings/SMS.vue')
                },
                {
                    path: 'teacher-reportcard',
                    name: 'MyReportCards',
                    meta: {
                        requiresAuth: true,
                    },
                    component: () => import('@/views/teachers/TeacherReportCard.vue')
                }
            ]
        }
    ]
});

router.beforeEach(authGuard);
export default router;
