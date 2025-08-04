import { ReactNode } from "react";

interface CardGlassProps {
  children: ReactNode;
  className?: string;
}

const CardGlass = ({ children, className = "" }: CardGlassProps) => {
  return (
    <div
      className={`backdrop-blur-md bg-white/5 border border-white/20 shadow-lg rounded-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
};

export default CardGlass;
