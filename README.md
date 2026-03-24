# NETGUARD — DDoS Attack Visualization Dashboard

> An interactive data visualization platform for exploring, detecting, and understanding DDoS attacks using the CIC-DDoS2019 dataset.

## Overview

NETGUARD is a React-based dashboard that brings DDoS network traffic data to life through interactive visualizations. Built around the **CIC-DDoS2019 dataset** from the Canadian Institute for Cybersecurity, it tells the full data story: from raw traffic anomalies through EDA, PCA projection, ML model comparison, and simulated real-time detection.

## Features

| Tab | What it shows |
|-----|---------------|
| **01 · Overview** | 24-hour traffic timeline, attack type breakdown, traffic fingerprinting scatter plot |
| **02 · Live Feed** | Simulated real-time flow classification stream with pause/resume |
| **03 · ML Models** | Performance comparison table, radar chart, feature importance |
| **04 · PCA / EDA** | 2D PCA projection of 83 features, packet rate timeline, explained variance |
| **05 · Methodology** | Dataset, EDA approach, ML pipeline, findings, references |

## Dataset

**CIC-DDoS2019** — Canadian Institute for Cybersecurity  
https://www.kaggle.com/datasets/aymenabb/ddos-evaluation-dataset-cic-ddos2019

- 83 computed network flow features (CICFlowMeter)
- Attack types: UDP flood, SYN flood, HTTP flood, ICMP flood, DNS amplification
- Labeled benign + malicious flows

> This dashboard uses **simulated data** mirroring CIC-DDoS2019 statistical patterns.

## Tech Stack

- **React 18** — component architecture, hooks
- **Recharts** — AreaChart, ScatterChart, RadarChart, BarChart
- **Space Mono + Syne** — typography (Google Fonts)
- CSS custom properties for theming

## Getting Started

```bash
git clone https://github.com/your-handle/ddos-dashboard.git
cd ddos-dashboard
npm install
npm start       # http://localhost:3000
npm run build   # Production build
```

## Project Structure

```
src/
├── App.js              # Root component — all tabs, charts, layout
├── index.css           # Global styles, CSS variables
└── data/
    └── trafficData.js  # Simulated data generators
```

## ML Results

| Model | Accuracy | F1 |
|-------|----------|----|
| Random Forest | **99.2%** | **0.992** |
| XGBoost | 98.9% | 0.989 |
| LSTM | 97.4% | 0.973 |
| Transformer | 98.1% | 0.981 |

## Key Research Questions

1. What network traffic features best indicate a DDoS attack?
2. Which packet types are most common in DDoS attacks?
3. How can visualization differentiate DDoS from legitimate traffic spikes?
4. Which ML model best balances accuracy, FPR, and speed?
5. How does PCA visualization affect human-in-the-loop detection?

## References

- Sharafaldin et al. (2019). Developing Realistic DDoS Attack Dataset. IEEE
- Cloudflare (2023). Cloudflare mitigates 71M rps DDoS attack
- CIC-DDoS2019 Dataset — University of New Brunswick

## License

MIT © 2024
