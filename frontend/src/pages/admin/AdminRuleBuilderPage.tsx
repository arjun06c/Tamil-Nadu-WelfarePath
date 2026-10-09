import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Sliders,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  ShieldAlert,
  Info,
  Check
} from 'lucide-react';

const FIELD_LIBRARY = [
  { group: 'Personal & Residence', key: 'residence', labelEn: 'Tamil Nadu Resident', labelTa: 'தமிழ்நாடு இருப்பிடம்', type: 'boolean' },
  { group: 'Personal & Residence', key: 'age', labelEn: 'Age (Years)', labelTa: 'வயது (ஆண்டுகள்)', type: 'number' },
  { group: 'Personal & Residence', key: 'gender', labelEn: 'Gender', labelTa: 'பாலினம்', type: 'select', options: ['Female', 'Male', 'Transgender'] },
  { group: 'Personal & Residence', key: 'district', labelEn: 'District', labelTa: 'மாவட்டம்', type: 'string' },
  
  { group: 'Income & Finances', key: 'annualFamilyIncome', labelEn: 'Annual Family Income (₹)', labelTa: 'குடும்பத்தின் ஆண்டு வருமானம் (₹)', type: 'number', hasFrequency: true },
  { group: 'Income & Finances', key: 'monthlySalary', labelEn: 'Monthly Salary (₹)', labelTa: 'மாத வருமானம் (₹)', type: 'number', hasFrequency: true },
  
  { group: 'Employment & Occupation', key: 'governmentEmployee', labelEn: 'Government Employee', labelTa: 'அரசு ஊழியர்', type: 'boolean' },
  { group: 'Employment & Occupation', key: 'employmentStatus', labelEn: 'Employment Status', labelTa: 'வேலைவாய்ப்பு நிலை', type: 'select', options: ['Employed', 'Unemployed', 'Student', 'Self-Employed'] },
  { group: 'Employment & Occupation', key: 'isFarmer', labelEn: 'Farmer Status', labelTa: 'விவசாயி தகுதி', type: 'boolean' },
  
  { group: 'Social & Vulnerability', key: 'communityCategory', labelEn: 'Community / Social Category', labelTa: 'சமூகப் பிரிவு / சாதி', type: 'select', options: ['SC', 'ST', 'MBC', 'BC', 'General'] },
  { group: 'Social & Vulnerability', key: 'isWidow', labelEn: 'Destitute Widow', labelTa: 'ஆதரவற்ற விதவை', type: 'boolean' },
  { group: 'Social & Vulnerability', key: 'hasDisability', labelEn: 'Differently Abled', labelTa: 'மாற்றுத்திறனாளி', type: 'boolean' },
  { group: 'Social & Vulnerability', key: 'disabilityPercentage', labelEn: 'Disability Percentage (%)', labelTa: 'மாற்றுத்திறன் சதவீதம் (%)', type: 'number' },
  { group: 'Social & Vulnerability', key: 'alreadyReceivingBenefit', labelEn: 'Already Receiving Scheme Benefit', labelTa: 'தற்போது பெறும் அரசு உதவி', type: 'boolean' }
];

const AVAILABLE_DOCUMENTS = [
  { docType: 'AadhaarCard', labelEn: 'Aadhaar Card', labelTa: 'ஆதார் கார்டு' },
  { docType: 'IncomeCertificate', labelEn: 'Income Certificate', labelTa: 'வருமானச் சான்றிதழ்' },
  { docType: 'CommunityCertificate', labelEn: 'Community Certificate', labelTa: 'சாதிச் சான்றிதழ்' },
  { docType: 'DisabilityCertificate', labelEn: 'Disability Certificate', labelTa: 'மாற்றுத்திறனாளி சான்றிதழ்' },
  { docType: 'HouseSitePatta', labelEn: 'House Site Patta Document', labelTa: 'வீட்டு மனை பட்டா சான்றிதழ்' },
  { docType: 'SmartRationCard', labelEn: 'Smart Ration Card', labelTa: 'குடும்ப அட்டை (ரேஷன் கார்டு)' }
];

export const AdminRuleBuilderPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSchemeId = searchParams.get('schemeId') || '';

  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState(initialSchemeId);
  const [currentScheme, setCurrentScheme] = useState<any | null>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  // Rule State
  const [allConditions, setAllConditions] = useState<any[]>([]);
  const [exclusionConditions, setExclusionConditions] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState('DRAFT');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // JSON Accordion State
  const [showJson, setShowJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  // Rule Tester State
  const [sampleProfile, setSampleProfile] = useState({
    residence: 'Tamil Nadu',
    age: 28,
    annualFamilyIncome: 60000,
    governmentEmployee: false,
    hasDisability: false,
    isFarmer: false,
    attachedDocTypes: ['AadhaarCard', 'IncomeCertificate']
  });
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    if (selectedSchemeId && schemes.length > 0) {
      const sch = schemes.find((s) => s._id === selectedSchemeId || s.schemeCode === selectedSchemeId);
      if (sch) {
        loadSchemeRules(sch);
      }
    }
  }, [selectedSchemeId, schemes]);

  const fetchSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const res = await api.get('/schemes?includeDrafts=true');
      const list = res.data.schemes || [];
      setSchemes(list);
      if (list.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(list[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const loadSchemeRules = (sch: any) => {
    setCurrentScheme(sch);
    const rules = sch.rules || {};
    setAllConditions(rules.all || []);
    setExclusionConditions(rules.exclusions || rules.none || []);
    const docTypes = (sch.requiredDocuments || []).map((d: any) => d.docType);
    setSelectedDocs(docTypes);
    setVersion(sch.ruleVersion || '1.0');
    setStatus(sch.status || (sch.isActive ? 'PUBLISHED' : 'DRAFT'));

    // Sync Raw JSON
    const jsonObj = {
      all: rules.all || [],
      exclusions: rules.exclusions || rules.none || [],
      requiredDocuments: sch.requiredDocuments || []
    };
    setRawJsonText(JSON.stringify(jsonObj, null, 2));
    setTestResult(null);
  };

  const handleAddCondition = () => {
    setAllConditions([
      ...allConditions,
      {
        field: 'annualFamilyIncome',
        operator: 'less_than_or_equal',
        value: 72000,
        frequency: 'Annual',
        label: {
          en: 'Annual Family Income <= ₹72,000',
          ta: 'குடும்பத்தின் ஆண்டு வருமானம் ₹72,000 அல்லது அதற்குக் குறைவாக இருக்க வேண்டும்'
        },
        isMandatory: true
      }
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setAllConditions(allConditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, updated: any) => {
    const list = [...allConditions];
    list[index] = updated;
    setAllConditions(list);
  };

  const handleAddExclusion = () => {
    setExclusionConditions([
      ...exclusionConditions,
      {
        field: 'governmentEmployee',
        operator: 'equals',
        value: true,
        label: {
          en: 'Applicant must NOT be a Government Employee',
          ta: 'விண்ணப்பதாரர் அரசு ஊழியராக இருக்கக்கூடாது'
        }
      }
    ]);
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusionConditions(exclusionConditions.filter((_, i) => i !== index));
  };

  const handleUpdateExclusion = (index: number, updated: any) => {
    const list = [...exclusionConditions];
    list[index] = updated;
    setExclusionConditions(list);
  };

  const handleToggleDoc = (docType: string) => {
    if (selectedDocs.includes(docType)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== docType));
    } else {
      setSelectedDocs([...selectedDocs, docType]);
    }
  };

  const handleTestRule = async () => {
    if (!currentScheme) return;
    setTesting(true);
    try {
      const rulesPayload = {
        all: allConditions,
        exclusions: exclusionConditions
      };
      const reqDocsPayload = selectedDocs.map((dt) => {
        const found = AVAILABLE_DOCUMENTS.find((d) => d.docType === dt);
        return {
          docType: dt,
          isMandatory: true,
          label: { en: found?.labelEn || dt, ta: found?.labelTa || dt }
        };
      });

      const res = await api.post('/admin/schemes/rules/test', {
        rules: rulesPayload,
        requiredDocuments: reqDocsPayload,
        sampleProfile
      });

      setTestResult(res.data.outcome);
    } catch (err: any) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSchemeRules = async (targetStatus?: string) => {
    if (!currentScheme) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const saveStatus = targetStatus || status;

      const reqDocsPayload = selectedDocs.map((dt) => {
        const found = AVAILABLE_DOCUMENTS.find((d) => d.docType === dt);
        return {
          docType: dt,
          isMandatory: true,
          label: { en: found?.labelEn || dt, ta: found?.labelTa || dt }
        };
      });

      const payload = {
        rules: {
          all: allConditions,
          exclusions: exclusionConditions
        },
        requiredDocuments: reqDocsPayload,
        status: saveStatus
      };

      const res = await api.patch(`/admin/schemes/${currentScheme._id}`, payload);
      setCurrentScheme(res.data.scheme);
      setStatus(saveStatus);
      setVersion(res.data.scheme.ruleVersion || '1.1');
      setSaveMsg(
        isTa
          ? `விதிப் பதிப்பு v${res.data.scheme.ruleVersion || '1.1'} வெற்றி கரமாக (${saveStatus}) சேமிக்கப்பட்டது!`
          : `Rule Schema v${res.data.scheme.ruleVersion || '1.1'} successfully saved as ${saveStatus}!`
      );
      await fetchSchemes();
    } catch (err: any) {
      console.error('Save rules error:', err);
      setSaveMsg('Error saving rules: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-blue-900" />
            <span>{isTa ? 'விளக்கமான தகுதி விதிகள் கட்டமைப்பு' : 'Visual Configurable Eligibility Rule Builder'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'அரசு திட்டங்களுக்கான தகுதி, விலக்கு மற்றும் ஆவண விவாதங்களை காட்சி வடிவில் கட்டமைக்கலாம்'
              : 'Configure scheme-specific positive rules, exclusions, and document requirements'}
          </p>
        </div>
      </div>

      {/* Scheme Selector Header Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              {isTa ? 'திட்டத்தைத் தேர்ந்தெடுக்கவும் (Select Target Scheme):' : 'Select Target Scheme:'}
            </label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-extrabold text-xs text-slate-900 focus:ring-2 focus:ring-blue-900"
            >
              {schemes.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.schemeCode} — {isTa ? s.name?.ta : s.name?.en} ({s.domainKey})
                </option>
              ))}
            </select>
          </div>

          {currentScheme && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Rule Version</span>
                <span className="font-mono font-black text-blue-900 text-sm">v{version}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {saveMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs p-4 rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span className="font-bold">{saveMsg}</span>
        </div>
      )}

      {/* Main Visual Rule Builder Sections */}
      {currentScheme && (
        <div className="space-y-6">

          {/* 1. REQUIRED POSITIVE CONDITIONS (ALL / AND) */}
          <div className="glass-card p-6 rounded-3xl border border-blue-200 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-blue-900" />
                  <span>{isTa ? 'தேவைப்படும் அடிப்படை தகுதி நிபந்தனைகள் (Required Conditions - ALL)' : 'Required Positive Conditions (All must be met)'}</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isTa ? 'விண்ணப்பதாரர் இந்த அனைத்து நிபந்தனைகளையும் பூர்த்தி செய்ய வேண்டும்' : 'Applicant must satisfy all configured positive criteria'}
                </p>
              </div>

              <button
                onClick={handleAddCondition}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{isTa ? 'நிபந்தனை சேர்க்க' : 'Add Condition'}</span>
              </button>
            </div>

            {allConditions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No positive conditions configured yet. Click "Add Condition" above.
              </div>
            ) : (
              <div className="space-y-3">
                {allConditions.map((cond, idx) => (
                  <RuleRowEditor
                    key={idx}
                    index={idx}
                    condition={cond}
                    onUpdate={(updated) => handleUpdateCondition(idx, updated)}
                    onRemove={() => handleRemoveCondition(idx)}
                    isTa={isTa}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. EXCLUSION CONDITIONS (NONE / DISQUALIFIERS) */}
          <div className="glass-card p-6 rounded-3xl border border-red-200 bg-red-50/20 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-red-950 flex items-center space-x-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
                  <span>{isTa ? 'விலக்கு நிபந்தனைகள் (Exclusion Disqualifiers)' : 'Exclusion Conditions (Applicant NOT eligible if true)'}</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isTa ? 'இந்த நிபந்தனைகளில் ஏதேனும் ஒன்றும் பொருந்தினால் தகுதியற்றது எனக் கருதப்படும்' : 'If any exclusion condition is met, applicant is immediately disqualified'}
                </p>
              </div>

              <button
                onClick={handleAddExclusion}
                className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>{isTa ? 'விலக்கு சேர்க்க' : 'Add Exclusion'}</span>
              </button>
            </div>

            {exclusionConditions.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No exclusion rules defined (optional).
              </div>
            ) : (
              <div className="space-y-3">
                {exclusionConditions.map((ex, idx) => (
                  <RuleRowEditor
                    key={idx}
                    index={idx}
                    condition={ex}
                    isExclusion
                    onUpdate={(updated) => handleUpdateExclusion(idx, updated)}
                    onRemove={() => handleRemoveExclusion(idx)}
                    isTa={isTa}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. REQUIRED PROOF DOCUMENTS */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4.5 h-4.5 text-teal-700" />
                <span>{isTa ? 'தேவைப்படும் சான்றிதழ் ஆவணங்கள்' : 'Required Proof Documents'}</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {isTa ? 'விண்ணப்பதாரர் இந்த திட்டத்திற்காக சமர்ப்பிக்க வேண்டிய ஆவணங்கள்' : 'Proof documents required for preliminary match verification'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_DOCUMENTS.map((doc) => {
                const checked = selectedDocs.includes(doc.docType);
                return (
                  <div
                    key={doc.docType}
                    onClick={() => handleToggleDoc(doc.docType)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      checked
                        ? 'border-teal-500 bg-teal-50/50 text-teal-950 font-extrabold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isTa ? doc.labelTa : doc.labelEn}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      checked ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300'
                    }`}>
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. LIVE RULE SUMMARY */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-md">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>{isTa ? 'விதிகளின் சுருக்கம் (Live Rule Summary)' : 'Live Rule Summary & Logic Preview'}</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-medium">
              <div>
                <span className="text-emerald-400 font-extrabold block">✓ Required Positive Criteria:</span>
                {allConditions.length === 0 ? (
                  <span className="text-slate-400 italic">None configured</span>
                ) : (
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {allConditions.map((c, i) => (
                      <li key={i}>{isTa ? c.label?.ta : c.label?.en}</li>
                    ))}
                  </ul>
                )}
              </div>

              {exclusionConditions.length > 0 && (
                <div>
                  <span className="text-red-400 font-extrabold block">✕ Disqualifying Exclusions:</span>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {exclusionConditions.map((ex, i) => (
                      <li key={i}>{isTa ? ex.label?.ta : ex.label?.en}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="text-teal-300 font-extrabold block">📄 Required Proof Documents:</span>
                <span className="ml-2 text-slate-300">
                  {selectedDocs.length > 0 ? selectedDocs.join(', ') : 'None mandatory'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. INTERACTIVE RULE TESTER */}
          <div className="glass-card p-6 rounded-3xl border border-indigo-200 bg-indigo-50/20 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-indigo-950 flex items-center space-x-2">
                  <Play className="w-4.5 h-4.5 text-indigo-700" />
                  <span>{isTa ? 'விதி பரிசோதனை (Interactive Rule Tester)' : 'Interactive Rule Tester (Sample Profile)'}</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Test configured scheme rules against a sample citizen profile using the single backend eligibility engine.
                </p>
              </div>

              <button
                onClick={handleTestRule}
                disabled={testing}
                className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>{testing ? 'Evaluating...' : 'Test Rule Now'}</span>
              </button>
            </div>

            {/* Sample Profile Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-2xl border border-indigo-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={sampleProfile.age}
                  onChange={(e) => setSampleProfile({ ...sampleProfile, age: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
                <input
                  type="number"
                  value={sampleProfile.annualFamilyIncome}
                  onChange={(e) => setSampleProfile({ ...sampleProfile, annualFamilyIncome: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Government Employee</label>
                <select
                  value={sampleProfile.governmentEmployee ? 'yes' : 'no'}
                  onChange={(e) => setSampleProfile({ ...sampleProfile, governmentEmployee: e.target.value === 'yes' })}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residence</label>
                <select
                  value={sampleProfile.residence}
                  onChange={(e) => setSampleProfile({ ...sampleProfile, residence: e.target.value })}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                >
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Other State">Other State</option>
                </select>
              </div>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div className="bg-white p-4 rounded-2xl border border-indigo-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">Backend Evaluation Result:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    testResult.status === 'STRONG_MATCH' || testResult.status === 'ELIGIBLE'
                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      : testResult.status === 'POTENTIAL_MATCH' || testResult.status === 'NEAR_ELIGIBLE'
                      ? 'bg-blue-100 text-blue-950 border border-blue-300'
                      : 'bg-red-100 text-red-950 border border-red-300'
                  }`}>
                    {testResult.statusBadge ? (isTa ? testResult.statusBadge.ta : testResult.statusBadge.en) : testResult.status}
                  </span>
                </div>

                <p className="text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {isTa ? testResult.gapAnalysisRemarks?.ta : testResult.gapAnalysisRemarks?.en}
                </p>

                {testResult.criteriaBreakdown?.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 block">Criteria Evaluation Breakdown:</span>
                    {testResult.criteriaBreakdown.map((c: any, i: number) => (
                      <div key={i} className="flex items-center space-x-2 text-[11px]">
                        {c.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        )}
                        <span>{isTa ? c.explanation?.ta : c.explanation?.en}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. ADVANCED JSON ACCORDION */}
          <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowJson(!showJson)}
              className="w-full p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-between transition-colors"
            >
              <span>Advanced Rule JSON Configuration (Developer Inspection)</span>
              {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showJson && (
              <div className="p-4 bg-slate-900 space-y-3">
                <textarea
                  rows={10}
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-950 text-amber-200 rounded-xl focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 7. SAVE & PUBLISH ACTION BAR */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => handleSaveSchemeRules('DRAFT')}
              disabled={saving}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl transition-all"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={() => handleSaveSchemeRules('PUBLISHED')}
              disabled={saving}
              className="px-7 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing...' : 'Publish Rule Schema'}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

// Row Editor Subcomponent
const RuleRowEditor: React.FC<{
  index: number;
  condition: any;
  isExclusion?: boolean;
  onUpdate: (updated: any) => void;
  onRemove: () => void;
  isTa: boolean;
}> = ({ condition, isExclusion, onUpdate, onRemove, isTa }) => {
  const selectedFieldObj = FIELD_LIBRARY.find((f) => f.key === condition.field) || FIELD_LIBRARY[0];

  const handleFieldChange = (newKey: string) => {
    const fObj = FIELD_LIBRARY.find((f) => f.key === newKey) || FIELD_LIBRARY[0];
    const updated = {
      ...condition,
      field: newKey,
      operator: fObj.type === 'boolean' ? 'equals' : 'less_than_or_equal',
      value: fObj.type === 'boolean' ? true : 72000,
      label: {
        en: `${fObj.labelEn} condition`,
        ta: `${fObj.labelTa} நிபந்தனை`
      }
    };
    onUpdate(updated);
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
      isExclusion ? 'bg-red-50/40 border-red-200' : 'bg-slate-50/60 border-slate-200'
    }`}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
        
        {/* Field Selection */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Field</label>
          <select
            value={condition.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
          >
            {FIELD_LIBRARY.map((f) => (
              <option key={f.key} value={f.key}>
                {isTa ? f.labelTa : f.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Operator Selection */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Operator</label>
          <select
            value={condition.operator}
            onChange={(e) => onUpdate({ ...condition, operator: e.target.value })}
            className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
          >
            {selectedFieldObj.type === 'boolean' ? (
              <>
                <option value="equals">Is Equals (=)</option>
                <option value="not_equals">Is Not Equals (!=)</option>
              </>
            ) : (
              <>
                <option value="less_than_or_equal">Less than or equal (&lt;=)</option>
                <option value="greater_than_or_equal">Greater than or equal (&gt;=)</option>
                <option value="equals">Equals (=)</option>
                <option value="between">Between Range</option>
              </>
            )}
          </select>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Required Value</label>
          {selectedFieldObj.type === 'boolean' ? (
            <select
              value={condition.value ? 'true' : 'false'}
              onChange={(e) => onUpdate({ ...condition, value: e.target.value === 'true' })}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
            >
              <option value="true">Yes / True</option>
              <option value="false">No / False</option>
            </select>
          ) : selectedFieldObj.type === 'select' ? (
            <select
              value={condition.value}
              onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
            >
              {selectedFieldObj.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              value={condition.value}
              onChange={(e) => onUpdate({ ...condition, value: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
            />
          )}
        </div>

        {/* Frequency & Remove Button */}
        <div className="flex items-center justify-between gap-2">
          {selectedFieldObj.hasFrequency ? (
            <div className="w-full">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Frequency</label>
              <select
                value={condition.frequency || 'Annual'}
                onChange={(e) => onUpdate({ ...condition, frequency: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
              >
                <option value="Annual">Annual</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          ) : <div className="w-full" />}

          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors mt-4 shrink-0"
            title="Remove Rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Human Readable Explanation Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
        <div>
          <span className="text-slate-400 font-extrabold block">English Explanation Label:</span>
          <input
            type="text"
            value={condition.label?.en || ''}
            onChange={(e) => onUpdate({ ...condition, label: { ...condition.label, en: e.target.value } })}
            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
          />
        </div>
        <div>
          <span className="text-slate-400 font-extrabold block">தமிழ் விளக்கம்:</span>
          <input
            type="text"
            value={condition.label?.ta || ''}
            onChange={(e) => onUpdate({ ...condition, label: { ...condition.label, ta: e.target.value } })}
            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
          />
        </div>
      </div>
    </div>
  );
};
