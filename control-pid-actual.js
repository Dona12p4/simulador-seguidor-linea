/* Control PWM y memoria óptica de Seguidor_v7_10_Memoria_Calibracion.
 * Traducción de ControlPIDDirecto.h / MemoriaLinea.h; no es una planta física.
 * f32 conserva las operaciones float del ESP32. No modifica el firmware.
 */
(function installPidDirectoActual(root) {
  'use strict';
  const f = Math.fround;
  const defaults = {
    kp:100, ki:4, kd:1.6, derivativeTauS:0.016,
    derivativeLimitPwm:65, integralLimitPwm:4, integralWindow:0.30,
    integralDecayPerS:4, correctionLimitPwm:180, schedulePWithSpeed:true,
    straightPwm:120, curvePwm:80, errorPenaltyPwm:60,
    derivativePenaltyPwm:1.2, derivativePenaltyLimitPwm:40,
    minSpeedFactor:0.80, maxSpeedFactor:2, maxBasePwm:240,
    accelerationPwmS:220, decelerationPwmS:900,
    reverseFloorPwm:46, wheelZeroThresholdPwm:18,
    minDtS:0.000001, maxDtS:0.25,
  };
  function Config(overrides = {}) {
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) =>
      [key, typeof value === 'boolean' ? !!(overrides[key] ?? value) : f(overrides[key] ?? value)]));
  }
  const defaultConfig = Object.freeze(Config());
  const clamp = (value, lo, hi) => value < lo ? lo : value > hi ? hi : value;
  const finite = Number.isFinite;
  function createState() {
    return {initialized:false, previousError:0, derivativeNormS:0, integralPwm:0, basePwm:0};
  }
  function reset(state) { Object.assign(state, createState()); return state; }
  function output() {
    return {valid:false, saturated:false, integralHeld:false, motorFloorAdjusted:false,
      errorNorm:0, derivativeNormS:0, p:0, i:0, d:0, correctionPwm:0,
      baseTargetPwm:0, basePwm:0, appliedBasePwm:0, appliedCorrectionPwm:0,
      leftPwm:0, rightPwm:0};
  }
  function validConfig(c) {
    const nonnegative = ['kp','ki','kd','derivativeTauS','derivativeLimitPwm',
      'integralLimitPwm','integralWindow','integralDecayPerS','straightPwm','curvePwm',
      'errorPenaltyPwm','derivativePenaltyPwm','derivativePenaltyLimitPwm',
      'accelerationPwmS','decelerationPwmS','reverseFloorPwm','wheelZeroThresholdPwm'];
    if (nonnegative.some(key => !finite(c[key]) || c[key] < 0)) return false;
    return finite(c.correctionLimitPwm) && c.correctionLimitPwm > 0 &&
      c.correctionLimitPwm <= 255 && c.integralWindow <= 1 &&
      c.integralLimitPwm <= 255 && c.derivativeLimitPwm <= 255 &&
      c.curvePwm <= c.straightPwm && c.straightPwm <= 255 &&
      finite(c.minSpeedFactor) && finite(c.maxSpeedFactor) &&
      c.minSpeedFactor > 0 && c.maxSpeedFactor >= c.minSpeedFactor &&
      finite(c.maxBasePwm) && c.maxBasePwm >= 0 && c.maxBasePwm <= 255 &&
      c.reverseFloorPwm <= 255 && c.wheelZeroThresholdPwm <= 255 &&
      finite(c.minDtS) && finite(c.maxDtS) && c.minDtS > 0 && c.maxDtS >= c.minDtS;
  }
  function applyIsolatedMotorFloor(command, forwardFloor, c) {
    if (command === 0 || Math.abs(command) < c.wheelZeroThresholdPwm) return 0;
    if (command > 0) return command < forwardFloor ? forwardFloor : command;
    return -Math.max(Math.abs(command), c.reverseFloorPwm);
  }
  function update(state, config, errorNorm, dt, factor, forwardFloor, sign = 1) {
    const c = Config(config);
    errorNorm = f(errorNorm); dt = f(dt); factor = f(factor);
    forwardFloor = f(forwardFloor); sign = f(sign);
    const out = output();
    if (!validConfig(c) || !finite(errorNorm) || !finite(dt) ||
        dt < c.minDtS || dt > c.maxDtS || !finite(factor) ||
        !finite(forwardFloor) || forwardFloor < 0 || forwardFloor > 255 ||
        !finite(sign) || (sign !== 1 && sign !== -1)) {
      reset(state); return out;
    }
    out.errorNorm = clamp(errorNorm, -1, 1);
    const first = !state.initialized;
    let derivative = 0;
    if (!first) {
      const rawDerivative = f(f(out.errorNorm - state.previousError) / dt);
      const alpha = f(dt / f(c.derivativeTauS + dt));
      derivative = f(state.derivativeNormS + f(alpha * f(rawDerivative - state.derivativeNormS)));
    }
    out.derivativeNormS = derivative;
    out.d = clamp(f(c.kd * derivative), -c.derivativeLimitPwm, c.derivativeLimitPwm);
    const speedFactor = clamp(factor, c.minSpeedFactor, c.maxSpeedFactor);
    const boost = Math.max(1, speedFactor);
    const curveBase = Math.min(f(c.curvePwm * speedFactor), c.maxBasePwm);
    const straightBase = Math.min(f(c.straightPwm * speedFactor), c.maxBasePwm);
    const penalty = f(f(f(c.errorPenaltyPwm * boost) * Math.abs(out.errorNorm)) +
      Math.min(f(c.derivativePenaltyPwm * Math.abs(derivative)), f(c.derivativePenaltyLimitPwm * boost)));
    out.baseTargetPwm = clamp(f(straightBase - penalty), curveBase, straightBase);
    let base = state.basePwm;
    if (first) base = Math.min(forwardFloor, out.baseTargetPwm);
    else if (base < out.baseTargetPwm)
      base = Math.min(f(base + f(f(c.accelerationPwmS * boost) * dt)), out.baseTargetPwm);
    else base = Math.max(f(base - f(c.decelerationPwmS * dt)), out.baseTargetPwm);
    out.basePwm = base;
    const nominalTarget = f(out.baseTargetPwm / speedFactor);
    const pScale = c.schedulePWithSpeed && speedFactor > 1 && nominalTarget > 0
      ? clamp(f(base / nominalTarget), 1, speedFactor) : 1;
    out.p = f(f(c.kp * pScale) * out.errorNorm);
    const previousIntegral = state.integralPwm;
    let candidateIntegral = previousIntegral;
    const integrating = Math.abs(out.errorNorm) < c.integralWindow;
    if (integrating) candidateIntegral = f(candidateIntegral + f(f(c.ki * out.errorNorm) * dt));
    else candidateIntegral = f(candidateIntegral * f(Math.exp(f(-c.integralDecayPerS * dt))));
    candidateIntegral = clamp(candidateIntegral, -c.integralLimitPwm, c.integralLimitPwm);
    let unsaturated = f(f(out.p + candidateIntegral) + out.d);
    const integralChange = f(candidateIntegral - previousIntegral);
    if (integrating && Math.abs(unsaturated) > c.correctionLimitPwm &&
        f(integralChange * unsaturated) > 0) {
      candidateIntegral = previousIntegral;
      out.integralHeld = true;
      unsaturated = f(f(out.p + candidateIntegral) + out.d);
    }
    out.i = candidateIntegral;
    out.correctionPwm = f(sign * clamp(unsaturated, -c.correctionLimitPwm, c.correctionLimitPwm));
    out.saturated = Math.abs(unsaturated) > c.correctionLimitPwm;
    const commonHeadroom = f(255 - Math.abs(out.correctionPwm));
    const common = Math.min(base, commonHeadroom);
    if (common < base) out.saturated = true;
    let left = f(common + out.correctionPwm);
    let right = f(common - out.correctionPwm);
    const beforeFloorLeft = left, beforeFloorRight = right;
    if (left > 0 && right > 0) {
      const slower = Math.min(left, right);
      if (slower < forwardFloor) {
        const shift = f(forwardFloor - slower);
        if (f(Math.max(left, right) + shift) <= 255) {
          left = f(left + shift); right = f(right + shift);
        } else {
          if (left < forwardFloor) left = 0;
          if (right < forwardFloor) right = 0;
        }
      }
    } else {
      left = applyIsolatedMotorFloor(left, forwardFloor, c);
      right = applyIsolatedMotorFloor(right, forwardFloor, c);
    }
    out.leftPwm = clamp(left, -255, 255); out.rightPwm = clamp(right, -255, 255);
    out.appliedBasePwm = f(f(0.5) * f(out.leftPwm + out.rightPwm));
    out.appliedCorrectionPwm = f(f(0.5) * f(out.leftPwm - out.rightPwm));
    out.motorFloorAdjusted = out.leftPwm !== beforeFloorLeft || out.rightPwm !== beforeFloorRight;
    out.valid = [out.leftPwm,out.rightPwm,out.p,out.i,out.d,out.baseTargetPwm].every(finite);
    if (!out.valid) { reset(state); return output(); }
    state.initialized = true; state.previousError = out.errorNorm;
    state.derivativeNormS = derivative; state.integralPwm = candidateIntegral; state.basePwm = base;
    return out;
  }
  // lroundf: empate hacia fuera de cero, distinto de Math.round para negativos.
  function roundPwm(value) {
    const n = f(value);
    return n < 0 ? Math.ceil(n - 0.5) : Math.floor(n + 0.5);
  }
  const elapsed = (now, then) => (now - then) >>> 0;
  function createLineMemory() {
    return {disponible:false,ladoDisponible:false,instanteMs:0,ladoMs:0,
      errorM:0,tendenciaM_S:0,pwmIzq:0,pwmDer:0,lado:0,ladoCandidato:0,
      muestrasLado:0,candidatoMs:0};
  }
  function resetLineMemory(memory) { Object.assign(memory, createLineMemory()); return memory; }
  function observeLine(memory, nowMs, errorM, derivativeM_S, pwmL, pwmR) {
    const now = nowMs >>> 0, error = f(errorM), derivative = f(derivativeM_S);
    if (!finite(error) || !finite(derivative)) {
      memory.muestrasLado = 0; memory.ladoCandidato = 0; return;
    }
    memory.disponible = true; memory.instanteMs = now; memory.errorM = error;
    memory.tendenciaM_S = derivative; memory.pwmIzq = (pwmL << 16) >> 16;
    memory.pwmDer = (pwmR << 16) >> 16;
    if (Math.abs(error) >= f(0.001)) {
      const observed = error < 0 ? -1 : 1;
      if (observed === memory.ladoCandidato && elapsed(now, memory.candidatoMs) <= 40) {
        if (memory.muestrasLado < 2) ++memory.muestrasLado;
      } else { memory.ladoCandidato = observed; memory.muestrasLado = 1; }
      memory.candidatoMs = now;
      if (memory.muestrasLado >= 2) {
        memory.ladoDisponible = true; memory.ladoMs = now; memory.lado = observed;
      }
    } else { memory.muestrasLado = 0; memory.ladoCandidato = 0; }
  }
  function recoveryDirection(memory, nowMs, sign = 1) {
    const now = nowMs >>> 0;
    if (!memory.disponible || elapsed(now, memory.instanteMs) > 300) return 0;
    if (memory.ladoDisponible && elapsed(now, memory.ladoMs) <= 300) return memory.lado;
    if (Math.abs(memory.errorM) >= f(0.001)) return memory.errorM < 0 ? -1 : 1;
    if (Math.abs(memory.tendenciaM_S) >= f(0.12)) return memory.tendenciaM_S < 0 ? -1 : 1;
    const differential = f(f(memory.pwmIzq - memory.pwmDer) * f(sign));
    if (Math.abs(differential) >= 12) return differential < 0 ? -1 : 1;
    return 0;
  }
  const api = Object.freeze({defaultConfig,Config,createState,reset,update,validConfig,
    roundPwm,createLineMemory,resetLineMemory,observeLine,recoveryDirection,
    sourceVersion:'Seguidor_v7_10_Memoria_Calibracion / PID v7.8 / MemoriaLinea v7.9'});
  root.pidDirectoActual = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
