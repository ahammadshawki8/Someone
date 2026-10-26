const path = require('path');
const fs = require('fs');
const ENGINE = 'C:/Users/Shawki/.claude/plugins/cache/ls-extensions/ls-clad/1.0.0/skills/build-sfx/tools';
const audio = require(ENGINE);
const SR = audio.SAMPLE_RATE;
const PROJECT_ASSETS_SFX = 'C:/Users/Shawki/Desktop/Specs/Someone/Someone/Assets/GeneratedSFX';
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });

function write(buf, name) {
  audio.mix_bus.masterChain(buf, { normalize: 'peak' });
  audio.WavBuilder.write(buf, path.join(PROJECT_ASSETS_SFX, name + '.wav'));
  console.log('wrote', name);
}

// 1. Metronome: warm, soft, heartbeat-like wooden thump. Short, round, no click.
function metronome() {
  const body = audio.transient_designer.designImpact({
    attack: { kind: 'click', durationMs: 4, lpHz: 1800, hpHz: 300, gain: 0.18 },
    body:   { kind: 'tonal', freq: 196, partials: 3, decay: 0.11, hpHz: 70, lpHz: 1600, gain: 0.85 },
  });
  const sub = audio.sine(98, 0.16, 0.6);
  audio.adsrExp(sub, 0.003, 0.05, 0, 0.1, 4);
  const out = new Float32Array(Math.floor(0.26 * SR));
  audio.addInto(out, body, 0, 0.9);
  audio.addInto(out, sub, 0, 0.35);
  audio.fadeOut(out, 0.01);
  return audio.mix_bus.applyFx(out, { hpf: 60, lpf: 2400, gain: 0.9 });
}

// 2. AED chime: gentle, distinct two-bell rise (perfect fourth), soft room.
function aedChime() {
  const a = audio.synth_voices.bell(76, 0.5, 70, 120); // E5
  const b = audio.synth_voices.bell(81, 0.8, 64, 120); // A5
  const out = new Float32Array(Math.floor(1.8 * SR));
  audio.addInto(out, a, 0, 0.6);
  audio.addInto(out, b, Math.floor(0.22 * SR), 0.55);
  audio.fadeOut(out, 0.4);
  return audio.mix_bus.applyFx(out, { hpf: 250, lpf: 7000, gain: 0.8 });
}

// 3. Tap confirm: soft physical click for step buttons.
function tapConfirm() {
  const b = audio.sfx_presets.uiClick({ character: 'soft' });
  return audio.mix_bus.applyFx(b, { lpf: 5000, gain: 0.8 });
}

// 4. Dispatcher connected: calm two-tone, low and warm.
function dispatcherConnect() {
  const a = audio.synth_voices.marimba(67, 0.4, 70, 120); // G4
  const b = audio.synth_voices.marimba(74, 0.6, 64, 120); // D5
  const out = new Float32Array(Math.floor(1.0 * SR));
  audio.addInto(out, a, 0, 0.6);
  audio.addInto(out, b, Math.floor(0.14 * SR), 0.55);
  audio.fadeOut(out, 0.2);
  return audio.mix_bus.applyFx(out, { hpf: 150, reverb: 'smallRoom', gain: 0.75 });
}

// 5. Shock cue (stand-in AED): muted low thump with a soft swell, not an alarm.
function shockCue() {
  const swell = audio.sweep(140, 70, 0.6, 'sine', 'exponential');
  audio.adsrExp(swell, 0.12, 0.2, 0.3, 0.25, 2);
  const thump = audio.sfx_presets.impact({ material: 'soft', size: 0.6 });
  const out = new Float32Array(Math.floor(1.0 * SR));
  audio.addInto(out, swell, 0, 0.5);
  audio.addInto(out, thump, Math.floor(0.18 * SR), 0.7);
  audio.fadeOut(out, 0.15);
  return audio.mix_bus.applyFx(out, { hpf: 45, lpf: 1500, reverb: 'mediumRoom', gain: 0.85 });
}

write(metronome(), 'SomeoneMetronome');
write(aedChime(), 'SomeoneAEDChime');
write(tapConfirm(), 'SomeoneTapConfirm');
write(dispatcherConnect(), 'SomeoneDispatcherConnect');
write(shockCue(), 'SomeoneShockCue');
