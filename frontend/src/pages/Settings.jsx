import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Monitor,
  Database,
} from "lucide-react";

function Settings() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Configure your Teramax security platform.
        </p>
      </div>

      {/* General Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-blue-500/10 p-3">
            <SettingsIcon
              size={22}
              className="text-blue-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              General Settings
            </h2>

            <p className="text-sm text-slate-400">
              Basic platform configuration.
            </p>
          </div>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Platform Name
            </label>

            <input
              type="text"
              value="Teramax"
              readOnly
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Environment
            </label>

            <select
              defaultValue="development"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="development">
                Development
              </option>

              <option value="production">
                Production
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-yellow-500/10 p-3">
            <Bell
              size={22}
              className="text-yellow-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Notifications
            </h2>

            <p className="text-sm text-slate-400">
              Control security alert notifications.
            </p>
          </div>

        </div>

        <div className="mt-6 space-y-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                Critical Threat Alerts
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Receive notifications for critical security threats.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-700 bg-slate-950"
            />

          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                High Risk Alerts
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Receive notifications for high-risk events.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-700 bg-slate-950"
            />

          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                Daily Security Summary
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Receive a daily summary of security activity.
              </p>
            </div>

            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-700 bg-slate-950"
            />

          </div>

        </div>

      </div>

      {/* Security Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-red-500/10 p-3">
            <Shield
              size={22}
              className="text-red-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Security
            </h2>

            <p className="text-sm text-slate-400">
              Configure security-related options.
            </p>
          </div>

        </div>

        <div className="mt-6 space-y-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                Automatic Threat Blocking
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Automatically block detected critical threats.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-700 bg-slate-950"
            />

          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-white">
                Command Monitoring
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Monitor commands executed on connected systems.
              </p>
            </div>

            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-700 bg-slate-950"
            />

          </div>

        </div>

      </div>

      {/* Monitoring */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-green-500/10 p-3">
            <Monitor
              size={22}
              className="text-green-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Monitoring
            </h2>

            <p className="text-sm text-slate-400">
              Configure network monitoring behavior.
            </p>
          </div>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Monitoring Interval
            </label>

            <select
              defaultValue="5"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="1">1 second</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Threat Detection Level
            </label>

            <select
              defaultValue="high"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* Database Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-purple-500/10 p-3">
            <Database
              size={22}
              className="text-purple-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              System Status
            </h2>

            <p className="text-sm text-slate-400">
              Current platform services.
            </p>
          </div>

        </div>

        <div className="mt-6 space-y-3">

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">

            <span className="text-sm text-slate-300">
              API Server
            </span>

            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </span>

          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">

            <span className="text-sm text-slate-300">
              Database
            </span>

            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </span>

          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">

            <span className="text-sm text-slate-300">
              ML Detection Engine
            </span>

            <span className="flex items-center gap-2 text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Ready
            </span>

          </div>

        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end">

        <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
          Save Changes
        </button>

      </div>

    </div>
  );
}

export default Settings;