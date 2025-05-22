import confetti from "canvas-confetti"

// Winning confetti animation (your existing code)
export const playWinningAnimation = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    startVelocity: 30,
    decay: 0.95,
    gravity: 0.7,
    shapes: ["square"],
    colors: ["#FFD700", "#FFEC8B", "#FFF8DC", "#FFFACD", "#FFC300"],
    origin: { y: 0.9 },
  })

  setTimeout(() => {
    confetti({
        particleCount: 150,
        spread: 70,
        startVelocity: 30,
        decay: 0.95,
        gravity: 0.7,
        shapes: ["square"],
        colors: ["#FFD700", "#FFEC8B", "#FFF8DC", "#FFFACD", "#FFC300"],
      origin: { y: 0.3, x: 1 }, // Start from right
    })
  }, 500)
  setTimeout(() => {
    confetti({
        particleCount: 150,
        spread: 70,
        startVelocity: 30,
        decay: 0.95,
        gravity: 0.7,
        shapes: ["square"],
        colors: ["#FFD700", "#FFEC8B", "#FFF8DC", "#FFFACD", "#FFC300"],
        origin: { y: 0.3, x: 0 } // Start from right
    })
  }, 250)
}

// Updated Losing confetti animation - quicker and more directly falling
export const playLosingAnimation = () => {
  // Main burst - fast falling particles from the top
  confetti({
    particleCount: 100,
    spread: 40, // Reduced spread for more direct falling
    startVelocity: 10, // Lower initial velocity
    decay: 0.9, // Faster decay
    gravity: 3, // Much higher gravity for very fast falling
    shapes: ["circle"],
    colors: ["#FF0000", "#CC0000", "#990000", "#660000", "#330000"], // Red colors for losing
    origin: { y: -0.1, x: 0.5 }, // Start slightly above the screen
    angle: 180, // Straight down
    scalar: 0.7, // Smaller particles
  })

  // Quick follow-up burst for density
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 35,
      startVelocity: 15,
      decay: 0.9,
      gravity: 2.5,
      shapes: ["circle"],
      colors: ["#FF0000", "#CC0000", "#990000", "#660000", "#330000"],
      origin: { y: -0.1, x: 0.5 },
      angle: 180,
      scalar: 0.6,
    })
  }, 100) // Very short delay

  // Left side burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 20, // Tighter spread
      startVelocity: 15,
      decay: 0.88,
      gravity: 2.8,
      shapes: ["circle"],
      colors: ["#FF0000", "#CC0000", "#990000", "#660000", "#330000"],
      origin: { y: 0.1, x: 0.1 }, // Start from upper left
      angle: 135, // Angle toward center-down
      scalar: 0.5,
    })
  }, 150)

  // Right side burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 20,
      startVelocity: 15,
      decay: 0.88,
      gravity: 2.8,
      shapes: ["circle"],
      colors: ["#FF0000", "#CC0000", "#990000", "#660000", "#330000"],
      origin: { y: 0.1, x: 0.9 }, // Start from upper right
      angle: 45, // Angle toward center-down
      scalar: 0.5,
    })
  }, 150)
}
