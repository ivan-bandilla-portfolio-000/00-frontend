import { useState, useEffect } from 'react'
import { styles } from '@/styles/js/styles'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'
import personalInfo from '@/constants/personalInfo'
import navLinks from '@/constants/topbarNavlinks'
import type { NavLink } from '@/constants/topbarNavlinks'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { useIdInViewport } from '@/hooks/useIdInViewport'

const shrinkDuration: number = 0.3; // seconds

interface NavAreaProps {
    active: string;
    setActive: (id: string) => void;
    shrink: boolean;
    className?: string;
    isHeroVisible: boolean;
}

const NavArea: React.FC<NavAreaProps> = ({ active, setActive, shrink, className, isHeroVisible }) => {

    return (
        <NavigationMenu>
            <NavigationMenuList className="gap-8">
                {navLinks
                    .filter(link => !(link.id === 'hero' && isHeroVisible))
                    .map((link: NavLink) => (
                        <NavigationMenuItem key={link.id}>
                            <motion.div
                                animate={{ scale: shrink ? 0.85 : 1 }}
                                transition={{ duration: shrinkDuration }}
                                style={{ display: 'inline-block' }}
                            >
                                <NavigationMenuLink
                                    active={active === link.id}
                                    className={`text-md underline ${link.id === 'projects' ? 'text font-extrabold' : 'font-medium '}`}
                                    href={`#${link.id}`}
                                    onClick={() => setActive(link.id)}
                                >
                                    {link.title}
                                </NavigationMenuLink>
                            </motion.div>
                        </NavigationMenuItem>
                    ))}
            </NavigationMenuList>
        </NavigationMenu>
    )
}

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
            className={`${styles.paddingX} w-full flex justify-between items-center fixed top-0 z-20 text-primary feather-shadow bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10`}
            animate={{ height: shrink ? shrunkHeight : defaultHeight }}
            transition={{ duration: shrinkDuration }}
            style={{ height: shrink ? shrunkHeight : defaultHeight }}
        >
            <div className=' items-center'>
                <motion.div
                    animate={{ fontSize }}
                    transition={{ duration: shrinkDuration }}
                    style={{ fontWeight: 'bold', fontSize: defaultFontSize }}
                >
                    <span className='nunito-text font-black'>{!isHeroVisible && personalInfo.name}</span>
                </motion.div>
            </div>

            <NavArea active={active} setActive={setActive} shrink={shrink} isHeroVisible={isHeroVisible} className="content-center" />

            <div className=' w-2'>

            </div>
        </motion.div>


    )
}

export default TopBar