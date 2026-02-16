export default function Logo({ className = "", size = "default" }) {
    const heightClass = size === "small" ? "h-10" : size === "large" ? "h-16" : "h-14";

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/images/Logo-01.png"
                alt="Betopia Group"
                className={`${heightClass} object-contain`}
            />
            <div className="w-px bg-gray-300 self-stretch my-1"></div>
            <img
                src="/images/Logo-03.png"
                alt="Bdcalling Academy"
                className={`${heightClass} object-contain`}
            />
        </div>
    );
}
