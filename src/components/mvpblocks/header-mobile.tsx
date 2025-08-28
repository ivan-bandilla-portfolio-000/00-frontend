'use client';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { Menu, X, ArrowRight, Search, SquareArrowDown } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../ui/button';

const LazyModeToggle = lazy(() =>
    import('@/features/theming/components/mode-toggle').then(m => ({ default: m.ModeToggle }))
);

export interface ReusableNavItem {
    name: string;
    href: string;
    url?: string;
    id?: string;
    type?: 'anchor' | 'internal' | 'external';
    baseUrl?: string;
}

interface BrandInfo {
    name: string;
    tagline?: string;
    href?: string;
    icon?: React.ReactNode;
}

interface HeaderProps {
    brand: BrandInfo;
    navItems: ReusableNavItem[];
    onNavClick?: (e: React.MouseEvent, item: ReusableNavItem) => void;
    showSearch?: boolean;
    showAuthButtons?: boolean;
    includeDarkModeToggle?: boolean;
    darkModeToggleProps?: { showAsLabel?: boolean };
    extraDesktopRight?: React.ReactNode;
    className?: string;
    fixed?: boolean;
}

const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, staggerChildren: 0.1 }
    }
};
const itemVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } };
const mobileMenuVariants = {
    closed: { opacity: 0, x: '100%', transition: { duration: 0.3, ease: easeInOut } },
    open: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: easeInOut, staggerChildren: 0.05 }
    }
};
const mobileItemVariants = { closed: { opacity: 0, x: 20 }, open: { opacity: 1, x: 0 } };

const HeaderMobile: React.FC<HeaderProps> = ({
    brand,
    navItems,
    onNavClick,
    showSearch = false,
    showAuthButtons = false,
    includeDarkModeToggle = false,
    darkModeToggleProps,
    extraDesktopRight,
    className = '',
    fixed = true
}) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // PWA install prompt state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        const onBeforeInstall = (e: any) => {
            console.log('beforeinstallprompt received', e);
            e.preventDefault?.();
            setDeferredPrompt(e);
            setCanInstall(true);
        };
        const onAppInstalled = () => {
            console.log('appinstalled event');
            setDeferredPrompt(null);
            setCanInstall(false);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
        window.addEventListener('appinstalled', onAppInstalled);

        // iOS fallback: show an install affordance if not in standalone mode
        const ua = navigator.userAgent || '';
        const isIos = /iphone|ipad|ipod/.test(ua.toLowerCase());
        const isInStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) || false;
        if (isIos && !isInStandalone) setCanInstall(true);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            try {
                await (deferredPrompt as any).prompt();
                await (deferredPrompt as any).userChoice;
            } catch (err) {
                console.error('PWA install prompt error', err);
            } finally {
                setDeferredPrompt(null);
                setCanInstall(false);
            }
        } else {
            // iOS fallback instructions
            alert('To install this app on iOS: tap Share → Add to Home Screen.');
        }
    };


    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const brandContent = (
        <Link to={brand.href ?? '/'} className="flex items-center space-x-3">
            <div className="flex flex-col">
                <span className="nunito-text text-primary-dark text-lg font-bold">{brand.name}</span>
                {brand.tagline && (
                    <span className="text-muted-foreground -mt-1 text-xs">
                        {brand.tagline}
                    </span>
                )}
            </div>
        </Link>
    );

    return (
        <>
            <motion.header
                className={`${fixed ? 'fixed top-0 right-0 left-0 z-50' : ''} transition-all duration-500 ${isScrolled
                    ? 'border-border/50 bg-background/80 border-b shadow-sm backdrop-blur-md'
                    : 'bg-transparent'
                    } ${className}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="mx-auto w-full px-4 sm:px-6">
                    <div className="flex h-14 items-center justify-between">
                        <motion.div
                            className="flex items-center space-x-3"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            {brandContent}
                        </motion.div>

                        <nav className="hidden items-center space-x-1 lg:flex">
                            {navItems.map(item => (
                                <motion.div
                                    key={item.name}
                                    variants={itemVariants}
                                    className="relative"
                                    onMouseEnter={() => setHoveredItem(item.name)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <Link
                                        to={item.href}
                                        onClick={(e) => {
                                            onNavClick?.(e, item);
                                        }}
                                        className="text-foreground/80 hover:text-foreground relative rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200"
                                    >
                                        {hoveredItem === item.name && (
                                            <motion.div
                                                className="bg-muted absolute inset-0 rounded-lg"
                                                layoutId="navbar-hover"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10">{item.name}</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>

                        <motion.div
                            className="hidden items-center space-x-3 lg:flex"
                            variants={itemVariants}
                        >
                            {showSearch && (
                                <motion.button
                                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Search className="h-5 w-5" />
                                </motion.button>
                            )}

                            {includeDarkModeToggle && (
                                <Suspense fallback={<div className="h-8 w-20 animate-pulse rounded bg-muted" />}>
                                    <LazyModeToggle showAsLabel={darkModeToggleProps?.showAsLabel} shrink={false} />
                                </Suspense>
                            )}

                            {showAuthButtons && (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-foreground/80 hover:text-foreground px-4 py-2 text-sm font-medium transition-colors duration-200"
                                    >
                                        Sign In
                                    </Link>
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            to="/signup"
                                            className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center space-x-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200"
                                        >
                                            <span>Get Started</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </motion.div>
                                </>
                            )}

                            {extraDesktopRight}
                        </motion.div>

                        <motion.button
                            className="text-foreground hover:bg-muted rounded-lg p-2 transition-colors duration-200 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(o => !o)}
                            variants={itemVariants}
                            whileTap={{ scale: 0.92 }}
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <motion.div
                            className="border-border bg-background fixed top-14 inset-x-0 mx-2 z-50 rounded-2xl border shadow-2xl lg:hidden"
                            variants={mobileMenuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                        >
                            <div className="space-y-6 p-5">

                                {canInstall && (
                                    <motion.div variants={mobileItemVariants}>
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                handleInstallClick();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            aria-label="Install app"
                                            className="flex-inline"
                                        >
                                            <SquareArrowDown /> <span>Install App</span>
                                        </Button>
                                    </motion.div>
                                )}

                                <div className="space-y-1">
                                    {navItems.map(item => (
                                        <motion.div key={item.name} variants={mobileItemVariants}>
                                            <Link
                                                to={item.href}
                                                className="text-foreground hover:bg-muted block rounded-lg px-4 py-3 font-medium transition-colors duration-200"
                                                onClick={(e) => {
                                                    onNavClick?.(e, item);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                {item.name}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {includeDarkModeToggle && (
                                    <motion.div
                                        className="border-border space-y-3 border-t pt-5"
                                        variants={mobileItemVariants}
                                    >
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground px-1">
                                            Appearance
                                        </div>
                                        <Suspense
                                            fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-muted" />}
                                        >
                                            <LazyModeToggle
                                                showAsLabel={darkModeToggleProps?.showAsLabel}
                                                shrink={false}
                                            />
                                        </Suspense>
                                    </motion.div>
                                )}

                                {showAuthButtons && (
                                    <motion.div
                                        className="border-border space-y-3 border-t pt-5"
                                        variants={mobileItemVariants}
                                    >
                                        <Link
                                            to="/login"
                                            className="text-foreground hover:bg-muted block w-full rounded-lg py-3 text-center font-medium transition-colors duration-200"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/signup"
                                            className="bg-foreground text-background hover:bg-foreground/90 block w-full rounded-lg py-3 text-center font-medium transition-all duration-200"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Get Started
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeaderMobile;