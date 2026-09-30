import React from 'react';

interface AnimatedWeatherIconProps {
  condition?: string;
  isDay?: boolean;
  size?: number; // e.g. 64 or 72
  className?: string;
}

export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
  condition = 'Clear',
  isDay = true,
  size = 68,
  className = ''
}) => {
  const c = condition.toLowerCase();
  const currentHour = new Date().getHours();
  const isNightTime = isDay !== undefined 
    ? !isDay 
    : c.includes('night') || currentHour >= 19 || currentHour < 5;

  // Determine icon type
  let type: 'SUN' | 'MOON' | 'PARTLY_DAY' | 'PARTLY_NIGHT' | 'CLOUDY' | 'RAIN' | 'THUNDERSTORM' | 'FOG' | 'SNOW' | 'WIND' | 'HEAT' = 'SUN';

  if (c.includes('thunder') || c.includes('lightning')) {
    type = 'THUNDERSTORM';
  } else if (c.includes('heavy rain') || c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
    type = 'RAIN';
  } else if (c.includes('snow') || c.includes('sleet') || c.includes('ice')) {
    type = 'SNOW';
  } else if (c.includes('fog') || c.includes('mist') || c.includes('haze') || c.includes('dust')) {
    type = 'FOG';
  } else if (c.includes('wind') || c.includes('breeze') || c.includes('gale')) {
    type = 'WIND';
  } else if (c.includes('hot') || c.includes('heat')) {
    type = 'HEAT';
  } else if (c.includes('partly') || c.includes('scattered')) {
    type = isNightTime ? 'PARTLY_NIGHT' : 'PARTLY_DAY';
  } else if (c.includes('cloud') || c.includes('overcast')) {
    type = 'CLOUDY';
  } else if (isNightTime) {
    type = 'MOON';
  } else {
    type = 'SUN';
  }

  return (
    <div 
      className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes sunRaySpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sunCorePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.85)); }
        }
        @keyframes moonGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(186, 230, 253, 0.5)); transform: translateY(0px); }
          50% { filter: drop-shadow(0 0 14px rgba(125, 211, 252, 0.8)); transform: translateY(-2px); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-3px) translateX(2px); }
        }
        @keyframes rainFall {
          0% { transform: translateY(-4px) translateX(-2px); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: translateY(12px) translateX(6px); opacity: 0; }
        }
        @keyframes thunderFlash {
          0%, 90%, 100% { opacity: 0; transform: scale(0.9); }
          92%, 96% { opacity: 1; transform: scale(1.05); filter: drop-shadow(0 0 8px #fef08a); }
          94% { opacity: 0.2; }
        }
        @keyframes mistDrift {
          0%, 100% { transform: translateX(-3px); opacity: 0.5; }
          50% { transform: translateX(3px); opacity: 0.85; }
        }
        @keyframes windStream {
          0% { stroke-dashoffset: 24; opacity: 0.3; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: -24; opacity: 0.3; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* 1. CLEAR DAY (SUN) */}
      {type === 'SUN' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Rotating Sunrays */}
          <g style={{ transformOrigin: '32px 32px', animation: 'sunRaySpin 24s linear infinite' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="32"
                y1="8"
                x2="32"
                y2="13"
                stroke="url(#sunRayGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${deg} 32 32)`}
              />
            ))}
          </g>

          {/* Pulsing Sun Core */}
          <circle
            cx="32"
            cy="32"
            r="13"
            fill="url(#sunCoreGrad)"
            style={{ transformOrigin: '32px 32px', animation: 'sunCorePulse 4s ease-in-out infinite' }}
          />

          <defs>
            <linearGradient id="sunCoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="sunRayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 2. CLEAR NIGHT (MOON) */}
      {type === 'MOON' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Faint Stars */}
          <circle cx="16" cy="18" r="1.5" fill="#bae6fd" style={{ animation: 'starTwinkle 3s ease-in-out infinite' }} />
          <circle cx="48" cy="22" r="1.2" fill="#bae6fd" style={{ animation: 'starTwinkle 2.5s ease-in-out infinite 1s' }} />
          <circle cx="42" cy="46" r="1.5" fill="#bae6fd" style={{ animation: 'starTwinkle 3.2s ease-in-out infinite 1.8s' }} />

          {/* Crescent Moon */}
          <path
            d="M36 14 C23.8 14 14 23.8 14 36 C14 48.2 23.8 58 36 58 C41.2 58 46 56.2 49.8 53.2 C38.5 52.5 29.5 43.1 29.5 31.5 C29.5 22.8 34.5 15.3 41.8 12.2 C39.9 14.1 38 14 36 14 Z"
            fill="url(#moonGrad)"
            style={{ transformOrigin: '32px 36px', animation: 'moonGlow 4s ease-in-out infinite' }}
          />

          <defs>
            <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="50%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 3. PARTLY CLOUDY (DAY) */}
      {type === 'PARTLY_DAY' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Peeking Sun */}
          <g style={{ transformOrigin: '40px 22px', animation: 'sunRaySpin 28s linear infinite' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="42"
                y1="10"
                x2="42"
                y2="13"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${deg} 42 22)`}
              />
            ))}
          </g>
          <circle cx="42" cy="22" r="10" fill="url(#sunCoreGrad)" />

          {/* Floating Cloud */}
          <path
            d="M44 46 H20 C14.5 46 10 41.5 10 36 C10 31.2 13.5 27.2 18.2 26.3 C20 20.8 25.2 17 31.2 17 C38.5 17 44.5 22.5 45.2 29.8 C48.5 30.5 51 33.4 51 37 C51 42 47.9 46 44 46 Z"
            fill="url(#cloudGrad)"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.35))"
            style={{ animation: 'cloudFloat 5s ease-in-out infinite' }}
          />

          <defs>
            <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 4. PARTLY CLOUDY (NIGHT) */}
      {type === 'PARTLY_NIGHT' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Peeking Moon */}
          <path
            d="M42 16 C33 16 26 23 26 32 C26 35.5 27 38.8 28.8 41.6 C24.5 40 21 34 23 26 C24.5 20 29 16 35 15 C37.5 14.8 40 15.2 42 16 Z"
            fill="url(#moonGrad)"
            filter="drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))"
          />

          {/* Floating Night Cloud */}
          <path
            d="M44 48 H20 C14.5 48 10 43.5 10 38 C10 33.2 13.5 29.2 18.2 28.3 C20 22.8 25.2 19 31.2 19 C38.5 19 44.5 24.5 45.2 31.8 C48.5 32.5 51 35.4 51 39 C51 44 47.9 48 44 48 Z"
            fill="url(#nightCloudGrad)"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.45))"
            style={{ animation: 'cloudFloat 5s ease-in-out infinite' }}
          />

          <defs>
            <linearGradient id="nightCloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 5. CLOUDY / OVERCAST */}
      {type === 'CLOUDY' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Back Cloud */}
          <path
            d="M48 36 H30 C25.5 36 22 32.5 22 28 C22 24.2 24.8 21 28.5 20.2 C30 15.8 34.2 12.8 39 12.8 C44.8 12.8 49.6 17.2 50.2 23 C52.8 23.6 54.8 26 54.8 28.8 C54.8 32.8 51.8 36 48 36 Z"
            fill="#475569"
            opacity="0.8"
            style={{ animation: 'cloudFloat 6s ease-in-out infinite -2s' }}
          />

          {/* Front Cloud */}
          <path
            d="M42 50 H18 C13 50 9 46 9 41 C9 36.6 12.2 33 16.5 32.2 C18.1 27.2 22.8 23.8 28.2 23.8 C34.8 23.8 40.2 28.8 40.8 35.3 C43.8 36 46 38.6 46 41.8 C46 46.3 44.2 50 42 50 Z"
            fill="url(#cloudGrad)"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
            style={{ animation: 'cloudFloat 5s ease-in-out infinite' }}
          />
        </svg>
      )}

      {/* 6. RAIN */}
      {type === 'RAIN' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Cloud */}
          <path
            d="M44 38 H18 C13 38 9 34 9 29 C9 24.6 12.2 21 16.5 20.2 C18.1 15.2 22.8 11.8 28.2 11.8 C34.8 11.8 40.2 16.8 40.8 23.3 C43.8 24 46 26.6 46 29.8 C46 34.3 44.2 38 44 38 Z"
            fill="url(#rainCloudGrad)"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
          />

          {/* Falling Raindrops */}
          <g stroke="#38bdf8" strokeWidth="2" strokeLinecap="round">
            <line x1="20" y1="42" x2="16" y2="50" style={{ animation: 'rainFall 1.1s linear infinite' }} />
            <line x1="28" y1="42" x2="24" y2="50" style={{ animation: 'rainFall 1.1s linear infinite 0.35s' }} />
            <line x1="36" y1="42" x2="32" y2="50" style={{ animation: 'rainFall 1.1s linear infinite 0.7s' }} />
            <line x1="44" y1="42" x2="40" y2="50" style={{ animation: 'rainFall 1.1s linear infinite 0.2s' }} />
          </g>

          <defs>
            <linearGradient id="rainCloudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 7. THUNDERSTORM */}
      {type === 'THUNDERSTORM' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          {/* Dark Storm Cloud */}
          <path
            d="M44 36 H18 C13 36 9 32 9 27 C9 22.6 12.2 19 16.5 18.2 C18.1 13.2 22.8 9.8 28.2 9.8 C34.8 9.8 40.2 14.8 40.8 21.3 C43.8 22 46 24.6 46 27.8 C46 32.3 44.2 36 44 36 Z"
            fill="#1e293b"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
          />

          {/* Lightning Bolt */}
          <polygon
            points="32,32 23,45 29,45 25,58 39,42 33,42"
            fill="#facc15"
            stroke="#fef08a"
            strokeWidth="0.8"
            style={{ transformOrigin: '30px 45px', animation: 'thunderFlash 4s infinite' }}
          />

          {/* Rain streak */}
          <line x1="16" y1="40" x2="12" y2="48" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" style={{ animation: 'rainFall 1s linear infinite' }} />
          <line x1="44" y1="40" x2="40" y2="48" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" style={{ animation: 'rainFall 1s linear infinite 0.5s' }} />
        </svg>
      )}

      {/* 8. FOG / MIST */}
      {type === 'FOG' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          <g stroke="url(#fogGrad)" strokeWidth="3" strokeLinecap="round">
            <line x1="14" y1="24" x2="50" y2="24" style={{ animation: 'mistDrift 4s ease-in-out infinite' }} />
            <line x1="10" y1="32" x2="54" y2="32" style={{ animation: 'mistDrift 5s ease-in-out infinite -1s' }} />
            <line x1="16" y1="40" x2="48" y2="40" style={{ animation: 'mistDrift 4.5s ease-in-out infinite -2s' }} />
            <line x1="12" y1="48" x2="52" y2="48" style={{ animation: 'mistDrift 5.5s ease-in-out infinite -0.5s' }} />
          </g>
          <defs>
            <linearGradient id="fogGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 9. WIND */}
      {type === 'WIND' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          <path
            d="M10 24 H38 C42 24 45 21 45 18 C45 15 42 12 39 12 C36 12 33 14 33 17"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="24 6"
            style={{ animation: 'windStream 2s linear infinite' }}
          />
          <path
            d="M8 34 H46 C50 34 54 37 54 41 C54 45 50 48 46 48 C42 48 39 45 39 42"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="24 6"
            style={{ animation: 'windStream 1.8s linear infinite -0.5s' }}
          />
          <path
            d="M14 44 H34 C37 44 40 46 40 49 C40 52 37 54 34 54"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="16 4"
            style={{ animation: 'windStream 2.2s linear infinite -1s' }}
          />
        </svg>
      )}

      {/* 10. SNOW */}
      {type === 'SNOW' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          <path
            d="M44 34 H18 C13 34 9 30 9 25 C9 20.6 12.2 17 16.5 16.2 C18.1 11.2 22.8 7.8 28.2 7.8 C34.8 7.8 40.2 12.8 40.8 19.3 C43.8 20 46 22.6 46 25.8 C46 30.3 44.2 34 44 34 Z"
            fill="url(#cloudGrad)"
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))"
          />
          {/* Snowflakes */}
          <g fill="#e0f2fe">
            <text x="18" y="48" fontSize="13" style={{ animation: 'cloudFloat 3s infinite' }}>❄</text>
            <text x="30" y="54" fontSize="11" style={{ animation: 'cloudFloat 3.5s infinite -1s' }}>❄</text>
            <text x="42" y="48" fontSize="13" style={{ animation: 'cloudFloat 3.2s infinite -1.8s' }}>❄</text>
          </g>
        </svg>
      )}

      {/* 11. HEAT */}
      {type === 'HEAT' && (
        <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible">
          <circle cx="32" cy="32" r="14" fill="#f59e0b" filter="drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.4" style={{ animation: 'sunCorePulse 3s infinite' }} />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3" style={{ animation: 'sunCorePulse 3s infinite 0.5s' }} />
        </svg>
      )}
    </div>
  );
};
