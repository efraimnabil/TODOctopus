import { CSSProperties } from "react";

const GradientBorder: CSSProperties = {
  content: '""',
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  borderRadius: '50px',
  border: '2px solid transparent',
  background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'destination-out',
  maskComposite: 'exclude',
};

export default GradientBorder;