
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SavingsChartProps {
  current: number;
  projected: number;
}

const SavingsChart: React.FC<SavingsChartProps> = ({ current, projected }) => {
  const data = [
    { name: 'Atual', value: current, color: '#ef4444' },
    { name: 'Reduzida', value: projected, color: '#22c55e' },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SavingsChart;
