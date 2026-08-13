import {
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  Calendar,
} from "lucide-react";

function Profile() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manage your account information and security settings.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* User Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col items-center text-center">

            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
              D
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              Deepak
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Administrator
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />

              <span className="text-xs font-medium text-green-400">
                Account Active
              </span>
            </div>

          </div>

        </div>

        {/* Account Information */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">

          <h2 className="text-lg font-semibold text-white">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Your basic account details.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <User size={17} className="text-slate-500" />

                <label className="text-sm text-slate-400">
                  Full Name
                </label>
              </div>

              <input
                type="text"
                value="Deepak"
                readOnly
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Mail size={17} className="text-slate-500" />

                <label className="text-sm text-slate-400">
                  Email
                </label>
              </div>

              <input
                type="email"
                value="deepak@example.com"
                readOnly
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={17} className="text-slate-500" />

                <label className="text-sm text-slate-400">
                  Role
                </label>
              </div>

              <input
                type="text"
                value="Administrator"
                readOnly
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Calendar size={17} className="text-slate-500" />

                <label className="text-sm text-slate-400">
                  Member Since
                </label>
              </div>

              <input
                type="text"
                value="August 2026"
                readOnly
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

          </div>

        </div>

      </div>

      {/* Security */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-blue-500/10 p-3">
            <KeyRound
              size={22}
              className="text-blue-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Security
            </h2>

            <p className="text-sm text-slate-400">
              Manage your account password.
            </p>
          </div>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Current Password
            </label>

            <input
              type="password"
              placeholder="Enter current password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

        </div>

        <button className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
          Update Password
        </button>

      </div>

    </div>
  );
}

export default Profile;