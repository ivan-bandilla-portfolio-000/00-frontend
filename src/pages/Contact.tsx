import { forwardRef, useRef, useState, useEffect, lazy, createRef } from "react";
import { getRequestStatusById } from "@/constants/requestStatuses";
import { ContactInfoService, type ContactInfo } from "@/services/ContactInfoService";
import ContactForm from '@/components/forms/ContactForm/';
import { Link } from "react-router";

import { SectionWrapper } from '@/hoc';
import { Suspense } from 'react';
import { useTheme } from "@/features/theming/components/theme-provider";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import CopiableLink from "@/components/ui/custom/CopiableLink";
import ContactItem from "@/components/contact/ContactItem";
import { MoveLeft } from "lucide-react";
import { FormService } from "@/services/FormService";
import { NonceManager } from "@/features/nonce/client/services/NonceManager";
import SectionLoader from "@/components/SectionLoader";
import { useClientDB } from "@/clientDB/context";
const Hyperspeed = lazy(() => import('@/components/blocks/backgrounds/Hyperspeed/Hyperspeed'));

const hyperspeedRef = createRef<any>();

const HyperSpeedCanvas = forwardRef<any, {}>((_, ref) => {
    const { theme } = useTheme();

    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const hyperspeedOptions = {
        onSpeedUp: () => { },
        onSlowDown: () => { },
        distortion: 'turbulentDistortion',
        length: 400,
        roadWidth: 10,
        islandWidth: 2,
        lanesPerRoad: 4,
        fov: 90,
        fovSpeedUp: 150,
        speedUp: 2,
        carLightsFade: 0.4,
        totalSideLightSticks: 10,
        lightPairsPerRoadWay: 40,
        shoulderLinesWidthPercentage: 0.05,
        brokenLinesWidthPercentage: 0.1,
        brokenLinesLengthPercentage: 0.5,
        lightStickWidth: [0.12, 0.5] as [number, number],
        lightStickHeight: [1.3, 1.7] as [number, number],
        movingAwaySpeed: [15, 20] as [number, number],
        movingCloserSpeed: [-30, -40] as [number, number],
        carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
        carLightsRadius: [0.05, 0.14] as [number, number],
        carWidthPercentage: [0.3, 0.5] as [number, number],
        carShiftX: [-0.8, 0.8] as [number, number],
        carFloorSeparation: [0, 5] as [number, number],
        colors: {
            roadColor: !isDark ? 0xFFFFFF : 0x080808,
            islandColor: !isDark ? 0xFFFFFF : 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0xFFFFFF,
            brokenLines: 0xFFFFFF,
            leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
            rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
            sticks: 0x03B3C3,
        }
    }
    return (
        <Suspense fallback={null}>
            <Hyperspeed ref={ref} effectOptions={hyperspeedOptions} />
        </Suspense>
    );
});

const DeferredBackground: React.FC = () => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const idle = (window as any).requestIdleCallback ?? ((fn: any) => setTimeout(fn, 300));
        const id = idle(() => setReady(true));
        return () => {
            const cancel = (window as any).cancelIdleCallback ?? clearTimeout;
            cancel(id);
        };
    }, []);
    if (!ready) return null;
    return <HyperSpeedCanvas ref={hyperspeedRef} />;
};


const ContactInfoSection = () => {
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<ContactInfo | null>(null);
    const db = useClientDB(); // get DB at top-level

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!db) return; // wait until DB is available
            try {
                const data = await ContactInfoService.ensureAndGet(db);
                if (alive) setInfo(data ?? null);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [db]);

    if (loading) {
        return (
            <SectionLoader />
        );
    }

    if (!info) return null;

    return (
        <>
            <address className="space-y-2">
                <ContactItem type="email" label="Email:">
                    {info.email ? (
                        <CopiableLink type="email" href={`mailto:${info.email}`}>
                            {info.email}
                        </CopiableLink>
                    ) : (
                        <span>-</span>
                    )}
                </ContactItem>

                <ContactItem type="phone" label="Phone:">
                    {info.phone ? (
                        <CopiableLink type="tel" href={`tel:${info.phone}`}>
                            {info.phone}
                        </CopiableLink>
                    ) : (
                        <span>-</span>
                    )}
                </ContactItem>
            </address>
            <br />
            <br />
            <div className="space-y-2">
                <ContactItem type="linkedin" label="LinkedIn:">
                    {info.linkedin?.url ? (
                        <CopiableLink href={info.linkedin.url}>
                            {info.linkedin?.username ?? info.linkedin.url}
                        </CopiableLink>
                    ) : (
                        <span>{info.linkedin?.username ?? '-'}</span>
                    )}
                </ContactItem>

                <ContactItem type="github" label="Github:">
                    {info.github?.url ? (
                        <CopiableLink href={info.github.url}>
                            {info.github?.username ?? info.github.url}
                        </CopiableLink>
                    ) : (
                        <span>{info.github?.username ?? '-'}</span>
                    )}
                </ContactItem>
            </div>
        </>
    );
}


const Contact = () => {
    const [status, setStatus] = useState(getRequestStatusById("ready")!);
    const hyperspeedRef = useRef<any>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSpeedUp = () => {
        hyperspeedRef.current?.speedUp();
        hyperspeedRef.current?.setLocked(true);
    };

    const handleSlowDown = () => {
        hyperspeedRef.current?.setLocked(false);
        hyperspeedRef.current?.slowDown();
    };

    const handleExternalSubmit = () => {
        if (formRef.current) {
            setStatus(getRequestStatusById("validating")!);
            setTimeout(() => {
                formRef.current?.requestSubmit();
            }, 300);
        }
    };


    return (
        <div className="relative z-50 container h-full pointer-events-none">
            <div className="flex flex-col lg:flex-row lg:h-[80svh] gap-16 pointer-events-none">
                <Card className="flex-[0.90] opacity-[95%] gap-10 py-10 px-6 pointer-events-auto">
                    <CardHeader>
                        <CardTitle className="nunito-text text-4xl font-black">Other Contact</CardTitle>
                        {/* <CardDescription>Card Description</CardDescription> */}
                    </CardHeader>
                    <CardContent className="px-8 text-sm space-y-2">
                        <ContactInfoSection />
                    </CardContent>
                </Card>
                <Card className="flex-[1.1] opacity-[98%] gap-10 py-10 px-6 overflow-y-auto pointer-events-auto" >
                    <CardHeader className="select-none opacity-100 ">
                        <CardTitle className="nunito-text text-4xl font-black">Direct Message</CardTitle>
                        {/* <CardDescription>Card Description</CardDescription> */}
                    </CardHeader>
                    <Suspense fallback={<SectionLoader />}>
                        <CardContent className="px-8 opacity-100">
                            <ContactForm
                                // @ts-ignore
                                formRef={formRef}
                                callbacks={{
                                    onSubmitting: handleSpeedUp,
                                    onStop: handleSlowDown
                                }}
                                status={status}
                                setStatus={setStatus}
                                formService={FormService}
                                nonceManager={NonceManager}
                            />
                        </CardContent>
                        <CardFooter className="select-none -mt-4 @container">
                            <div className="flex gap-2 items-stretch w-full @max-md:flex-col">
                                <Button
                                    variant="link"
                                    className="w-full order-1 @max-md:order-2 @md:flex-1 @md:w-auto h-fit text-left @max-md:text-center @max-md:justify-center justify-start items-center-safe @max-md:translate-y-0 -translate-y-2 group shrink-1"
                                >
                                    <MoveLeft className="group-hover:-translate-x-1 transition-transform" />
                                    <Link to="/" className="pointer-coarse:py-4 py-3 px-2 grid place-content-center ">
                                        <span>Back to Home</span>
                                    </Link>
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleExternalSubmit}
                                    className="w-full @md:flex-[2] py-6 order-2 @max-md:order-1"
                                    disabled={status.id !== "ready"}
                                >
                                    {status.id !== "ready" ? `${status.label}...` : "Submit"}
                                </Button>
                            </div>
                        </CardFooter>
                    </Suspense>
                </Card>
            </div>
        </div>
    );
};



export default SectionWrapper(
    (props) => <Contact {...props} hyperspeedRef={hyperspeedRef} />,
    "contact",
    {
        className: "h-fit lg:h-dvh bg-gray-50 dark:bg-gray-950",
        background: <DeferredBackground />
    }
);