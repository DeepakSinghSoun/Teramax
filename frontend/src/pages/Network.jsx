import {
  Activity,
  Wifi,
  Server,
  AlertTriangle,
  Search,
} from "lucide-react";

const connections = [
  {
    id: 1,
    source: "192.168.1.15",
    destination: "192.168.1.1",
    protocol: "TCP",
    port: "443",
    status: "Active",
    risk: "Low",
  },
  {
    id: 2,
    source: "192.168.1.23",
    destination: "192.168.1.10",
    protocol: "TCP",
    port: "22",
    status: "Active",
    risk: "High",
  },
  {
    id: 3,
    source: "192.168.1.45",
    destination: "192.168.1.5",
    protocol: "UDP",
    port: "53",
    status: "Blocked",
    risk: "Critical",
  },
  {
    id: 4,
    source: "192.168.1.30",
    destination: "192.168.1.20",
    protocol: "TCP",
    port: "80",
    status: "Active",
    risk: "Low",
  },
];

function Network() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Network Monitoring
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Monitor network traffic, connections, and suspicious activity.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Activity className="text-blue-400" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Network Traffic
              </p>

              <p className="text-2xl font-bold text-white">
                75 Mbps
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <Wifi className="text-green-400" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Active Connections
              </p>

              <p className="text-2xl font-bold text-white">
                128
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Server className="text-purple-400" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Open Ports
              </p>

              <p className="text-2xl font-bold text-white">
                14
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-500/10 p-3">
              <AlertTriangle className="text-red-400" size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Suspicious
              </p>

              <p className="text-2xl font-bold text-white">
                06
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Traffic Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Network Status
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Current network activity
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />

            <span className="text-sm text-green-400">
              Healthy
            </span>
          </div>

        </div>

        {/* Traffic bars */}
        <div className="mt-6">

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-400">
              Traffic Usage
            </span>

            <span className="text-white">
              75%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-[75%] rounded-full bg-blue-500" />
          </div>

        </div>

      </div>

      {/* Connections */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Active Connections
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Current network connections
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            <Search size={17} className="text-slate-500" />

            <input
              type="text"
              placeholder="Search IP..."
              className="w-32 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-slate-950">
              <tr className="text-xs uppercase text-slate-500">

                <th className="px-6 py-4">
                  Source
                </th>

                <th className="px-6 py-4">
                  Destination
                </th>

                <th className="px-6 py-4">
                  Protocol
                </th>

                <th className="px-6 py-4">
                  Port
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Risk
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">

              {connections.map((connection) => (

                <tr
                  key={connection.id}
                  className="transition hover:bg-slate-800/40"
                >

                  <td className="px-6 py-5 font-mono text-sm text-slate-300">
                    {connection.source}
                  </td>

                  <td className="px-6 py-5 font-mono text-sm text-slate-300">
                    {connection.destination}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-300">
                    {connection.protocol}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-300">
                    {connection.port}
                  </td>

                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        connection.status === "Active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {connection.status}
                    </span>

                  </td>

                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        connection.risk === "Critical"
                          ? "border-red-500/20 bg-red-500/10 text-red-400"
                          : connection.risk === "High"
                          ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
                          : "border-green-500/20 bg-green-500/10 text-green-400"
                      }`}
                    >
                      {connection.risk}
                    </span>

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

export default Network;