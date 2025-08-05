import { Github, Linkedin, Mail, Phone } from "lucide-react";
import type { JSX } from "react";


const icons: Record<string, JSX.Element> = {
    email: <Mail className="w-6 h-6" />,
    phone: <Phone className="w-6 h-6" />,
    linkedin: <Linkedin className="w-6 h-6" />,
    github: <Github className="w-6 h-6" />,
};

export default function ContactIcon({ type }: { type: string }) {
    return icons[type] || null;
}