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

import { useCallback } from "react"
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={`${showAsLabel ? 'default' : 'icon'}`} className={`${shrink ? 'scale-90' : ''}`}>
                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
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