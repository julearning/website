"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  from?: "bottom" | "left" | "right" | "none";
}

export function RevealSection({
  children,
  className = "",
  delay = 0,
  from = "bottom",
  ...rest
}: RevealSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const direction =
      from === "none"
        ? { y: 0 }
        : from === "left"
          ? { x: -30 }
          : from === "right"
            ? { x: 30 }
            : { y: 30 };

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, ...direction },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [delay, from]);

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{ opacity: 0 }}
      {...rest}
    >
      {children}
    </div>
  );
}
