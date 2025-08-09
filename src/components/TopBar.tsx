import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react'
import { useLocation } from 'react-router';
import { styles } from '@/styles/js/styles'
import { motion } from 'motion/react'
import { useIsMobile } from '@/hooks/useIsMobile'
import personalInfo from '@/constants/personalInfo'
import navLinks from '@/constants/topbarNavlinks'
import type { NavLink } from '@/constants/topbarNavlinks'
import {
    NavigationMenu,
    // NavigationMenuContent,
    // NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    // NavigationMenuTrigger,
    // NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { useIdInViewport } from '@/hooks/useIdInViewport'
const IconLink = lazy(() => import('./ui/custom/IconLink'))
import { ModeToggle } from '@/features/theming/components/mode-toggle';

const shrinkDuration: number = 0.3; // seconds

interface NavAreaProps {
    active: string | undefined;
    setActive: (id: string) => void;
    shrink: boolean;
    className?: string;
    isHeroVisible: boolean;
}

const NavArea: React.FC<NavAreaProps> = memo(({ active, setActive, shrink, className, isHeroVisible }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getHref = useCallback((link: NavLink) => {
        if (link.type === 'anchor') {
            // If already on the correct page, just use #id
            if (link.baseUrl === currentPath) {
                return `#${link.id}`;
            }
            // Otherwise, go to the correct page and anchor
            return `${link.baseUrl}#${link.id}`;
        }
        return link.url ?? "#";
    }, [currentPath]);

    const isAnchorToCurrentPage = (link: NavLink) => {
        // Internal if anchor and baseUrl matches current path
        return link.type === 'anchor'
            ? (link.baseUrl === currentPath ? 'anchor' : 'internal')
            : link.type;
    };

    const links = useMemo(
        () => navLinks.filter(link => !(link.id === 'hero' && isHeroVisible)),
        [isHeroVisible]
    );

    return (
        <NavigationMenu className={className ?? ""}>
            <NavigationMenuList className="gap-8">
                {links.map((link: NavLink, idx: number) => (
                    <NavigationMenuItem key={link.id ?? idx}>
                        <motion.div
                            animate={{ scale: shrink ? 0.85 : 1 }}
                            transition={{ duration: shrinkDuration }}
                            style={{ display: 'inline-block' }}
                        >
                            <NavigationMenuLink
                                active={active === link.id}
                                className={`
    text-md hover:underline font-medium ps-6 pe-5 group/link-icon
    relative
    dark:text-green-400
    dark:before:content-['']
    dark:before:absolute
    dark:before:left-1/2 dark:before:top-1/2
    dark:before:w-[120%] dark:before:h-[110%]
    dark:before:-translate-x-1/2 dark:before:-translate-y-1/2
    dark:before:rounded-full
    dark:before:pointer-events-none
    dark:before:bg-[radial-gradient(circle,_rgba(34,197,94,0.28)_0%,_rgba(34,197,94,0.10)_60%,_rgba(34,197,94,0)_100%)]
    dark:before:opacity-50
    dark:hover:before:opacity-100
    transition-all
`}
                                href={getHref(link)}
                                onClick={() => setActive(link.id ?? "")}
                            >
                                <span className='-translate-x-2'>{link.title}</span>
                                <Suspense fallback={null}>
                                    <IconLink type={isAnchorToCurrentPage(link)} />
                                </Suspense>
                            </NavigationMenuLink>
                        </motion.div>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    )
})

const TopBar = () => {
    const [shrink, setShrink] = useState(false)
    const [active, setActive] = useState(navLinks[0].id)

    const isMobile: boolean | undefined = useIsMobile();
    const isHeroVisible = useIdInViewport('hero');

    const defaultHeight: number | undefined = isMobile === undefined ? 64 : (isMobile ? 48 : 64)
    const shrunkHeight: number | undefined = isMobile === undefined ? 48 : (isMobile ? 40 : 48)
    const defaultFontSize: string = '1.5rem'
    const shrunkFontSize: string = '1.1rem'
    const fontSize: string | undefined = isMobile === undefined
        ? defaultFontSize
        : (shrink ? shrunkFontSize : defaultFontSize)

    useEffect(() => {
        const handleScroll = () => {
            setShrink(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <motion.div
            className={`
        ${styles.paddingX}
        w-svw flex justify-between items-center fixed top-0 z-20
        feather-shadow bg-clip-padding backdrop-filter backdrop-blur-sm
        dark:bg-background
        text-primary-dark
    `}
            animate={{ height: shrink ? shrunkHeight : defaultHeight }}
            transition={{ duration: shrinkDuration }}
            style={{ height: shrink ? shrunkHeight : defaultHeight }}
        >
            <div
                className={`
        items-center
        relative
        dark:before:content-['']
        dark:before:absolute
        dark:before:left-1/2 dark:before:top-1/2
        dark:before:w-[300%] dark:before:h-[210%]
        dark:before:-translate-x-1/2 dark:before:-translate-y-1/2
        dark:before:rounded-full
        dark:before:pointer-events-none
        dark:before:bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_rgba(34,197,94,0.10)_60%,_rgba(34,197,94,0)_100%)]
        dark:before:opacity-90
    `}
            >
                <motion.div
                    animate={{ fontSize: fontSize ?? defaultFontSize }}
                    transition={{ duration: shrinkDuration }}
                    style={{ fontWeight: 'bold', fontSize: fontSize ?? defaultFontSize }}
                    className="relative"
                >
                    <span className='nunito-text font-black'>{!isHeroVisible && personalInfo.name}</span>
                </motion.div>
            </div>

            <NavArea active={active} setActive={setActive} shrink={shrink} isHeroVisible={isHeroVisible} />

            <div className=' w-2'>
                <ModeToggle />
            </div>
        </motion.div>


    )
}

export default TopBar