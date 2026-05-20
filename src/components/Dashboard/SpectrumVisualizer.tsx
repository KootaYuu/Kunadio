import { useRef, useEffect } from 'react';
import { useStore } from '../../stores/useStore';

export default function SpectrumVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { player, ui } = useStore();
  const frequencyData = ui.frequencyData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const bars = 64;
    const barWidth = canvas.width / bars;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.05;

      if (!player.isPlaying || !frequencyData) {
        // Idle animation
        for (let i = 0; i < bars; i++) {
          const x = i * barWidth;
          const normalizedHeight = Math.sin(i * 0.2 + time) * 0.3 + 0.1;
          const height = normalizedHeight * canvas.height * 0.5;
          const y = canvas.height / 2 - height / 2;

          const gradient = ctx.createLinearGradient(x, y, x, y + height);
          gradient.addColorStop(0, 'rgba(196, 149, 106, 0.1)');
          gradient.addColorStop(1, 'rgba(196, 149, 106, 0.05)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, height);
        }
      } else {
        // Real frequency data visualization
        const dataLength = frequencyData.length;
        const step = Math.floor(dataLength / bars);

        for (let i = 0; i < bars; i++) {
          const x = i * barWidth;
          const dataIndex = Math.min(i * step, dataLength - 1);
          const value = frequencyData[dataIndex] || 0;
          const normalizedHeight = value / 255;
          const height = normalizedHeight * canvas.height * 0.9;
          const y = canvas.height - height;

          const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
          gradient.addColorStop(0, '#e8b86d');
          gradient.addColorStop(0.5, '#c4956a');
          gradient.addColorStop(1, 'rgba(196, 149, 106, 0.1)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, height);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [player.isPlaying, frequencyData]);

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full max-w-3xl opacity-85"
      style={{ width: '100%', height: '112px' }}
    />
  );
}
