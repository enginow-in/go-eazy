import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFluidZLS } from '../../hooks/useFluidZLS';
import { cn } from '../../utils/helpers';

/**
 * A highly-polished wrapper around img tags that uses Framer Motion 
 * to provide a cinematic, spring-physics crossfade from Skeleton to HD Image.
 * Zero Layout Shift (ZLS) guaranteed.
 */
export const FluidImage = ({ src, alt, className, skeletonClassName }) => {
  const { isLoaded, hasError } = useFluidZLS(src);

  // Physics configuration matching Apple-tier spring transitions
  const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1
  };

  return (
    <div className={cn('relative overflow-hidden w-full h-full', className)}>
      <AnimatePresence mode="wait">
        {!isLoaded && !hasError ? (
          // Skeleton Phase
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={springTransition}
            className={cn('skeleton absolute inset-0 w-full h-full', skeletonClassName)}
          />
        ) : (
          // HD Image Phase
          <motion.img
            key="image"
            src={src}
            alt={alt || "Property Image"}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springTransition}
            className="w-full h-full object-cover"
          />
        )}
      </AnimatePresence>
      
      {/* Fallback if image utterly fails to load */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <span className="text-xs font-semibold uppercase">Image Failed</span>
        </div>
      )}
    </div>
  );
};
