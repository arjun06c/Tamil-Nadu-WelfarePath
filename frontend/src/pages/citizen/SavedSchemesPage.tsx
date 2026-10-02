import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SchemeCard } from '../../components/SchemeCard';
import { Bookmark } from 'lucide-react';

export const SavedSchemesPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [savedSchemes, setSavedSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await api.get('/misc/saved-schemes');
      setSavedSchemes(res.data.savedSchemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading saved schemes...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'சேமித்த திட்டங்கள் (Saved Bookmarks)' : 'Bookmarked Welfare Schemes'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'நீங்கள் விரும்பிய அல்லது பிறகு விண்ணப்பிக்க சேமித்து வைத்துள்ள திட்டங்கள்' : 'Your saved schemes list for quick eligibility checking and application'}
        </p>
      </div>

      {savedSchemes.length === 0 ? (
        <div className="glass-card text-center py-16 p-4 rounded-2xl">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">{isTa ? 'சேமிக்கப்பட்ட திட்டங்கள் எதுவும் இல்லை.' : 'You have not saved any schemes yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSchemes.map((scheme) => (
            <SchemeCard key={scheme._id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
};
