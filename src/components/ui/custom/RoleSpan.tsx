import * as React from "react";

type RoleSpanProps = { role?: string | null };

const RoleSpan: React.FC<RoleSpanProps> = ({ role }) => {
    return role ? <span className="capitalize">{role}</span> : null;
};

export default RoleSpan;