import { useState, useCallback, useMemo } from 'react';
import { EndlessRoll, type Hex, type CellContent, type CellState, key } from 'endless-roll';

type ContentType = 'numbers' | 'portfolio' | 'news';

const PORTFOLIO_PROJECTS = [
  { title: 'AI Chat App', tech: 'React, OpenAI', color: '#e0f2fe', textColor: '#0369a1' },
  { title: 'E-Commerce', tech: 'Next.js, Stripe', color: '#fef3c7', textColor: '#92400e' },
  { title: 'Task Manager', tech: 'Vue, Firebase', color: '#dcfce7', textColor: '#166534' },
  { title: 'Portfolio Site', tech: 'Astro, Tailwind', color: '#f3e8ff', textColor: '#7c3aed' },
  { title: 'Weather App', tech: 'React Native', color: '#fee2e2', textColor: '#dc2626' },
  { title: 'Blog Platform', tech: 'Remix, Prisma', color: '#e0e7ff', textColor: '#4338ca' },
  { title: 'Music Player', tech: 'Electron, Web Audio', color: '#fce7f3', textColor: '#be185d' },
  { title: 'Recipe Finder', tech: 'SvelteKit', color: '#cffafe', textColor: '#0891b2' },
  { title: 'Fitness Tracker', tech: 'Flutter', color: '#d1fae5', textColor: '#059669' },
  { title: 'Code Editor', tech: 'Monaco, TypeScript', color: '#fef9c3', textColor: '#a16207' },
  { title: 'Social Network', tech: 'GraphQL, Postgres', color: '#ede9fe', textColor: '#6d28d9' },
  { title: 'Video Platform', tech: 'AWS, FFmpeg', color: '#fff1f2', textColor: '#e11d48' },
];

const NEWS_HEADLINES = [
  { headline: 'Tech Giants Unveil New AI Models', category: 'Tech', color: '#dbeafe', textColor: '#1d4ed8' },
  { headline: 'Markets Rally on Economic Data', category: 'Finance', color: '#d1fae5', textColor: '#047857' },
  { headline: 'Climate Summit Reaches Agreement', category: 'World', color: '#fef3c7', textColor: '#b45309' },
  { headline: 'New Study Links Sleep to Memory', category: 'Health', color: '#fce7f3', textColor: '#be185d' },
  { headline: 'Space Mission Launches Tomorrow', category: 'Science', color: '#e0e7ff', textColor: '#4338ca' },
  { headline: 'Championship Finals Set for Sunday', category: 'Sports', color: '#fee2e2', textColor: '#dc2626' },
  { headline: 'Award Winners Announced Tonight', category: 'Entertainment', color: '#f3e8ff', textColor: '#7c3aed' },
  { headline: 'Major Infrastructure Bill Passes', category: 'Politics', color: '#ecfccb', textColor: '#4d7c0f' },
  { headline: 'Electric Vehicle Sales Surge', category: 'Auto', color: '#cffafe', textColor: '#0891b2' },
  { headline: 'Remote Work Trend Continues', category: 'Business', color: '#fef9c3', textColor: '#a16207' },
  { headline: 'New Restaurant Opens Downtown', category: 'Local', color: '#ffe4e6', textColor: '#e11d48' },
  { headline: 'Scientists Discover New Species', category: 'Nature', color: '#dcfce7', textColor: '#15803d' },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getNumber(coord: Hex): number {
  const seed = coord.q * 73856093 + coord.r * 19349663;
  return Math.floor(seededRandom(seed) * 99) + 1;
}

function getPortfolioProject(coord: Hex) {
  const seed = coord.q * 73856093 + coord.r * 19349663;
  const index = Math.abs(seed) % PORTFOLIO_PROJECTS.length;
  return PORTFOLIO_PROJECTS[index];
}

function getNewsHeadline(coord: Hex) {
  const seed = coord.q * 73856093 + coord.r * 19349663;
  const index = Math.abs(seed) % NEWS_HEADLINES.length;
  return NEWS_HEADLINES[index];
}

const numberColors = [
  { bg: '#f0f2e8', text: '#69785d', outline: '#d4dac9' },
  { bg: '#fcf5e7', text: '#a96436', outline: '#ce8b5d' },
  { bg: '#eaf1ed', text: '#547c79', outline: '#8caeac' },
  { bg: '#f8f4ff', text: '#7c5cbf', outline: '#c4b5e0' },
  { bg: '#fff4f4', text: '#c25a5a', outline: '#e8a8a8' },
];

function getNumberColor(num: number) {
  return numberColors[num % numberColors.length];
}

export default function App() {
  const [center, setCenter] = useState<Hex>({ q: 0, r: 0 });
  const [contentType, setContentType] = useState<ContentType>('numbers');
  const [selectedCell, setSelectedCell] = useState<Hex | null>(null);

  const handleCenterChange = useCallback((coord: Hex) => {
    setCenter(coord);
    setSelectedCell(null);
  }, []);

  const handleCellSelect = useCallback((coord: Hex) => {
    setSelectedCell(prev => 
      prev && key(prev) === key(coord) ? null : coord
    );
  }, []);

  const cellProvider = useCallback((coord: Hex) => {
    switch (contentType) {
      case 'numbers':
        return getNumber(coord);
      case 'portfolio':
        return getPortfolioProject(coord);
      case 'news':
        return getNewsHeadline(coord);
    }
  }, [contentType]);

  const renderCell = useCallback((_coord: Hex, data: unknown, state: CellState): CellContent => {
    const { isCenter, isHovered } = state;
    
    switch (contentType) {
      case 'numbers': {
        const num = data as number;
        const colors = getNumberColor(num);
        return {
          label: num,
          backgroundColor: isCenter ? '#cd603b' : isHovered ? '#e8e8dd' : colors.bg,
          textColor: isCenter ? '#fff8ed' : colors.text,
          outlineColor: isCenter ? '#bd5433' : isHovered ? '#b8b8a8' : colors.outline,
          icon: isCenter ? 'dot' : undefined,
        };
      }
      case 'portfolio': {
        const project = data as typeof PORTFOLIO_PROJECTS[0];
        return {
          label: project.title.split(' ')[0],
          sublabel: project.tech.split(',')[0],
          backgroundColor: isCenter ? '#2563eb' : isHovered ? '#f0f4ff' : project.color,
          textColor: isCenter ? '#ffffff' : project.textColor,
          outlineColor: isCenter ? '#1d4ed8' : isHovered ? '#a0aec0' : project.textColor + '40',
          fontSize: 0.85,
        };
      }
      case 'news': {
        const article = data as typeof NEWS_HEADLINES[0];
        const words = article.headline.split(' ');
        const shortTitle = words.slice(0, 2).join(' ');
        return {
          label: shortTitle,
          sublabel: article.category,
          backgroundColor: isCenter ? '#1e293b' : isHovered ? '#f8fafc' : article.color,
          textColor: isCenter ? '#ffffff' : article.textColor,
          outlineColor: isCenter ? '#0f172a' : isHovered ? '#94a3b8' : article.textColor + '40',
          fontSize: 0.8,
        };
      }
    }
  }, [contentType]);

  const selectedData = useMemo(() => {
    if (!selectedCell) return null;
    const data = cellProvider(selectedCell);
    switch (contentType) {
      case 'numbers':
        return { title: `Cell ${key(selectedCell)}`, subtitle: `Value: ${data}` };
      case 'portfolio': {
        const p = data as typeof PORTFOLIO_PROJECTS[0];
        return { title: p.title, subtitle: p.tech };
      }
      case 'news': {
        const n = data as typeof NEWS_HEADLINES[0];
        return { title: n.headline, subtitle: n.category };
      }
    }
  }, [selectedCell, cellProvider, contentType]);

  const contentTypes: { type: ContentType; label: string }[] = [
    { type: 'numbers', label: '🔢 Numbers' },
    { type: 'portfolio', label: '💼 Portfolio' },
    { type: 'news', label: '📰 News' },
  ];

  return (
    <div className="app">
      <header>
        <h1>
          <span>🌐</span>
          Endless Roll
        </h1>
        <div className="switcher">
          {contentTypes.map(({ type, label }) => (
            <button
              key={type}
              className={contentType === type ? 'active' : ''}
              onClick={() => {
                setContentType(type);
                setSelectedCell(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main>
        <div className="sphere-container">
          <EndlessRoll
            center={center}
            onCenterChange={handleCenterChange}
            onCellSelect={handleCellSelect}
            cellProvider={cellProvider}
            renderCell={renderCell}
            settings={{
              visibleRings: 2,
              duration: 350,
            }}
            enableDrag={true}
            ariaLabel={`Endless rolling sphere showing ${contentType}`}
            resetKey={contentType}
          />
        </div>

        {selectedData && (
          <div className="cell-preview">
            <h3>{selectedData.title}</h3>
            <p>{selectedData.subtitle}</p>
          </div>
        )}
      </main>

      <div className="info-bar">
        <span className="coords">
          Center: ({center.q}, {center.r})
        </span>
        <div className="hint">
          <span>👆 Tap to navigate</span>
          <span>✋ Drag to explore</span>
        </div>
      </div>
    </div>
  );
}
