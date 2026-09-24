export const FONT_OPTIONS = [
    { value: 'default', label: 'Theme Default' },
    {
        category: 'Sans-Serif',
        options: [
            { value: "'Inter', system-ui, -apple-system, sans-serif", label: 'Inter (Modern Sans)' },
            { value: "'Roboto', sans-serif", label: 'Roboto' },
            { value: "'Open Sans', sans-serif", label: 'Open Sans' },
            { value: "Arial, Helvetica, sans-serif", label: 'Arial / Helvetica' },
            { value: "'Segoe UI', system-ui, sans-serif", label: 'Segoe UI (System)' }
        ]
    },
    {
        category: 'Serif (Publication & Medical)',
        options: [
            { value: "'Times New Roman', Times, serif", label: 'Times New Roman (Academic)' },
            { value: "Georgia, serif", label: 'Georgia' },
            { value: "'EB Garamond', Garamond, serif", label: 'EB Garamond' },
            { value: "'Playfair Display', serif", label: 'Playfair Display' },
            { value: "'Merriweather', serif", label: 'Merriweather' }
        ]
    },
    {
        category: 'Monospace',
        options: [
            { value: "'Courier New', Courier, monospace", label: 'Courier New' },
            { value: "'JetBrains Mono', Consolas, monospace", label: 'JetBrains Mono' }
        ]
    }
];

export const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:wght@400;500;700&display=swap';
