type ArrowSwapIconProps = {
  darkMode?: boolean;
  size?: number | string;
  className?: string;
  lightColor?: string;
  darkColor?: string;
};

export function ArrowSwapIcon({
  darkMode = false,
  size = 18,
  className,
  lightColor = "#001D3D",
  darkColor = "#E6EDF3",
}: ArrowSwapIconProps) {
  const fill = darkMode ? darkColor : lightColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.148438 1.00039C0.148438 0.530949 0.528995 0.150391 0.998438 0.150391H4.99844C5.46788 0.150391 5.84844 0.530949 5.84844 1.00039C5.84844 1.46983 5.46788 1.85039 4.99844 1.85039H3.05052L6.59948 5.39935C6.93142 5.7313 6.93142 6.26949 6.59948 6.60143C6.26753 6.93338 5.72934 6.93338 5.3974 6.60143L1.84844 3.05247V5.00039C1.84844 5.46983 1.46788 5.85039 0.998438 5.85039C0.528995 5.85039 0.148438 5.46983 0.148438 5.00039V1.00039ZM11.3974 11.3994C11.7293 11.0674 12.2675 11.0674 12.5995 11.3994L16.1484 14.9483V13.0004C16.1484 12.5309 16.529 12.1504 16.9984 12.1504C17.4679 12.1504 17.8484 12.5309 17.8484 13.0004V17.0004C17.8484 17.4698 17.4679 17.8504 16.9984 17.8504H12.9984C12.529 17.8504 12.1484 17.4698 12.1484 17.0004C12.1484 16.5309 12.529 16.1504 12.9984 16.1504H14.9464L11.3974 12.6014C11.0655 12.2695 11.0655 11.7313 11.3974 11.3994Z"
        fill={fill}
      />
    </svg>
  );
}
