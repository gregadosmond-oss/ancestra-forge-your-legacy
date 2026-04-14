import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const StaggerGroup = ({
  children,
  delay = 0.2,
  stagger = 0.18,
  className = "",
}: Props) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: {
        transition: { staggerChildren: stagger, delayChildren: delay },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default StaggerGroup;
