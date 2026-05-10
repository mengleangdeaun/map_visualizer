const SystemDashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">System Management</h1>
            <p className="text-muted-foreground mt-2">Global system configuration and administration.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage roles, permissions, and accounts.</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold">Audit Logs</h3>
                    <p className="text-sm text-muted-foreground">Monitor system-wide actions and changes.</p>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-semibold">Configuration</h3>
                    <p className="text-sm text-muted-foreground">Global API keys and environment settings.</p>
                </div>
            </div>
        </div>
    );
};

export default SystemDashboard;
