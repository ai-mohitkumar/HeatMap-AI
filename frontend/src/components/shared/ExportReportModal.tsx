import React, { useState } from 'react';
import { FileText, Download, X, Check, Database, MapPin, Sparkles } from 'lucide-react';
import { notificationService } from '../../utils/notificationService';

export type ExportFormat = 'md' | 'csv' | 'bundle';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (format: ExportFormat) => Promise<void> | void;
  activeK?: number;
  activeLocation?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  activeK = 4,
  activeLocation = 'Patna Synoptic Base, IN'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsExporting(true);
      await onConfirmExport(selectedFormat);
      notificationService.dispatchInAppAlert(
        '📥 Report Exported',
        selectedFormat === 'bundle'
          ? 'Executive Report (.md) and Station Dataset (.csv) downloaded successfully.'
          : selectedFormat === 'csv'
          ? 'Synoptic Stations Dataset (.csv) downloaded successfully.'
          : 'Executive Climate Briefing (.md) downloaded successfully.',
        'success'
      );
      onClose();
    } catch (err: any) {
      notificationService.dispatchInAppAlert(
        'Export Failed',
        err.message || 'An error occurred during report export.',
        'danger'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#0F172E] border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl z-50 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Export Research &amp; Intelligence Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirm your download preferences before generating the file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dataset Metadata Summary Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Artifact Scope &amp; Methodology
          </span>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Observation Network</span>
                <span className="font-bold text-white">46 Synoptic Stations</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Clustering Model</span>
                <span className="font-bold text-white">K-Means Partition (k={activeK})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-300 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Active Geolocation: <strong>{activeLocation}</strong></span>
          </div>
        </div>

        {/* Format Selection Radio Cards */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 block">
            Select Export Format
          </label>

          {/* Option 1: Markdown Executive Report */}
          <div
            onClick={() => setSelectedFormat('md')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
              selectedFormat === 'md'
                ? 'bg-blue-600/15 border-blue-500 text-white ring-2 ring-blue-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Executive Briefing Document (.md)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Contains complete methodology, mathematical formulations, ANOVA separation metrics, and district heat advisories.
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                selectedFormat === 'md'
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-slate-600 bg-transparent'
              }`}
            >
              {selectedFormat === 'md' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Option 2: CSV Dataset */}
          <div
            onClick={() => setSelectedFormat('csv')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
              selectedFormat === 'csv'
                ? 'bg-blue-600/15 border-blue-500 text-white ring-2 ring-blue-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                Synoptic Stations Dataset (.csv)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clean tabular data with 46 station coordinates, temperatures, heat index, and vulnerability tiers for Excel or Python.
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                selectedFormat === 'csv'
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-slate-600 bg-transparent'
              }`}
            >
              {selectedFormat === 'csv' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Option 3: Complete Bundle */}
          <div
            onClick={() => setSelectedFormat('bundle')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
              selectedFormat === 'bundle'
                ? 'bg-blue-600/15 border-blue-500 text-white ring-2 ring-blue-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                Complete Bundle (.md + .csv)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Downloads both the scientific briefing document and raw CSV dataset simultaneously.
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                selectedFormat === 'bundle'
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-slate-600 bg-transparent'
              }`}
            >
              {selectedFormat === 'bundle' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isExporting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-blue-900/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Confirm & Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
