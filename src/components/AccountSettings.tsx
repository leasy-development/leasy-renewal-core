import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, User, Shield, CreditCard, Globe, Smartphone, Download, Key, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhotoUploader from "@/components/PhotoUploader";
import { LanguageSettingsCard } from "@/components/LanguageSettingsCard";

interface UserProfile {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  avatar: File[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  propertyUpdates: boolean;
  bookingAlerts: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  apiAccess: boolean;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.email?.split('@')[0] || '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    avatar: []
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    propertyUpdates: true,
    bookingAlerts: true,
    weeklyReports: true
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    apiAccess: false
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'notifications' | 'security' | 'billing'>('profile');

  const handleProfileUpdate = async () => {
    try {
      // Here you would typically update the user profile in Supabase
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      // Here you would save notification preferences
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSecurityUpdate = async () => {
    try {
      // Here you would update security settings
      toast({
        title: "Security Updated",
        description: "Your security settings have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update security settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { data, error } = await supabase.rpc('changepassword', {
        current_plain_password: passwordForm.currentPassword,
        new_plain_password: passwordForm.newPassword,
        current_id: user.id
      });

      if (error) throw error;

      if (data === 'success') {
        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated.",
        });
        // Clear the form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else if (data === 'incorrect') {
        toast({
          title: "Incorrect Password",
          description: "Your current password is incorrect.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Change Failed",
          description: "An error occurred while changing your password.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      // Here you would export user data
      toast({
        title: "Export Started",
        description: `Your data export in ${format.toUpperCase()} format will be ready shortly.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const TabButton = ({ tab, icon: Icon, label }: { tab: string; icon: any; label: string }) => (
    <Button
      variant={activeTab === tab ? "default" : "ghost"}
      onClick={() => setActiveTab(tab as any)}
      className="justify-start w-full"
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('account.settings')}</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <TabButton tab="profile" icon={User} label={t('account.profile')} />
                <TabButton tab="language" icon={Globe} label={t('account.language')} />
                <TabButton tab="notifications" icon={Bell} label={t('account.notifications')} />
                <TabButton tab="security" icon={Shield} label={t('account.security')} />
                <TabButton tab="billing" icon={CreditCard} label={t('account.billing')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar.length > 0 ? URL.createObjectURL(profile.avatar[0]) : undefined} />
                      <AvatarFallback className="text-lg">
                        {profile.displayName.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <PhotoUploader
                        photos={profile.avatar}
                        onPhotosChange={(photos) => setProfile(prev => ({ ...prev, avatar: photos }))}
                        maxFiles={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profile.displayName}
                        onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+49 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Berlin, Germany"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profile.website}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://your-website.com"
                      />
                    </div>
                  </div>

                  <Button onClick={handleProfileUpdate} className="w-full md:w-auto">
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Property Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about your property status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.propertyUpdates}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, propertyUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Booking Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about new bookings and inquiries
                        </p>
                      </div>
                      <Switch
                        checked={notifications.bookingAlerts}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, bookingAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly performance reports
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and tips
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketingEmails}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Button onClick={handleNotificationUpdate} className="w-full md:w-auto">
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={security.twoFactorAuth ? "default" : "secondary"}>
                          {security.twoFactorAuth ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={security.twoFactorAuth}
                          onCheckedChange={(checked) => 
                            setSecurity(prev => ({ ...prev, twoFactorAuth: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Login Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <Switch
                        checked={security.loginAlerts}
                        onCheckedChange={(checked) => 
                          setSecurity(prev => ({ ...prev, loginAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">API Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow third-party applications to access your data
                        </p>
                      </div>
                      <Switch
                        checked={security.apiAccess}
                        onCheckedChange={(checked) => 
                          setSecurity(prev => ({ ...prev, apiAccess: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      <h4 className="font-medium">Change Password</h4>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        For security reasons, you must enter your current password to set a new one.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handlePasswordChange} 
                      disabled={isChangingPassword}
                      className="w-full md:w-auto"
                    >
                      {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Data Export</h4>
                    <p className="text-sm text-muted-foreground">
                      Download your data in different formats
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => exportData('json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                      <Button variant="outline" onClick={() => exportData('csv')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleSecurityUpdate} className="w-full md:w-auto">
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <LanguageSettingsCard />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Free Plan</h4>
                        <p className="text-sm text-muted-foreground">
                          Up to 5 properties
                        </p>
                      </div>
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Up to 5 properties</li>
                      <li>• Basic analytics</li>
                      <li>• Email support</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Pro Plan</h4>
                        <p className="text-sm text-muted-foreground">
                          €29/month - Unlimited properties
                        </p>
                      </div>
                      <Button size="sm">
                        Upgrade
                      </Button>
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Unlimited properties</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                      <li>• API access</li>
                      <li>• Custom branding</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Payment Method</h4>
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">No payment method</p>
                          <p className="text-sm text-muted-foreground">
                            Add a payment method to upgrade
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Add Card
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;