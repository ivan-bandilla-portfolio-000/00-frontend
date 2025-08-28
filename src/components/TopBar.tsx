import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    lazy,
    Suspense,
    memo,
    type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { styles } from '@/styles/js/styles';
import { motion } from 'motion/react';
import { useIsMobile } from '@/hooks/useIsMobile';
import personalInfo from '@/constants/personalInfo';
import navLinks, { type NavLink } from '@/constants/topbarNavlinks';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { useIdInViewport } from '@/hooks/useIdInViewport';
import HeaderMobile, { type ReusableNavItem } from '@/components/mvpblocks/header-mobile';

const IconLink = lazy(() => import('./ui/custom/IconLink'));
const LazyModeToggle = lazy(() =>
    import('@/features/theming/components/mode-toggle').then(m => ({ default: m.ModeToggle })),
);

/* -------------------------------------------------
 * Configuration constants
 * ------------------------------------------------- */
const SHRINK_ANIMATION_DURATION_SECONDS = 0.3;

/* -------------------------------------------------
 * Class name tokens (kept here to reduce JSX clutter)
 * ------------------------------------------------- */
const desktopWrapperClasses = `
    ${styles.paddingX}
    w-svw flex justify-between items-center fixed top-0 z-20
    feather-shadow bg-clip-padding backdrop-filter backdrop-blur-sm
    dark:bg-background text-primary-dark dark:text-primary
`;

const nameRevealContainerClasses = `
    items-center relative
    dark:before:content-[''] dark:before:absolute
    dark:before:left-1/2 dark:before:top-1/2
    dark:before:w-[300%] dark:before:h-[210%]
    dark:before:-translate-x-1/2 dark:before:-translate-y-1/2
    dark:before:rounded-full dark:before:pointer-events-none
    dark:before:bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_rgba(34,197,94,0.10)_60%,_rgba(34,197,94,0)_100%)]
    dark:before:opacity-90
`;

const navMenuLinkBaseClasses = `
    text-md font-medium ps-6 pe-5 group/link-icon relative
    hover:underline transition-all
    dark:text-green-400
    dark:before:content-[''] dark:before:absolute
    dark:before:left-1/2 dark:before:top-1/2
    dark:before:w-[120%] dark:before:h-[110%]
    dark:before:-translate-x-1/2 dark:before:-translate-y-1/2
    dark:before:rounded-full dark:before:pointer-events-none
    dark:before:bg-[radial-gradient(circle,_rgba(34,197,94,0.28)_0%,_rgba(34,197,94,0.10)_60%,_rgba(34,197,94,0)_100%)]
    dark:before:opacity-50 dark:hover:before:opacity-100
`;

/* -------------------------------------------------
 * Utility helpers (kept local; tiny enough not to split file)
 * ------------------------------------------------- */

/**
 * Build the href for a nav link.
 * Anchor links differ depending on whether we are already on the base URL.
 */
const buildHref = (navigationLink: NavLink, currentPathname: string): string => {
    if (navigationLink.type === 'anchor') {
        return navigationLink.baseUrl === currentPathname
            ? `#${navigationLink.id}`
            : `${navigationLink.baseUrl}#${navigationLink.id}`;
    }
    return navigationLink.url ?? '#';
};

/**
 * Returns a semantic type for the icon logic (anchor pointing to current page vs internal route).
 */
const resolveIconType = (
    navigationLink: NavLink,
    currentPathname: string,
): 'anchor' | 'internal' | 'external' =>
    navigationLink.type === 'anchor'
        ? navigationLink.baseUrl === currentPathname
            ? 'anchor'
            : 'internal'
        : navigationLink.type;

/**
 * Smooth-scroll to anchor inside the same page (no full navigation).
 */
const scrollToAnchorOnSamePage = (anchorId: string | undefined) => {
    if (!anchorId) return;
    const targetElement = document.getElementById(anchorId);
    if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(null, '', `#${anchorId}`);
};

/**
 * Centralized navigation click handler (desktop + mobile).
 * Keeping logic identical avoids drift and subtle inconsistencies.
 */
const handleNavigation = (
    event: React.MouseEvent,
    navigationLink: NavLink,
    currentPathname: string,
    navigate: (to: string) => void,
    setActive: (id: string) => void,
): void => {
    event.preventDefault();

    if (navigationLink.type === 'anchor') {
        if (navigationLink.baseUrl === currentPathname) {
            scrollToAnchorOnSamePage(navigationLink.id);
        } else {
            navigate(`${navigationLink.baseUrl}#${navigationLink.id}`);
        }
        setActive(navigationLink.id ?? '');
        return;
    }

    if (navigationLink.type === 'internal') {
        navigate(navigationLink.url);
        setActive(navigationLink.id ?? navigationLink.url);
        return;
    }

    if (navigationLink.type === 'external') {
        window.location.href = navigationLink.url;
    }
};

/* -------------------------------------------------
 * NavArea (desktop navigation list)
 * ------------------------------------------------- */
interface NavAreaProps {
    activeId: string | undefined;
    setActiveId: (id: string) => void;
    isShrunk: boolean;
    isHeroInViewport: boolean;
    className?: string;
}

const NavArea: React.FC<NavAreaProps> = memo(
    ({ activeId, setActiveId, isShrunk, isHeroInViewport, className }) => {
        const location = useLocation();
        const navigate = useNavigate();
        const currentPathname = location.pathname;

        // Hide hero link once hero is scrolled past (per original logic).
        const visibleNavigationLinks = useMemo(
            () => navLinks.filter(nav => !(nav.id === 'hero' && isHeroInViewport)),
            [isHeroInViewport],
        );

        const onNavItemClick = useCallback(
            (event: React.MouseEvent, navigationLink: NavLink) => {
                handleNavigation(event, navigationLink, currentPathname, navigate, setActiveId);
            },
            [currentPathname, navigate, setActiveId],
        );

        return (
            <NavigationMenu className={className ?? ''}>
                <NavigationMenuList className="gap-8">
                    {visibleNavigationLinks.map((navigationLink: NavLink, navigationIndex: number): ReactNode => (
                        <NavigationMenuItem key={navigationLink.id ?? navigationIndex}>
                            <motion.div
                                animate={{ scale: isShrunk ? 0.85 : 1 }}
                                transition={{ duration: SHRINK_ANIMATION_DURATION_SECONDS }}
                                style={{ display: 'inline-block' }}
                            >
                                <NavigationMenuLink
                                    active={activeId === navigationLink.id}
                                    className={navMenuLinkBaseClasses}
                                    href={buildHref(navigationLink, currentPathname)}
                                    onClick={event => onNavItemClick(event, navigationLink)}
                                >
                                    <span className="-translate-x-2">{navigationLink.title}</span>
                                    <Suspense fallback={null}>
                                        <IconLink type={resolveIconType(navigationLink, currentPathname)} />
                                    </Suspense>
                                </NavigationMenuLink>
                            </motion.div>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        );
    },
);
NavArea.displayName = 'NavArea';

/* -------------------------------------------------
 * TopBar root component
 * ------------------------------------------------- */
const TopBar = () => {
    const [isShrunk, setIsShrunk] = useState(false);
    const [activeId, setActiveId] = useState(navLinks[0].id);
    const [heroHasBeenVisibleOnce, setHeroHasBeenVisibleOnce] = useState(false);

    const isMobile = useIsMobile();
    const isHeroInViewport = useIdInViewport('hero');

    const location = useLocation();
    const navigate = useNavigate();
    const currentPathname = location.pathname;

    // Heights + font sizes adapt to mobile and shrink.
    const defaultBarHeight = isMobile === undefined ? 64 : isMobile ? 48 : 64;
    const shrunkBarHeight = isMobile === undefined ? 48 : isMobile ? 40 : 48;
    const defaultTitleFontSize = '1.5rem';
    const shrunkTitleFontSize = '1.1rem';
    const animatedFontSize =
        isMobile === undefined ? defaultTitleFontSize : isShrunk ? shrunkTitleFontSize : defaultTitleFontSize;

    // Track scroll to toggle shrink state.
    useEffect(() => {
        const onScroll = () => setIsShrunk(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Remember that hero was once on screen: used to fade in name after leaving hero.
    useEffect(() => {
        if (isHeroInViewport && !heroHasBeenVisibleOnce) setHeroHasBeenVisibleOnce(true);
    }, [isHeroInViewport, heroHasBeenVisibleOnce]);

    // Shared click handler for mobile list (reuses the same navigation logic).
    const onMobileNavClick = useCallback(
        (event: React.MouseEvent, navItem: ReusableNavItem) => {
            // navItem is extended from NavLink so we cast.
            const extended = navItem as unknown as NavLink;
            handleNavigation(event, extended, currentPathname, navigate, setActiveId);
        },
        [currentPathname, navigate],
    );

    // Derived mobile nav items.
    const mobileNavItems: ReusableNavItem[] = useMemo(
        () =>
            navLinks.map(navigationLink => ({
                name: navigationLink.title,
                href: buildHref(navigationLink, currentPathname),
                url: navigationLink.type !== 'anchor' ? navigationLink.url : undefined,
                id: navigationLink.id,
                type: navigationLink.type,
                baseUrl: navigationLink.type === 'anchor' ? navigationLink.baseUrl : undefined,
            })),
        [currentPathname],
    );

    /* -------------------------------------------------
     * Mobile branch renders alternate component early
     * ------------------------------------------------- */
    if (isMobile) {
        return (
            <HeaderMobile
                brand={{ name: personalInfo.name }}
                navItems={mobileNavItems}
                onNavClick={onMobileNavClick}
                includeDarkModeToggle
                darkModeToggleProps={{ showAsLabel: true }}
                showSearch={false}
                showAuthButtons={false}
                fixed
            />
        );
    }

    /* -------------------------------------------------
     * Desktop render
     * ------------------------------------------------- */
    return (
        <motion.div
            className={desktopWrapperClasses}
            animate={{ height: isShrunk ? shrunkBarHeight : defaultBarHeight }}
            transition={{ duration: SHRINK_ANIMATION_DURATION_SECONDS }}
            style={{ height: isShrunk ? shrunkBarHeight : defaultBarHeight }}
        >
            {/* Left section: Name appears after hero leaves viewport to save visual focus */}
            <div className={nameRevealContainerClasses}>
                <motion.div
                    animate={{ fontSize: animatedFontSize }}
                    transition={{ duration: SHRINK_ANIMATION_DURATION_SECONDS }}
                    style={{ fontWeight: 'bold', fontSize: animatedFontSize }}
                    className="relative"
                >
                    <span
                        className={`nunito-text font-black transition-opacity duration-500 ${heroHasBeenVisibleOnce && !isHeroInViewport ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        {heroHasBeenVisibleOnce && !isHeroInViewport && personalInfo.name}
                    </span>
                </motion.div>
            </div>

            {/* Center navigation */}
            <NavArea
                activeId={activeId}
                setActiveId={setActiveId}
                isShrunk={isShrunk}
                isHeroInViewport={isHeroInViewport}
            />

            {/* Right side: theme toggle (prefetched on hover for snappier UX) */}
            <div
                className="w-auto"
                onMouseEnter={() => {
                    // Prefetch chunk to minimize flicker on first open.
                    void import('@/features/theming/components/mode-toggle');
                }}
            >
                <Suspense
                    fallback={
                        <div
                            aria-hidden
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/30 animate-pulse"
                        />
                    }
                >
                    <LazyModeToggle showAsLabel={false} shrink={isShrunk} />
                </Suspense>
            </div>
        </motion.div>
    );
};

export default TopBar;