import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(
    'https://fvfviudlxyumnskakftp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZnZpdWRseHl1bW5za2FrZnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjExMDEsImV4cCI6MjA3ODg5NzEwMX0.fODOqTUm9g_20Jbxz5J5s_L-PwcH-mKfNp_3741fAnA'
);

export let currentAdmin = null;

export async function checkAdminAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error || !profile || (profile.role !== 'admin' && profile.role !== 'staff') || profile.status !== 'active') {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
        return null;
    }

    currentAdmin = { ...session.user, profile };
    return currentAdmin;
}

export async function signOut() {
    if (currentAdmin) {
        await supabase
            .from('audit_logs')
            .insert({
                actor_id: currentAdmin.id,
                action: 'admin_logout',
                resource_type: 'auth'
            });
    }

    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

export async function logAction(action, resourceType, resourceId = null, details = null) {
    if (!currentAdmin) return;

    await supabase
        .from('audit_logs')
        .insert({
            actor_id: currentAdmin.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details
        });
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

export function timeAgo(dateString) {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }

    return 'Just now';
}

export function renderSidebar(activePage) {
    return `
        <div class="logo" onclick="location.href='index.html'">
            <i class="fas fa-shield-alt"></i> Admin Panel
        </div>
        <a href="index.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
            <i class="fas fa-chart-line"></i> Dashboard
        </a>
        <a href="users.html" class="nav-item ${activePage === 'users' ? 'active' : ''}">
            <i class="fas fa-users"></i> Users
        </a>
        <a href="families.html" class="nav-item ${activePage === 'families' ? 'active' : ''}">
            <i class="fas fa-users-cog"></i> Families
        </a>
        <a href="flags.html" class="nav-item ${activePage === 'flags' ? 'active' : ''}">
            <i class="fas fa-flag"></i> Feature Flags
        </a>
        <a href="logs.html" class="nav-item ${activePage === 'logs' ? 'active' : ''}">
            <i class="fas fa-clipboard-list"></i> Audit Logs
        </a>
        <a href="moderation.html" class="nav-item ${activePage === 'moderation' ? 'active' : ''}">
            <i class="fas fa-gavel"></i> Moderation
        </a>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #e2e8f0;">
        <a href="../dashboard/index.html" class="nav-item">
            <i class="fas fa-home"></i> Main Site
        </a>
        <a href="#" onclick="window.adminSignOut()" class="nav-item">
            <i class="fas fa-sign-out-alt"></i> Sign Out
        </a>
    `;
}

export const adminStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; }
    .container { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: #1e293b; color: white; padding: 24px; position: fixed; height: 100vh; overflow-y: auto; }
    .logo { font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 32px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .nav-item { padding: 12px 16px; margin-bottom: 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; color: #cbd5e1; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .nav-item:hover { background: #334155; color: white; }
    .nav-item.active { background: #ef4444; color: white; }
    .main { flex: 1; padding: 32px; margin-left: 260px; max-width: 1400px; }

    h1 { font-size: 32px; margin-bottom: 8px; color: #1e293b; }
    .subtitle { color: #64748b; margin-bottom: 32px; font-size: 16px; }

    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-number { font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .stat-label { color: #64748b; font-size: 14px; }
    .stat-change { font-size: 13px; margin-top: 8px; }
    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #ef4444; }

    .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .card h2 { font-size: 20px; margin-bottom: 16px; color: #1e293b; }

    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th { padding: 12px 16px; text-align: left; font-weight: 600; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
    td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    tr:hover { background: #f8fafc; }

    .badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-secondary { background: #f1f5f9; color: #475569; }

    .btn { padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn:hover { background: #dc2626; }
    .btn:disabled { background: #cbd5e0; cursor: not-allowed; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-secondary { background: #64748b; }
    .btn-secondary:hover { background: #475569; }
    .btn-success { background: #10b981; }
    .btn-success:hover { background: #059669; }
    .btn-danger { background: #ef4444; }
    .btn-danger:hover { background: #dc2626; }

    .search-bar { margin-bottom: 24px; display: flex; gap: 12px; }
    .search-bar input { flex: 1; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
    .search-bar input:focus { outline: none; border-color: #ef4444; }
    .search-bar select { padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }

    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1000; align-items: center; justify-content: center; }
    .modal.active { display: flex; }
    .modal-content { background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header h2 { font-size: 24px; color: #1e293b; }
    .close-modal { background: none; border: none; font-size: 28px; color: #64748b; cursor: pointer; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #1e293b; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; }
    .form-group textarea { min-height: 100px; resize: vertical; }

    .empty-state { text-align: center; padding: 64px 32px; color: #94a3b8; }
    .empty-state i { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state p { font-size: 16px; }

    .alert { padding: 16px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
    .alert-danger { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
    .alert-warning { background: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
    .alert-info { background: #dbeafe; color: #1e40af; border: 1px solid #3b82f6; }

    .loading { display: flex; align-items: center; justify-content: center; padding: 64px; }
    .loading i { font-size: 32px; color: #ef4444; }
`;
