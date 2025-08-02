import ContactIcon from "./ContactIcon";

interface ContactItemProps {
    type: string;
    label: string;
    children: React.ReactNode;
}

export default function ContactItem({ type, label, children }: ContactItemProps) {
    return (
        <div className="flex items-center gap-4">
            <ContactIcon type={type} />
            <div>
                <div className="font-bold text-[1.25em]">{label}</div>
                {children}
            </div>
        </div>
    );
}