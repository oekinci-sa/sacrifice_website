import React from 'react';
import { BarChart } from '@mui/x-charts';

const data = [
  { month: 'Jan', sales: 3 },
  { month: 'Feb', sales: 2 },
  { month: 'Mar', sales: 1 },
  { month: 'Apr', sales: 4 },
  { month: 'May', sales: 3 },
  { month: 'Jun', sales: 2 },
];

const Charts: React.FC = () => {
  return (
    <div className="h-[200px]">
      <BarChart data={data} />
    </div>
  );
};

export default Charts; 