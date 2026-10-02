import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, UserCheck, Shield } from 'lucide-react';

export const AdminUserManagerPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const sampleUsers = [
    { name: 'Kavitha R', email: 'citizen@gmail.com', role: 'Citizen', district: 'Coimbatore', status: 'ACTIVE' },
    { name: 'District Officer', email: 'officer@tnwelfare.gov.in', role: 'Officer', district: 'Madurai', status: 'ACTIVE' },
    { name: 'System Admin Officer', email: 'admin@tnwelfare.gov.in', role: 'Admin', district: 'Chennai', status: 'ACTIVE' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'பயனர்கள் & அதிகாரிகள் மேலாண்மை' : 'User, Officer & Role Access Management'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'கணக்குகள் மற்றும் அதிகாரிகளின் பணி அதிகாரங்களை நிர்வகிக்க' : 'Manage citizen accounts, officer assignments, and role-based permissions'}
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sampleUsers.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                      u.role === 'Admin' ? 'bg-amber-100 text-amber-900' : u.role === 'Officer' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{u.district}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {u.status}
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
};
