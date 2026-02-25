import confetti from 'canvas-confetti';

export function fireLevelUpConfetti() {
  // Big celebratory burst from both sides
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#7c3aed', '#2563eb'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#7c3aed', '#2563eb'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  // Center starburst
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.5 },
    colors: ['#fbbf24', '#7c3aed', '#2563eb', '#10b981'],
  });
}

export function fireBadgeConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#a855f7', '#6366f1', '#ec4899', '#fbbf24'],
    shapes: ['star', 'circle'],
    scalar: 1.2,
  });
}
