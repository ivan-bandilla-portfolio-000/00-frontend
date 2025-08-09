import { Code, Award, ArrowRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const items = [
    {
        title: `${new Date().getFullYear() - 2023}+ years of personal experience`,
        // meta: '100+ components',
        description: 'Developer of web application client-centered projects since 2nd year college.',
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
        title: 'Capstone Excellence Award',
        description: 'Developed frontend and backend for award-winning HRMS featuring Google Cloud OCR with <strong class="font-black">90.4% resume parsing accuracy</strong>, intelligent job ranking algorithm, and Gemini AI-powered performance improvement recommendations.',
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
        title: 'Research Excellence Award',
        description: 'Built a centralized DMS portal for city barangay assessment with document tracking and validation, real-time chat, and pass/fail assessment reports.',
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