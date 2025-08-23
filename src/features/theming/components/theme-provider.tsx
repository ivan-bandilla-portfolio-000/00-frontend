import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    resolvedTheme: "dark" | "light"
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            return (localStorage.getItem(storageKey) as Theme) || defaultTheme
        } catch {
            return defaultTheme
        }
    })

    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => {
        if (typeof window === "undefined") return defaultTheme === "dark" ? "dark" : "light"
        const initial = (localStorage.getItem(storageKey) as Theme) || defaultTheme
        if (initial === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        }
        return initial === "dark" ? "dark" : "light"
    })

    useEffect(() => {
        const root = window.document.documentElement
        const apply = (t: Theme) => {
            root.classList.remove("light", "dark")
            if (t === "system") {
                const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                root.classList.add(systemDark ? "dark" : "light")
                setResolvedTheme(systemDark ? "dark" : "light")
            } else {
                root.classList.add(t)
                setResolvedTheme(t)
            }
        }
        apply(theme)
    }, [theme])

    useEffect(() => {
        if (theme !== "system") return
        const mql = window.matchMedia("(prefers-color-scheme: dark)")
        const root = window.document.documentElement
        const handler = () => {
            root.classList.remove("light", "dark")
            root.classList.add(mql.matches ? "dark" : "light")
            setResolvedTheme(mql.matches ? "dark" : "light")
        }

        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", handler)
        } else if (typeof (mql as any).addListener === "function") {
            (mql as any).addListener(handler)
        }

        handler()

        return () => {
            if (typeof mql.removeEventListener === "function") {
                mql.removeEventListener("change", handler)
            } else if (typeof (mql as any).removeListener === "function") {
                (mql as any).removeListener(handler)
            }
        }
    }, [theme])

    const value = {
        theme,
        resolvedTheme,
        setTheme: (t: Theme) => {
            try {
                localStorage.setItem(storageKey, t)
            } catch { }
            setTheme(t)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")
    return context
}