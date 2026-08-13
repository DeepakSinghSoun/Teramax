import {
  FileText,
  Download,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";

const reportStats = [
  {
    title: "Total Threats",
    value: "124",
    description: "Detected this month",
    icon: ShieldAlert,
    iconStyle: "bg-red-500/10 text-red-400",
  },
  {
    title: "Threats Resolved",
    value: "98",
    description: "Successfully handled",
    icon: ShieldCheck,
    iconStyle: "bg-green-500/10 text-green-400",
  },
  {
    title: "Active Threats",
    value: "26",
    description: "Require investigation",
    icon: AlertTriangle,
    iconStyle: "bg-orange-500/10 text-orange-400",
  },
  {
    title: "Network Events",
    value: "1,284",
    description: "Events analyzed",
    icon: Activity,
    iconStyle: "bg-blue-500/10 text-blue-400",
  },
];

const reports = [
  {
    id: 1,
    name: "Monthly Security Report",
    period: "August 2026",
    threats: 124,
    status: "Ready",
  },
  {
    id: 2,
    name: "Network Activity Report",
    period: "August 2026",
    threats: 76,
    status: "Ready",
  },
  {
    id: 3,
    name: "Threat Detection Report",
    period: "July 2026",
    threats: 143,
    status: "Ready",
  },
];

function Reports() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Security Reports
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Review security activity and generate detailed reports.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
          <FileText size={18} />
          Generate Report
        </button>

      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {reportStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >

              <div className="flex items-center gap-4">

                <div className={`rounded-lg p-3 ${stat.iconStyle}`}>
                  <Icon size={22} />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    {stat.title}
                  </p>

                  <p className="text-2xl font-bold text-white">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {stat.description}
                  </p>
                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* Security Overview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            Security Overview
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Current threat resolution status.
          </p>
        </div>

        <div className="space-y-5">

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">
                Threats Resolved
              </span>

              <span className="text-green-400">
                79%
              </span>
            </div>

            <div className="h-3 rounded-full bg-slate-800">
              <div className="h-3 w-[79%] rounded-full bg-green-500" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">
                Active Threats
              </span>

              <span className="text-red-400">
                21%
              </span>
            </div>

            <div className="h-3 rounded-full bg-slate-800">
              <div className="h-3 w-[21%] rounded-full bg-red-500" />
            </div>
          </div>

        </div>

      </div>

      {/* Reports */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 p-5">

          <h2 className="text-lg font-semibold text-white">
            Available Reports
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Download previously generated security reports.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-slate-950">

              <tr className="text-xs uppercase text-slate-500">

                <th className="px-6 py-4">
                  Report
                </th>

                <th className="px-6 py-4">
                  Period
                </th>

                <th className="px-6 py-4">
                  Threats
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {reports.map((report) => (

                <tr
                  key={report.id}
                  className="transition hover:bg-slate-800/40"
                >

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <FileText
                          size={18}
                          className="text-blue-400"
                        />
                      </div>

                      <span className="font-medium text-white">
                        {report.name}
                      </span>

                    </div>

                  </td>

                  <td className="px-6 py-5 text-sm text-slate-400">
                    {report.period}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-300">
                    {report.threats}
                  </td>

                  <td className="px-6 py-5">

                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      {report.status}
                    </span>

                  </td>

                  <td className="px-6 py-5 text-right">

                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
                      <Download size={16} />
                      Download
                    </button>

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

export default Reports;