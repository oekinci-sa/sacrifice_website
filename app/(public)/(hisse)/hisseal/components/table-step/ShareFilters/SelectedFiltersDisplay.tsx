import { AnimatePresence, motion } from "framer-motion";

export const SelectedFiltersDisplay = ({
  selectedValues,
  options,
  type,
}: {
  selectedValues: Set<string>;
  options: { label: string; value: string }[];
  type: "price" | "share";
}) => {
  if (selectedValues.size === 0) return null;

  const sortedValues = Array.from(selectedValues).sort((a, b) => {
    return parseFloat(a) - parseFloat(b);
  });

  if (type === "price") {
    if (selectedValues.size <= 3) {
      return (
        <div className="hidden md:flex gap-1 ml-2">
          <AnimatePresence>
            {sortedValues.map((value, index) => {
              const option = options.find((opt) => opt.value === value);
              return option ? (
                <motion.span
                  key={value}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-muted text-xs px-2 py-0.5"
                >
                  {option.label}
                </motion.span>
              ) : null;
            })}
          </AnimatePresence>
        </div>
      );
    }
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="hidden md:inline ml-2 bg-muted text-xs px-2 py-0.5"
      >
        {selectedValues.size} seçili
      </motion.span>
    );
  }

  return (
    <div className="hidden md:flex gap-1 ml-2">
      <AnimatePresence>
        {sortedValues.length > 0 && (
          <motion.span
            key="share-filter"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="bg-muted text-xs px-2 py-0.5"
          >
            {(() => {
              const value = sortedValues[0];
              const option = options.find((opt) => opt.value === value);
              return option ? option.label : value;
            })()}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
