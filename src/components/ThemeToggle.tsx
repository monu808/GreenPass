"use client";

export default function ThemeToggle() {
    const toggle = () => {
        const html = document.documentElement;

        if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
        } else {
        html.classList.add("dark");
        localStorage.setItem("theme", "dark");
        }
    };

    return (
        <button
        onClick={toggle}
        className="px-3 py-2 rounded-md border"
        style={{
            background: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
        }}
        >
        🌙 / ☀️
        </button>
    );
}
