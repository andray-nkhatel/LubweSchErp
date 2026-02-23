// src/services/api.service.js
import { ensureNumber } from '@/service/numberUtils.js';
import axios from 'axios';

// Get API base URL from environment variable
// Simply use VITE_API_BASE_URL directly - no complex logic needed
// Examples:
//   Development: VITE_API_BASE_URL=http://localhost:5287/api
//   Production:  VITE_API_BASE_URL=https://bluebirdhub.somee.com/api
//   Docker:      VITE_API_BASE_URL=/api (uses nginx reverse proxy)
function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Use default value for Docker/production if not set
  // Default to /api for Docker compose setup (nginx reverse proxy)
  const defaultUrl = '/api';
  const apiUrl = envUrl || defaultUrl;
  
  if (!envUrl) {
    console.warn('⚠️ VITE_API_BASE_URL is not set in environment variables!');
    console.warn(`💡 Using default value: ${defaultUrl}`);
    console.warn('💡 For production, set VITE_API_BASE_URL in your .env file or Docker build args');
  }
  
  // Log in development for debugging
  if (import.meta.env.DEV) {
    console.log('✅ Using API base URL:', apiUrl);
  }
  
  return apiUrl;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  // Transform response to handle non-JSON responses gracefully
  transformResponse: [
    function (data, headers) {
      const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
      
      // If it's not JSON, return as string
      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        try {
          // Try to parse as JSON
          if (typeof data === 'string') {
            return JSON.parse(data);
          }
          return data;
        } catch (e) {
          // If JSON parsing fails, return as string for error handling
          console.warn('Failed to parse JSON response:', e);
          return data;
        }
      }
      
      // For non-JSON responses (HTML, XML, etc.), return as string
      return data;
    }
  ]
});

// Log the base URL for debugging (only in development for cleaner production builds)
if (import.meta.env.DEV) {
  console.log('🔍 API Configuration:');
  console.log('  Base URL:', apiClient.defaults.baseURL);
  console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '(not set)');
  console.log('  Environment mode:', import.meta.env.MODE);
  console.log('  Is development:', import.meta.env.DEV);
}


// Add request interceptor to attach token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Optional: Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config.data);
      console.log('🔍 Request config:', {
        baseURL: config.baseURL,
        url: config.url,
        params: config.params,
        headers: config.headers,
        hasAuthToken: !!config.headers.Authorization
      });
    }
    
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
 apiClient.interceptors.response.use(
   response => {
     // Optional: Log responses in development
     if (import.meta.env.DEV) {
       console.log(`✅ ${response.status} ${response.config.url}`, response.data);
     }
     return response;
   },
   error => {
     // Handle different error scenarios
     if (error.response) {
       const { status, data, headers } = error.response;    
       const url = error.config?.url || '';
       const isHomeroomInfo = url.includes('/homeroom/grade-info');
       
       // Check if response is HTML/XML (non-JSON) - common for server error pages
       const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
       const isNonJsonResponse = typeof data === 'string' || 
                                 contentType.includes('text/html') || 
                                 contentType.includes('text/xml') ||
                                 contentType.includes('application/xml');
       
       // Log error in development (suppress noisy homeroom 403 logs)
       if (import.meta.env.DEV && !(isHomeroomInfo && status === 403)) {
         console.error(`❌ ${status} ${url}`, isNonJsonResponse ? `[Non-JSON response: ${contentType}]` : data);
         if (isNonJsonResponse && typeof data === 'string') {
           console.error('Response preview:', data.substring(0, 200));
         }
       }    
       
       // Handle unauthorized - redirect to login
       if (status === 401) {
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         window.location.href = '/auth/login';
         return Promise.reject(new Error('Session expired. Please log in again.'));
       }    
       
       // Handle forbidden - preserve backend message if available
       if (status === 403) {
         const backendMessage = (typeof data === 'string') ? data : (data?.message || data?.title);
         return Promise.reject(new Error(backendMessage || 'Access denied. Insufficient permissions.'));
       }    
       
       // Handle server errors (500+) with better messaging
       if (status >= 500) {
         let errorMessage = `Server error (${status}).`;
         if (isNonJsonResponse) {
           errorMessage += ' The server returned an error page. Please check server logs or try again later.';
           // Attach original response to error for debugging
           error.isNonJsonResponse = true;
           error.rawResponse = data;
         } else if (data?.message) {
           errorMessage = data.message;
         } else if (data?.title) {
           errorMessage = data.title;
         } else if (data?.error) {
           errorMessage = data.error;
         }
         // Preserve the original error structure so components can access error.response
         error.userMessage = errorMessage;
         return Promise.reject(error);
       }    
       
       // Handle other errors with API message
       const message = data?.message || data?.title || data?.error || 'An error occurred';
       error.userMessage = message;
       return Promise.reject(error);
     }   
     
    // Network errors (including CORS)
    if (error.request) {
      // Check if this is a CORS error
      const isCorsError = !error.response && 
                         (error.message?.includes('CORS') || 
                          error.message?.includes('cross-origin') ||
                          error.message?.includes('Same Origin Policy') ||
                          error.code === 'ERR_NETWORK' ||
                          error.code === 'ERR_CONNECTION_REFUSED');
      
      if (isCorsError) {
        const frontendOrigin = window.location.origin;
        const backendUrl = apiClient.defaults.baseURL;
        
        // Enhanced CORS error message
        let errorMessage = `CORS Configuration Error: The backend API at ${backendUrl} is not configured to allow requests from ${frontendOrigin}.`;
        
        // Check if we're in development mode and suggest using proxy
        if (import.meta.env.DEV) {
          errorMessage += `\n\nFor local development, you can:\n1. Use the Vite proxy by setting VITE_API_BASE_URL=/api in your .env file\n2. Or configure the backend to allow requests from ${frontendOrigin}`;
        } else {
          errorMessage += `\n\nThe backend CORS configuration must include:\n- Allow-Origin header set to: ${frontendOrigin}\n- Or Allow-Origin: * (less secure, but works for all origins)\n- Proper Allow-Methods, Allow-Headers, and Allow-Credentials headers`;
          errorMessage += `\n\nBackend fix needed: Add ${frontendOrigin} to the allowed origins in your CORS configuration.`;
        }
        
        errorMessage += `\n\nPlease contact the backend administrator to fix the CORS configuration.`;
        
        console.error('🚫 CORS Error Details:', {
          frontendOrigin,
          backendUrl,
          message: errorMessage,
          error: error.message,
          code: error.code,
          env: {
            mode: import.meta.env.MODE,
            isDev: import.meta.env.DEV,
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL
          }
        });
        
        // Create a more descriptive error object
        const corsError = new Error(errorMessage);
        corsError.isCorsError = true;
        corsError.frontendOrigin = frontendOrigin;
        corsError.backendUrl = backendUrl;
        return Promise.reject(corsError);
      }
      
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
     
     // Other errors
     return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
   }
 );

// apiClient.interceptors.response.use(
//   response => {
//     // Optional: Log responses in development
//     if (import.meta.env.DEV) {
//       console.log(`✅ ${response.status} ${response.config.url}`, response.data);
//     }
//     return response;
//   },
//   error => {
//     // Handle different error scenarios
//     if (error.response) {
//       const { status, data } = error.response;
      
//       // Log error in development - but preserve the original error
//       if (import.meta.env.DEV) {
//         console.error(`❌ ${status} ${error.config.url}`, data);
//         console.log('🔍 Full error response data:', JSON.stringify(data, null, 2));
//       }
      
//       // DON'T modify the error - just attach the response for debugging
//       error.backendData = data;
//       error.backendStatus = status;
      
//       // Only handle auth redirects here, preserve other errors as-is
//       if (status === 401) {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         window.location.href = '/auth/login';
//       }
      
//       // Return the original error so we can access error.response.data
//       return Promise.reject(error);
//     } 
    
//     // Network errors
//     if (error.request) {
//       return Promise.reject(new Error('Network error. Please check your connection.'));
//     }
    
//     // Other errors  
//     return Promise.reject(error);
//   }
// );

export const promotionData = {}

// API Service Methods
export const authService = {
 
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);

    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Convert single role to roles array for consistency
      const userData = { ...response.data.user };
      if (userData.role && !userData.roles) {
        userData.roles = [userData.role];
      } else if (!userData.roles) {
        userData.roles = [];
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Convert single role to roles array for consistency
      const userData = { ...response.data.user };
      if (userData.role && !userData.roles) {
        userData.roles = [userData.role];
      } else if (!userData.roles) {
        userData.roles = [];
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Don't try to call logout endpoint if it doesn't exist
    // window.location.href = '/auth/login';
    // Instead, just redirect to login page
    window.location.href = '/auth/login';
  }
};

export const studentService = {
  async getAll(includeArchived = false) {
    const response = await apiClient.get(`/students?includeArchived=${includeArchived}`);
    // Handle ApiResponse wrapper: { success, message, data: [...], errors }
    const payload = response.data;
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },

  async getById(id) {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  async create(student) {
    const response = await apiClient.post('/students', student);
    return response.data;
  },

  async update(id, student) {
    const response = await apiClient.put(`/students/${id}`, student);
    return response.data;
  },

  async delete(id) {
    await apiClient.delete(`/students/${id}`);
  },

  async getByGrade(gradeId) {
    const response = await apiClient.get(`/students/grade/${gradeId}`);
    return response.data;
  },

  async archive(id) {
    await apiClient.post(`/students/${id}/archive`);
  },

  async assignOptionalSubjects(studentId, subjectIds) {
    // If subjectIds contains strings (subject names), convert them to IDs
    let processedSubjectIds = subjectIds;
    
    if (subjectIds.length > 0 && typeof subjectIds[0] === 'string') {
      try {
        // Get all subjects to map names to IDs
        const allSubjects = await subjectService.getAll();
        const subjectMap = new Map();
        
        // Create a map of subject names to IDs
        allSubjects.forEach(subject => {
          subjectMap.set(subject.name, subject.id);
        });
        
        console.log('Available subjects in database:', allSubjects.map(s => s.name));
        console.log('Subject names to convert:', subjectIds);
        
        // Convert subject names to IDs with fuzzy matching
        processedSubjectIds = subjectIds.map(subjectName => {
          let subjectId = subjectMap.get(subjectName);
          
          // If exact match not found, try fuzzy matching
          if (!subjectId) {
            const availableSubjects = Array.from(subjectMap.keys());
            console.log(`Exact match not found for "${subjectName}". Available subjects:`, availableSubjects);
            
            // Try case-insensitive matching
            const lowerSubjectName = subjectName.toLowerCase();
            const matchingSubject = availableSubjects.find(available => 
              available.toLowerCase() === lowerSubjectName
            );
            
            if (matchingSubject) {
              subjectId = subjectMap.get(matchingSubject);
              console.log(`Found case-insensitive match: "${subjectName}" -> "${matchingSubject}"`);
            } else {
              // Try partial matching
              const partialMatch = availableSubjects.find(available => 
                available.toLowerCase().includes(lowerSubjectName) || 
                lowerSubjectName.includes(available.toLowerCase())
              );
              
              if (partialMatch) {
                subjectId = subjectMap.get(partialMatch);
                console.log(`Found partial match: "${subjectName}" -> "${partialMatch}"`);
              } else {
                console.error(`Subject "${subjectName}" not found. Available subjects:`, availableSubjects);
                throw new Error(`Subject "${subjectName}" not found. Available subjects: ${availableSubjects.join(', ')}`);
              }
            }
          }
          
          return subjectId;
        });
        
        console.log('Converted subject names to IDs:', processedSubjectIds);
      } catch (error) {
        console.error('Error converting subject names to IDs:', error);
        throw new Error(`Failed to convert subject names to IDs: ${error.message}`);
      }
    }
    
    const response = await apiClient.post(`/students/${studentId}/assign-optional-subjects`, {
      SubjectIds: processedSubjectIds
    });
    return response.data;
  },

  async removeOptionalSubjects(studentId) {
    await apiClient.delete(`/students/${studentId}/remove-optional-subjects`);
  },

  async promoteStudents(promotionData) {
    const response = await apiClient.post('/students/promote', promotionData);
    return response.data;
  },

  async importFromCsv(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/students/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Backend returns ApiResponse<ImportResult<StudentDto>>
      // Extract the data from the response
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error importing students from CSV:', error);
      throw error;
    }
  },

  async downloadTemplate() {
    const response = await apiClient.get('/students/template', {
      responseType: 'blob'
    });
    return response.data;
  },

  async createMinimal(student) {
    // Expects: { firstName, lastName, gradeId }
    try {
      const response = await apiClient.post('/students/minimal', student);
      return response.data;
    } catch (error) {
      console.error('Error creating student (minimal):', error);
      // Re-throw with better context
      if (error.response) {
        const { status, data } = error.response;
        // If we got XML/HTML error page (500 error), provide clearer message
        if (status === 500 && typeof data === 'string') {
          error.userMessage = 'Server error occurred while creating student. Please check server logs or contact support.';
        }
      }
      throw error;
    }
  },

  async updateMinimal(id, student) {
    // Expects: { firstName, lastName, gradeId, isActive }
    const response = await apiClient.put(`/students/minimal/${id}`, student);
    return response.data;
  }
};
export const gradeService = {
  async getAll(includeInactive = false) {
    // You may need to add a query parameter for inactive grades
    // or modify your C# controller to accept this parameter
    const response = await apiClient.get('/grades', {
      params: { includeInactive }
    });
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/grades/${id}`);
    return response.data;
  },

  async create(grade) {
    // Map your frontend grade object to match the CreateGradeDto
    const createGradeDto = {
      name: grade.name,
      stream: grade.stream,
      level: grade.level || 1,
      section: grade.section,
      homeroomTeacherId: grade.homeroomTeacherId || null // This is required by your API
    };
    
    const response = await apiClient.post('/grades', createGradeDto);
    return response.data;
  },

  async update(id, grade) {
    // You'll need to add an update endpoint in your C# controller
    const response = await apiClient.put(`/grades/${id}`, grade);
    return response.data;
  },

  async toggleStatus(id) {
    // You'll need to add this endpoint in your C# controller
    const response = await apiClient.patch(`/grades/${id}/toggle-status`);
    return response.data;
  },

  async assignHomeroomTeacher(gradeId, teacherId) {
    const response = await apiClient.post(`/grades/${gradeId}/assign-homeroom-teacher`, {
      teacherId: teacherId
    });
    return response.data;
  }
};


export const subjectService = {

  async getAll(includeInactive = false) {
    try {
      const params = includeInactive ? '?includeInactive=true' : '';
      const response = await apiClient.get(`/subjects${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },


  async getById(id) {
    try {
      const response = await apiClient.get(`/subjects/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subject ${id}:`, error);
      throw error;
    }
  },


  async create(subject) {
    try {
      const response = await apiClient.post('/subjects', subject);
      return response.data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  },

 
  async update(id, subject) {
    try {
      const response = await apiClient.put(`/subjects/${id}`, subject);
      return response.data;
    } catch (error) {
      console.error(`Error updating subject ${id}:`, error);
      throw error;
    }
  },


  async delete(id) {
    try {
      await apiClient.delete(`/subjects/${id}`);
    } catch (error) {
      console.error(`Error deleting subject ${id}:`, error);
      throw error;
    }
  },


  async toggleStatus(id) {
    try {
      const response = await apiClient.patch(`/subjects/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling subject ${id} status:`, error);
      throw error;
    }
  },


  async getSubjectAssignments(subjectId) {
    try {
      const response = await apiClient.get(`/subjects/${subjectId}/assignments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignments for subject ${subjectId}:`, error);
      throw error;
    }
  },


  async assignToGrade(subjectId, gradeId, assignmentData) {
    try {
      const response = await apiClient.post(
        `/subjects/${subjectId}/assign-to-grade/${gradeId}`, 
        assignmentData
      );
      return response;
    } catch (error) {
      console.error(`Error assigning subject ${subjectId} to grade ${gradeId}:`, error);
      throw error;
    }
  },

  async bulkAssignSubjectsToGrade(gradeId, bulkData) {
    try {
      const response = await apiClient.post(
        `/subjects/grades/${gradeId}/assign-subjects`,
        bulkData
      );
      return response.data;
    } catch (error) {
      console.error(`Error bulk assigning subjects to grade ${gradeId}:`, error);
      throw error;
    }
  },

  async syncGradeStudentSubjects(gradeId, syncData) {
    try {
      const response = await apiClient.post(
        `/subjects/grades/${gradeId}/sync-student-subjects`,
        syncData
      );
      return response.data;
    } catch (error) {
      console.error(`Error syncing student subjects for grade ${gradeId}:`, error);
      throw error;
    }
  },

  async getGradeSubjectsWithInheritance(gradeId, includeInheritance = false) {
    try {
      const response = await apiClient.get(
        `/subjects/grades/${gradeId}/subjects?includeInheritance=${includeInheritance}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching subjects for grade ${gradeId}:`, error);
      throw error;
    }
  },

  
  async assignTeacher(subjectId, assignmentData) {
    try {
      const response = await apiClient.post(`/subjects/${subjectId}/assign-teacher`, assignmentData);
      return response.data;
    } catch (error) {
      console.error(`Error assigning teacher to subject ${subjectId}:`, error);
      throw error;
    }
  },


  async assignTeacherToMultipleGrades(subjectId, assignmentData) {
    try {
      const response = await apiClient.post(`/subjects/${subjectId}/assign-teacher-multiple-grades`, assignmentData);
      return response.data;
    } catch (error) {
      console.error(`Error assigning teacher to multiple grades for subject ${subjectId}:`, error);
      throw error;
    }
  },

  
  async bulkAssignTeachersToSubjects(bulkAssignmentData) {
    try {
      const response = await apiClient.post('/subjects/bulk-assign', bulkAssignmentData);
      return response.data;
    } catch (error) {
      console.error('Error performing bulk assignment:', error);
      throw error;
    }
  },

 
  async importFromCsv(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/subjects/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing subjects from CSV:', error);
      throw error;
    }
  },

 
  async transferAssignments(transferData) {
    try {
      const response = await apiClient.post('/subjects/transfer-assignments', transferData);
      return response.data;
    } catch (error) {
      console.error('Error transferring assignments:', error);
      throw error;
    }
  },

 
  async removeTeacherAssignment(assignmentId) {
    try {
      await apiClient.delete(`/subjects/assignments/${assignmentId}`);
    } catch (error) {
      console.error(`Error removing assignment ${assignmentId}:`, error);
      throw error;
    }
  },

 
  async getByGrade(gradeId) {
    try {
      const response = await apiClient.get(`/subjects/grade/${gradeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subjects for grade ${gradeId}:`, error);
      throw error;
    }
  },

 
  async getByTeacher(teacherId) {
    try {
      const response = await apiClient.get(`/subjects/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subjects for teacher ${teacherId}:`, error);
      throw error;
    }
  },

 
  async search(query) {
    try {
      const response = await apiClient.get(`/subjects/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching subjects:', error);
      throw error;
    }
  },

 
  async getStatistics(subjectId = null) {
    try {
      const url = subjectId ? `/subjects/${subjectId}/statistics` : '/subjects/statistics';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching subject statistics:', error);
      throw error;
    }
  },


  async toggleStatus(id, isActive) {
    try {
      const response = await apiClient.patch(`/subjects/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error(`Error toggling subject ${id} status:`, error);
      throw error;
    }
  },


  async getUnassignedForGrade(gradeId) {
    try {
      const response = await apiClient.get(`/subjects/unassigned/grade/${gradeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching unassigned subjects for grade ${gradeId}:`, error);
      throw error;
    }
  },

 
  async getAssignmentConflicts() {
    try {
      const response = await apiClient.get('/subjects/assignment-conflicts');
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment conflicts:', error);
      throw error;
    }
  },

 
  async resolveConflict(conflictId, resolution) {
    try {
      const response = await apiClient.post(`/subjects/conflicts/${conflictId}/resolve`, resolution);
      return response.data;
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error);
      throw error;
    }
  },

  async getTeacherAssignments(teacherId, includeInactive = false) {
    try {
      const params = includeInactive ? '?includeInactive=true' : '';
      const response = await apiClient.get(`/subjects/assignments/teacher/${teacherId}${params}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignments for teacher ${teacherId}:`, error);
      throw error;
    }
  },

  async getOptionalSubjectsForGrade(gradeId) {
    try {
      const response = await apiClient.get(`/subjects/optional/${gradeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching optional subjects for grade ${gradeId}:`, error);
      throw error;
    }
  },


};

export const examService = {
  // ===== CORE EXAM SCORE ENDPOINTS =====
  
  // Get exam scores for a student
  async getStudentScores(studentId, academicYear, term) {
    const response = await apiClient.get(`/exams/student/${studentId}/scores?academicYear=${academicYear}&term=${term}`);
    return response.data;
  },

  // Get per-subject Test1, Mid(Test2), EndTerm for a student in a term (backend summary endpoint)
  async getStudentTermSummary(studentId, academicYear, term) {
    const response = await apiClient.get(`/exams/student/${studentId}/term-summary`, {
      params: { academicYear, term }
    });
    return response.data;
  },

  // Get per-subject Test1, Mid(Test2), EndTerm for each student in a grade for a term
  async getGradeTermSummary(gradeId, academicYear, term) {
    const response = await apiClient.get(`/exams/grade/${gradeId}/term-summary`, {
      params: { academicYear, term }
    });
    return response.data;
  },

  // Get teacher-specific subject summary for secondary subject teachers
  async getTeacherSubjectSummary(subjectId, gradeId, academicYear, term) {
    const response = await apiClient.get('/exams/teacher/subject-summary', {
      params: { subjectId, gradeId, academicYear, term }
    });
    return response.data;
  },

  // Admin: Get subject summary for a grade/year/term, optional teacher filter
  async getAdminSubjectSummary(subjectId, gradeId, academicYear, term, teacherId = null) {
    const response = await apiClient.get('/exams/admin/subject-summary', {
      params: { subjectId, gradeId, academicYear, term, ...(teacherId ? { teacherId } : {}) }
    });
    return response.data;
  },

  // Get exam scores for a grade/class
  async getGradeScores(gradeId, academicYear, term) {
    const response = await apiClient.get(`/exams/grade/${gradeId}/scores?academicYear=${academicYear}&term=${term}`);
    return response.data;
  },



// Replace your submitScore method with this enhanced debug version
async submitScore(scoreData) {
  try {
    console.log('📤 examService.submitScore called with:', scoreData)
    
    // 1. Validate incoming data first
    const validationErrors = this.validateScoreData(scoreData);
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors before API call:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // 2. Build payload with explicit type conversion and validation
    const isAbsentFlag = scoreData.isAbsent === true;
    const academicYearValue = scoreData.academicYear ?? scoreData.academicYearId;

    const payload = {
      studentId: ensureNumber(scoreData.studentId, 'studentId'),
      subjectId: ensureNumber(scoreData.subjectId, 'subjectId'), 
      examTypeId: ensureNumber(scoreData.examTypeId, 'examTypeId'),
      // Always use a number for score (0 when absent, not null) to avoid Decimal conversion errors
      score: isAbsentFlag ? 0 : ensureNumber(scoreData.score, 'score'),
      academicYear: ensureNumber(academicYearValue, 'academicYear'),
      term: ensureNumber(scoreData.term, 'term'),
      // Include gradeId for backend authorization checks (subject+grade+student)
      gradeId: scoreData.gradeId !== undefined ? ensureNumber(scoreData.gradeId, 'gradeId') : undefined,
      // Pass isAbsent explicitly if provided
      isAbsent: scoreData.isAbsent != null ? Boolean(scoreData.isAbsent) : undefined
    }
    
    // Only include comments if they exist and are not empty
    if (scoreData.comments && typeof scoreData.comments === 'string' && scoreData.comments.trim() !== '') {
      payload.comments = scoreData.comments?.trim() || '';
    }

    //payload.comments = scoreData.comments?.trim() || '';

    
    // 3. Final payload validation
    console.log('📦 API Payload being sent:', payload)
    console.log('📊 Payload types:', {
      studentId: typeof payload.studentId,
      subjectId: typeof payload.subjectId,
      examTypeId: typeof payload.examTypeId,
      score: typeof payload.score,
      academicYear: typeof payload.academicYear,
      term: typeof payload.term,
      gradeId: typeof payload.gradeId,
      isAbsent: typeof payload.isAbsent,
      comments: typeof payload.comments
    });

    // 3a. Optional pre-check: verify teacher assignment to subject+grade
    try {
      const currentUser = getCurrentUser();
      if (currentUser?.id && payload.subjectId && payload.gradeId) {
        const canEnter = await this.canTeacherEnterScore(currentUser.id, payload.subjectId, payload.gradeId);
        if (canEnter === false) {
          const message = 'You are not assigned to enter scores for this subject and grade.';
          console.warn('⛔ Pre-check failed:', { teacherId: currentUser.id, subjectId: payload.subjectId, gradeId: payload.gradeId });
          throw new Error(message);
        }
      }
    } catch (precheckError) {
      // If the pre-check endpoint itself errors, log and proceed to actual submit so backend remains source of truth
      console.warn('⚠️ Pre-check error (continuing to submit anyway):', precheckError?.message || precheckError);
    }

    // 3b. Optional pre-check: verify the student belongs to the selected grade (helps avoid 403s)
    try {
      if (payload.studentId && payload.gradeId) {
        const student = await studentService.getById(payload.studentId);
        const studentGradeId = student?.gradeId ?? student?.grade?.id;
        if (studentGradeId && Number(studentGradeId) !== Number(payload.gradeId)) {
          const message = `Selected student is not in grade ${payload.gradeId} (student gradeId: ${studentGradeId}).`;
          console.warn('⛔ Student-grade mismatch:', { studentId: payload.studentId, studentGradeId, selectedGradeId: payload.gradeId });
          throw new Error(message);
        }
      }
    } catch (studentCheckError) {
      console.warn('⚠️ Student-grade pre-check warning:', studentCheckError?.message || studentCheckError);
      // Continue to submit; backend remains the final authority
    }

    const response = await apiClient.post('/exams/scores', payload)
    console.log('✅ API Response received:', response.data)
    return response.data
    
  } catch (error) {
    console.error('❌ Failed to submit score:', error)

    if (error.response?.data?.errors) {
      console.group('🔍 Validation Errors');
      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`);
      });
      console.groupEnd();
    }
    
    
    // ENHANCED ERROR LOGGING - This is the critical part
    if (error.response) {
      console.group('🚨 DETAILED ERROR ANALYSIS')
      console.error('Status:', error.response.status)
      console.error('Status Text:', error.response.statusText)
      console.error('Headers:', error.response.headers)
      console.error('Raw Response Data:', error.response.data)
      console.error('Response Data Type:', typeof error.response.data)
      console.error('Response Data as JSON:', JSON.stringify(error.response.data, null, 2))
      console.error('Original Score Data:', scoreData)
      console.error('Final Payload Sent:', payload)
      console.groupEnd()
      
      // Try to extract and display validation errors in multiple formats
      const responseData = error.response.data;
      
      if (responseData) {
        // Format 1: Standard ASP.NET Core validation response
        if (responseData.errors) {
          console.error('🔍 ASP.NET Core Validation Errors:')
          Object.keys(responseData.errors).forEach(field => {
            console.error(`  ${field}: ${responseData.errors[field].join(', ')}`)
          })
        }
        
        // Format 2: Custom validation response
        if (responseData.message) {
          console.error('🔍 Server Message:', responseData.message)
        }
        
        // Format 3: Simple string error
        if (typeof responseData === 'string') {
          console.error('🔍 String Error:', responseData)
        }
        
        // Format 4: Array of errors
        if (Array.isArray(responseData)) {
          console.error('🔍 Error Array:', responseData)
        }
        
        // Format 5: ModelState errors
        if (responseData.modelState) {
          console.error('🔍 ModelState Errors:', responseData.modelState)
        }
      }
    } else if (error.request) {
      console.error('❌ Network Error - No response received:', error.request)
    } else {
      console.error('❌ Request Setup Error:', error.message)
    }
    
    throw error
  }
},



debugScoreDataFlow(change, context) {
  console.log('🔍 Debug Score Data Flow Input:', { change, context });
  
  // More robust field extraction
  const scoreData = {
    studentId: change.studentId,
    subjectId: context.currentSubject?.id || context.currentSubject,
    examTypeId: context.currentExamType?.id || context.currentExamType,
    academicYearId: context.selectedAcademicYear?.id || context.selectedAcademicYear,
    term: context.selectedTerm,
    score: change.score,
    gradeId: change.gradeId,
    // Add any other fields your API expects
  };

  // Additional debugging to understand the structure
  console.log('🔍 Context breakdown:', {
    currentSubject: context.currentSubject,
    currentExamType: context.currentExamType,
    selectedAcademicYear: context.selectedAcademicYear,
    selectedTerm: context.selectedTerm
  });

  // Validate required fields
  const requiredFields = ['studentId', 'subjectId', 'examTypeId', 'academicYearId', 'term'];
  const missingFields = requiredFields.filter(field => !scoreData[field]);
  
  if (missingFields.length > 0) {
    console.warn('⚠️ Missing required fields:', missingFields);
    console.warn('💡 This usually means the user hasn\'t selected all required options in the UI');
  }

  console.log('✅ Constructed Score Data:', scoreData);
  
  return scoreData; // Return plain object, NOT a Promise
},



  // Update existing score
  async updateScore(scoreId, scoreData) {
    const response = await apiClient.put(`/exams/scores/${scoreId}`, scoreData);
    return response.data;
  },

  // Delete score
  async deleteScore(scoreId) {
    const response = await apiClient.delete(`/exams/scores/${scoreId}`);
    return response.data;
  },

  // Bulk submit scores
  async bulkSubmitScores(scoresData) {
    const response = await apiClient.post('/exams/scores/bulk', scoresData);
    return response.data;
  },

// ===== ABSENCE MANAGEMENT ENDPOINTS =====

// Toggle absent status for a single score
async toggleAbsentStatus(scoreId, currentIsAbsent = false) {
  // Since the toggle-absent endpoint consistently returns 404, 
  // we'll use the working UpdateScore endpoint instead
  try {
    console.log(`🔄 Attempting to toggle absent status for score ID: ${scoreId}, currentIsAbsent: ${currentIsAbsent}`);
    
    const response = await apiClient.put(`/exams/scores/${scoreId}`, {
      isAbsent: !currentIsAbsent,
      // Always set score to 0 when toggling absent status:
      // - When toggling FROM absent TO present: need valid numeric score (0), not null
      // - When toggling FROM present TO absent: set to 0
      score: 0
    });
    
    console.log(`✅ Toggle successful for score ID: ${scoreId}`, response.data);
    return response.data;
  } catch (error) {
    console.log(`❌ Toggle failed for score ID: ${scoreId}`, error);
    
    // Check if it's a 404 error that was converted by the interceptor
    if (error.message === 'An error occurred' || error.message.includes('404')) {
      // Create a proper 404 error for the fallback logic
      const notFoundError = new Error('Score not found');
      notFoundError.response = { status: 404 };
      throw notFoundError;
    }
    
    // For other errors, re-throw as is
    throw error;
  }
},

// Bulk mark students as absent/present
async bulkMarkAbsent(data) {
  const response = await apiClient.post('/exams/scores/bulk-absent', data);
  return response.data;
},



  // ===== STUDENT ENDPOINTS =====
  
  // Get students by grade - CORRECTED ENDPOINT PATH
  async getStudentsByGrade(gradeId) {
    const response = await apiClient.get(`/students/grade/${gradeId}`);
    // Handle ApiResponse { data: [...] } or { Data: [...] }, or raw array
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    const list = payload?.data ?? payload?.Data;
    return Array.isArray(list) ? list : [];
  },

  // ===== EXAM TYPE ENDPOINTS =====
  
  // Get all exam types
  async getExamTypes() {
    const response = await apiClient.get('/exams/types');
    return response.data;
  },

  // Create new exam type (Admin only)
  async createExamType(examTypeData) {
    const response = await apiClient.post('/exams/types', examTypeData);
    return response.data;
  },

  // Update exam type (Admin only)
  async updateExamType(examTypeId, examTypeData) {
    const response = await apiClient.put(`/exams/types/${examTypeId}`, examTypeData);
    return response.data;
  },

  // Delete exam type (Admin only)
  async deleteExamType(examTypeId) {
    const response = await apiClient.delete(`/exams/types/${examTypeId}`);
    return response.data;
  },

  // ===== TEACHER ASSIGNMENT ENDPOINTS =====
  
  // Get teacher's assigned subjects and grades
  async getTeacherAssignments() {
    const response = await apiClient.get('/exams/teacher/assignments');
    return response.data;
  },

  async getTeacherAssignmentsStats() {
    const response = await apiClient.get('/exams/admin/teacher-assignments/stats');
    return response.data;
  },

  async statistics({ gradeId, subjectId, academicYear, term } = {}) {
    const response = await apiClient.get('/exams/statistics', {
      params: {
        ...(gradeId !== undefined && { gradeId }),
        ...(subjectId !== undefined && { subjectId }),
        ...(academicYear !== undefined && { academicYear }),
        ...(term !== undefined && { term }),
      }
    });
    return response.data;
  },

  // Check if teacher can enter score for subject/grade
  async canTeacherEnterScore(teacherId, subjectId, gradeId) {
    const response = await apiClient.get(`/exams/teacher/${teacherId}/can-enter-score?subjectId=${subjectId}&gradeId=${gradeId}`);
    return response.data;
  },

  // ===== EXPORT AND REPORTING ENDPOINTS =====
  
  // Export gradebook
  async exportGradeBook(gradeId, subjectId, academicYear, term, format = 'csv') {
    const params = new URLSearchParams({
      academicYear: academicYear.toString(),
      term: term.toString(),
      format
    });
    if (subjectId) params.append('subjectId', subjectId.toString());
    
    const response = await apiClient.get(`/exams/grade/${gradeId}/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate report card for student
  async generateReportCard(studentId, academicYear, term) {
    const response = await apiClient.get(`/exams/student/${studentId}/report-card?academicYear=${academicYear}&term=${term}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ===== STATISTICS ENDPOINTS =====
  
  // Get score statistics
  async getScoreStatistics(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`/exams/statistics?${params}`);
    return response.data;
  },

  // ===== ACADEMIC YEAR ENDPOINTS =====
  
  // Get academic years (using existing AcademicYears controller)
  async getAcademicYears() {
    const response = await apiClient.get('/AcademicYears');
    return response.data;
  },

  // Get active academic year
  async getActiveAcademicYear() {
    const response = await apiClient.get('/AcademicYears/active');
    return response.data;
  },

async createAcademicYear(formData){
  const response = await apiClient.post(`/AcademicYears/`, formData);
  return response.data;
},
  // async closeAcademicYear(academicYearId) {
  //   const response = await apiClient.post(`/AcademicYears/${academicYearId}/close`);
  //   return response.data;
  // },
  // async promoteAllStudents(academicYearId) {
  //   const response = await apiClient.post(`/AcademicYears/${academicYearId}/promote-all`);
  //   return response.data;
  // },

  // async archiveGraduates(academicYearId) {
  //   const response = await apiClient.post(`/AcademicYears/${academicYearId}/archive-graduates`);
  //   return response.data;
  // }




  // Update academic year (Admin only)
  async updateAcademicYear(id, academicYearData) {
    try {
      if (!id) {
        throw new Error('Academic year ID is required');
      }

      if (!academicYearData) {
        throw new Error('Academic year data is required');
      }

      const response = await apiClient.put(`/AcademicYears/${id}`, {
        name: academicYearData.name,
        startDate: academicYearData.startDate,
        endDate: academicYearData.endDate
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // Delete academic year (Admin only)
  async deleteAcademicYear(id) {
    try {
      if (!id) {
        throw new Error('Academic year ID is required');
      }

      await apiClient.delete(`/AcademicYears/${id}`);
      return { success: true };
    } catch (error) {
      this.handleApiError(error);
    }
  },
  async closeAcademicYear(academicYearId) {
    try {
      const response = await apiClient.post(`/AcademicYears/${academicYearId}/close`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // Promote all students to next grade (Admin only)
  async promoteAllStudents(academicYearId) {
    try {
      const response = await apiClient.post(`/AcademicYears/${academicYearId}/promote-all`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // Archive graduates (Admin only)
  async archiveGraduates(academicYearId) {
    try {
      const response = await apiClient.post(`/AcademicYears/${academicYearId}/archive-graduates`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // ===== UTILITY METHODS =====
  
  // Get gradebook data (combines grade scores with filtering)
  async getGradeBook(gradeId, subjectId, academicYear, term) {
    const response = await apiClient.get(`/exams/grade/${gradeId}/scores?academicYear=${academicYear}&term=${term}`);
    // Filter by subject if provided
    if (subjectId) {
      response.data = response.data.filter(score => score.subjectId === subjectId);
    }
    return response.data;
  },

  // Get terms (static data - you might want to make this dynamic)
  async getTerms() {
    // This could be a static return or API call depending on your needs
    return [
      { id: 1, name: 'Term 1' },
      { id: 2, name: 'Term 2' },
      { id: 3, name: 'Term 3' }
    ];
  },

  // Get current term (you might want to implement this on backend)
  async getCurrentTerm() {
    const activeYear = await this.getActiveAcademicYear();
    const now = new Date();
    const yearStart = new Date(activeYear.startDate);
    const yearEnd = new Date(activeYear.endDate);
    
    // Simple logic to determine current term based on date
    const totalDays = (yearEnd - yearStart) / (1000 * 60 * 60 * 24);
    const daysSinceStart = (now - yearStart) / (1000 * 60 * 60 * 24);
    const termProgress = daysSinceStart / totalDays;
    
    if (termProgress < 0.33) return 1;
    if (termProgress < 0.66) return 2;
    return 3;
  },

  // ===== DEBUG ENDPOINTS =====
  
  // Debug endpoints - using your existing endpoints
  async debugAuth() {
    const response = await apiClient.get('/exams/debug/auth');
    return response.data;
  },

  async debugRoles() {
    const response = await apiClient.get('/exams/debug/roles');
    return response.data;
  },

  // ===== ERROR HANDLING HELPERS =====
  
  // Helper method to handle API errors consistently
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message ?? (typeof data === 'string' ? data : null) ?? error.response.statusText;

      switch (status) {
        case 401:
          throw new Error('Authentication required. Please log in again.');
        case 403:
          throw new Error('Access denied. You do not have permission to perform this action.');
        case 404:
          throw new Error('Resource not found.');
        case 422:
          throw new Error(`Validation error: ${message}`);
        case 500:
          throw new Error(message || 'Server error. Please try again later.');
        default:
          throw new Error(`Error ${status}: ${message}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check if the backend is running.');
    } else {
      // Other error
      throw new Error('An unexpected error occurred.');
    }
  },

 

  // ===== VALIDATION HELPERS =====
  
  // Validate score data before submission
  validateScoreData(scoreData) {
    const errors = [];
    
    if (!scoreData.studentId) errors.push('Student ID is required');
    if (!scoreData.subjectId) errors.push('Subject ID is required');
    if (!scoreData.examTypeId) errors.push('Exam Type ID is required');
    if (!scoreData.gradeId) errors.push('Grade ID is required');
    // Allow score to be null/undefined if explicitly marked absent
    const isAbsent = scoreData.isAbsent === true;
    if (!isAbsent) {
      if (scoreData.score === null || scoreData.score === undefined) {
        errors.push('Score is required');
      } else if (scoreData.score < 0 || scoreData.score > 150) {
        errors.push('Score must be between 0 and 150');
      }
    }
    if (!scoreData.academicYear) errors.push('Academic Year is required');
    if (!scoreData.term || scoreData.term < 1 || scoreData.term > 3) {
      errors.push('Term must be 1, 2, or 3');
    }
    
    return errors;
  },

  // ===== CONVENIENCE METHODS =====
  
  // Submit score with validation
  async submitScoreWithValidation(scoreData) {
    const errors = this.validateScoreData(scoreData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
    
    try {
      return await this.submitScore(scoreData);
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // Get complete grade summary
  async getGradeSummary(gradeId, academicYear, term) {
    try {
      const [scores, students, statistics] = await Promise.all([
        this.getGradeScores(gradeId, academicYear, term),
        this.getStudentsByGrade(gradeId),
        this.getScoreStatistics({ gradeId, academicYear, term })
      ]);
      
      return {
        scores,
        students,
        statistics,
        summary: {
          totalStudents: students.length,
          studentsWithScores: new Set(scores.map(s => s.studentId)).size,
          averageScore: statistics.average || 0,
          passingRate: statistics.passingRate || 0
        }
      };
    } catch (error) {
      this.handleApiError(error);
    }
  },

  // ===== GENERAL COMMENT ENDPOINTS =====
  
  // Get general comment for a report card
  async getGeneralComment(reportCardId) {
    try {
      const response = await apiClient.get(`/reportcards/${reportCardId}/general-comment`);
      return response.data;
    } catch (error) {
      console.error('Error fetching general comment:', error);
      throw error;
    }
  },

  // Update general comment for a report card
  async updateGeneralComment(reportCardId, comment) {
    try {
      const response = await apiClient.put(`/reportcards/${reportCardId}/general-comment`, {
        comment: comment
      });
      return response.data;
    } catch (error) {
      console.error('Error updating general comment:', error);
      throw error;
    }
  },

  // Check if user can edit general comment
  async canEditGeneralComment(reportCardId) {
    try {
      const response = await apiClient.get(`/reportcards/${reportCardId}/general-comment/can-edit`);
      return response.data;
    } catch (error) {
      console.error('Error checking general comment edit permissions:', error);
      throw error;
    }
  },

  // Generate report card for a student
  async generateReportCard(studentId, academicYear, term) {
    try {
      const response = await apiClient.post(`/reportcards/generate/student/${studentId}`, null, {
        params: { academicYear, term }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report card:', error);
      throw error;
    }
  },

  // Get student report cards
  async getStudentReportCards(studentId) {
    try {
      const response = await apiClient.get(`/reportcards/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student report cards:', error);
      throw error;
    }
  },

  // Get report card details/scoreboard data
  async getReportCardDetails(reportCardId) {
    try {
      const response = await apiClient.get(`/reportcards/${reportCardId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report card details:', error);
      throw error;
    }
  }
};

// Add error handling wrapper to all methods
Object.keys(examService).forEach(key => {
  if (typeof examService[key] === 'function' && !key.startsWith('handle') && !key.startsWith('validate')) {
    const originalMethod = examService[key];
    examService[key] = async function(...args) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // For toggleAbsentStatus, preserve the original error for custom handling
        if (key === 'toggleAbsentStatus') {
          throw error;
        }
        this.handleApiError(error);
        
      }
    };
  }
});

// In your api.service.js
export const markScheduleService = {
  async testBackendConnection() {
    try {
      console.log('🔍 Testing backend connection...');
      const response = await apiClient.get('/students', { timeout: 5000 });
      console.log('✅ Backend connection successful:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  },

  async getMarkSchedulePdfForGrade(gradeId, academicYearId, term, examTypeName) {
    // Validate parameters
    if (!gradeId || !academicYearId || !term || !examTypeName) {
      throw new Error(`Missing required parameters: gradeId=${gradeId}, academicYearId=${academicYearId}, term=${term}, examTypeName=${examTypeName}`);
    }
    
    console.log('🔍 getMarkSchedulePdfForGrade called with:', { gradeId, academicYearId, term, examTypeName });
    
    const response = await apiClient.get(`/MarkSchedule/pdf/grade/${gradeId}`, {
      params: { academicYearId, term, examTypeName },
      responseType: 'blob'
    });
    return response.data;
  },

  async getMarkSchedulePdfForAllGrades(academicYearId, term, examTypeName) {
    // Validate parameters
    if (!academicYearId || !term || !examTypeName) {
      throw new Error(`Missing required parameters: academicYearId=${academicYearId}, term=${term}, examTypeName=${examTypeName}`);
    }
    
    console.log('🔍 getMarkSchedulePdfForAllGrades called with:', { academicYearId, term, examTypeName });
    console.log('🔍 Full URL will be:', `${apiClient.defaults.baseURL}/MarkSchedule/pdf?academicYearId=${academicYearId}&term=${term}&examTypeName=${examTypeName}`);
    
    try {
      console.log('🔍 Making API request to:', `${apiClient.defaults.baseURL}/MarkSchedule/pdf`);
      console.log('🔍 With params:', { academicYearId, term, examTypeName });
      
      // Try the exact URL format from your working curl
      const url = `/MarkSchedule/pdf?academicYearId=${academicYearId}&term=${term}&examTypeName=${examTypeName}`;
      console.log('🔍 Using exact URL format:', url);
      
      console.log('🔍 Starting PDF generation request...');
      const response = await apiClient.get(url, {
        responseType: 'blob',
        timeout: 60000, // Increase timeout to 60 seconds for PDF generation
        headers: {
          'Accept': '*/*'
        }
      });
      console.log('🔍 PDF generation completed successfully');
      
      console.log('✅ API response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers['content-type'],
        dataSize: response.data?.size || 'unknown'
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ getMarkSchedulePdfForAllGrades error:', error);
      
      // If we got a response with JSON error, try to read it
      if (error.response && error.response.data && error.response.data.type === 'application/json') {
        try {
          const errorText = await error.response.data.text();
          console.error('❌ Backend error response:', errorText);
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ Parsed error JSON:', errorJson);
            throw new Error(`Backend error: ${errorJson.message || errorJson.title || errorText}`);
          } catch (parseError) {
            throw new Error(`Backend error: ${errorText}`);
          }
        } catch (textError) {
          console.error('❌ Could not read error response:', textError);
        }
      }
      
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config,
        isNetworkError: !error.response && !error.request,
        isRequestError: !!error.request,
        isResponseError: !!error.response
      });
      throw error;
    }
  }
};


// export const reportService = {
//   async generateReportCard(studentId, academicYear, term) {
//     const response = await apiClient.post(`/reportcards/generate/student/${studentId}?academicYear=${academicYear}&term=${term}`);
//     return response.data;
//   },

//   async generateClassReportCards(gradeId, academicYear, term) {
//     const response = await apiClient.post(`/reportcards/generate/class/${gradeId}?academicYear=${academicYear}&term=${term}`);
//     return response.data;
//   },

//   async downloadReportCard(reportCardId) {
//     const response = await apiClient.get(`/reportcards/${reportCardId}/download`, {
//       responseType: 'blob'
//     });
//     return response.data;
//   },

//   async getStudentReportCards(studentId) {
//     const response = await apiClient.get(`/reportcards/student/${studentId}`);
//     return response.data;
//   },

// async downloadClassReportCardsZip(gradeId, academicYear, term) {
//   const response = await apiClient.get(
//     `/reportcards/download/class/${gradeId}?academicYear=${academicYear}&term=${term}`,
//     { responseType: 'blob' }
//   );
//   return response.data; // This is the Blob
// },

// async downloadClassReportCardsMergedPdf(gradeId, academicYear, term) {
//   const response = await apiClient.get(
//     `/reportcards/download/class/${gradeId}/merged?academicYear=${academicYear}&term=${term}`,
//     { responseType: 'blob' }
//   );
//   return response.data; // This is the Blob (PDF)
// },

//  async requestMergedPdf(gradeId, academicYear, term) {
//   const response = await apiClient.post(
//     `/reportcards/download/class/${gradeId}/merged/request?academicYear=${academicYear}&term=${term}`
//   );
// },
// async checkMergedPdfStatus(jobId) {
//   const response = await apiClient.get(
//     `/reportcards/download/class/merged/status/${jobId}`
//   );
// },
// async downloadMergedPdfFile(gradeId, academicYear, term) {
//   const response = await apiClient.get(
//     `/reportcards/download/class/merged/file/${gradeId}/${academicYear}/${term}`,
//     { responseType: 'blob' }
//   );
// }

// };




export const reportService = {
    async generateReportCard(studentId, academicYear, term) {
        const response = await apiClient.post(
            `/reportcards/generate/student/${studentId}`, 
            null, 
            { params: { academicYear, term } }
        );
        return response.data;
    },

    async generateClassReportCards(gradeId, academicYear, term) {
        const response = await apiClient.post(
            `/reportcards/generate/class/${gradeId}`, 
            null, 
            { params: { academicYear, term } }
        );
        return response.data;
    },

    async downloadReportCard(reportCardId) {
        const response = await apiClient.get(
            `/reportcards/${reportCardId}/download`, 
            { responseType: 'blob' }
        );
        return this.handleBlobDownload(response, `ReportCard_${reportCardId}.pdf`);
    },

    async getStudentReportCards(studentId) {
        const response = await apiClient.get(`/reportcards/student/${studentId}`);
        return response.data;
    },


    async downloadClassReportCardsZip(gradeId, academicYear, term) {
      try {
          const response = await apiClient.get(
              `/reportcards/download/class/${gradeId}`,
              {
                  responseType: 'blob',
                  params: { academicYear, term }
              }
          );
          return this.handleBlobDownload(
              response,
              `ReportCards_Grade${gradeId}_${academicYear}_Term${term}.zip`
          );
      } catch (error) {
          if (error.response && error.response.status === 404) {
              // Show a user-friendly message
              alert("No report cards found for this class, year, and term.");
          } else {
              // Handle other errors
              alert("An error occurred while downloading the report cards.");
          }
          throw error;
      }
  },
    

    
    async requestMergedPdfJob(gradeId, academicYear, term) {
        // Send academicYear and term as query params, not in the body
        const response = await apiClient.post(
            `/reportcards/download/class/${gradeId}/merged/request?academicYear=${academicYear}&term=${term}`
        );
        return response.data
    },
  
    async getMergeJobStatus(jobId) {
        // GET to /reportcards/download/class/merged/status/{jobId}
        const response = await apiClient.get(`/reportcards/download/class/merged/status/${jobId}`);
        return response.data;
    },
  
    async downloadMergedPdfFile(gradeId, academicYear, term) {
        // GET to /reportcards/download/class/merged/file/{gradeId}/{academicYear}/{term}
        const response = await apiClient.get(
            `/reportcards/download/class/merged/file/${gradeId}/${academicYear}/${term}`,
            { responseType: 'blob' }
        );
        return response.data;
    },

    // Helper method to handle blob downloads
    handleBlobDownload(response, fileName) {
        const blob = new Blob([response.data], { 
            type: response.headers['content-type'] 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return blob;
    },

    // Get the view URL for a single report card (for iframe viewing)
    getReportCardViewUrl(reportCardId) {
        // Assumes the backend is served from the same origin or CORS is handled
        return `${apiClient.defaults.baseURL}/reportcards/${reportCardId}/view`;
    },

    // Get view URLs for all report cards for a class (grade, academic year, term)
    async getClassReportCardViewUrls(gradeId, academicYear, term) {
        const response = await apiClient.get(
            `/reportcards/class/${gradeId}/view-urls`,
            { params: { academicYear, term } }
        );
        return response.data; // Array of { Id, AcademicYear, Term, GradeName, StudentName, ViewUrl }
    },

    // Fetch the PDF as a blob (for viewing, not download)
    async fetchReportCardBlob(reportCardId) {
        try {
            const response = await apiClient.get(
                `/reportcards/${reportCardId}/download`,
                { 
                    responseType: 'blob',
                    timeout: 90000 // 90 seconds - backend can take 70+ seconds for large PDFs
                }
            );
            
            // Check if the blob is actually an error response (JSON error in blob format)
            // This can happen if the server returns an error with content-type blob
            if (response.data.type === 'application/json' || (response.data.size < 1000 && response.data.size > 0)) {
                // Likely an error response, try to parse it
                const text = await response.data.text();
                let errorMessage = 'Failed to load report card PDF';
                
                try {
                    const errorJson = JSON.parse(text);
                    errorMessage = errorJson.message || errorJson.error || errorJson.title || errorMessage;
                } catch {
                    // If not JSON, use the text or default message
                    if (text && text.length < 500) {
                        errorMessage = text;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            return response.data; // Just return the blob, no download
        } catch (error) {
            console.error(`Failed to fetch report card blob ${reportCardId}:`, error);
            
            // If error has response data, try to extract better error message
            if (error.response?.data) {
                const data = error.response.data;
                
                // If it's a blob (which happens with responseType: 'blob' even for errors), try to read it
                if (data instanceof Blob) {
                    try {
                        const text = await data.text();
                        console.log('📄 Error blob content:', text.substring(0, 500));
                        
                        // Check if it's JSON (error responses are often JSON)
                        if (data.type === 'application/json' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
                            try {
                                const errorJson = JSON.parse(text);
                                const extractedMessage = errorJson.message || errorJson.error || errorJson.title;
                                if (extractedMessage) {
                                    // Create a new error with the extracted message, preserving the original error
                                    const enhancedError = new Error(extractedMessage);
                                    enhancedError.originalError = error;
                                    enhancedError.status = error.response?.status;
                                    throw enhancedError;
                                }
                            } catch (parseError) {
                                // If parsing fails but we have a readable error message, use it
                                if (parseError.message && parseError.message !== error.message) {
                                    throw parseError; // Re-throw the enhanced error
                                }
                                // If text is short enough, use it directly
                                if (text.length < 500 && text.trim().length > 0) {
                                    const enhancedError = new Error(text.trim());
                                    enhancedError.originalError = error;
                                    enhancedError.status = error.response?.status;
                                    throw enhancedError;
                                }
                            }
                        } else if (text.length < 500 && text.trim().length > 0) {
                            // Even if not JSON, if it's a short text, it might be an error message
                            const enhancedError = new Error(text.trim());
                            enhancedError.originalError = error;
                            enhancedError.status = error.response?.status;
                            throw enhancedError;
                        }
                    } catch (readError) {
                        // If we successfully extracted a message, re-throw it
                        if (readError.message && readError.message !== error.message && !readError.message.includes('Could not read')) {
                            throw readError;
                        }
                        // Otherwise, log and continue with original error
                        console.warn('Could not extract error message from blob:', readError);
                    }
                } else if (typeof data === 'string') {
                    // If response data is a string, use it as error message
                    if (data.length < 500) {
                        throw new Error(data);
                    }
                } else if (data && typeof data === 'object') {
                    // If response data is an object, extract message
                    const extractedMessage = data.message || data.error || data.title;
                    if (extractedMessage) {
                        throw new Error(extractedMessage);
                    }
                }
            }
            
            // Use the error message if available, otherwise create one
            const errorMessage = error.message || 
                (error.response?.status ? `Server error (${error.response.status}): Failed to load report card PDF` : 'Failed to load report card PDF');
            
            throw new Error(errorMessage);
        }
    },

    async getClassReportCardIds(gradeId, academicYear, term) {
        const response = await apiClient.get(
            `/reportcards/class/${gradeId}/view-urls`,
            { params: { academicYear, term } }
        );
        // Map to expected format: { id, studentName, gradeName }
        return response.data.map(rc => ({
            id: rc.id,
            studentName: rc.studentName,
            gradeName: rc.gradeName
        }));
    },

    async sendClassReportCardsEmail(gradeId, academicYear, term) {
        // POST to /reportcards/send/class/{gradeId}/email?academicYear=...&term=...
        const response = await apiClient.post(
            `/reportcards/send/class/${gradeId}/email`,
            null,
            { params: { academicYear, term } }
        );
        return response.data;
    }
};



// Updated userService with correct backend format
export const userService = {
  async getAll() {
    const response = await apiClient.get('/users');
    return response.data;
  },

  async create(user) {
    console.log('🚀 userService.create called with:', user);

    // Ensure role is a number (1, 2, or 3)
    const roleMap = {
      'Admin': 1,
      'Teacher': 2,
      'Staff': 3
    };
    const roleValue = typeof user.role === 'string' ? roleMap[user.role] : user.role;

    const payload = {
      
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: roleValue,
        password: user.password
      
    };

    try {
      const response = await apiClient.post('/users', payload);
      console.log('✅ Backend response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ userService.create error:', error);
      if (error.response && error.response.data) {
        console.error('❌ Backend error details:', error.response.data);
        alert('Backend error: ' + JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  async update(id, user) {
    console.log('🔄 userService.update called with:', { id, user });
    const roleMap = {
      1: 'Admin',
      2: 'Teacher',
      3: 'Staff',
      'Admin': 'Admin',
      'Teacher': 'Teacher',
      'Staff': 'Staff',
    };
    // Always send role as a string
    const roleValue = roleMap[user.role];
    const payload = {
      Username: user.username,
      FullName: user.fullName,
      Email: user.email,
      Role: roleValue, // string: "Admin", "Teacher", or "Staff"
      IsActive: user.isActive
    };
    try {
      const response = await apiClient.put(`/users/${id}`, payload);
      console.log('✅ Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ userService.update error:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Payload sent:', payload);
      throw error;
    }
  },
  async resetPassword(userId, resetData) {
    try {
      console.log('🔍 Reset password payload:', resetData); // Add this line
      const response = await apiClient.post(`/users/${userId}/reset-password`, resetData);
      return response.data;
    } catch (error) {
      console.error('❌ Reset password error details:', error.response?.data); // Add this line
      throw error;  
    }
  },
  async delete(id) {
    console.log('🗑️ userService.delete called with id:', id);
    try {
        const response = await apiClient.delete(`/users/${id}`);
        //console.log('✅ Delete response:', response.status);
        return response.data;
    } catch (error) {
        //console.error(' userService.delete error:', error);
        throw error;
    }
},

  // async resetPassword(id, newPassword) {
  //   await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  // }

  async getTeacherAssignments(teacherId) {
    const response = await apiClient.get(`/users/${teacherId}/assignments`);
    return response.data;
  }
};



// Utility function to get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  return !!(token && user);
};

// Utility function to check user role
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Handle multiple roles
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  
  // Backward compatibility for single role
  return user.role === role;
};

// Utility function to check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  if (!user || !Array.isArray(roles)) return false;
  
  // Handle multiple roles
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(userRole => roles.includes(userRole));
  }
  
  // Backward compatibility for single role
  return roles.includes(user.role);
};

export const examAnalysisService = {
  async getExamAnalysisPdf(academicYearId, term, examTypeName) {
    const response = await apiClient.get('/examanalysis/pdf', {
      params: { academicYearId, term, examTypeName },
      responseType: 'blob'
    });
    return response.data;
  },

  async getExamAnalysisPdfForGrade(gradeId, academicYearId, term, examTypeName) {
    const response = await apiClient.get(`/examanalysis/pdf/${gradeId}`, {
      params: { academicYearId, term, examTypeName },
      responseType: 'blob'
    });
    return response.data;
  }
};

// Secondary Subject Assignment Service
export const secondarySubjectService = {
  async getSecondaryStudents(search = null) {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await apiClient.get(`/secondarysubjectassignment/students${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching secondary students:', error);
      throw error;
    }
  },

  async getStudentSubjects(studentId) {
    try {
      const response = await apiClient.get(`/secondarysubjectassignment/students/${studentId}/subjects`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subjects for student ${studentId}:`, error);
      throw error;
    }
  },

  async getAllSubjects() {
    try {
      const response = await apiClient.get('/secondarysubjectassignment/subjects');
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  async assignSubject(studentId, subjectData) {
    try {
      const response = await apiClient.post(`/secondarysubjectassignment/students/${studentId}/subjects`, subjectData);
      return response.data;
    } catch (error) {
      console.error(`Error assigning subject to student ${studentId}:`, error);
      throw error;
    }
  },

  async removeSubject(studentId, subjectId) {
    try {
      const response = await apiClient.delete(`/secondarysubjectassignment/students/${studentId}/subjects/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing subject ${subjectId} from student ${studentId}:`, error);
      throw error;
    }
  },

  async bulkAssignSubjects(bulkData) {
    try {
      const response = await apiClient.post('/secondarysubjectassignment/bulk-assign', bulkData);
      return response.data;
    } catch (error) {
      console.error('Error performing bulk assignment:', error);
      throw error;
    }
  }
};

// Homeroom Teacher Service
export const homeroomService = {
  async getHomeroomStudents() {
    try {
      const response = await apiClient.get('/homeroom/students');
      return response.data;
    } catch (error) {
      console.error('Error fetching homeroom students:', error);
      throw error;
    }
  },

  async getHomeroomGradeInfo() {
    try {
      const response = await apiClient.get('/homeroom/grade-info');
      return response.data;
    } catch (error) {
      const msg = (error && error.message ? String(error.message) : '').toLowerCase();
      // Suppress 403s for non-homeroom users to avoid noisy logs
      if (msg.includes('access denied') || msg.includes('403')) {
        return null;
      }
      // For other errors, rethrow
      throw error;
    }
  },

  async getAvailableSubjects() {
    try {
      const response = await apiClient.get('/homeroom/available-subjects');
      return response.data;
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      throw error;
    }
  },

  async assignSubjectToStudent(studentId, subjectData) {
    try {
      const response = await apiClient.post(`/homeroom/students/${studentId}/subjects`, subjectData);
      return response.data;
    } catch (error) {
      console.error(`Error assigning subject to student ${studentId}:`, error);
      throw error;
    }
  },

  async removeSubjectFromStudent(studentId, subjectId, reason = null) {
    try {
      const response = await apiClient.delete(`/homeroom/students/${studentId}/subjects/${subjectId}`, {
        data: reason ? { reason } : {}
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing subject ${subjectId} from student ${studentId}:`, error);
      throw error;
    }
  },

  async bulkAssignSubjects(bulkData) {
    try {
      const response = await apiClient.post('/homeroom/bulk-assign-subjects', bulkData);
      return response.data;
    } catch (error) {
      console.error('Error performing bulk assignment:', error);
      throw error;
    }
  },

  async getHomeroomStatus() {
    try {
      const response = await apiClient.get('/homeroom/debug/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching homeroom status:', error);
      throw error;
    }
  },

  async updateStudentName(studentId, { firstName, middleName, lastName }) {
    const payload = {
      firstName: String(firstName || '').trim(),
      middleName: middleName != null ? String(middleName).trim() : null,
      lastName: String(lastName || '').trim()
    };
    const response = await apiClient.patch(`/homeroom/students/${studentId}/name`, payload);
    return response.data;
  }
};

// SMS Service
export const smsService = {
  /**
   * Send SMS to a single phone number
   * @param {string} phoneNumber - Phone number (with or without country code)
   * @param {string} message - SMS message content
   * @returns {Promise<{success: boolean, message: string, phoneNumber: string}>}
   */
  async sendSms(phoneNumber, message) {
    try {
      const response = await apiClient.post('/sms/send', {
        phoneNumber,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  },

  /**
   * Send bulk SMS to multiple phone numbers
   * @param {string[]} phoneNumbers - Array of phone numbers
   * @param {string} message - SMS message content (same for all recipients)
   * @returns {Promise<{success: boolean, message: string, count: number}>}
   */
  async sendBulkSms(phoneNumbers, message) {
    try {
      const response = await apiClient.post('/sms/send/bulk', {
        phoneNumbers,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw error;
    }
  },

  /**
   * Send student marks via SMS
   * @param {Object} request - Request object containing:
   *   @param {number} studentId - Student ID
   *   @param {number} term - Term number (1, 2, or 3)
   *   @param {string} examTypeName - Exam type name (e.g., "End-of-Term", "Mid-Term")
   *   @param {number} [academicYear] - Academic year (optional, defaults to current year)
   *   @param {string} [phoneNumber] - Phone number (optional, uses student's phone if not provided)
   * @returns {Promise<{success: boolean, message: string, phoneNumber: string, studentName: string, term: number, examType: string, academicYear: number, marksCount: number, totalScore: number}>}
   */
  async sendStudentMarksSms(request) {
    try {
      const payload = {
        studentId: request.studentId,
        term: request.term,
        examTypeName: request.examTypeName,
        ...(request.academicYear && { academicYear: request.academicYear }),
        ...(request.phoneNumber && { phoneNumber: request.phoneNumber })
      };
      
      const response = await apiClient.post('/sms/send/student-marks', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending student marks SMS:', error);
      throw error;
    }
  },

  /**
   * Get preview of student marks SMS message without sending
   * @param {Object} request - Request object containing:
   *   @param {number} studentId - Student ID
   *   @param {number} term - Term number (1, 2, or 3)
   *   @param {number} [academicYear] - Academic year (optional, defaults to current year)
   * @returns {Promise<{message: string, preview: string, content: string}>}
   */
  async previewStudentMarksSms(request) {
    try {
      const payload = {
        studentId: request.studentId,
        term: request.term,
        ...(request.academicYear && { academicYear: request.academicYear }),
        previewOnly: true // Flag to indicate preview only, don't send
      };
      
      // Try preview endpoint first (if it exists)
      try {
        const response = await apiClient.post('/sms/preview/student-marks', payload);
        // Extract message from preview response
        const message = response.data?.message || 
                       response.data?.preview || 
                       response.data?.content || 
                       response.data?.smsContent ||
                       response.data?.smsMessage ||
                       (typeof response.data === 'string' ? response.data : null);
        if (message) {
          return { message, preview: message, content: message };
        }
        return response.data;
      } catch (previewError) {
        // If preview endpoint doesn't exist (404/405), try GET endpoint
        try {
          const getResponse = await apiClient.get(`/sms/preview/student-marks`, {
            params: {
              studentId: request.studentId,
              term: request.term,
              ...(request.academicYear && { academicYear: request.academicYear })
            }
          });
          const message = getResponse.data?.message || 
                         getResponse.data?.preview || 
                         getResponse.data?.content || 
                         (typeof getResponse.data === 'string' ? getResponse.data : null);
          if (message) {
            return { message, preview: message, content: message };
          }
          return getResponse.data;
        } catch (getError) {
          // If GET also fails, try the send endpoint with preview flag as last resort
          // Note: This might actually send the SMS, so we need to be careful
          // Only do this if we're sure the backend supports previewOnly flag
          console.warn('Preview endpoints not available, trying send endpoint with preview flag');
          throw previewError; // Don't try send endpoint as it might actually send
        }
      }
    } catch (error) {
      console.error('Error getting student marks SMS preview:', error);
      throw error;
    }
  },

  /**
   * Get SMS logs with filtering and pagination
   * @param {Object} filters - Filter options:
   *   @param {number} [page=1] - Page number
   *   @param {number} [pageSize=20] - Number of records per page
   *   @param {string} [status] - Filter by status: Sent, Failed, Pending
   *   @param {string} [messageType] - Filter by message type: Single, Bulk, StudentMarks
   *   @param {number} [studentId] - Filter by student ID
   *   @param {number} [sentByUserId] - Filter by user ID who sent the SMS
   *   @param {string} [startDate] - Filter by start date (ISO format)
   *   @param {string} [endDate] - Filter by end date (ISO format)
   *   @param {string} [phoneNumber] - Filter by phone number (partial match)
   * @returns {Promise<{logs: Array, totalCount: number, page: number, pageSize: number, totalPages: number, statistics: Object}>}
   */
  async getSmsLogs(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.messageType && { messageType: filters.messageType }),
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.sentByUserId && { sentByUserId: filters.sentByUserId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.phoneNumber && { phoneNumber: filters.phoneNumber })
      };
      
      const response = await apiClient.get('/sms/logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      throw error;
    }
  }
};

export default apiClient;