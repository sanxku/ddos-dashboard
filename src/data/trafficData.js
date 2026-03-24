// Simulated CIC-DDoS2019-inspired dataset
// Features: flow_duration, packet_rate, bytes_per_second, src_ips, label

export const ATTACK_TYPES = [
  'BENIGN',
  'UDP-flood',
  'SYN-flood',
  'HTTP-flood',
  'ICMP-flood',
  'DNS-amplification',
];

export const COLORS = {
  BENIGN: '#00ff88',
  'UDP-flood': '#ff3366',
  'SYN-flood': '#ff6600',
  'HTTP-flood': '#cc44ff',
  'ICMP-flood': '#ffcc00',
  'DNS-amplification': '#00ccff',
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max));
}

// Generate 24-hour timeline (one point per 5 min = 288 points)
export function generateTimelineData() {
  const points = [];
  const attackStart = 144; // attack begins at hour 12
  const attackEnd = 192;   // attack ends at hour 16

  for (let i = 0; i < 288; i++) {
    const hour = (i * 5) / 60;
    const isAttack = i >= attackStart && i <= attackEnd;
    const peakFactor = isAttack
      ? Math.sin(((i - attackStart) / (attackEnd - attackStart)) * Math.PI) * 8 + 1
      : 1;

    points.push({
      time: `${String(Math.floor(hour)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
      benign: Math.max(0, randInt(800, 1200)),
      malicious: isAttack ? randInt(3000, 6000) * peakFactor : randInt(0, 50),
      packetRate: isAttack ? rand(40000, 71000) * peakFactor : rand(500, 2000),
      isAttack,
    });
  }
  return points;
}

// Feature scatter data (packet_rate vs flow_duration)
export function generateScatterData() {
  const points = [];

  // Benign traffic
  for (let i = 0; i < 300; i++) {
    points.push({
      label: 'BENIGN',
      packetRate: rand(10, 500),
      flowDuration: rand(0.1, 120),
      bytesPerSec: rand(500, 50000),
      srcIps: randInt(1, 5),
    });
  }

  // SYN flood — high packet rate, very short duration
  for (let i = 0; i < 80; i++) {
    points.push({
      label: 'SYN-flood',
      packetRate: rand(5000, 50000),
      flowDuration: rand(0.001, 0.5),
      bytesPerSec: rand(1000, 20000),
      srcIps: randInt(100, 1000),
    });
  }

  // UDP flood — very high bytes, moderate duration
  for (let i = 0; i < 80; i++) {
    points.push({
      label: 'UDP-flood',
      packetRate: rand(10000, 71000),
      flowDuration: rand(0.1, 5),
      bytesPerSec: rand(500000, 2000000),
      srcIps: randInt(200, 2000),
    });
  }

  // HTTP flood — moderate packet rate, long duration (mimics legitimate)
  for (let i = 0; i < 60; i++) {
    points.push({
      label: 'HTTP-flood',
      packetRate: rand(200, 2000),
      flowDuration: rand(10, 90),
      bytesPerSec: rand(10000, 100000),
      srcIps: randInt(10, 200),
    });
  }

  // ICMP flood
  for (let i = 0; i < 60; i++) {
    points.push({
      label: 'ICMP-flood',
      packetRate: rand(20000, 60000),
      flowDuration: rand(0.001, 0.1),
      bytesPerSec: rand(50000, 500000),
      srcIps: randInt(50, 500),
    });
  }

  // DNS amplification
  for (let i = 0; i < 60; i++) {
    points.push({
      label: 'DNS-amplification',
      packetRate: rand(1000, 15000),
      flowDuration: rand(0.01, 2),
      bytesPerSec: rand(100000, 1000000),
      srcIps: randInt(5, 50),
    });
  }

  return points;
}

// Attack type distribution
export function generateAttackDistribution() {
  return [
    { type: 'SYN-flood', count: 234512, pct: 31 },
    { type: 'UDP-flood', count: 198043, pct: 26 },
    { type: 'HTTP-flood', count: 152391, pct: 20 },
    { type: 'ICMP-flood', count: 106271, pct: 14 },
    { type: 'DNS-amplification', count: 68114, pct: 9 },
  ];
}

// PCA 2D projection data
export function generatePCAData() {
  const points = [];

  const clusters = {
    BENIGN: { cx: 2, cy: 1, spread: 1.2 },
    'SYN-flood': { cx: -4, cy: 3, spread: 0.8 },
    'UDP-flood': { cx: -5, cy: -2, spread: 1.0 },
    'HTTP-flood': { cx: 1, cy: 3.5, spread: 1.5 },
    'ICMP-flood': { cx: -2, cy: -4, spread: 0.7 },
    'DNS-amplification': { cx: 4, cy: -3, spread: 0.9 },
  };

  for (const [label, { cx, cy, spread }] of Object.entries(clusters)) {
    const count = label === 'BENIGN' ? 200 : 80;
    for (let i = 0; i < count; i++) {
      points.push({
        label,
        pc1: cx + (Math.random() - 0.5) * spread * 2,
        pc2: cy + (Math.random() - 0.5) * spread * 2,
      });
    }
  }
  return points;
}

// Feature importance
export function generateFeatureImportance() {
  return [
    { feature: 'Packet Rate (pkt/s)', importance: 0.94 },
    { feature: 'Source IP Count', importance: 0.87 },
    { feature: 'Bytes per Second', importance: 0.82 },
    { feature: 'Flow Duration', importance: 0.76 },
    { feature: 'Fwd Packet Length', importance: 0.68 },
    { feature: 'IAT Mean', importance: 0.61 },
    { feature: 'Protocol Type', importance: 0.55 },
    { feature: 'Bwd Packet Length', importance: 0.49 },
    { feature: 'SYN Flag Count', importance: 0.44 },
    { feature: 'URG Flag Count', importance: 0.31 },
  ];
}

// Model comparison
export function generateModelComparison() {
  return [
    { model: 'Random Forest', accuracy: 99.2, precision: 99.1, recall: 99.3, f1: 99.2, speed: 45 },
    { model: 'XGBoost', accuracy: 98.9, precision: 98.7, recall: 99.1, f1: 98.9, speed: 38 },
    { model: 'LSTM', accuracy: 97.4, precision: 97.1, recall: 97.6, f1: 97.3, speed: 12 },
    { model: 'Transformer', accuracy: 98.1, precision: 98.0, recall: 98.2, f1: 98.1, speed: 8 },
    { model: 'SVM', accuracy: 94.3, precision: 93.8, recall: 94.7, f1: 94.2, speed: 25 },
  ];
}

// Real-time feed simulation
export function generateLiveFeed() {
  const types = ['BENIGN', 'BENIGN', 'BENIGN', 'SYN-flood', 'UDP-flood', 'HTTP-flood'];
  const sources = ['192.168.', '10.0.', '172.16.', '45.33.', '198.51.', '203.0.'];
  const entries = [];

  for (let i = 0; i < 20; i++) {
    const type = types[randInt(0, types.length)];
    const src = sources[randInt(0, sources.length)] + randInt(0, 255) + '.' + randInt(0, 255);
    entries.push({
      id: i,
      timestamp: new Date(Date.now() - i * 3000).toISOString(),
      src,
      dst: '203.0.113.' + randInt(1, 10),
      type,
      packetRate: type === 'BENIGN' ? randInt(10, 500) : randInt(5000, 50000),
      confidence: type === 'BENIGN' ? rand(0.85, 0.99) : rand(0.92, 0.999),
    });
  }

  return entries;
}
