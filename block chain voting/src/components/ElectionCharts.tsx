import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Candidate {
  id: string;
  name: string;
  votes_count: number;
}

const COLORS = [
  'hsl(192, 91%, 52%)',
  'hsl(262, 80%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(210, 80%, 55%)',
];

export function VoteBarChart({ candidates }: { candidates: Candidate[] }) {
  const data = candidates.map(c => ({ name: c.name, votes: c.votes_count }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              color: 'hsl(210, 40%, 96%)',
            }}
          />
          <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VotePieChart({ candidates }: { candidates: Candidate[] }) {
  const data = candidates.filter(c => c.votes_count > 0).map(c => ({ name: c.name, value: c.votes_count }));
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No votes yet</p>;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              color: 'hsl(210, 40%, 96%)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
