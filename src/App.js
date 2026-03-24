import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, Legend
} from 'recharts';
import {
  generateTimelineData, generateScatterData, generateAttackDistribution,
  generatePCAData, generateFeatureImportance, generateModelComparison,
  generateLiveFeed, COLORS, ATTACK_TYPES
} from './data/trafficData';
import './index.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function useTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t.toLocaleTimeString('en-US', { hour12: false });
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#0a1520', border:'1px solid rgba(0,255,136,0.35)',
      borderRadius:3, padding:'10px 14px', fontFamily:'Space Mono,monospace',
      fontSize:'0.65rem', boxShadow:'0 8px 24px rgba(0,0,0,0.6)'
    }}>
      <div style={{color:'#00ff88', marginBottom:6, letterSpacing:'0.05em'}}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{display:'flex', justifyContent:'space-between', gap:16, color:'#7ba89a', marginBottom:2}}>
          <span style={{color:p.color || '#7ba89a'}}>{p.name}</span>
          <span style={{color:'#e8f4f0'}}>{typeof p.value === 'number' ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, delta, color = '#e8f4f0', glow }) => (
  <div style={{
    background:'#0a1520', border:'1px solid rgba(0,255,136,0.12)',
    borderRadius:4, padding:'1.1rem 1.25rem', position:'relative', overflow:'hidden',
    transition:'border-color 0.2s'
  }}>
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:1,
      background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.25),transparent)'
    }}/>
    <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.6rem', letterSpacing:'0.12em',
      textTransform:'uppercase', color:'#3d5a50', marginBottom:6}}>{label}</div>
    <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem',
      lineHeight:1, color, textShadow: glow || 'none'}}>{value}</div>
    {sub && <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.6rem', color:'#3d5a50', marginTop:4}}>{sub}</div>}
    {delta && <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
      color: delta.startsWith('+') ? '#ff3366' : '#00ff88', marginTop:4}}>{delta}</div>}
  </div>
);

// ── Section Title ─────────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:'1rem'}}>
    <span style={{fontFamily:'Space Mono,monospace', fontSize:'0.62rem',
      letterSpacing:'0.15em', textTransform:'uppercase', color:'#7ba89a', whiteSpace:'nowrap'}}>{children}</span>
    <div style={{flex:1, height:1, background:'rgba(0,255,136,0.1)'}}/>
  </div>
);

// ── Chart Card ────────────────────────────────────────────────────────────────

const ChartCard = ({ title, badge, badgeType='info', children, style={} }) => (
  <div style={{
    background:'#0a1520', border:'1px solid rgba(0,255,136,0.12)',
    borderRadius:4, padding:'1.25rem', position:'relative', overflow:'hidden', ...style
  }}>
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:1,
      background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.2),transparent)'
    }}/>
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
      <span style={{fontFamily:'Space Mono,monospace', fontSize:'0.62rem',
        letterSpacing:'0.1em', textTransform:'uppercase', color:'#7ba89a'}}>{title}</span>
      {badge && (
        <span style={{
          fontFamily:'Space Mono,monospace', fontSize:'0.58rem', padding:'3px 8px',
          borderRadius:2, letterSpacing:'0.06em',
          background: badgeType==='live' ? 'rgba(255,51,102,0.12)' : 'rgba(0,204,255,0.1)',
          border: `1px solid ${badgeType==='live' ? 'rgba(255,51,102,0.3)' : 'rgba(0,204,255,0.2)'}`,
          color: badgeType==='live' ? '#ff3366' : '#00ccff'
        }}>{badge}</span>
      )}
    </div>
    {children}
  </div>
);

// ── Legend Row ────────────────────────────────────────────────────────────────

const LegendRow = ({ items }) => (
  <div style={{display:'flex', gap:16, flexWrap:'wrap', marginTop:8}}>
    {items.map(({ color, label }) => (
      <div key={label} style={{display:'flex', alignItems:'center', gap:6,
        fontFamily:'Space Mono,monospace', fontSize:'0.6rem', color:'#7ba89a'}}>
        <div style={{width:8, height:8, borderRadius:'50%', background:color, flexShrink:0}}/>
        {label}
      </div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════

const OverviewTab = ({ timeline, scatter, attackDist }) => {
  const SAMPLE = useMemo(() => {
    const step = Math.max(1, Math.floor(timeline.length / 120));
    return timeline.filter((_, i) => i % step === 0);
  }, [timeline]);

  return (
    <div>
      {/* Alert Banner */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
        background:'rgba(255,51,102,0.07)', border:'1px solid rgba(255,51,102,0.25)',
        borderRadius:3, marginBottom:'1.5rem', animation:'alertPulse 3s infinite'
      }}>
        <span style={{fontSize:'0.9rem'}}>⚠</span>
        <span style={{fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
          color:'#ff3366', letterSpacing:'0.05em'}}>
          ANOMALY DETECTED — UDP-flood signature identified · Peak 71M req/s · Origin: 847 unique IPs
        </span>
        <span style={{marginLeft:'auto', fontFamily:'Space Mono,monospace',
          fontSize:'0.6rem', color:'#3d5a50'}}>12:03:41 UTC</span>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem'}}>
        <StatCard label="Total Flows (24h)" value="4.2M" sub="CIC-DDoS2019 sample" delta="+18.3% vs baseline"/>
        <StatCard label="Malicious Flows" value="759K" color="#ff3366" glow="0 0 20px rgba(255,51,102,0.4)" delta="+312% spike" sub="18.1% of total"/>
        <StatCard label="Peak Packet Rate" value="71M/s" color="#ffcc00" sub="req/s · Cloudflare scale" delta="+8,900% above normal"/>
        <StatCard label="Model Accuracy" value="99.2%" color="#00ff88" glow="0 0 20px rgba(0,255,136,0.3)" sub="Random Forest · F1 0.992"/>
      </div>

      {/* Timeline Chart */}
      <SectionTitle>Traffic Timeline — 24h Window</SectionTitle>
      <ChartCard title="Benign vs Malicious Flow Volume" badge="LIVE SIMULATION" badgeType="live"
        style={{marginBottom:'1.5rem'}}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={SAMPLE} margin={{top:4, right:4, bottom:0, left:0}}>
            <defs>
              <linearGradient id="gBenign" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gMal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3366" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="time" tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}}
              tickLine={false} axisLine={false} interval={23}/>
            <YAxis tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}}
              tickLine={false} axisLine={false} tickFormatter={fmt}/>
            <Tooltip content={<TT/>}/>
            <ReferenceLine x="12:00" stroke="rgba(255,51,102,0.4)" strokeDasharray="4 4"
              label={{value:'Attack begins',fill:'#ff3366',fontSize:9,fontFamily:'Space Mono'}}/>
            <Area type="monotone" dataKey="benign" name="Benign" stroke="#00ff88"
              strokeWidth={1.5} fill="url(#gBenign)"/>
            <Area type="monotone" dataKey="malicious" name="Malicious" stroke="#ff3366"
              strokeWidth={1.5} fill="url(#gMal)"/>
          </AreaChart>
        </ResponsiveContainer>
        <LegendRow items={[{color:'#00ff88',label:'Benign Traffic'},{color:'#ff3366',label:'Malicious Traffic'}]}/>
      </ChartCard>

      {/* Attack Distribution + Scatter */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:'1.5rem', marginBottom:'1.5rem'}}>
        {/* Attack distribution */}
        <ChartCard title="Attack Type Breakdown">
          <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:4}}>
            {attackDist.map(({ type, count, pct }) => (
              <div key={type} style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.6rem',
                  color:'#7ba89a', width:140, flexShrink:0}}>{type}</div>
                <div style={{flex:1, height:18, background:'rgba(255,255,255,0.03)', position:'relative', overflow:'hidden'}}>
                  <div style={{
                    width:`${pct * 3}%`, height:'100%', maxWidth:'100%',
                    background: COLORS[type] || '#00ff88',
                    opacity:0.75, display:'flex', alignItems:'center', paddingLeft:8,
                    transition:'width 1s ease'
                  }}>
                    <span style={{fontFamily:'Space Mono,monospace', fontSize:'0.58rem',
                      color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap'}}>{fmt(count)}</span>
                  </div>
                </div>
                <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.62rem',
                  color: COLORS[type] || '#00ff88', width:35, textAlign:'right'}}>{pct}%</div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Scatter: packet rate vs flow duration */}
        <ChartCard title="Packet Rate vs Flow Duration · Traffic Fingerprinting" badge="CIC-DDoS2019" badgeType="info">
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart margin={{top:4, right:4, bottom:0, left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="packetRate" name="Packet Rate" type="number"
                tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false}
                tickFormatter={fmt} label={{value:'pkt/s', position:'insideBottomRight',
                  offset:-4, fill:'#3d5a50', fontSize:9, fontFamily:'Space Mono'}}/>
              <YAxis dataKey="flowDuration" name="Flow Duration" type="number"
                tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false}
                label={{value:'sec', angle:-90, position:'insideLeft',
                  fill:'#3d5a50', fontSize:9, fontFamily:'Space Mono'}}/>
              <Tooltip cursor={{stroke:'rgba(0,255,136,0.2)'}} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{background:'#0a1520', border:'1px solid rgba(0,255,136,0.3)',
                    borderRadius:3, padding:'8px 12px', fontFamily:'Space Mono,monospace', fontSize:'0.62rem'}}>
                    <div style={{color: COLORS[d.label] || '#00ff88', marginBottom:4}}>{d.label}</div>
                    <div style={{color:'#7ba89a'}}>Rate: <span style={{color:'#e8f4f0'}}>{fmt(d.packetRate)} pkt/s</span></div>
                    <div style={{color:'#7ba89a'}}>Duration: <span style={{color:'#e8f4f0'}}>{d.flowDuration.toFixed(3)}s</span></div>
                  </div>
                );
              }}/>
              {Object.keys(COLORS).filter(k => k !== 'BENIGN').concat(['BENIGN']).map(label => (
                <Scatter key={label} name={label}
                  data={scatter.filter(d => d.label === label)}
                  fill={COLORS[label]} opacity={label === 'BENIGN' ? 0.5 : 0.8}
                  r={label === 'BENIGN' ? 2 : 3}/>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <LegendRow items={Object.entries(COLORS).map(([label, color]) => ({color, label}))}/>
        </ChartCard>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: LIVE FEED
// ══════════════════════════════════════════════════════════════════════════════

const LiveFeedTab = () => {
  const [feed, setFeed] = useState(() => generateLiveFeed());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setFeed(prev => {
        const newEntry = generateLiveFeed()[0];
        newEntry.id = Date.now();
        return [newEntry, ...prev.slice(0, 49)];
      });
    }, 1500);
    return () => clearInterval(id);
  }, [paused]);

  const attacks = feed.filter(f => f.type !== 'BENIGN').length;

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem'}}>
        <StatCard label="Total Events" value={feed.length} sub="last 50 flows"/>
        <StatCard label="Attack Events" value={attacks} color="#ff3366" glow="0 0 15px rgba(255,51,102,0.3)" sub="detected malicious"/>
        <StatCard label="Detection Rate" value={`${((attacks/feed.length)*100).toFixed(0)}%`} color="#ffcc00" sub="of feed"/>
        <StatCard label="Avg Confidence" value="97.4%" color="#00ff88" glow="0 0 15px rgba(0,255,136,0.3)" sub="ML classifier"/>
      </div>

      <ChartCard title="Real-Time Network Flow Classification" badge="● STREAMING" badgeType="live">
        {/* Header row */}
        <div style={{display:'grid', gridTemplateColumns:'90px 1fr 1fr auto 80px', gap:12,
          padding:'6px 0', fontFamily:'Space Mono,monospace', fontSize:'0.58rem',
          letterSpacing:'0.1em', textTransform:'uppercase', color:'#3d5a50',
          borderBottom:'1px solid rgba(0,255,136,0.1)', marginBottom:4}}>
          <span>Timestamp</span><span>Source IP</span><span>Destination</span>
          <span>Classification</span><span style={{textAlign:'right'}}>Confidence</span>
        </div>
        <div style={{maxHeight:420, overflowY:'auto'}}>
          {feed.map(row => (
            <div key={row.id} style={{
              display:'grid', gridTemplateColumns:'90px 1fr 1fr auto 80px', gap:12,
              padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.03)',
              fontFamily:'Space Mono,monospace', fontSize:'0.63rem', alignItems:'center',
              animation:'feedIn 0.3s ease'
            }}>
              <span style={{color:'#3d5a50'}}>
                {new Date(row.timestamp).toLocaleTimeString('en-US',{hour12:false})}
              </span>
              <span style={{color:'#7ba89a'}}>{row.src}</span>
              <span style={{color:'#3d5a50'}}>{row.dst}</span>
              <span style={{
                padding:'2px 8px', borderRadius:2, fontSize:'0.58rem', letterSpacing:'0.06em',
                background: row.type === 'BENIGN' ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.1)',
                border: `1px solid ${row.type === 'BENIGN' ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.25)'}`,
                color: COLORS[row.type] || '#00ff88'
              }}>{row.type}</span>
              <span style={{color:'#7ba89a', textAlign:'right'}}>
                {(row.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        <div style={{marginTop:12, display:'flex', gap:12}}>
          <button onClick={() => setPaused(p => !p)} style={{
            fontFamily:'Space Mono,monospace', fontSize:'0.62rem', padding:'6px 16px',
            background: paused ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
            border: `1px solid ${paused ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
            color: paused ? '#00ff88' : '#ff3366', borderRadius:2, cursor:'pointer',
            letterSpacing:'0.08em', textTransform:'uppercase'
          }}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        </div>
      </ChartCard>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ML MODELS
// ══════════════════════════════════════════════════════════════════════════════

const ModelsTab = ({ featureImportance, models }) => {
  const radarData = models.map(m => ({
    model: m.model.split(' ')[0],
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    F1: m.f1,
    Speed: m.speed,
  }));

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem'}}>
        <StatCard label="Best Model" value="RF" sub="Random Forest · 99.2% acc" color="#00ff88" glow="0 0 15px rgba(0,255,136,0.3)"/>
        <StatCard label="False Positive Rate" value="0.8%" color="#00ccff" sub="precision 99.1%"/>
        <StatCard label="Avg Inference" value="45ms" color="#ffcc00" sub="per 1K flows"/>
        <StatCard label="Features Used" value="10/83" sub="post feature selection" color="#cc44ff"/>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'1.5rem', marginBottom:'1.5rem'}}>
        {/* Model table */}
        <ChartCard title="Model Performance Comparison">
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Model','Accuracy','Precision','Recall','F1','Speed'].map(h => (
                  <th key={h} style={{fontFamily:'Space Mono,monospace', fontSize:'0.58rem',
                    letterSpacing:'0.1em', textTransform:'uppercase', color:'#3d5a50',
                    padding:'8px 10px', textAlign:'left', borderBottom:'1px solid rgba(0,255,136,0.1)'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={m.model}>
                  <td style={{padding:'10px 10px', fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
                    color:'#e8f4f0', fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    {i === 0 && <span style={{color:'#00ff88', marginRight:6}}>★</span>}
                    {m.model}
                  </td>
                  {['accuracy','precision','recall','f1'].map(k => (
                    <td key={k} style={{padding:'10px 10px', fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
                      color: m[k] >= 99 ? '#00ff88' : m[k] >= 97 ? '#ffcc00' : '#7ba89a',
                      borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      {m[k]}%
                    </td>
                  ))}
                  <td style={{padding:'10px 10px', fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
                    color:'#7ba89a', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    {m.speed}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        {/* Radar chart */}
        <ChartCard title="Model Profile — Accuracy vs Speed vs Recall">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={[
              {metric:'Accuracy', RF:99.2, XGB:98.9, LSTM:97.4},
              {metric:'Precision', RF:99.1, XGB:98.7, LSTM:97.1},
              {metric:'Recall', RF:99.3, XGB:99.1, LSTM:97.6},
              {metric:'F1', RF:99.2, XGB:98.9, LSTM:97.3},
              {metric:'Speed%', RF:60, XGB:51, LSTM:16},
            ]}>
              <PolarGrid stroke="rgba(0,255,136,0.1)"/>
              <PolarAngleAxis dataKey="metric" tick={{fontFamily:'Space Mono',fontSize:9,fill:'#7ba89a'}}/>
              <Radar name="Random Forest" dataKey="RF" stroke="#00ff88" fill="#00ff88" fillOpacity={0.15} strokeWidth={1.5}/>
              <Radar name="XGBoost" dataKey="XGB" stroke="#00ccff" fill="#00ccff" fillOpacity={0.1} strokeWidth={1.5}/>
              <Radar name="LSTM" dataKey="LSTM" stroke="#cc44ff" fill="#cc44ff" fillOpacity={0.1} strokeWidth={1.5}/>
            </RadarChart>
          </ResponsiveContainer>
          <LegendRow items={[{color:'#00ff88',label:'Random Forest'},{color:'#00ccff',label:'XGBoost'},{color:'#cc44ff',label:'LSTM'}]}/>
        </ChartCard>
      </div>

      {/* Feature Importance */}
      <SectionTitle>Feature Importance — Top 10 Predictors</SectionTitle>
      <ChartCard title="Relative Feature Importance (Random Forest Gini)">
        <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:4}}>
          {featureImportance.map(({ feature, importance }, i) => {
            const hue = Math.round(150 - importance * 120); // green → orange
            const color = `hsl(${hue}, 100%, 55%)`;
            return (
              <div key={feature} style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.62rem',
                  color:'#7ba89a', width:180, flexShrink:0}}>{feature}</div>
                <div style={{flex:1, height:10, background:'rgba(255,255,255,0.03)', overflow:'hidden'}}>
                  <div style={{
                    width:`${importance * 100}%`, height:'100%',
                    background: color, opacity:0.8, transition:'width 1s ease',
                    position:'relative'
                  }}>
                    <div style={{position:'absolute', right:0, top:0, bottom:0,
                      width:3, background:'rgba(255,255,255,0.5)'}}/>
                  </div>
                </div>
                <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.62rem',
                  color:'#3d5a50', width:36, textAlign:'right'}}>{importance.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PCA / EDA
// ══════════════════════════════════════════════════════════════════════════════

const EDATab = ({ pcaData, timeline }) => {
  const SAMPLE = useMemo(() => {
    const step = Math.max(1, Math.floor(timeline.length / 80));
    return timeline.filter((_, i) => i % step === 0);
  }, [timeline]);

  return (
    <div>
      <div style={{marginBottom:'1rem', padding:'12px 16px',
        background:'rgba(0,204,255,0.05)', border:'1px solid rgba(0,204,255,0.15)',
        borderRadius:3, fontFamily:'Space Mono,monospace', fontSize:'0.65rem', color:'#7ba89a',
        lineHeight:1.7}}>
        <span style={{color:'#00ccff'}}>PCA Analysis:</span> Principal Component Analysis applied to 83 CIC-DDoS2019
        features. PC1 captures ~64% of variance (dominated by packet rate, byte count).
        PC2 captures ~21% (driven by flow duration, IAT). Distinct cluster separation
        enables visual classification without ML.
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'1.5rem', marginBottom:'1.5rem'}}>
        {/* PCA Scatter */}
        <ChartCard title="PCA 2D Projection — Traffic Cluster Visualization" badge="83 → 2 dims" badgeType="info">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{top:4, right:4, bottom:0, left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="pc1" name="PC1" type="number"
                tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false}
                label={{value:'PC1 (64%)', position:'insideBottomRight', offset:-4,
                  fill:'#3d5a50', fontSize:9, fontFamily:'Space Mono'}}/>
              <YAxis dataKey="pc2" name="PC2" type="number"
                tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false}
                label={{value:'PC2 (21%)', angle:-90, position:'insideLeft',
                  fill:'#3d5a50', fontSize:9, fontFamily:'Space Mono'}}/>
              <Tooltip cursor={{stroke:'rgba(0,255,136,0.15)'}} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{background:'#0a1520', border:'1px solid rgba(0,255,136,0.3)',
                    borderRadius:3, padding:'8px 12px', fontFamily:'Space Mono,monospace', fontSize:'0.62rem'}}>
                    <div style={{color: COLORS[d.label] || '#00ff88', marginBottom:4}}>{d.label}</div>
                    <div style={{color:'#7ba89a'}}>PC1: <span style={{color:'#e8f4f0'}}>{d.pc1.toFixed(3)}</span></div>
                    <div style={{color:'#7ba89a'}}>PC2: <span style={{color:'#e8f4f0'}}>{d.pc2.toFixed(3)}</span></div>
                  </div>
                );
              }}/>
              {Object.entries(COLORS).map(([label, color]) => (
                <Scatter key={label} name={label}
                  data={pcaData.filter(d => d.label === label)}
                  fill={color} opacity={label === 'BENIGN' ? 0.45 : 0.75} r={3}/>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <LegendRow items={Object.entries(COLORS).map(([label, color]) => ({color, label}))}/>
        </ChartCard>

        {/* Packet rate distribution */}
        <ChartCard title="Packet Rate Over Time — Attack Detection Window">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={SAMPLE} margin={{top:4, right:4, bottom:0, left:0}}>
              <defs>
                <linearGradient id="gPkt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cc44ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#cc44ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="time" tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}}
                tickLine={false} axisLine={false} interval={19}/>
              <YAxis tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}}
                tickLine={false} axisLine={false} tickFormatter={fmt}/>
              <Tooltip content={<TT/>}/>
              <ReferenceLine y={5000} stroke="rgba(255,204,0,0.3)" strokeDasharray="4 4"
                label={{value:'Alert threshold',fill:'#ffcc00',fontSize:9,fontFamily:'Space Mono',position:'right'}}/>
              <Area type="monotone" dataKey="packetRate" name="Packet Rate" stroke="#cc44ff"
                strokeWidth={1.5} fill="url(#gPkt)"/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.6rem', color:'#3d5a50', marginTop:8}}>
            Threshold: 5,000 pkt/s triggers anomaly alert · Above = potential DDoS
          </div>
        </ChartCard>
      </div>

      {/* Variance explanation */}
      <ChartCard title="PCA Explained Variance — Cumulative">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={[
            {comp:'PC1',var:64,cum:64},{comp:'PC2',var:21,cum:85},
            {comp:'PC3',var:8,cum:93},{comp:'PC4',var:4,cum:97},
            {comp:'PC5',var:2,cum:99},{comp:'PC6+',var:1,cum:100},
          ]} margin={{top:4, right:4, bottom:0, left:0}}>
            <defs>
              <linearGradient id="gVar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ccff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00ccff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="comp" tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fontFamily:'Space Mono',fontSize:9,fill:'#3d5a50'}} tickLine={false} axisLine={false} domain={[0,100]}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="cum" name="Cumulative Variance %" stroke="#00ccff" strokeWidth={2} fill="url(#gVar)"/>
            <Bar dataKey="var" name="Component Variance %" fill="#00ccff" opacity={0.3}/>
          </AreaChart>
        </ResponsiveContainer>
        <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.6rem', color:'#3d5a50', marginTop:8}}>
          First 2 PCs explain 85% of total variance — sufficient for visual separation of attack clusters
        </div>
      </ChartCard>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: METHODOLOGY
// ══════════════════════════════════════════════════════════════════════════════

const MethodologyTab = () => {
  const sections = [
    {
      title: 'Dataset — CIC-DDoS2019',
      body: `The Canadian Institute for Cybersecurity DDoS 2019 dataset contains labeled network flow records covering both benign traffic and 12+ DDoS attack categories. Flows are captured using CICFlowMeter and include 83 computed features from raw packet captures (PCAP files). The dataset covers volumetric, protocol, and application-layer attacks — making it one of the most comprehensive publicly available DDoS benchmarks.`,
      items: ['Volumetric: UDP flood, ICMP flood — bandwidth exhaustion', 'Protocol: SYN flood — TCP state table exhaustion', 'Application: HTTP flood, Slowloris — request-level saturation', 'Amplification: DNS, NTP, LDAP — reflection & amplification', '83 flow features: duration, packet length stats, IAT, flags']
    },
    {
      title: 'Exploratory Data Analysis',
      body: `Initial EDA revealed significant class imbalance (malicious flows outnumber benign in attack windows). Key preprocessing steps included null imputation with median values, dropping low-variance features (e.g., Bwd PSH Flags), and log-transforming heavily skewed distributions like packet rate. PCA confirmed that most discriminative signal lives in 2–3 principal components.`,
      items: ['Class imbalance handled via stratified sampling + SMOTE', 'Infinite values (division by near-zero duration) → capped', 'Feature correlation matrix identified 23 redundant features', 'Log1p transform applied to packet_rate, bytes_per_sec', 'Train/Test split: 80/20 stratified by attack type']
    },
    {
      title: 'Machine Learning Pipeline',
      body: `Five classifiers were benchmarked using scikit-learn and PyTorch. Random Forest achieved the highest F1 (0.992) while remaining interpretable and fast. LSTM was tested for temporal sequence modeling — useful for detecting slow-burn application-layer attacks. All models evaluated on accuracy, precision, recall, F1-score, and ROC-AUC.`,
      items: ['Random Forest: 100 estimators, max_depth=20, Gini criterion', 'XGBoost: 200 estimators, learning_rate=0.1, subsample=0.8', 'LSTM: 2 layers × 128 units, dropout=0.3, sequence_len=10', 'Transformer: 4-head attention, 2 encoder layers, d_model=64', 'Cross-validation: 5-fold stratified, reported on held-out test set']
    },
    {
      title: 'Visualization Design',
      body: `Data storytelling was central to the project. Interactive visualizations were built in React using Recharts for chart rendering. PCA projections use D3 force-directed layout logic. The live feed simulates real-time inference output. Color encoding is consistent throughout: green = benign, red = malicious, with attack-type-specific hues for multi-class views.`,
      items: ['Color-blind friendly accent palette with high luminance contrast', 'Monospace typography (Space Mono) for data readability', 'Scanline texture and terminal aesthetic for cybersecurity context', 'Recharts for composable, responsive chart primitives', 'Simulated streaming data via React state + setInterval']
    },
    {
      title: 'Key Findings',
      body: `DDoS attacks leave clear statistical fingerprints. SYN floods cluster around extremely high packet rates with near-zero flow durations. HTTP floods are the hardest to detect — they overlap significantly with benign traffic in PCA space. Random Forest and XGBoost both exceed 98.9% accuracy, suggesting that tabular ML is highly effective for flow-level detection. Temporal models (LSTM) offer marginal accuracy gains but add latency.`,
      items: ['Packet Rate is the single most predictive feature (Gini 0.94)', 'Source IP diversity strongly separates DDoS from benign spikes', 'HTTP-flood false positive rate 3× higher than volumetric attacks', 'Real-time inference feasible at <50ms per 1K flows (Random Forest)', 'PCA visual inspection achieves ~80% accuracy — useful for analysts']
    },
    {
      title: 'References',
      body: '',
      items: [
        'Sharafaldin et al. (2019). Developing Realistic Distributed Denial of Service (DDoS) Attack Dataset. IEEE 2019',
        'CIC-DDoS2019 Dataset — Canadian Institute for Cybersecurity, University of New Brunswick',
        'Cloudflare (2023). Cloudflare mitigates record-breaking 71 million rps DDoS attack',
        'Mirsky et al. (2018). Kitsune: An Ensemble of Autoencoders for Online Network Intrusion Detection. NDSS',
        'Mirai Botnet Analysis — Krebs on Security (2016)'
      ]
    }
  ];

  return (
    <div style={{maxWidth:840}}>
      {sections.map(({ title, body, items }) => (
        <div key={title} style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'0.95rem',
            color:'#00ff88', letterSpacing:'0.05em', marginBottom:'0.75rem',
            paddingBottom:6, borderBottom:'1px solid rgba(0,255,136,0.1)'}}>
            {title}
          </h2>
          {body && <p style={{fontFamily:'Syne,sans-serif', fontSize:'0.82rem',
            color:'#7ba89a', lineHeight:1.75, marginBottom:'0.75rem'}}>{body}</p>}
          <ul style={{listStyle:'none'}}>
            {items.map((item, i) => (
              <li key={i} style={{fontFamily:'Space Mono,monospace', fontSize:'0.68rem',
                color:'#7ba89a', padding:'4px 0', paddingLeft:18, position:'relative',
                lineHeight:1.6}}>
                <span style={{position:'absolute', left:0, color:'#00ff88'}}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'overview', label: '01 · Overview' },
  { id: 'live', label: '02 · Live Feed' },
  { id: 'models', label: '03 · ML Models' },
  { id: 'eda', label: '04 · PCA / EDA' },
  { id: 'methodology', label: '05 · Methodology' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const time = useTime();

  // Generate all data once on mount
  const timeline = useMemo(() => generateTimelineData(), []);
  const scatter = useMemo(() => generateScatterData(), []);
  const attackDist = useMemo(() => generateAttackDistribution(), []);
  const pcaData = useMemo(() => generatePCAData(), []);
  const featureImportance = useMemo(() => generateFeatureImportance(), []);
  const models = useMemo(() => generateModelComparison(), []);

  return (
    <div style={{display:'flex', flexDirection:'column', minHeight:'100vh'}}>
      {/* Header */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2rem', height:64, borderBottom:'1px solid rgba(0,255,136,0.12)',
        background:'rgba(6,13,20,0.97)', backdropFilter:'blur(12px)',
        position:'sticky', top:0, zIndex:100
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="1" y="1" width="26" height="26" rx="3" stroke="#00ff88" strokeWidth="1.5" strokeOpacity="0.5"/>
            <path d="M6 14 L10 8 L14 18 L18 10 L22 14" stroke="#00ff88" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="14" r="2" fill="#ff3366"/>
          </svg>
          <div>
            <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'0.95rem',
              letterSpacing:'0.1em', textTransform:'uppercase', color:'#e8f4f0', lineHeight:1.2}}>
              NET<span style={{color:'#00ff88'}}>GUARD</span>
            </div>
            <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.5rem',
              letterSpacing:'0.12em', color:'#3d5a50', textTransform:'uppercase'}}>
              DDoS Detection & Visualization
            </div>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <div style={{display:'flex', alignItems:'center', gap:8,
            fontFamily:'Space Mono,monospace', fontSize:'0.65rem', color:'#7ba89a'}}>
            <div style={{width:7, height:7, borderRadius:'50%', background:'#ff3366',
              boxShadow:'0 0 8px #ff3366', animation:'pulse 2s infinite'}}/>
            ATTACK DETECTED
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8,
            fontFamily:'Space Mono,monospace', fontSize:'0.65rem', color:'#7ba89a'}}>
            <div style={{width:7, height:7, borderRadius:'50%', background:'#00ff88',
              boxShadow:'0 0 8px #00ff88', animation:'pulse 2s infinite'}}/>
            MODEL ONLINE
          </div>
          <div style={{fontFamily:'Space Mono,monospace', fontSize:'0.8rem',
            color:'#00ff88', letterSpacing:'0.1em'}}>{time}</div>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav style={{display:'flex', padding:'0 2rem',
        borderBottom:'1px solid rgba(0,255,136,0.1)',
        background:'#060d14', overflowX:'auto'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'14px 22px', fontFamily:'Space Mono,monospace', fontSize:'0.65rem',
            letterSpacing:'0.08em', textTransform:'uppercase',
            color: tab === t.id ? '#00ff88' : '#3d5a50',
            cursor:'pointer', border:'none', background:'none',
            borderBottom: tab === t.id ? '2px solid #00ff88' : '2px solid transparent',
            textShadow: tab === t.id ? '0 0 16px rgba(0,255,136,0.4)' : 'none',
            transition:'all 0.2s', whiteSpace:'nowrap'
          }}>{t.label}</button>
        ))}
      </nav>

      {/* Main */}
      <main style={{flex:1, padding:'2rem', maxWidth:1600, width:'100%', margin:'0 auto'}}>
        {tab === 'overview' && <OverviewTab timeline={timeline} scatter={scatter} attackDist={attackDist}/>}
        {tab === 'live' && <LiveFeedTab/>}
        {tab === 'models' && <ModelsTab featureImportance={featureImportance} models={models}/>}
        {tab === 'eda' && <EDATab pcaData={pcaData} timeline={timeline}/>}
        {tab === 'methodology' && <MethodologyTab/>}
      </main>

      {/* Footer */}
      <footer style={{padding:'16px 2rem', borderTop:'1px solid rgba(0,255,136,0.08)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontFamily:'Space Mono,monospace', fontSize:'0.58rem', color:'#3d5a50'}}>
        <span>NETGUARD · CIC-DDoS2019 · Data Visualization Project</span>
        <span>Built with React · Recharts · D3 — github.com/your-handle/ddos-dashboard</span>
      </footer>
    </div>
  );
}
