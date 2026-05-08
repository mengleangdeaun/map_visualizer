/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./resources/**/*.blade.php", "./resources/**/*.{js,ts,jsx,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "oklch(var(--border) / <alpha-value>)",
                input: "oklch(var(--input) / <alpha-value>)",
                ring: "oklch(var(--ring) / <alpha-value>)",
                background: "oklch(var(--background) / <alpha-value>)",
                foreground: "oklch(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "oklch(var(--primary) / <alpha-value>)",
                    foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
                    light: "oklch(var(--primary) / 0.1)",
                    "dark-light": "oklch(var(--primary) / 0.15)",
                },
                secondary: {
                    DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
                    foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
                    light: "oklch(var(--secondary) / 0.1)",
                    "dark-light": "oklch(var(--secondary) / 0.15)",
                },
                destructive: {
                    DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
                    foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
                },
                success: {
                    DEFAULT: "oklch(var(--primary) / <alpha-value>)", // Mapping success to primary for Emerald consistency
                    light: "oklch(var(--primary) / 0.1)",
                    "dark-light": "oklch(var(--primary) / 0.15)",
                },
                danger: {
                    DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
                    light: "oklch(var(--destructive) / 0.1)",
                    "dark-light": "oklch(var(--destructive) / 0.15)",
                },
                warning: {
                    DEFAULT: "#e2a03f",
                    light: "#fff9ed",
                    "dark-light": "rgba(226,160,63,.15)",
                },
                info: {
                    DEFAULT: "#2196f3",
                    light: "#e7f7ff",
                    "dark-light": "rgba(33,150,243,.15)",
                },
                muted: {
                    DEFAULT: "oklch(var(--muted) / <alpha-value>)",
                    foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "oklch(var(--accent) / <alpha-value>)",
                    foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "oklch(var(--popover) / <alpha-value>)",
                    foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "oklch(var(--card) / <alpha-value>)",
                    foreground: "oklch(var(--card-foreground) / <alpha-value>)",
                },
                sidebar: {
                    DEFAULT: "oklch(var(--sidebar) / <alpha-value>)",
                    foreground: "oklch(var(--sidebar-foreground) / <alpha-value>)",
                    primary: "oklch(var(--sidebar-primary) / <alpha-value>)",
                    "primary-foreground": "oklch(var(--sidebar-primary-foreground) / <alpha-value>)",
                    accent: "oklch(var(--sidebar-accent) / <alpha-value>)",
                    "accent-foreground": "oklch(var(--sidebar-accent-foreground) / <alpha-value>)",
                    border: "oklch(var(--sidebar-border) / <alpha-value>)",
                    ring: "oklch(var(--sidebar-ring) / <alpha-value>)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Nunito", "sans-serif"],
                heading: ["var(--font-heading)", "Nunito", "sans-serif"],
                nunito: ["Nunito", "sans-serif"],
            },
            spacing: {
                4.5: "18px",
            },
            boxShadow: {
                "3xl": "0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-in",
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        "--tw-prose-invert-headings": theme("colors.white.dark"),
                        "--tw-prose-invert-links": theme("colors.white.dark"),
                        h1: {
                            fontSize: "40px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        h2: {
                            fontSize: "32px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        h3: {
                            fontSize: "28px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        h4: {
                            fontSize: "24px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        h5: {
                            fontSize: "20px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        h6: {
                            fontSize: "16px",
                            marginBottom: "0.5rem",
                            marginTop: 0,
                        },
                        p: { marginBottom: "0.5rem" },
                        li: { margin: 0 },
                        img: { margin: 0 },
                    },
                },
            }),
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/forms")({
            strategy: "class",
        }),
        require("@tailwindcss/typography"),
    ],
};
