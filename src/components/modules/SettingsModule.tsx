import React, { useState } from 'react';
import {
  Sliders,
  MapPin,
  Car,
  ShieldCheck,
  Calendar,
  Download,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PersonalOperatingContext, AIMProject } from '../../types';
import { aimContextService } from '../../services/aimContextService';

interface SettingsModuleProps {
  context: PersonalOperatingContext;
  projects: AIMProject[];
  onUpdateContext: (updatedContext: PersonalOperatingContext) => void;
  onToast: (msg: string) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  context,
  projects,
  onUpdateContext,
  onToast,
}) => {
  const [formData, setFormData] = useState<PersonalOperatingContext>(() => ({
    ...context,
    location: context?.location || 'Fort Worth, Texas',
    searchRadiusMiles: context?.searchRadiusMiles || 35,
    hasPersonalVehicle: context?.hasPersonalVehicle ?? context?.transportation?.hasPersonalVehicle ?? false,
    needsEmployerVehicle: context?.needsEmployerVehicle ?? context?.transportation?.needsEmployerVehicle ?? true,
    driverLicenseType: context?.driverLicenseType || context?.transportation?.driverLicenseType || 'Texas non-CDL Class C',
    cleanDrivingRecord: context?.cleanDrivingRecord ?? context?.transportation?.cleanDrivingRecord ?? true,
    licenseReissueDateNote: context?.licenseReissueDateNote || context?.transportation?.licenseReissueDate || 'August 2026',
    historicalDrivingExperience: context?.historicalDrivingExperience || context?.transportation?.historicalDrivingExp || 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
    autoScanWeekdays: context?.autoScanWeekdays ?? true,
    scanTime: context?.scanTime || '07:30 AM',
  }));
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedContext: PersonalOperatingContext = {
      ...formData,
      transportation: {
        ...(formData.transportation || {
          hasPersonalVehicle: false,
          needsEmployerVehicle: true,
          driverLicenseType: 'Texas non-CDL Class C',
          cleanDrivingRecord: true,
          licenseReissueDate: 'August 2026',
          apparentHistoryUnderOneYear: true,
          historicalDrivingExp: 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
          cdlQualified: false,
        }),
        hasPersonalVehicle: Boolean(formData.hasPersonalVehicle),
        needsEmployerVehicle: Boolean(formData.needsEmployerVehicle),
        driverLicenseType: formData.driverLicenseType || 'Texas non-CDL Class C',
        cleanDrivingRecord: Boolean(formData.cleanDrivingRecord),
        licenseReissueDate: formData.licenseReissueDateNote || 'August 2026',
        historicalDrivingExp: formData.historicalDrivingExperience || 'Passenger and chauffeur driving experience through The Ride Guys (approx. 2019–2022)',
      },
    };
    onUpdateContext(updatedContext);
    onToast('Operating settings and constraints saved!');
  };

  const handleExportData = () => {
    const data = {
      context: formData,
      projects,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aim-life-os-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Exported complete operating data as JSON!');
  };

  const handleResetData = () => {
    localStorage.removeItem('aim_personal_context');
    localStorage.removeItem('aim_projects_data');
    localStorage.removeItem('aim_job_listings');
    localStorage.removeItem('aim_job_scan_runs');
    onToast('Reset all operating data. Reloading default baseline...');
    window.location.reload();
  };

  return (
    <div id="settings-screen" className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Operating System Context & Constraints
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune your confirmed operating facts, transportation parameters, license constraints, and scanner schedules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Location & Search Parameters */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <h2>Search Geography & Commute Range</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Search Center City / Area</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Search Radius (Miles)</label>
              <select
                value={formData.searchRadiusMiles || 35}
                onChange={(e) => setFormData({ ...formData, searchRadiusMiles: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value={15}>15 Miles (Fort Worth core)</option>
                <option value={25}>25 Miles (Fort Worth + Arlington)</option>
                <option value={35}>35 Miles (Fort Worth + DFW Airport corridor)</option>
                <option value={50}>50 Miles (Greater DFW Metroplex)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Transportation & Vehicle Rules */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Car className="w-4 h-4 text-amber-400" />
            <h2>Transportation & Vehicle Access Constraints</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={!Boolean(formData.hasPersonalVehicle)}
                onChange={(e) => setFormData({ ...formData, hasPersonalVehicle: !e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-white">No Personal Vehicle Available</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Mandates that all recommended driving jobs must strictly supply an employer-provided vehicle.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.needsEmployerVehicle)}
                onChange={(e) => setFormData({ ...formData, needsEmployerVehicle: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-white">Employer-Provided Vehicle Required on Duty</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Filters out gig delivery (DoorDash, Uber, Amazon Flex) that require personal car wear-and-tear.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Driver License & Qualifications */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2>Driver License & Driving History</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">License Class</label>
              <input
                type="text"
                value={formData.driverLicenseType || ''}
                onChange={(e) => setFormData({ ...formData, driverLicenseType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">MVR Record Status</label>
              <input
                type="text"
                value={formData.cleanDrivingRecord ? 'Clean Driving Record (Zero Violations)' : 'Violations on Record'}
                readOnly
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Reissued License Date Note</label>
              <input
                type="text"
                value={formData.licenseReissueDateNote || ''}
                onChange={(e) => setFormData({ ...formData, licenseReissueDateNote: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Historical Passenger Experience</label>
              <input
                type="text"
                value={formData.historicalDrivingExperience || ''}
                onChange={(e) => setFormData({ ...formData, historicalDrivingExperience: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Automatic Scan Schedule */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h2>Scheduled Opportunity Scanning</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.autoScanWeekdays)}
                onChange={(e) => setFormData({ ...formData, autoScanWeekdays: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 mt-0.5"
              />
              <div>
                <span className="font-semibold text-white">Enable Weekday Morning Scan (Mon-Fri)</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Automatically scans DFW airport, shuttle, and fleet jobs every weekday morning.
                </p>
              </div>
            </label>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Scan Trigger Time</label>
              <input
                type="text"
                value={formData.scanTime || ''}
                onChange={(e) => setFormData({ ...formData, scanTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Data Export & Reset */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-white font-bold text-sm">Operating Data Management</h2>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All AIM Data (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset to Default Baseline</span>
            </button>
          </div>

          {showResetConfirm && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-red-300">
                <AlertTriangle className="w-4 h-4" /> Are you sure you want to reset all data?
              </div>
              <p className="text-[11px] text-red-200">
                This will clear local edits and restore the initial 10 projects and Fort Worth context baseline.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                >
                  Yes, Reset Everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Operating Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
