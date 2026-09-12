import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PHASES, MOCK_ERP_DATA, DRIFT_OFFSETS } from '../state/demoState';
import { audioEngine } from '../audio/audioEngine';

const DemoContext = createContext(null);

export const DemoProvider = ({ children }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [injectViolation, setInjectViolation] = useState(false);
  const [isDriftActive, setIsDriftActive] = useState(false);
  const [relocalizationProgress, setRelocalizationProgress] = useState(0);

  // Form Field Typing State
  const [vendorText, setVendorText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [activeFocusedField, setActiveFocusedField] = useState(null);

  // Submit Button & Guardrail State
  const [buttonState, setButtonState] = useState('IDLE'); // IDLE, HOVER, CHECKING, VALIDATING, APPROVED, BLOCKED, SUBMITTED
  const [guardrailResults, setGuardrailResults] = useState({
    schema: 'PENDING',
    limit: 'PENDING',
    intent: 'PENDING',
    overall: 'PENDING',
  });

  // Telemetry Log
  const [eventLogs, setEventLogs] = useState([
    { id: 1, time: '00:00.12', text: 'Spatial tracking system initialized', type: 'system' },
    { id: 2, time: '00:00.45', text: 'Legacy ERP window mapped into anchor coordinate space', type: 'info' }
  ]);

  const addLog = useCallback((text, type = 'info') => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    setEventLogs(prev => [{ id: Date.now() + Math.random(), time: timeStr, text, type }, ...prev.slice(0, 19)]);
  }, []);

  // Audio Toggle
  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioEngine.setMuted(!next);
    if (next) {
      audioEngine.playScan();
      addLog('Procedural Audio Engine: ONLINE', 'system');
    } else {
      addLog('Procedural Audio Engine: MUTED', 'system');
    }
  }, [soundEnabled, addLog]);

  // Phase controller
  const currentPhase = PHASES[currentPhaseIndex];

  // Manual Phase Navigation
  const setPhase = useCallback((idx) => {
    setCurrentPhaseIndex(idx);
    addLog(`Phase transitioned: [${PHASES[idx].id}/9] ${PHASES[idx].title}`, 'system');
  }, [addLog]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      const next = !prev;
      addLog(next ? 'Autonomous timeline RESUMED' : 'Autonomous timeline PAUSED', 'system');
      return next;
    });
  }, [addLog]);

  // Force Drift Trigger
  const triggerDriftNow = useCallback(() => {
    setIsDriftActive(true);
    setRelocalizationProgress(0);
    audioEngine.playWarning();
    addLog('MANUAL OVERRIDE: Submit button anchor drift triggered (+76px, +42px)', 'warning');
    setTimeout(() => {
      audioEngine.playRelocalize();
      setRelocalizationProgress(100);
      addLog('Spatial Memory: Relocalization lock acquired', 'success');
    }, 1800);
  }, [addLog]);

  // Toggle Guardrail Violation Honeypot
  const toggleGuardrailViolation = useCallback(() => {
    setInjectViolation(prev => {
      const next = !prev;
      addLog(next ? 'HONEYPOT ENGAGED: Next amount exceeds ₹100,000 threshold' : 'HONEYPOT DISENGAGED: Standard safe demo values active', next ? 'warning' : 'info');
      return next;
    });
  }, [addLog]);

  // Reset entire scenario
  const resetScenario = useCallback(() => {
    setCurrentPhaseIndex(0);
    setVendorText('');
    setAmountText('');
    setActiveFocusedField(null);
    setButtonState('IDLE');
    setIsDriftActive(false);
    setRelocalizationProgress(0);
    setGuardrailResults({
      schema: 'PENDING',
      limit: 'PENDING',
      intent: 'PENDING',
      overall: 'PENDING',
    });
    addLog('System state re-initialized to Standby', 'system');
    if (soundEnabled) audioEngine.playScan();
  }, [addLog, soundEnabled]);

  // Handle phase specific behaviors (Cadenced typing, drift, relocalization, guardrail check, etc.)
  const phaseTimerRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(phaseTimerRef.current);
    clearInterval(typingTimerRef.current);

    const phaseId = currentPhase.id;

    // Phase 1: STANDBY
    if (phaseId === 1) {
      setVendorText('');
      setAmountText('');
      setActiveFocusedField(null);
      setButtonState('IDLE');
      setIsDriftActive(false);
      setRelocalizationProgress(0);
      setGuardrailResults({ schema: 'PENDING', limit: 'PENDING', intent: 'PENDING', overall: 'PENDING' });
    }

    // Phase 2: MEMORY ACTIVATION
    if (phaseId === 2) {
      audioEngine.playScan();
      addLog('Memory Graph: Resolving semantic relationships & landmark anchors', 'info');
    }

    // Phase 3: AGENT VENDOR
    if (phaseId === 3) {
      setActiveFocusedField('vendor');
      addLog('Kinematic Cursor: Intersected Vendor Input Field. Initiating cadenced keystrokes.', 'info');
      const targetStr = MOCK_ERP_DATA.vendorTarget;
      let charIndex = 0;
      setVendorText('');

      typingTimerRef.current = setInterval(() => {
        if (charIndex < targetStr.length) {
          setVendorText(targetStr.slice(0, charIndex + 1));
          audioEngine.playKeystroke();
          charIndex++;
        } else {
          clearInterval(typingTimerRef.current);
        }
      }, 95 / playbackSpeed);
    }

    // Phase 4: AGENT AMOUNT
    if (phaseId === 4) {
      setVendorText(MOCK_ERP_DATA.vendorTarget);
      setActiveFocusedField('amount');
      addLog('Kinematic Cursor: Repositioning to Invoice Amount input.', 'info');
      const targetStr = injectViolation ? MOCK_ERP_DATA.amountTargetViolating : MOCK_ERP_DATA.amountTarget;
      let charIndex = 0;
      setAmountText('');

      typingTimerRef.current = setInterval(() => {
        if (charIndex < targetStr.length) {
          setAmountText(targetStr.slice(0, charIndex + 1));
          audioEngine.playKeystroke();
          charIndex++;
        } else {
          clearInterval(typingTimerRef.current);
        }
      }, 110 / playbackSpeed);
    }

    // Phase 5: DRIFT DETECTED
    if (phaseId === 5) {
      setActiveFocusedField(null);
      setVendorText(MOCK_ERP_DATA.vendorTarget);
      setAmountText(injectViolation ? MOCK_ERP_DATA.amountTargetViolating : MOCK_ERP_DATA.amountTarget);
      setIsDriftActive(true);
      setRelocalizationProgress(0);
      audioEngine.playWarning();
      addLog('SPATIAL ANOMALY: Landmark Submit has displaced +76px X, +42px Y', 'warning');
    }

    // Phase 6: RELOCALIZATION
    if (phaseId === 6) {
      setIsDriftActive(true);
      addLog('Spatial Memory: Tracking vector generated. Performing sub-pixel re-alignment.', 'info');
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setRelocalizationProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          audioEngine.playRelocalize();
          addLog('VECTOR LOCK: Submit button re-anchored at (X: 472px, Y: 338px)', 'success');
        }
      }, 150 / playbackSpeed);

      return () => clearInterval(interval);
    }

    // Phase 7: GUARDRAIL CHECK
    if (phaseId === 7) {
      setActiveFocusedField(null);
      setButtonState('CHECKING');
      addLog('GUARDRAILS & TRUST: Executing multi-layer boundary verification harness', 'system');

      setGuardrailResults({ schema: 'CHECKING', limit: 'PENDING', intent: 'PENDING', overall: 'PENDING' });

      setTimeout(() => {
        audioEngine.playScan();
        setGuardrailResults(prev => ({ ...prev, schema: 'PASS', limit: 'CHECKING' }));
        addLog('Guardrail Check 1/3: Schema & Type validation passed [OK]', 'success');
      }, 800 / playbackSpeed);

      setTimeout(() => {
        if (injectViolation) {
          audioEngine.playWarning();
          setGuardrailResults(prev => ({ ...prev, limit: 'FAIL', overall: 'BLOCKED' }));
          setButtonState('BLOCKED');
          addLog('POLICY VIOLATION: Transaction amount ₹840,000 exceeds single-po authorization ceiling ₹100,000! Execution HALTED.', 'error');
        } else {
          audioEngine.playScan();
          setGuardrailResults(prev => ({ ...prev, limit: 'PASS', intent: 'CHECKING' }));
          addLog('Guardrail Check 2/3: Expenditure threshold within limits [₹48,250 < ₹100,000 OK]', 'success');
        }
      }, 1800 / playbackSpeed);

      if (!injectViolation) {
        setTimeout(() => {
          audioEngine.playSuccess();
          setGuardrailResults(prev => ({ ...prev, intent: 'PASS', overall: 'PASS' }));
          setButtonState('APPROVED');
          addLog('Guardrail Check 3/3: Context alignment & cryptographic PO hash verified [OK]', 'success');
        }, 2800 / playbackSpeed);
      }
    }

    // Phase 8: EXECUTION
    if (phaseId === 8) {
      if (injectViolation) {
        setButtonState('BLOCKED');
        addLog('Action Prevented: Safety harness refused execution token', 'error');
      } else {
        setButtonState('VALIDATING');
        addLog('Kinematic Cursor: Engaging hardware click emulation on relocalized Submit', 'info');
        setTimeout(() => {
          audioEngine.playClick();
          setButtonState('SUBMITTED');
          audioEngine.playSuccess();
          addLog('ERP RESPONSE: PO-2026-8841-B committed to legacy database with HTTP 200 OK', 'success');
        }, 1500 / playbackSpeed);
      }
    }

    // Phase 9: COMPLETE
    if (phaseId === 9) {
      addLog('MISSION COMPLETE: Autonomous action executed outside chat constraints.', 'success');
      if (!injectViolation) {
        audioEngine.playSuccess();
      }
    }

    // Auto Advance Timeline
    if (isPlaying) {
      const duration = currentPhase.duration / playbackSpeed;
      phaseTimerRef.current = setTimeout(() => {
        setCurrentPhaseIndex(prev => {
          if (prev < PHASES.length - 1) {
            return prev + 1;
          } else {
            // Loop back to start after a pause
            return 0;
          }
        });
      }, duration);
    }

    return () => {
      clearTimeout(phaseTimerRef.current);
      clearInterval(typingTimerRef.current);
    };
  }, [currentPhaseIndex, isPlaying, playbackSpeed, injectViolation, addLog]);

  return (
    <DemoContext.Provider
      value={{
        phases: PHASES,
        currentPhaseIndex,
        currentPhase,
        setPhase,
        isPlaying,
        togglePlay,
        playbackSpeed,
        setPlaybackSpeed,
        soundEnabled,
        toggleSound,
        injectViolation,
        toggleGuardrailViolation,
        isDriftActive,
        triggerDriftNow,
        relocalizationProgress,
        vendorText,
        amountText,
        activeFocusedField,
        buttonState,
        guardrailResults,
        eventLogs,
        addLog,
        resetScenario,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};
