<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const router = useRouter();
const toast = useToast();

const email = ref('');
const username = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);
let isEnabled = ref(false);

// Add a ref to track if the last login attempt failed
const lastLoginFailed = ref(false);

const loginSuccess = ref(false); // New variable for possible future use, but not needed for immediate redirect

const login = async () => {
    if (!username.value || !password.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please enter username and password',
            closable: true,
            sticky: false
        });
        return;
    }

    loading.value = true;
    lastLoginFailed.value = false;

    try {
        // Dispatch login and get the response (which should have { token, user })
        const response = await store.dispatch('auth/login', {
            username: username.value,
            password: password.value
        });

        // Extract user object from store (should be set by the store action)
        const user = store.getters['auth/user'];
        // Fallback: if not in store, try from response
        const userObj = user || response?.data?.user || {};

        // Use roles from user object for redirect logic (handle both array and single role)
        let userRoles = [];
        if (userObj.roles && Array.isArray(userObj.roles)) {
            userRoles = userObj.roles;
        } else if (userObj.role) {
            userRoles = [userObj.role];
        }

        let redirectPath = '/';

        // Check for Admin role first
        if (userRoles.includes('Admin')) {
            redirectPath = '/app/profile';
        } else if (userRoles.includes('Teacher')) {
            redirectPath = '/app/scores/entry';
        } else if (userRoles.includes('Staff')) {
            redirectPath = '/app/overview';
        } else {
            redirectPath = '/app/overview';
        }

        // If a redirect query param is present, honor it (optional)
        const queryRedirect = router.currentRoute.value.query.redirect;
        if (queryRedirect) {
            redirectPath = queryRedirect;
        }

        toast.add({
            severity: 'success',
            summary: 'Login Successful',
            detail: 'You have been logged in successfully.',
            life: 1500,
            closable: true,
            sticky: false
        });

        router.push(redirectPath); // Immediate redirect
        password.value = '';
    } catch (error) {
        lastLoginFailed.value = true;
        console.error('Login error:', error);

        // Check for CORS errors specifically
        if (error.isCorsError || error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
            toast.add({
                severity: 'error',
                summary: 'Connection Error',
                detail: 'Cannot connect to the server. This appears to be a CORS configuration issue. The backend server needs to be configured to allow requests from this domain. Please contact your administrator.',
                life: 5000,
                closable: true,
                sticky: true
            });
        } else if (error.response && error.response.status === 401) {
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: 'Invalid user. Please check your credentials.',
                life: 1000,
                closable: true,
                sticky: true,
                id: new Date().getTime().toString()
            });
        } else if (error.response && error.response.status === 400) {
            const data = error.response.data;
            let errorMessage = data?.message || data?.detail || 'Invalid request. Check username and password.';
            if (data?.errors && typeof data.errors === 'object') {
                const first = Object.values(data.errors)[0];
                errorMessage = Array.isArray(first) ? first[0] : String(first);
            }
            console.warn('Login 400 response:', data);
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: errorMessage,
                life: 5000,
                closable: true,
                sticky: false
            });
        } else {
            let errorMessage = 'Invalid credentials';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                if (error.message.includes('No refresh token available')) {
                    errorMessage = 'Authentication failed. Please try again.';
                } else if (error.message.includes('Network error')) {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else {
                    errorMessage = error.message;
                }
            }
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: errorMessage,
                life: 3000,
                closable: true,
                sticky: false
            });
        }
        password.value = '';
    } finally {
        setTimeout(() => {
            loading.value = false;
        }, 300);
    }
};

const registerNavigation = () => {
    router.push('/auth/register');
};
</script>

<template>
    <Toast position="top-center" />
    <FloatingConfigurator />
    <div class="bg-surface-200 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center w-full">
            <!-- Responsive form container -->
            <div class="w-full max-w-lg py-20 px-4 sm:px-8" style="border-radius: 53px">
                <Message v-if="isEnabled" class="mb-6" severity="success" size="large">Login successful!</Message>
                <div class="text-center mb-8">
                    <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4 bluebird-brand">SUBLIME</div>
                    <span class="text-muted-color font-medium">Sign in to continue</span>
                </div>
                <form @submit.prevent="login">
                    <div>
                        <label for="User1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                        <InputText id="username" type="text" placeholder="Username" class="w-full mb-8" v-model="username" />
                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="w-full mb-4" fluid :feedback="false"></Password>
                        <div class="flex items-center justify-end mt-2 mb-8 gap-8">
                            <!-- <div class="flex items-center">
                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                <label for="rememberme1">Remember me</label>
              </div> -->
                            <!-- <span @click="registerNavigation" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Register</span> -->
                        </div>
                        <Button type="submit" label="Sign In" class="w-full" :loading="loading"></Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
