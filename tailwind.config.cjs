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
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                    light: "var(--primary) / 0.1",
                    "dark-light": "var(--primary) / 0.15",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                    light: "var(--secondary) / 0.1",
                    "dark-light": "var(--secondary) / 0.15",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                success: {
                    DEFAULT: "var(--primary)", // Mapping success to primary for Emerald consistency
                    light: "var(--primary) / 0.1",
                    "dark-light": "var(--primary) / 0.15",
                },
                danger: {
                    DEFAULT: "var(--destructive)",
                    light: "var(--destructive) / 0.1",
                    "dark-light": "var(--destructive) / 0.15",
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
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
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
