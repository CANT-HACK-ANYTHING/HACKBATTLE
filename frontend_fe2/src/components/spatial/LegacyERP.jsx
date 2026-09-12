import React, { useRef, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { MOCK_ERP_DATA, DRIFT_OFFSETS } from '../../state/demoState';
import { RelocalizationVector } from './RelocalizationVector';

export const LegacyERP = ({ onCoordinatesReady }) => {
  const {
    vendorText,
    amountText,
    activeFocusedField,
    buttonState,
    isDriftActive,
    relocalizationProgress,
    currentPhaseIndex,
  } = useDemo();

  const containerRef = useRef(null);
  const vendorRef = useRef(null);
  const amountRef = useRef(null);
  const submitOriginalRef = useRef(null);
  const submitDriftedRef = useRef(null);

  // Measure coordinates for the virtual cursor and relocalization vector
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();

      const getRelativeCoords = (el) => {
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left - cRect.left + rect.width / 2,
          y: rect.top - cRect.top + rect.height / 2,
          rawLeft: rect.left,
          rawTop: rect.top,
          rawWidth: rect.width,
          rawHeight: rect.height,
        };
      };

      const coords = {
        vendor: getRelativeCoords(vendorRef.current),
        amount: getRelativeCoords(amountRef.current),
        submitOriginal: getRelativeCoords(submitOriginalRef.current),
        submitDrifted: {
          x: getRelativeCoords(submitOriginalRef.current).x + DRIFT_OFFSETS.dx,
          y: getRelativeCoords(submitOriginalRef.current).y + DRIFT_OFFSETS.dy,
        },
      };

      if (onCoordinatesReady) {
        onCoordinatesReady(coords);
      }
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    const timer = setTimeout(updatePositions, 300);
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [onCoordinatesReady, isDriftActive]);

  // Button state label
  const getButtonText = () => {
    switch (buttonState) {
      case 'CHECKING': return 'CHECKING...';
      case 'VALIDATING': return 'VALIDATING...';
      case 'APPROVED': return '✓ APPROVED';
      case 'BLOCKED': return '✗ BLOCKED: POLICY';
      case 'SUBMITTED': return '✓ SUBMITTED [OK]';
      default: return 'SUBMIT ENTRY (F9)';
    }
  };

  const getButtonClass = () => {
    switch (buttonState) {
      case 'CHECKING': return 'bg-amber-200 text-amber-900';
      case 'VALIDATING': return 'bg-blue-200 text-blue-900';
      case 'APPROVED': return 'bg-emerald-300 text-emerald-950 font-bold border-emerald-600';
      case 'BLOCKED': return 'bg-rose-300 text-rose-950 font-bold border-rose-600';
      case 'SUBMITTED': return 'bg-emerald-600 text-white font-bold shadow-inner';
      default: return 'retro-btn hover:bg-gray-200';
    }
  };

  return (
    <div
      ref={containerRef}
      className="retro-window w-full max-w-2xl rounded-sm shadow-2xl relative overflow-hidden select-none"
    >
      {/* 1. Classic Windows/ERP Titlebar */}
      <div className="retro-titlebar flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Retro Window Icon */}
          <div className="w-3.5 h-3.5 bg-blue-300 border border-black flex items-center justify-center text-[8px] font-bold text-blue-900">
            PO
          </div>
          <span className="font-mono">
            LEGACY ERP v4.12 — PURCHASE ORDER ENTRY [SESSION #8841-B]
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="w-4 h-3.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black text-[9px] font-bold flex items-center justify-center leading-none">
            _
          </button>
          <button className="w-4 h-3.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black text-[9px] font-bold flex items-center justify-center leading-none">
            □
          </button>
          <button className="w-4 h-3.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black text-[9px] font-bold flex items-center justify-center leading-none text-red-700">
            ×
          </button>
        </div>
      </div>

      {/* 2. Menu Bar */}
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-0.5 flex items-center space-x-3 text-xs text-black">
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>F</u>ile</span>
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>E</u>dit</span>
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>R</u>ecords</span>
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>A</u>udit</span>
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>W</u>indow</span>
        <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-1"><u>H</u>elp</span>
      </div>

      {/* 3. Form Content */}
      <div className="p-4 bg-[#d4d0c8] space-y-3 text-xs text-black">
        {/* Header Metadata Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-[#eae7df] border border-[#808080]">
          <div>
            <span className="text-[10px] text-gray-600 block">PO NUMBER:</span>
            <span className="font-mono font-bold">{MOCK_ERP_DATA.poNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-600 block">COST CENTER:</span>
            <span className="font-mono font-bold">{MOCK_ERP_DATA.costCenter}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-600 block">POSTING DATE:</span>
            <span className="font-mono font-bold">{MOCK_ERP_DATA.date}</span>
          </div>
        </div>

        {/* Input Fields Container */}
        <div className="space-y-3 bg-[#e4e0d8] p-3 border border-[#a09c94]">
          {/* Field 1: Vendor */}
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="font-bold text-right pr-2">
              <span className="text-red-700">*</span> Vendor Name:
            </label>
            <div className="col-span-3 relative">
              <input
                ref={vendorRef}
                type="text"
                readOnly
                value={vendorText}
                placeholder="[ AWAITING AGENT INPUT ]"
                className={`retro-input w-full ${activeFocusedField === 'vendor' ? 'ring-2 ring-blue-600 bg-amber-50' : ''}`}
              />
              {activeFocusedField === 'vendor' && (
                <span className="absolute right-2 top-1 w-1.5 h-4 bg-black animate-pulse"></span>
              )}
            </div>
          </div>

          {/* Field 2: Invoice Amount */}
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="font-bold text-right pr-2">
              <span className="text-red-700">*</span> Total Amount:
            </label>
            <div className="col-span-3 relative">
              <input
                ref={amountRef}
                type="text"
                readOnly
                value={amountText}
                placeholder="[ 0.00 INR ]"
                className={`retro-input w-full font-mono font-bold ${activeFocusedField === 'amount' ? 'ring-2 ring-blue-600 bg-amber-50' : ''}`}
              />
              {activeFocusedField === 'amount' && (
                <span className="absolute right-2 top-1 w-1.5 h-4 bg-black animate-pulse"></span>
              )}
            </div>
          </div>

          {/* Field 3: Invoice Ref & GSTIN */}
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="font-bold text-right pr-2">PO Ref / Tax ID:</label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                readOnly
                value={MOCK_ERP_DATA.invoiceRef}
                className="retro-input bg-gray-100 text-gray-700"
              />
              <input
                type="text"
                readOnly
                value={MOCK_ERP_DATA.taxId}
                className="retro-input bg-gray-100 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Action Button Section with Simulated Drift */}
        <div className="pt-2 pb-1 relative min-h-[75px] flex items-center justify-center">
          {/* Invisible anchor marking the original expected position */}
          <div ref={submitOriginalRef} className="w-[140px] h-[32px] absolute pointer-events-none"></div>

          {/* Real Button: In drift mode, it offsets by +76px X, +42px Y */}
          <div
            ref={submitDriftedRef}
            className="transition-all duration-700 ease-out z-20"
            style={{
              transform: isDriftActive
                ? `translate(${DRIFT_OFFSETS.dx}px, ${DRIFT_OFFSETS.dy}px)`
                : 'translate(0px, 0px)',
            }}
          >
            <button
              type="button"
              className={`min-w-[140px] h-[32px] ${getButtonClass()} transition-colors duration-200`}
            >
              {getButtonText()}
            </button>
          </div>
        </div>

        {/* Relocalization Vector & Reticle Overlay */}
        <RelocalizationVector
          originCoords={
            submitOriginalRef.current && containerRef.current
              ? {
                  x: submitOriginalRef.current.offsetLeft + submitOriginalRef.current.offsetWidth / 2,
                  y: submitOriginalRef.current.offsetTop + submitOriginalRef.current.offsetHeight / 2,
                }
              : null
          }
          targetCoords={
            submitOriginalRef.current && containerRef.current
              ? {
                  x: submitOriginalRef.current.offsetLeft + submitOriginalRef.current.offsetWidth / 2 + (isDriftActive ? DRIFT_OFFSETS.dx : 0),
                  y: submitOriginalRef.current.offsetTop + submitOriginalRef.current.offsetHeight / 2 + (isDriftActive ? DRIFT_OFFSETS.dy : 0),
                }
              : null
          }
        />
      </div>

      {/* 4. Retro Status Bar */}
      <div className="retro-statusbar flex items-center justify-between font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-emerald-700 font-bold">● TCP/IP CONNECTED</span>
          <span>TTY: 1</span>
          <span>DB: ORCL-FIN-PROD-02</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>LATENCY: 28ms</span>
          <span>|</span>
          <span className="font-bold">STATUS: {buttonState === 'SUBMITTED' ? 'RECORD COMMITTED' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};
