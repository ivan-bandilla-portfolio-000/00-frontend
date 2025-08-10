import { Code, Award, ArrowRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const items = [
    {
        title: `<span class="select-none">${new Date().getFullYear() - 2023}+ years of personal experience</span>`,
        // meta: '100+ components',
        description: '<span class="select-none">Developer of web application client-centered projects since 2nd year college.</span>',
        icon: <Code className="size-6" />,
        size: 'small' as const,
        cta: {
            url: `${window.location.origin}/about`,
            urlPreview: {
                children: 'View My Journey',
            },
            icon: ArrowRight,
        },
        // status: 'Popular',
        tags: ['PHP', 'Laravel', 'BSIT'],
        colSpan: 1,
        // hasPersistentHover: true,
    },
    {
        title: '<span class="select-none">Capstone Excellence Award</span>',
        description: '<span class="select-none">Developed frontend and backend for award-winning HRMS featuring Google Cloud OCR with <strong class="font-black">90.4% resume parsing accuracy</strong>, intelligent job ranking algorithm, and Gemini AI-powered performance improvement recommendations.</span>',
        icon: <Award className="size-6" />,
        size: 'small' as const,
        cta: {
            url: 'https://www.facebook.com/share/p/1CZLTWo3vu/',
            urlPreview: {
                children: 'See the Achievement',
            },
            icon: ArrowRight,
        }
    },
    {
        title: '<span class="select-none">Research Excellence Award</span>',
        description: '<span class="select-none">Built a centralized DMS portal for city barangay assessment with document tracking and validation, real-time chat, and pass/fail assessment reports.</span>',
        icon: <Award className="size-6" />,
        size: 'small' as const,
        cta: {
            url: 'https://zenodo.org/records/11188828',
            urlPreview: {
                children: (
                    <Tooltip>
                        <TooltipTrigger>Read the Research</TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className='text-pretty max-w-32'>Estimated Reading Time: 16 min</p>
                        </TooltipContent>
                    </Tooltip>
                ),
            },
            icon: ArrowRight,
        }
    },
];

export default items;