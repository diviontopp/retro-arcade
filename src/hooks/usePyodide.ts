import { useState, useEffect, useRef } from 'react';

declare global {
    interface Window {
        pyodide: any;
        loadPyodide: any;
    }
}

export const usePyodide = () => {
    const [isPyodideReady, setIsPyodideReady] = useState(false);
    const pyodideRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (window.pyodide) {
                if (isMounted) setIsPyodideReady(true);
                return;
            }

            // Wait for script to load
            let attempts = 0;
            while (!window.loadPyodide && attempts < 50) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.loadPyodide) {
                console.error("Pyodide script not loaded");
                return;
            }

            try {
                const pyodide = await window.loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
                });

                await pyodide.loadPackage("micropip");

                if (isMounted) {
                    window.pyodide = pyodide;
                    pyodideRef.current = pyodide;
                    setIsPyodideReady(true);
                    console.log("Pyodide Ready via Hook");
                }
            } catch (err) {
                console.error("Failed to load Pyodide:", err);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    return { isPyodideReady, pyodide: pyodideRef.current };
};
