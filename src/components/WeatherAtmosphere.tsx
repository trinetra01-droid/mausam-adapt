import React, { useEffect, useRef, useState } from 'react';
import { WarningSeverity } from '../types.js';

export type WeatherState = 
  | 'CLEAR_DAY'
  | 'CLEAR_NIGHT'
  | 'SUNRISE'
  | 'SUNSET'
  | 'PARTLY_CLOUDY_DAY'
  | 'PARTLY_CLOUDY_NIGHT'
  | 'CLOUDY'
  | 'LIGHT_RAIN'
  | 'HEAVY_RAIN'
  | 'THUNDERSTORM'
  | 'FOG'
  | 'HEAT'
  | 'STRONG_WIND'
  | 'DUST'
  | 'CYCLONE'
  | 'FLOOD'
  | 'SNOW'
  | 'SYSTEM_OVERRIDE';

export interface WeatherAtmosphereProps {
  condition?: string;
  isDay?: boolean;
  temperature?: number;
  windSpeed?: number;
  rainIntensity?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  warningSeverity?: WarningSeverity;
  hazardType?: string;
  intensity?: 'high' | 'subtle' | 'very-subtle' | 'minimal' | 'focused';
  theme?: 'light' | 'dark';
}

export const WeatherAtmosphere: React.FC<WeatherAtmosphereProps> = ({
  condition = 'Clear Sky',
  isDay: propIsDay,
  temperature = 25,
  windSpeed = 10,
  rainIntensity = 0,
  visibility = 8,
  sunrise = '06:15',
  sunset = '18:30',
  warningSeverity,
  hazardType,
  intensity = 'subtle',
  theme = 'dark'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lightningFlash, setLightningFlash] = useState(false);

  // Monitor prefers-reduced-motion & mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Determine local day/night and effective visual theme
  const isNight = propIsDay !== undefined 
    ? !propIsDay 
    : (theme === 'dark');

  const effectiveTheme: 'light' | 'dark' = propIsDay !== undefined
    ? (propIsDay ? 'light' : 'dark')
    : (theme === 'light' ? 'light' : (!isNight ? 'light' : 'dark'));

  // Resolve Weather State with explicit priority for severe multi-hazard red alerts
  const resolveWeatherState = (): WeatherState => {
    const c = (condition || '').toLowerCase();
    const h = (hazardType || '').toLowerCase();

    // Priority 1: Specific severe hazard conditions take immediate priority during alerts
    if (h.includes('sand') || h.includes('dust') || c.includes('sand') || c.includes('dust')) return 'DUST';
    if (h.includes('flood') || c.includes('flood') || h.includes('inundat')) return 'FLOOD';
    if (h.includes('heat') || c.includes('heat') || h.includes('loo') || temperature > 38) return 'HEAT';
    if (h.includes('heavy rain') || c.includes('heavy rain') || (warningSeverity === 'RED' && (h.includes('rain') || c.includes('rain'))) || rainIntensity > 10) return 'HEAVY_RAIN';
    if (h.includes('cyclone') || c.includes('cyclone')) return 'CYCLONE';
    if (c.includes('thunder') || c.includes('lightning') || h.includes('thunder')) return 'THUNDERSTORM';

    // Priority 2: Generic RED alert with unclassified hazard
    if (warningSeverity === 'RED') {
      return 'SYSTEM_OVERRIDE';
    }

    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || rainIntensity > 0.5) return 'LIGHT_RAIN';
    if (c.includes('snow') || c.includes('sleet')) return 'SNOW';
    if (c.includes('fog') || c.includes('mist') || visibility < 2.0) return 'FOG';
    if (c.includes('dust') || c.includes('sand') || c.includes('haze')) return 'DUST';
    if (windSpeed > 35) return 'STRONG_WIND';
    if (c.includes('partly') || c.includes('scattered')) return isNight ? 'PARTLY_CLOUDY_NIGHT' : 'PARTLY_CLOUDY_DAY';
    if (c.includes('overcast') || c.includes('cloud') || c.includes('gloomy')) return 'CLOUDY';
    if (c.includes('sunrise') || c.includes('dawn')) return 'SUNRISE';
    if (c.includes('sunset') || c.includes('dusk')) return 'SUNSET';

    return isNight ? 'CLEAR_NIGHT' : 'CLEAR_DAY';
  };

  const weatherState = resolveWeatherState();

  // Distant Lightning Glow Effect (Thunderstorm, Cyclone, and Severe Storm Alerts)
  useEffect(() => {
    const isStormy = weatherState === 'THUNDERSTORM' || weatherState === 'CYCLONE' || (weatherState === 'HEAVY_RAIN' && warningSeverity === 'RED');
    if (!isStormy || prefersReducedMotion) {
      setLightningFlash(false);
      return;
    }

    let isMounted = true;
    let timeoutId: any;

    const triggerLightning = () => {
      if (!isMounted) return;
      const nextDelay = 4500 + Math.random() * 5500;
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setLightningFlash(true);
        setTimeout(() => {
          if (isMounted) setLightningFlash(false);
          if (Math.random() > 0.6) {
            setTimeout(() => {
              if (isMounted) setLightningFlash(true);
              setTimeout(() => {
                if (isMounted) setLightningFlash(false);
                triggerLightning();
              }, 120);
            }, 90);
          } else {
            triggerLightning();
          }
        }, 220);
      }, nextDelay);
    };

    triggerLightning();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [weatherState, prefersReducedMotion, intensity]);

  // Particle Canvas Engine (Stars, Rain, Breeze, Snow)
  useEffect(() => {
    if (prefersReducedMotion || intensity === 'focused' || intensity === 'minimal') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const intensityMultiplier = 
      intensity === 'high' ? 1.0 :
      intensity === 'subtle' ? 0.65 :
      0.4;

    const needsStars = isNight && effectiveTheme === 'dark' && (weatherState === 'CLEAR_NIGHT' || weatherState === 'PARTLY_CLOUDY_NIGHT');
    const isRaining = weatherState === 'LIGHT_RAIN' || weatherState === 'HEAVY_RAIN' || weatherState === 'THUNDERSTORM' || weatherState === 'FLOOD';
    const isHeavyRain = weatherState === 'HEAVY_RAIN' || weatherState === 'FLOOD' || (warningSeverity === 'RED' && isRaining);
    const isSnowing = weatherState === 'SNOW';
    const isWindy = weatherState === 'STRONG_WIND';
    const isDusty = weatherState === 'DUST';
    const isHeatWave = weatherState === 'HEAT';
    const isDayShimmer = !isNight && (weatherState === 'CLEAR_DAY' || weatherState === 'PARTLY_CLOUDY_DAY');

    interface Particle {
      x: number;
      y: number;
      length: number;
      speedY: number;
      speedX: number;
      opacity: number;
      baseOpacity: number;
      size: number;
      twinkleSpeed?: number;
      phase?: number;
    }

    const particles: Particle[] = [];

    if (needsStars) {
      const starCount = Math.round((isMobile ? 26 : 55) * intensityMultiplier);
      for (let i = 0; i < starCount; i++) {
        const baseOp = 0.2 + Math.random() * 0.55;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.65),
          length: 0,
          speedY: 0,
          speedX: 0,
          size: 0.6 + Math.random() * 1.2,
          opacity: baseOp,
          baseOpacity: baseOp,
          twinkleSpeed: 0.008 + Math.random() * 0.016,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (isDusty) {
      // Sand Storm: high-velocity blowing sand grains & fast-rushing horizontal sand streaks
      const sandCount = Math.round((isMobile ? 60 : 130) * intensityMultiplier);
      for (let i = 0; i < sandCount; i++) {
        const isStreak = Math.random() > 0.6;
        const speed = 14 + Math.random() * 22;
        const baseOp = 0.25 + Math.random() * 0.55;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: isStreak ? 25 + Math.random() * 55 : 0,
          speedX: speed,
          speedY: -0.5 + Math.random() * 1.0,
          size: isStreak ? 1.4 : 1.2 + Math.random() * 2.2,
          opacity: baseOp,
          baseOpacity: baseOp
        });
      }
    } else if (isHeatWave) {
      // Heat Storm / Heat Wave: thermal shimmering motes rising in hot convection air drafts
      const heatCount = Math.round((isMobile ? 24 : 52) * intensityMultiplier);
      for (let i = 0; i < heatCount; i++) {
        const baseOp = 0.18 + Math.random() * 0.48;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speedY: -0.7 - Math.random() * 1.5,
          speedX: -0.3 + Math.random() * 0.6,
          size: 1.4 + Math.random() * 2.6,
          opacity: baseOp,
          baseOpacity: baseOp,
          twinkleSpeed: 0.015 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (isDayShimmer) {
      // Warm, radiant daylight solar dust & sunbeam particles drifting gently through the atmosphere
      const moteCount = Math.round((isMobile ? 14 : 26) * intensityMultiplier);
      for (let i = 0; i < moteCount; i++) {
        const baseOp = 0.22 + Math.random() * 0.42;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speedY: -0.22 - Math.random() * 0.35,
          speedX: -0.15 + Math.random() * 0.3,
          size: 1.0 + Math.random() * 2.0,
          opacity: baseOp,
          baseOpacity: baseOp,
          twinkleSpeed: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (isRaining) {
      // Heavy Rainfall / Flood Downpour vs Gentle Rain
      const baseCount = isHeavyRain ? 110 : 36;
      const rainCount = Math.round((isMobile ? baseCount * 0.6 : baseCount) * intensityMultiplier);
      const angleSpeedX = weatherState === 'THUNDERSTORM' ? 3.8 : isHeavyRain ? 2.4 : 1.4;
      for (let i = 0; i < rainCount; i++) {
        const speedY = (isHeavyRain ? 20 : 11) + Math.random() * 9;
        particles.push({
          x: Math.random() * (width + 120) - 60,
          y: Math.random() * height,
          length: isHeavyRain ? 22 + Math.random() * 28 : 10 + Math.random() * 14,
          speedY,
          speedX: angleSpeedX + Math.random() * 0.8,
          opacity: (isHeavyRain ? 0.35 : 0.18) + Math.random() * 0.16,
          baseOpacity: 0.25,
          size: isHeavyRain ? 1.5 : 1.2
        });
      }
    } else if (isSnowing) {
      const snowCount = Math.round((isMobile ? 20 : 40) * intensityMultiplier);
      for (let i = 0; i < snowCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speedY: 0.8 + Math.random() * 1.4,
          speedX: -0.3 + Math.random() * 0.6,
          opacity: 0.25 + Math.random() * 0.4,
          baseOpacity: 0.35,
          size: 1.4 + Math.random() * 2
        });
      }
    } else if (isWindy) {
      const count = Math.round((isMobile ? 16 : 34) * intensityMultiplier);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 25 + Math.random() * 50,
          speedX: 5.5 + Math.random() * 3.5,
          speedY: -0.2 + Math.random() * 0.4,
          opacity: 0.14 + Math.random() * 0.18,
          baseOpacity: 0.16,
          size: 1.2
        });
      }
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      if (needsStars) {
        for (const p of particles) {
          if (p.twinkleSpeed && p.phase !== undefined) {
            p.opacity = p.baseOpacity + Math.sin(frame * p.twinkleSpeed + p.phase) * 0.25;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0.05, Math.min(0.85, p.opacity))})`;
          ctx.fill();
        }
      } else if (isDayShimmer) {
        for (const p of particles) {
          if (p.twinkleSpeed && p.phase !== undefined) {
            p.opacity = p.baseOpacity + Math.sin(frame * p.twinkleSpeed + p.phase) * 0.2;
          }
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0.08, Math.min(0.65, p.opacity))})`;
          ctx.fill();
        }
      } else if (isDusty) {
        // Sand Storm: high-velocity blowing sand grains & fast horizontal sand streaks
        for (const p of particles) {
          if (p.length > 0) {
            ctx.strokeStyle = `rgba(217, 119, 6, ${Math.max(0.15, Math.min(0.75, p.opacity * 0.9))})`;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.length, p.y + p.speedY * 3);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0.12, Math.min(0.85, p.opacity))})`;
            ctx.fill();
          }

          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x > width + 60) {
            p.x = -60;
            p.y = Math.random() * height;
          }
          if (p.y > height + 20) p.y = -20;
          if (p.y < -20) p.y = height + 20;
        }
      } else if (isHeatWave) {
        // Heat Storm / Heat Wave: thermal shimmering motes ascending in warm convection currents
        for (const p of particles) {
          if (p.twinkleSpeed && p.phase !== undefined) {
            p.opacity = p.baseOpacity + Math.sin(frame * p.twinkleSpeed + p.phase) * 0.22;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 146, 60, ${Math.max(0.08, Math.min(0.75, p.opacity))})`;
          ctx.fill();

          p.y += p.speedY;
          p.x += p.speedX + Math.sin(frame * 0.03 + p.y * 0.01) * 0.4;

          if (p.y < -15) {
            p.y = height + 15;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
        }
      } else if (isRaining) {
        const strokeCol = theme === 'light'
          ? (weatherState === 'THUNDERSTORM' ? 'rgba(37, 99, 235, 0.4)' : isHeavyRain ? 'rgba(2, 132, 199, 0.38)' : 'rgba(2, 132, 199, 0.28)')
          : (weatherState === 'THUNDERSTORM' ? 'rgba(186, 230, 253, 0.35)' : isHeavyRain ? 'rgba(186, 230, 253, 0.32)' : 'rgba(186, 230, 253, 0.22)');

        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = isHeavyRain ? 1.5 : 1.2;
        ctx.beginPath();

        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * (p.length / p.speedY), p.y + p.length);

          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * (width + 80) - 40;
          }
          if (p.x > width + 50) {
            p.x = -20;
          }
        }
        ctx.stroke();
      } else if (isSnowing) {
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'light' ? `rgba(100, 116, 139, ${p.opacity})` : `rgba(241, 245, 249, ${p.opacity})`;
          ctx.fill();

          p.y += p.speedY;
          p.x += p.speedX + Math.sin(frame * 0.02 + p.y * 0.01) * 0.5;

          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        }
      } else if (isWindy) {
        ctx.strokeStyle = theme === 'light' ? 'rgba(100, 116, 139, 0.24)' : 'rgba(226, 232, 240, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.length, p.y + p.speedY * 4);
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x > width + p.length) {
            p.x = -p.length;
            p.y = Math.random() * height;
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [weatherState, prefersReducedMotion, isMobile, intensity, theme, isNight, effectiveTheme]);

  // Derive atmospheric background styling based on resolved weather state and Light/Dark mode
  const getAtmosphericGradients = (): React.CSSProperties => {
    if (effectiveTheme === 'light') {
      // LIGHT THEME (DAYTIME) ATMOSPHERES
      switch (weatherState) {
        case 'CLEAR_DAY':
        case 'CLEAR_NIGHT':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 85% 10%, rgba(56, 189, 248, 0.55), transparent 70%),
              radial-gradient(ellipse 80% 55% at 20% 85%, rgba(254, 240, 138, 0.4), transparent 60%),
              radial-gradient(ellipse 100% 75% at 50% 25%, rgba(186, 230, 253, 0.7), transparent 80%),
              linear-gradient(180deg, #bae6fd 0%, #e0f2fe 35%, #f0f9ff 100%)
            `
          };

        case 'SUNRISE':
          return {
            background: `
              radial-gradient(ellipse 95% 60% at 50% 95%, rgba(251, 146, 60, 0.55), transparent 75%),
              radial-gradient(ellipse 85% 50% at 80% 60%, rgba(254, 215, 170, 0.65), transparent 65%),
              linear-gradient(180deg, #fdba74 0%, #fed7aa 40%, #f0f9ff 100%)
            `
          };

        case 'SUNSET':
          return {
            background: `
              radial-gradient(ellipse 95% 60% at 50% 95%, rgba(249, 115, 22, 0.55), transparent 75%),
              radial-gradient(ellipse 80% 50% at 25% 75%, rgba(192, 132, 252, 0.45), transparent 65%),
              linear-gradient(180deg, #f472b6 0%, #fbcfe8 35%, #f1f5f9 100%)
            `
          };

        case 'PARTLY_CLOUDY_DAY':
        case 'PARTLY_CLOUDY_NIGHT':
          return {
            background: `
              radial-gradient(ellipse 90% 60% at 75% 15%, rgba(56, 189, 248, 0.48), transparent 70%),
              radial-gradient(ellipse 85% 55% at 25% 40%, rgba(203, 213, 225, 0.6), transparent 65%),
              radial-gradient(ellipse 100% 70% at 50% 30%, rgba(224, 242, 254, 0.75), transparent 75%),
              linear-gradient(180deg, #c7d2fe 0%, #e0f2fe 40%, #f0f9ff 100%)
            `
          };

        case 'CLOUDY':
          return {
            background: `
              radial-gradient(ellipse 100% 70% at 50% 10%, rgba(186, 230, 253, 0.5), transparent 75%),
              radial-gradient(ellipse 90% 65% at 80% 35%, rgba(203, 213, 225, 0.75), transparent 70%),
              radial-gradient(ellipse 80% 55% at 20% 65%, rgba(148, 163, 184, 0.5), transparent 65%),
              radial-gradient(ellipse 95% 75% at 50% 50%, rgba(241, 245, 249, 0.8), transparent 80%),
              linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 45%, #f1f5f9 100%)
            `
          };

        case 'LIGHT_RAIN':
          return {
            background: `
              radial-gradient(ellipse 90% 60% at 50% 20%, rgba(186, 230, 253, 0.55), transparent 70%),
              radial-gradient(ellipse 80% 55% at 25% 65%, rgba(148, 163, 184, 0.5), transparent 65%),
              linear-gradient(180deg, #bfdbfe 0%, #dbeafe 50%, #eff6ff 100%)
            `
          };

        case 'HEAVY_RAIN':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 15%, rgba(15, 23, 42, 0.82), transparent 75%),
              radial-gradient(ellipse 85% 55% at 25% 60%, rgba(14, 116, 144, 0.4), transparent 65%),
              linear-gradient(180deg, #334155 0%, #64748b 50%, #94a3b8 100%)
            `
          };

        case 'DUST':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 35%, rgba(245, 158, 11, 0.45), transparent 75%),
              radial-gradient(ellipse 85% 55% at 85% 75%, rgba(217, 119, 6, 0.4), transparent 65%),
              linear-gradient(180deg, #d97706 0%, #f59e0b 35%, #fef3c7 100%)
            `
          };

        case 'FLOOD':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 15%, rgba(30, 41, 59, 0.85), transparent 75%),
              radial-gradient(ellipse 90% 55% at 50% 90%, rgba(8, 145, 178, 0.45), transparent 65%),
              linear-gradient(180deg, #475569 0%, #64748b 45%, #0e7490 100%)
            `
          };

        case 'CYCLONE':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 15%, rgba(15, 23, 42, 0.9), transparent 75%),
              radial-gradient(ellipse 85% 55% at 75% 45%, rgba(30, 58, 138, 0.4), transparent 65%),
              linear-gradient(180deg, #1e293b 0%, #334155 50%, #64748b 100%)
            `
          };

        case 'THUNDERSTORM':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 20%, rgba(129, 140, 248, 0.4), transparent 70%),
              radial-gradient(ellipse 85% 55% at 80% 40%, rgba(71, 85, 105, 0.55), transparent 65%),
              linear-gradient(180deg, #94a3b8 0%, #cbd5e1 50%, #e2e8f0 100%)
            `
          };

        case 'FOG':
          return {
            background: `
              radial-gradient(ellipse 100% 70% at 50% 45%, rgba(203, 213, 225, 0.75), transparent 75%),
              linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 50%, #f8fafc 100%)
            `
          };

        case 'HEAT':
          return {
            background: `
              radial-gradient(ellipse 95% 65% at 50% 10%, rgba(239, 68, 68, 0.45), transparent 75%),
              radial-gradient(ellipse 90% 55% at 50% 90%, rgba(245, 158, 11, 0.5), transparent 65%),
              linear-gradient(180deg, #f97316 0%, #fb923c 35%, #fef08a 100%)
            `
          };

        default:
          return {
            background: `
              radial-gradient(ellipse 90% 60% at 50% 15%, rgba(56, 189, 248, 0.45), transparent 70%),
              linear-gradient(180deg, #bae6fd 0%, #e0f2fe 40%, #f0f9ff 100%)
            `
          };
      }
    }

    // DARK THEME ATMOSPHERES
    switch (weatherState) {
      case 'DUST':
        return {
          background: `
            radial-gradient(ellipse 90% 55% at 50% 35%, rgba(217, 119, 6, 0.35), transparent 70%),
            radial-gradient(ellipse 80% 50% at 20% 80%, rgba(120, 53, 15, 0.45), transparent 65%),
            #0f0b06
          `
        };

      case 'FLOOD':
        return {
          background: `
            radial-gradient(ellipse 85% 60% at 50% 15%, rgba(15, 23, 42, 0.95), transparent 70%),
            radial-gradient(ellipse 90% 50% at 50% 95%, rgba(6, 182, 212, 0.3), transparent 65%),
            #020617
          `
        };

      case 'CYCLONE':
        return {
          background: `
            radial-gradient(ellipse 85% 60% at 50% 20%, rgba(15, 23, 42, 0.95), transparent 70%),
            radial-gradient(ellipse 75% 45% at 75% 30%, rgba(30, 58, 138, 0.3), transparent 65%),
            #010309
          `
        };

      case 'CLEAR_NIGHT':
        return {
          background: `
            radial-gradient(ellipse 70% 45% at 85% 15%, rgba(30, 58, 138, 0.2), transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(15, 23, 42, 0.5), transparent 70%),
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(14, 116, 144, 0.15), transparent 70%),
            #020617
          `
        };

      case 'CLEAR_DAY':
        return {
          background: `
            radial-gradient(ellipse 85% 55% at 80% 10%, rgba(56, 189, 248, 0.18), transparent 65%),
            radial-gradient(ellipse 70% 45% at 20% 40%, rgba(14, 165, 233, 0.12), transparent 60%),
            radial-gradient(ellipse 90% 50% at 50% 95%, rgba(251, 191, 36, 0.08), transparent 70%),
            #030712
          `
        };

      case 'SUNRISE':
        return {
          background: `
            radial-gradient(ellipse 90% 55% at 50% 95%, rgba(245, 158, 11, 0.22), transparent 75%),
            radial-gradient(ellipse 80% 45% at 75% 70%, rgba(249, 115, 22, 0.14), transparent 65%),
            radial-gradient(ellipse 70% 40% at 30% 20%, rgba(30, 58, 138, 0.24), transparent 70%),
            #020617
          `
        };

      case 'SUNSET':
        return {
          background: `
            radial-gradient(ellipse 90% 55% at 50% 95%, rgba(234, 88, 12, 0.18), transparent 70%),
            radial-gradient(ellipse 75% 45% at 30% 80%, rgba(168, 85, 247, 0.16), transparent 65%),
            radial-gradient(ellipse 80% 40% at 70% 20%, rgba(30, 58, 138, 0.22), transparent 70%),
            #020617
          `
        };

      case 'PARTLY_CLOUDY_DAY':
        return {
          background: `
            radial-gradient(ellipse 80% 50% at 50% 15%, rgba(56, 189, 248, 0.16), transparent 70%),
            radial-gradient(ellipse 65% 40% at 85% 30%, rgba(148, 163, 184, 0.14), transparent 60%),
            #030712
          `
        };

      case 'PARTLY_CLOUDY_NIGHT':
        return {
          background: `
            radial-gradient(ellipse 70% 45% at 80% 20%, rgba(30, 58, 138, 0.18), transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 40%, rgba(51, 65, 85, 0.24), transparent 60%),
            #020617
          `
        };

      case 'CLOUDY':
        return {
          background: `
            radial-gradient(ellipse 85% 55% at 50% 10%, rgba(71, 85, 105, 0.25), transparent 70%),
            radial-gradient(ellipse 70% 40% at 80% 60%, rgba(51, 65, 85, 0.2), transparent 65%),
            #020617
          `
        };

      case 'LIGHT_RAIN':
        return {
          background: `
            radial-gradient(ellipse 80% 50% at 50% 10%, rgba(14, 116, 144, 0.22), transparent 70%),
            radial-gradient(ellipse 70% 45% at 85% 40%, rgba(30, 58, 138, 0.18), transparent 65%),
            #020617
          `
        };

      case 'HEAVY_RAIN':
        return {
          background: `
            radial-gradient(ellipse 85% 60% at 50% 15%, rgba(15, 23, 42, 0.75), transparent 70%),
            radial-gradient(ellipse 75% 45% at 30% 50%, rgba(14, 116, 144, 0.26), transparent 65%),
            #010409
          `
        };

      case 'THUNDERSTORM':
        return {
          background: `
            radial-gradient(ellipse 85% 60% at 50% 15%, rgba(15, 23, 42, 0.85), transparent 70%),
            radial-gradient(ellipse 70% 45% at 75% 25%, rgba(67, 56, 202, 0.22), transparent 65%),
            #010307
          `
        };

      case 'FOG':
        return {
          background: `
            radial-gradient(ellipse 95% 65% at 50% 45%, rgba(100, 116, 139, 0.2), transparent 75%),
            radial-gradient(ellipse 80% 50% at 20% 75%, rgba(71, 85, 105, 0.22), transparent 65%),
            #020617
          `
        };

      case 'HEAT':
        return {
          background: `
            radial-gradient(ellipse 90% 50% at 50% 95%, rgba(245, 158, 11, 0.18), transparent 75%),
            radial-gradient(ellipse 75% 40% at 80% 75%, rgba(217, 119, 6, 0.14), transparent 65%),
            radial-gradient(ellipse 70% 40% at 20% 20%, rgba(15, 23, 42, 0.5), transparent 70%),
            #030712
          `
        };

      case 'STRONG_WIND':
        return {
          background: `
            radial-gradient(ellipse 85% 50% at 20% 30%, rgba(56, 189, 248, 0.16), transparent 65%),
            radial-gradient(ellipse 75% 45% at 80% 60%, rgba(148, 163, 184, 0.14), transparent 60%),
            #020617
          `
        };

      case 'SYSTEM_OVERRIDE':
      default:
        return {
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, rgba(225, 29, 72, 0.1), transparent 70%),
            radial-gradient(ellipse 70% 40% at 50% 80%, rgba(15, 23, 42, 0.65), transparent 70%),
            #02040a
          `
        };
    }
  };

  const hasClouds = 
    weatherState === 'PARTLY_CLOUDY_DAY' || 
    weatherState === 'PARTLY_CLOUDY_NIGHT' || 
    weatherState === 'CLOUDY' || 
    weatherState === 'CYCLONE' || 
    weatherState === 'LIGHT_RAIN' || 
    weatherState === 'HEAVY_RAIN' || 
    weatherState === 'THUNDERSTORM' || 
    (condition || '').toLowerCase().includes('cloud') || 
    (condition || '').toLowerCase().includes('overcast') ||
    (condition || '').toLowerCase().includes('partly') ||
    (condition || '').toLowerCase().includes('gloomy');

  const hasFog = weatherState === 'FOG';

  return (
    <div 
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 select-none"
      style={getAtmosphericGradients()}
    >
      {/* Distant Lightning Flash Ambient Bloom */}
      {lightningFlash && !prefersReducedMotion && (
        <div 
          className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 60% 25%, rgba(199, 210, 254, 0.22), transparent 65%)',
            opacity: 1
          }}
        />
      )}

      {/* Moon Glow for Clear Night */}
      {weatherState === 'CLEAR_NIGHT' && isNight && effectiveTheme === 'dark' && intensity !== 'minimal' && (
        <div 
          className="absolute -top-12 -right-12 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-35 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(224, 242, 254, 0.18) 0%, transparent 70%)',
            animationDuration: '8s'
          }}
        />
      )}

      {/* Sun Bloom for Daytime */}
      {!isNight && intensity !== 'minimal' && (
        <>
          <div 
            className="absolute -top-16 -right-16 w-[540px] h-[540px] rounded-full pointer-events-none blur-3xl opacity-65"
            style={{
              background: effectiveTheme === 'light'
                ? 'radial-gradient(circle, rgba(254, 240, 138, 0.65) 0%, rgba(56, 189, 248, 0.28) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(251, 191, 36, 0.12) 50%, transparent 70%)',
              animation: 'sunCoronaPulse 10s ease-in-out infinite alternate'
            }}
          />
          <div 
            className="absolute -top-28 -right-28 w-[680px] h-[680px] rounded-full pointer-events-none opacity-40 blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(254, 215, 170, 0.45) 0%, rgba(254, 240, 138, 0.2) 45%, transparent 75%)',
              animation: 'sunCoronaPulse 14s ease-in-out infinite alternate-reverse'
            }}
          />
        </>
      )}

      {/* Dynamic Animated Cloud Formations (Visible, Organic & Layered Drifting Across Sky) */}
      {hasClouds && !prefersReducedMotion && intensity !== 'minimal' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Overcast / Dense Cloud Strata for Cloudy Weather */}
          {(weatherState === 'CLOUDY' || (condition || '').toLowerCase().includes('overcast')) && (
            <div 
              className={`absolute -top-12 -left-48 right-0 h-80 rounded-[40%] blur-3xl pointer-events-none ${
                effectiveTheme === 'light' ? 'bg-white/75' : 'bg-slate-700/35'
              }`}
              style={{
                animation: 'cloudDriftSlow 50s ease-in-out infinite alternate',
                willChange: 'transform'
              }}
            />
          )}

          {/* Cloud Formation Layer 1 (Upper sky, large cumulus clusters) */}
          <div 
            className="absolute top-4 -left-[500px] w-[560px] pointer-events-none opacity-90"
            style={{
              animation: 'cloudDriftSlow 70s linear infinite',
              filter: effectiveTheme === 'light' ? 'drop-shadow(0 14px 28px rgba(100, 116, 139, 0.22))' : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))',
              willChange: 'transform'
            }}
          >
            <svg viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path 
                d="M120 180 C80 180 50 150 50 115 C50 85 75 60 105 60 C115 60 125 63 133 68 C148 38 180 20 220 20 C270 20 310 50 320 95 C335 90 350 88 365 88 C405 88 440 115 445 155 C460 155 475 168 475 185 C475 205 455 220 435 220 L130 220 C100 220 70 200 70 180 Z"
                fill={effectiveTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.45)'}
              />
              <path 
                d="M160 160 C130 160 110 140 110 115 C110 95 125 80 145 80 C152 80 160 82 165 85 C175 65 200 50 230 50 C265 50 295 70 302 100 C315 97 325 95 338 95 C370 95 395 115 400 145 C410 145 420 155 420 165 L160 160 Z"
                fill={effectiveTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(51, 65, 85, 0.35)'}
              />
            </svg>
          </div>

          {/* Cloud Formation Layer 2 (Mid sky, drifting at secondary offset) */}
          <div 
            className="absolute top-28 -left-[600px] w-[660px] pointer-events-none opacity-85"
            style={{
              animation: 'cloudDriftMedium 95s linear infinite',
              animationDelay: '-35s',
              filter: effectiveTheme === 'light' ? 'drop-shadow(0 16px 32px rgba(100, 116, 139, 0.2))' : 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45))',
              willChange: 'transform'
            }}
          >
            <svg viewBox="0 0 700 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path 
                d="M100 200 C60 200 30 170 30 130 C30 95 60 65 95 65 C108 65 120 70 130 78 C150 42 190 20 240 20 C300 20 350 55 365 110 C382 104 400 100 420 100 C470 100 512 135 520 180 C540 180 558 195 558 215 C558 238 535 255 510 255 L110 255 C80 255 50 230 50 200 Z"
                fill={effectiveTheme === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(30, 41, 59, 0.38)'}
              />
            </svg>
          </div>

          {/* Cloud Formation Layer 3 (Lower sky, soft rolling cumulus) */}
          <div 
            className="absolute top-60 -left-[700px] w-[720px] pointer-events-none opacity-80"
            style={{
              animation: 'cloudDriftSlow 130s linear infinite',
              animationDelay: '-75s',
              filter: effectiveTheme === 'light' ? 'drop-shadow(0 12px 24px rgba(148, 163, 184, 0.2))' : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))',
              willChange: 'transform'
            }}
          >
            <svg viewBox="0 0 750 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path 
                d="M140 180 C100 180 70 150 70 120 C70 90 95 68 125 68 C135 68 145 71 153 76 C170 45 205 25 250 25 C305 25 350 60 362 110 C378 105 395 100 415 100 C465 100 505 130 515 175 C530 175 545 188 545 205 C545 225 525 240 505 240 L150 240 Z"
                fill={effectiveTheme === 'light' ? 'rgba(248, 250, 252, 0.92)' : 'rgba(51, 65, 85, 0.3)'}
              />
            </svg>
          </div>

          {/* Soft ambient drifting puffs for realistic depth */}
          <div 
            className={`absolute top-10 -left-64 w-[620px] h-48 rounded-full blur-2xl ${
              effectiveTheme === 'light' ? 'bg-white/80' : 'bg-slate-700/25'
            }`}
            style={{ animation: 'cloudDriftSlow 65s linear infinite', willChange: 'transform' }}
          />
          <div 
            className={`absolute top-44 -left-80 w-[740px] h-56 rounded-full blur-3xl ${
              effectiveTheme === 'light' ? 'bg-slate-100/75' : 'bg-slate-800/25'
            }`}
            style={{ animation: 'cloudDriftMedium 90s linear infinite', animationDelay: '-45s', willChange: 'transform' }}
          />
        </div>
      )}

      {/* Fog / Mist */}
      {hasFog && !prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden opacity-45 pointer-events-none">
          <div 
            className={`absolute top-1/4 -left-32 right-0 h-40 rounded-full blur-2xl ${
              theme === 'light' ? 'bg-slate-200/40' : 'bg-slate-500/15'
            }`}
            style={{
              animation: 'fogWave 28s ease-in-out infinite alternate',
              willChange: 'transform'
            }}
          />
          <div 
            className={`absolute top-1/2 -right-32 left-0 h-48 rounded-full blur-3xl ${
              theme === 'light' ? 'bg-slate-300/40' : 'bg-slate-600/15'
            }`}
            style={{
              animation: 'fogWave 38s ease-in-out infinite alternate-reverse',
              willChange: 'transform'
            }}
          />
        </div>
      )}

      {/* Flood Animation in Bottom (Undulating, layered turbulent flood waters surging at the viewport bottom) */}
      {(weatherState === 'FLOOD' || (hazardType || '').toLowerCase().includes('flood')) && !prefersReducedMotion && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0 overflow-hidden select-none h-44 sm:h-56">
          {/* Deep murky water backing */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-blue-950/70 to-transparent" />
          
          {/* Flood Wave 1 - Back surge */}
          <div 
            className="absolute -bottom-2 -left-[100%] w-[300%] h-32 opacity-60 text-cyan-900"
            style={{ animation: 'floodWaveBack 10s ease-in-out infinite alternate' }}
          >
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
              <path d="M0,0 C150,40 350,-20 500,20 C650,60 900,-10 1200,15 L1200,120 L0,120 Z" />
            </svg>
          </div>

          {/* Flood Wave 2 - Mid water surge */}
          <div 
            className="absolute bottom-0 -left-[100%] w-[300%] h-28 opacity-75 text-sky-950"
            style={{ animation: 'floodWaveMid 7s ease-in-out infinite alternate-reverse' }}
          >
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-current">
              <path d="M0,20 C200,-10 400,45 600,10 C800,-25 1000,35 1200,15 L1200,120 L0,120 Z" />
            </svg>
          </div>

          {/* Flood Wave 3 - Front foaming water crest */}
          <div 
            className="absolute bottom-0 -left-[100%] w-[300%] h-20 opacity-80 text-teal-900/80"
            style={{ animation: 'floodWaveFront 5s ease-in-out infinite alternate' }}
          >
            <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full fill-current">
              <path d="M0,15 C180,30 360,-5 540,25 C720,55 900,0 1200,20 L1200,100 L0,100 Z" />
            </svg>
          </div>

          {/* Water reflection & foam line */}
          <div className="absolute bottom-16 sm:bottom-20 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-[1px] animate-pulse" />
        </div>
      )}

      {/* Sand Storm / Dust Storm Animation (Horizontal dust cloud sheets and ochre haze sweeps) */}
      {(weatherState === 'DUST' || (hazardType || '').toLowerCase().includes('sand') || (hazardType || '').toLowerCase().includes('dust')) && !prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Ambient Warm Ochre Sand Haze */}
          <div className="absolute inset-0 bg-amber-950/20 mix-blend-multiply" />

          {/* Sweeping Sand Dust Cloud (Layer 1) */}
          <div 
            className="absolute inset-y-0 -left-[100%] w-[300%] opacity-45 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 30% at 30% 40%, rgba(217, 119, 6, 0.35), transparent 70%), radial-gradient(ellipse 80% 40% at 75% 65%, rgba(180, 83, 9, 0.3), transparent 70%)',
              animation: 'sandHazeSweep 12s linear infinite',
              filter: 'blur(16px)'
            }}
          />

          {/* Sweeping Sand Dust Cloud (Layer 2 - Lower fast gust) */}
          <div 
            className="absolute bottom-10 -left-[100%] w-[300%] h-72 opacity-55 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 85% 45% at 50% 60%, rgba(245, 158, 11, 0.38), transparent 75%)',
              animation: 'sandHazeSweep 8s linear infinite',
              animationDelay: '-4s',
              filter: 'blur(12px)'
            }}
          />
        </div>
      )}

      {/* High Heat Storm & Heat Wave Animation: Intense Blazing Corona & Thermal Shimmer Mirage */}
      {(weatherState === 'HEAT' || (hazardType || '').toLowerCase().includes('heat')) && !prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Scorching Overhead Solar Flare & Blazing Corona */}
          <div 
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-75 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(251, 146, 60, 0.45) 0%, rgba(239, 68, 68, 0.25) 45%, rgba(245, 158, 11, 0.1) 70%, transparent 85%)',
              animation: 'heatCoronaPulse 6s ease-in-out infinite alternate'
            }}
          />

          {/* Rising Thermal Shimmer Waves (Mirage effect across lower/middle viewport) */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 opacity-40 pointer-events-none">
            <div 
              className="w-full h-full"
              style={{
                background: 'linear-gradient(to top, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.06) 50%, transparent 100%)',
                animation: 'heatShimmerWave 4s ease-in-out infinite alternate',
                filter: 'blur(2px)'
              }}
            />
          </div>

          {/* Undulating horizontal heat mirage bands */}
          <div 
            className="absolute inset-x-0 bottom-24 h-32 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 90% 40% at 50% 50%, rgba(251, 191, 36, 0.2), transparent 70%)',
              animation: 'thermalDistortion 5s ease-in-out infinite alternate-reverse'
            }}
          />
        </div>
      )}

      {/* Dark Ominous Storm Clouds with Rain for Heavy Rainfall */}
      {(weatherState === 'HEAVY_RAIN' || weatherState === 'FLOOD') && !prefersReducedMotion && (
        <div 
          className="absolute -top-16 inset-x-0 h-96 opacity-90 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(15, 23, 42, 0.95), transparent 85%), radial-gradient(ellipse 65% 50% at 80% 25%, rgba(30, 41, 59, 0.85), transparent 75%), radial-gradient(ellipse 70% 45% at 20% 30%, rgba(15, 23, 42, 0.9), transparent 70%)',
            animation: 'cloudDriftSlow 45s ease-in-out infinite alternate',
            filter: 'blur(20px)'
          }}
        />
      )}

      {/* HTML5 Particle Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <style>{`
        @keyframes cloudDriftSlow {
          0% {
            transform: translate3d(-10%, 0, 0);
          }
          100% {
            transform: translate3d(180vw, 0, 0);
          }
        }
        @keyframes cloudDriftMedium {
          0% {
            transform: translate3d(-20%, 0, 0);
          }
          100% {
            transform: translate3d(180vw, 0, 0);
          }
        }
        @keyframes fogWave {
          0% {
            transform: translate3d(-3%, 0, 0) scaleY(0.95);
          }
          100% {
            transform: translate3d(4%, 8px, 0) scaleY(1.08);
          }
        }
        @keyframes sunCoronaPulse {
          0% {
            transform: scale(0.95) translate(0, 0);
            opacity: 0.35;
          }
          100% {
            transform: scale(1.08) translate(-10px, 8px);
            opacity: 0.55;
          }
        }
        @keyframes floodWaveBack {
          0% {
            transform: translateX(0) scaleY(0.9);
          }
          100% {
            transform: translateX(33.33%) scaleY(1.15);
          }
        }
        @keyframes floodWaveMid {
          0% {
            transform: translateX(0) scaleY(1.1);
          }
          100% {
            transform: translateX(-33.33%) scaleY(0.85);
          }
        }
        @keyframes floodWaveFront {
          0% {
            transform: translateX(-15%) scaleY(0.95);
          }
          100% {
            transform: translateX(20%) scaleY(1.2);
          }
        }
        @keyframes sandHazeSweep {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(50%);
          }
        }
        @keyframes heatCoronaPulse {
          0% {
            transform: translate(-50%, 0) scale(0.92);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, 15px) scale(1.12);
            opacity: 0.9;
          }
        }
        @keyframes heatShimmerWave {
          0% {
            transform: scaleY(0.96) translateY(0);
          }
          100% {
            transform: scaleY(1.06) translateY(-8px);
          }
        }
        @keyframes thermalDistortion {
          0% {
            transform: scaleX(0.95) translateY(0);
            opacity: 0.2;
          }
          100% {
            transform: scaleX(1.05) translateY(-6px);
            opacity: 0.45;
          }
        }
      `}</style>
    </div>
  );
};
