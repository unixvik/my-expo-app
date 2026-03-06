/** @type {import('tailwindcss').Config} */
module.exports = {
    // Use absolute paths relative to the config file
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}", // Added in case you move files here later
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                claim: {
                    primary: "#FFF", // Your brand violet
                },
            },
        },
    },
    plugins: [],
};