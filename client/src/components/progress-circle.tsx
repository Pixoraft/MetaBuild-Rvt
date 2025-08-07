interface ProgressCircleProps {
  percentage: number;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  size?: number;
}

export function ProgressCircle({ percentage, color = "blue", size = 80 }: ProgressCircleProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: "stroke-blue-500",
    green: "stroke-green-500", 
    purple: "stroke-purple-500",
    orange: "stroke-orange-500",
    red: "stroke-red-500",
  };

  const textColorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500", 
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color]}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${textColorClasses[color]}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}
