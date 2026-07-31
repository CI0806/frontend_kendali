import { motion } from "framer-motion";

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} // Mulai dari transparan dan sedikit di bawah
      animate={{ opacity: 1, y: 0 }}  // Masuk ke posisi normal
      exit={{ opacity: 0, y: -15 }}   // Keluar ke atas saat pindah menu
      transition={{ duration: 0.4, ease: "easeOut" }} // Durasi halus
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;