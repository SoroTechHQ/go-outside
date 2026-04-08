import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      borderRadius: {
        card: "20px",
        "card-lg": "32px",
        panel: "16px",
      },
    },
  },
};

export default config;
