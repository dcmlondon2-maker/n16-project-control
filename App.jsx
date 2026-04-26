import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { week: 1, balance: 10000 },
  { week: 5, balance: -5000 },
  { week: 10, balance: 15000 },
  { week: 15, balance: 20000 },
];

export default function App(){
  return (
    <div style={{padding:40,fontFamily:"Arial"}}>
      <h1>N16 Project Control Dashboard</h1>
      <p>Live project control system</p>

      <h2>Cashflow</h2>
      <div style={{height:300}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="balance" stroke="#ff6600" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Modules</h2>
      <ul>
        <li>Budget by Trade</li>
        <li>Cashflow Forecast</li>
        <li>Labour Tracker</li>
        <li>PO Tracker</li>
        <li>Variations</li>
        <li>P&L Dashboard</li>
      </ul>
    </div>
  )
}
