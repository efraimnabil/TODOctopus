interface IProps {}

const pen = ({}: IProps) => {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_176_4169"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="16"
      >
        <rect
          x="0.476807"
          y="0.476562"
          width="15.1751"
          height="15.1751"
          fill="url(#paint0_linear_176_4169)"
          fillOpacity="0.8"
        />
      </mask>
      <g mask="url(#mask0_176_4169)">
        <path
          d="M3.63837 12.49H4.43602L10.9086 6.01748L10.1109 5.21982L3.63837 11.6924V12.49ZM3.26144 13.4384C3.09952 13.4384 2.96379 13.3837 2.85426 13.2741C2.74471 13.1646 2.68994 13.0289 2.68994 12.8669V11.7714C2.68994 11.6172 2.71953 11.4702 2.77872 11.3305C2.83789 11.1907 2.91935 11.069 3.02311 10.9652L11.0302 2.96183C11.1258 2.87498 11.2314 2.80788 11.3469 2.76051C11.4624 2.71314 11.5836 2.68945 11.7103 2.68945C11.8371 2.68945 11.9599 2.71195 12.0788 2.75695C12.1976 2.80194 12.3028 2.87347 12.3944 2.97155L13.1665 3.7534C13.2646 3.845 13.3346 3.9504 13.3763 4.06961C13.4181 4.18881 13.4389 4.30801 13.4389 4.42721C13.4389 4.55435 13.4172 4.67569 13.3738 4.79122C13.3304 4.90676 13.2613 5.01234 13.1665 5.10795L5.16315 13.1053C5.05939 13.209 4.93764 13.2905 4.7979 13.3497C4.65815 13.4088 4.51118 13.4384 4.35699 13.4384H3.26144ZM10.5027 5.62564L10.1109 5.21982L10.9086 6.01748L10.5027 5.62564Z"
          fill="white"
          fillOpacity="0.8"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_176_4169"
          x1="15.6475"
          y1="15.6473"
          x2="0.476807"
          y2="0.476562"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF00C2" />
          <stop offset="1" stopColor="#FF4D00" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default pen;
