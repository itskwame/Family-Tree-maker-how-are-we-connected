// Supabase Configuration
const SUPABASE_URL = 'https://fvfviudlxyumnskakftp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnZpdWRseHl1bW5za2FrZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjExMDEsImV4cCI6MjA3ODg5NzEwMX0.fODOqTUm9g_20Jbxz5J5s_L-PwcH-mKfNp_3741fAnA';

// Simple auth check
function checkAuth() {
    const user = localStorage.getItem('fc_user');
    if (!user && !window.location.pathname.includes('auth') && !window.location.pathname.includes('index.html')) {
        window.location.href = '/auth/login.html';
    }
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('fc_user', JSON.stringify(user));
}

function clearUser() {
    localStorage.removeItem('fc_user');
    window.location.href = '/auth/login.html';
}