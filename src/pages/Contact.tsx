import React, { forwardRef, useRef, useState } from "react";
import { getRequestStatusById } from "@/constants/requestStatuses";
import personalInfo from "@/constants/personalInfo";
import ContactForm from '@/components/forms/ContactForm/';

import { SectionWrapper } from '@/hoc';
import { Suspense } from 'react';
import Hyperspeed from '@/components/blocks/backgrounds/Hyperspeed/Hyperspeed';
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
import Loader from "@/components/Loader";

const hyperspeedRef = React.createRef<any>();

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
        <Suspense fallback={<Loader />}>
            <Hyperspeed ref={ref} effectOptions={hyperspeedOptions} />
        </Suspense>
    );
});


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
            <div className="flex lg:h-[80svh] gap-16 pointer-events-none">
                <Card className="flex-[0.90] opacity-[95%] gap-10 py-10 px-6 pointer-events-auto">
                    <CardHeader>
                        <CardTitle className="nunito-text text-4xl font-black">Other Contact</CardTitle>
                        {/* <CardDescription>Card Description</CardDescription> */}
                    </CardHeader>
                    <CardContent className="px-8 text-sm space-y-2">
                        <address className="space-y-2">
                            <ContactItem type="email" label="Email:">
                                <CopiableLink type="email" href="othercontact@example.com">
                                    {personalInfo.email}
                                </CopiableLink>
                            </ContactItem>

                            <ContactItem type="phone" label="Phone:">
                                <CopiableLink type="tel" href="+1234567890">
                                    {personalInfo.phone}
                                </CopiableLink>
                            </ContactItem>
                        </address>
                        <br />
                        <br />
                        <div className="space-y-2">
                            <ContactItem type="linkedin" label="LinkedIn:">
                                <CopiableLink href={personalInfo.linkedin.url}>
                                    {personalInfo.linkedin.username}
                                </CopiableLink>
                            </ContactItem>

                            <ContactItem type="github" label="Github:">
                                <CopiableLink href={personalInfo.github.url}>
                                    {personalInfo.github.username}
                                </CopiableLink>
                            </ContactItem>
                        </div>
                    </CardContent>
                </Card>
                <Card className="flex-[1.1] opacity-[98%] gap-10 py-10 px-6 overflow-y-auto pointer-events-auto" >
                    <CardHeader className="select-none opacity-100 ">
                        <CardTitle className="nunito-text text-4xl font-black">Direct Message</CardTitle>
                        {/* <CardDescription>Card Description</CardDescription> */}
                    </CardHeader>
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
                    <CardFooter className="select-none -mt-4 ">
                        <Button variant="link" className="flex-1 text-left justify-start group">
                            <MoveLeft className="group-hover:-translate-x-1 transition-transform" />
                            <a href="/">Back to Home</a>
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExternalSubmit}
                            className="flex-2 py-6"
                            disabled={status.id !== "ready"}
                        >
                            {status.id !== "ready"
                                ? `${status.label}...`
                                : "Submit"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};



export default SectionWrapper(
    (props) => <Contact {...props} hyperspeedRef={hyperspeedRef} />,
    "contact",
    {
        className: "h-dvh bg-gray-50 dark:bg-gray-950",
        background: <HyperSpeedCanvas ref={hyperspeedRef} />
    }
);