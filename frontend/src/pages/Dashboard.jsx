import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const attackData = [
  { name: "Mon", attacks: 12 },
  { name: "Tue", attacks: 19 },
  { name: "Wed", attacks: 8 },
  { name: "Thu", attacks: 25 },
  { name: "Fri", attacks: 17 },
  { name: "Sat", attacks: 10 },
  { name: "Sun", attacks: 15 },
];

const trafficData = [
  { time: "10:00", traffic: 30 },
  { time: "11:00", traffic: 45 },
  { time: "12:00", traffic: 38 },
  { time: "13:00", traffic: 65 },
  { time: "14:00", traffic: 52 },
  { time: "15:00", traffic: 75 },
];

const attackTypes = [
  { name: "DoS", value: 35, color: "#ef4444" },
  { name: "Port Scan", value: 25, color: "#f97316" },
  { name: "Brute Force", value: 20, color: "#eab308" },
  { name: "Other", value: 20, color: "#3b82f6" },
];

const recentAlerts = [
  {
    type: "Port Scan",
    source: "192.168.1.15",
    risk: "High",
    time: "2 min ago",
  },
  {
    type: "Brute Force",
    source: "192.168.1.23",
    risk: "Critical",
    time: "8 min ago",
  },
  {
    type: "DoS Attack",
    source: "192.168.1.45",
    risk: "High",
    time: "15 min ago",
  },
  {
    type: "Suspicious Command",
    source: "192.168.1.10",
    risk: "Medium",
    time: "22 min ago",
  },
];

function StatCard({ title, value, description, color }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      </div>

      <h2 className="mt-3 text-3xl font-bold text-white">
        {value}
      </h2>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Security Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Monitor your network security and detected threats.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
            title="Total Threats"
            value="124"
            description="Detected this month"
            color="bg-blue-500"
        />

        <StatCard
            title="High Risk"
            value="18"
            description="Requires attention"
            color="bg-orange-500"
        />

        <StatCard
            title="Active Alerts"
            value="07"
            description="Currently unresolved"
            color="bg-red-500"
        />

        <StatCard
            title="Network Status"
            value="Healthy"
            description="No major issues detected"
            color="bg-green-500"
        />

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Attack Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <h2 className="mb-5 text-lg font-semibold text-white">
            Attacks Detected
          </h2>

          <div className="h-72">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar
                    dataKey="attacks"
                    name="Attacks"
                    fill="#bd8080"
                    radius={[5, 5, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        </div>

        {/* Traffic Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <h2 className="mb-5 text-lg font-semibold text-white">
            Network Traffic
          </h2>

          <div className="h-72">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="time" />

                <YAxis />

                <Tooltip />

                <Line
                    type="monotone"
                    dataKey="traffic"
                    name="Traffic"
                    stroke="#3b82f6"
                    strokeWidth={2}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Attack Types */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <h2 className="mb-5 text-lg font-semibold text-white">
            Attack Types
          </h2>

          <div className="h-72">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={attackTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {attackTypes.map((entry, index) => (
                    <Cell 
                        key={index}
                        fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>
            </ResponsiveContainer>

          </div>
        </div>

        {/* Recent Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-lg font-semibold text-white">
              Recent Alerts
            </h2>

            <button className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </button>

          </div>

          <div className="space-y-3">

            {recentAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4"
              >

                <div>
                  <p className="font-medium text-white">
                    {alert.type}
                  </p>

                  <p className="text-xs text-slate-500">
                    {alert.source} • {alert.time}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    alert.risk === "Critical"
                      ? "bg-red-500/10 text-red-400"
                      : alert.risk === "High"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {alert.risk}
                </span>

              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;