import React, { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 40 }}
          transition={{ duration: 0.25 }}
          whileHover={{
            scale: 1.12,
            rotate: 6,
          }}
          whileTap={{
            scale: 0.92,
          }}
          onClick={scrollTop}
          className="
fixed
bottom-6
right-6
z-[999]
w-14
h-14
rounded-full
bg-gradient-to-r
from-[#CA3433]
to-[#E63946]
text-white
shadow-xl
hover:shadow-[0_0_25px_rgba(202,52,51,0.45)]
hover:-translate-y-1
transition-all
duration-300
flex
items-center
justify-center
"
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};