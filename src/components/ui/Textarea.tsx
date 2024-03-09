import { TextareaHTMLAttributes } from "react";

interface IProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = ({ ...rest }: IProps) => {
  return (
    <textarea
      className="border-[1px] border-pink-trans shadow-lg focus:border-pink-trans focus:outline-none focus:ring-1 focus:ring-pink-trans rounded-3xl px-3 py-3 text-md w-full bg-transparent mt-2 text-white font-SourceSerifPro placeholder-white/60"
      rows={6}
      {...rest}
    />
  );
};

export default Textarea;
