import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { FileCheck, ArrowRight, Clock } from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await api.get('/applications/my-portfolio');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading applications...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'என் விண்ணப்பங்கள் (My Applications)' : 'My Application Journey History'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'உங்கள் சமர்ப்பிக்கப்பட்ட விண்ணப்பங்களின் தற்போதைய நிலை மற்றும் முன்னேற்றம்' : 'Track current review status and step-by-step milestones'}
        </p>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="glass-card text-center py-12 p-4 rounded-2xl">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{isTa ? 'விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No applications submitted yet.'}</p>
          </div>
        ) : (
          applications.map((app: any) => (
            <div key={app._id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                    {app.applicationNo}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                </h3>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                  {app.status}
                </span>
                <Link
                  to={`/citizen/applications/${app._id}`}
                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <span>{isTa ? 'கண்காணிக்க' : 'Track Timeline'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
