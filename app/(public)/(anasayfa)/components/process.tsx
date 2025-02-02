import React from "react";

import { processes } from "../constants";

const Process = () => {
  return (
    <div>
      <p className="font-heading text-4xl font-bold text-center text-white my-20">
        Hisse Alım Sürecimiz
      </p>

      {/* Grid Düzeni */}
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-x-24 gap-y-16 justify-items-center pb-20">
        {processes.map((item) => (
          <div
            key={item.number}
            className="flex flex-col w-80 items-center gap-4 text-center" // Textler ortalanıyor
          >
            {/* Numaralandırma */}
            <p className="flex items-center justify-center rounded-sm bg-tertiary text-primary w-20 h-20 font-heading text-4xl font-semibold">
              {item.number}
            </p>
            <p className="font-heading text-2xl font-bold text-white">
              {item.header}
            </p>
            <p className="text-white ">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Process;
