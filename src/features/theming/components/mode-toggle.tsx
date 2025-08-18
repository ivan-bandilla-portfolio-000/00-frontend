import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/features/theming/components/theme-provider"

import { useCallback, useEffect, useState } from "react"
import { createAnimation } from "@/components/ui/theme-animations"

export function ModeToggle({ showAsLabel = false, shrink = false }: { showAsLabel?: boolean; shrink?: boolean }) {
    const { theme, setTheme } = useTheme()

    const applyAnimationCss = useCallback((css: string) => {
        const id = "theme-transition-styles"
        let styleEl = document.getElementById(id) as HTMLStyleElement | null
        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = id
            document.head.appendChild(styleEl)
        }
        styleEl.textContent = css
    }, [])

    const runWithAnimation = useCallback((target: "light" | "dark" | "system") => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            setTheme(target)
            return
        }

        const root = document.documentElement
        const currentApplied: "light" | "dark" = root.classList.contains("dark") ? "dark" : "light"
        const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        const nextApplied: "light" | "dark" = target === "system" ? (systemPrefersDark ? "dark" : "light") : target

        if (currentApplied === nextApplied) {
            setTheme(target)
            return
        }

        const { css } = createAnimation("circle-blur", "top-right")
        applyAnimationCss(css)

        const switchTheme = () => setTheme(target)

        const startVT = (document as any).startViewTransition?.bind(document)
        if (startVT) {
            startVT(switchTheme)
        } else {
            switchTheme()
        }
    }, [setTheme, applyAnimationCss])

    const [appliedTheme, setAppliedTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return theme === "dark" ? "dark" : "light"
        if (theme === "system") {
            return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"
        }
        return theme === "dark" ? "dark" : "light"
    })

    useEffect(() => {
        if (theme === "system") {
            const m = window.matchMedia("(prefers-color-scheme: dark)")
            const handler = (e: MediaQueryListEvent | MediaQueryList) => setAppliedTheme(Boolean((e as any).matches) ? "dark" : "light")
            // set initial
            setAppliedTheme(m.matches ? "dark" : "light")
            // listen for changes
            if (typeof m.addEventListener === "function") {
                m.addEventListener("change", handler as EventListener)
                return () => m.removeEventListener("change", handler as EventListener)
            } else {
                m.addListener(handler as any)
                return () => m.removeListener(handler as any)
            }
        } else {
            setAppliedTheme(theme === "dark" ? "dark" : "light")
        }
    }, [theme])


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={`${showAsLabel ? 'default' : 'icon'}`} className={`${shrink ? 'scale-90' : ''}`}>
                    {appliedTheme === "light" ? <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" /> : null}
                    {appliedTheme === 'dark' ? <Moon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" /> : null}
                    <span className={`${showAsLabel ? '' : 'sr-only'}`}>Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" >
                <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(v) => runWithAnimation(v as "light" | "dark" | "system")}
                >
                    <DropdownMenuRadioItem value="light" className="text-md flex items-center gap-2">
                        Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="text-md flex items-center gap-2">
                        Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="text-md flex items-center gap-2">
                        System
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}