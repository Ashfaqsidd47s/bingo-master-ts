import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Card {
  id: number
  title: string
  color: string
}

export default function SlidingCards() {
  // Initial cards data
  const initialCards: Card[] = [
    { id: 1, title: "Card One", color: "bg-rose-500" },
    { id: 2, title: "Card Two", color: "bg-blue-500" },
    { id: 3, title: "Card Three", color: "bg-amber-500" },
  ]

  const [cards, setCards] = useState<Card[]>(initialCards)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeIndex, setActiveIndex] = useState(1) // Middle card is active initially
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Function to rotate cards
  const rotateCards = () => {
    setCards((prevCards) => {
      const newCards = [...prevCards]
      // Move the first card to the end
      const firstCard = newCards.shift()
      if (firstCard) newCards.push(firstCard)
      return newCards
    })
  }

  // Set up the infinite animation
  useEffect(() => {
    const startRotation = () => {
      timeoutRef.current = setTimeout(() => {
        rotateCards()
        startRotation()
      }, 2000) // Rotate every 3 seconds
    }

    startRotation()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full min-w-[300px] overflow-hidden py-16">
      <div className="relative flex justify-center items-center h-80">
        <AnimatePresence initial={false}>
          {cards.map((card, index) => {
            // Determine if this card is active (in the center)
            const isActive = index === activeIndex

            // Calculate position and size based on index
            let xPosition = 0
            if (index < activeIndex) xPosition = -140
            if (index > activeIndex) xPosition = 140

            return (
              <motion.div
                key={card.id}
                className={`absolute rounded-xl shadow-lg ${card.color} text-white p-6 flex items-center justify-center`}
                initial={{
                  x: 140,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  x: xPosition,
                  scale: isActive ? 1 : 0.8,
                  opacity: 1,
                  zIndex: isActive ? 10 : 0,
                }}
                exit={{
                  x: -140,
                  scale: 0.8,
                  opacity: 0,
                }}
                transition={{
                  x: { type: "spring", stiffness: 200, damping: 30 },
                  scale: { duration: 0.4 },
                  opacity: { duration: 0.3 },
                }}
                style={{
                  width: isActive ? 200 : 140,
                  height: isActive ? 300 : 200,
                }}
              >
                <h2
                  className={`text-2xl font-bold transition-all duration-300 ${isActive ? "scale-110" : "scale-100"}`}
                >
                  {card.title}
                </h2>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
