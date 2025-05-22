"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Interface for emoji objects
interface EmojiItem {
  id: number
  emoji: string
  x: number
  size: number
  rotation: number
  duration: number
}

interface EmojiAttachmentProps {
  emoji: string | null
  count?: number
}

export function EmojiAttachment({ emoji, count = 15 }: EmojiAttachmentProps) {
  const [emojis, setEmojis] = useState<EmojiItem[]>([])

  // Generate new emojis when emoji prop changes
  useEffect(() => {
    if (emoji) {
      const newEmojis = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        emoji: emoji,
        x: Math.random() * 100 - 40, // Random horizontal position (-50 to 50)
        size: Math.random() * 0.7 + 0.75, // Random size (0.8 to 1.5)
        rotation: Math.random() * 60 - 30, // Random rotation (-30 to 30 degrees)
        duration: Math.random() * 1.5 + 1.5, // Random duration (1 to 2.5 seconds)
      }))

      setEmojis((prev) => [...prev, ...newEmojis])

      // Clean up emojis after they've animated
      const timer = setTimeout(() => {
        setEmojis((prev) => prev.filter((emoji) => emoji.id !== newEmojis[0].id))
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [emoji, count])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {emojis.map((item) => (
          <motion.div
            key={item.id}
            className="absolute left-1/2 bottom-1/6 transform -translate-x-1/2"
            initial={{
              y: 0,
              x: item.x,
              opacity: 0,
              scale: 0,
              rotate: item.rotation,
            }}
            animate={{
              y: -500,
              x: item.x + (Math.random() * 100 - 50),
              opacity: [0, 1, 1, 0],
              scale: item.size,
              rotate: item.rotation + (Math.random() * 60 - 30),
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: item.duration,
              ease: "easeOut",
            }}
            style={{ fontSize: `${item.size * 2}rem` }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
