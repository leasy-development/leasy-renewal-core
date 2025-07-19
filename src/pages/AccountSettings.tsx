import AccountSettingsComponent from "@/components/AccountSettings";

const AccountSettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Leasy</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <AccountSettingsComponent />
      </main>
    </div>
  );
};

export default AccountSettingsPage;