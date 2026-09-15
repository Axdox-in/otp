"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";

const PALETTE = { whatsapp: "#0b8f84", sms: "#e0a100", email: "#7c6cf0", verified: "#1f9e57", sent: "#94a3b8" };

export function AnalyticsCharts({
  daily,
  channels,
  countries,
}: {
  daily: { date: string; sent: number; verified: number }[];
  channels: { name: string; value: number }[];
  countries: { country: string; count: number }[];
}) {
  const chanColor = (n: string) => (PALETTE as Record<string, string>)[n.toLowerCase()] ?? "#94a3b8";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Sent vs verified (30 days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke={PALETTE.sent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="verified" stroke={PALETTE.verified} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Channel mix</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={channels} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {channels.map((c) => <Cell key={c.name} fill={chanColor(c.name)} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top countries</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={countries} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <YAxis type="category" dataKey="country" fontSize={11} width={44} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill={PALETTE.whatsapp} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
