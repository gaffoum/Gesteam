"use client";
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Données simulées (En attendant d'avoir assez d'historique en base de données)
const data = [
  { journee: 'J1', position: 12 },
  { journee: 'J2', position: 10 },
  { journee: 'J3', position: 8 },
  { journee: 'J4', position: 9 },
  { journee: 'J5', position: 6 },
  { journee: 'J6', position: 5 },
  { journee: 'J7', position: 3 },
  { journee: 'J8', position: 2 },
  { journee: 'J9', position: 1 },
];

export default function TeamPositionChart() {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-6">
      <h3 className="font-black uppercase italic text-sm mb-4">Évolution Classement</h3>
      <div className="h-[200px] w-full text-[10px] font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="journee" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af'}} 
            />
            <YAxis 
              reversed={true} // Inversé car 1er = en haut du graph
              hide={true} 
              domain={[1, 'auto']} 
            />
            <Tooltip 
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              cursor={{stroke: '#ff9d00', strokeWidth: 1}}
            />
            <Line 
              type="monotone" 
              dataKey="position" 
              stroke="#ff9d00" 
              strokeWidth={3} 
              dot={{r: 4, fill: '#000', strokeWidth: 2, stroke:'#fff'}} 
              activeDot={{r: 6, fill: '#ff9d00'}} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}