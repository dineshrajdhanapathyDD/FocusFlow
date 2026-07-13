import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ENERGY_PATTERNS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [workStart, setWorkStart] = useState(user?.preferences.workStartTime || '09:00');
  const [workEnd, setWorkEnd] = useState(user?.preferences.workEndTime || '17:00');
  const [breakDuration, setBreakDuration] = useState(String(user?.preferences.breakDuration || 15));
  const [focusBlock, setFocusBlock] = useState(String(user?.preferences.focusBlockDuration || 90));
  const [energyPattern, setEnergyPattern] = useState(user?.preferences.energyPattern || 'morning');

  const handleSaveProfile = () => {
    updateUser({ name, email });
    toast.success('Profile updated');
  };

  const handleSavePreferences = () => {
    updateUser({
      preferences: {
        ...user!.preferences,
        workStartTime: workStart,
        workEndTime: workEnd,
        breakDuration: parseInt(breakDuration),
        focusBlockDuration: parseInt(focusBlock),
        energyPattern: energyPattern as 'morning' | 'afternoon' | 'evening' | 'night',
        theme: theme,
      },
    });
    toast.success('Preferences saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Settings</h1>
        <p className="text-sm text-surface-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleSaveProfile}>Save Profile</Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how FocusFlow looks</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Select
            label="Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Work Preferences</CardTitle>
          <CardDescription>Help AI optimize your schedule</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Work Start Time"
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
            />
            <Input
              label="Work End Time"
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Break Duration (min)"
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(e.target.value)}
            />
            <Input
              label="Focus Block (min)"
              type="number"
              value={focusBlock}
              onChange={(e) => setFocusBlock(e.target.value)}
            />
          </div>
          <Select
            label="Energy Pattern"
            value={energyPattern}
            onChange={(e) => setEnergyPattern(e.target.value)}
            options={ENERGY_PATTERNS.map((p) => ({ value: p.value, label: p.label }))}
          />
          <Button onClick={handleSavePreferences}>Save Preferences</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control what notifications you receive</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {[
            { key: 'deadlineReminder', label: 'Deadline reminders', desc: 'Get notified before tasks are due' },
            { key: 'dailyDigest', label: 'Daily digest', desc: 'Summary of your day ahead each morning' },
            { key: 'overdueAlert', label: 'Overdue alerts', desc: 'When tasks pass their due date' },
            { key: 'productivityInsights', label: 'AI insights', desc: 'Productivity tips and observations' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900">
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{item.label}</p>
                <p className="text-xs text-surface-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                  aria-label={item.label}
                />
                <div className="w-9 h-5 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
          <CardDescription>Quick navigation keys</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'N', action: 'New Task' },
            { key: '/', action: 'Search' },
            { key: '1', action: 'Dashboard' },
            { key: '2', action: 'Tasks' },
            { key: '3', action: 'Planner' },
            { key: '4', action: 'AI Assistant' },
            { key: '5', action: 'Analytics' },
            { key: 'T', action: 'Toggle Theme' },
          ].map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-900">
              <span className="text-sm text-surface-600 dark:text-surface-400">{shortcut.action}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-200 dark:bg-surface-700 rounded text-surface-700 dark:text-surface-300">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
