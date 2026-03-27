import Image from "next/image";

interface EvidenceImageProps {
  src: string;
  alt?: string;
  maxHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function EvidenceImage({ src, alt = "증거 사진", maxHeight = 250, className, style }: EvidenceImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={maxHeight}
      unoptimized
      style={{
        width: "100%",
        maxHeight,
        objectFit: "contain",
        ...style,
      }}
      className={className}
    />
  );
}
