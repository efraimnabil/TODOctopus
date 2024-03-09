import { InputHTMLAttributes, Ref, forwardRef } from "react";

interface IProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef(
  ({ ...rest }: IProps, ref: Ref<HTMLInputElement>) => {

    return (
      <input
        ref={ref}
        className="border-[1px] border-pink-trans shadow-lg focus:border-pink-trans focus:outline-none focus:ring-1 focus:ring-pink-trans rounded-3xl px-3 py-3 text-md w-full bg-transparent mt-2 text-white font-SourceSerifPro placeholder-white/60"
        {...rest}
      />
    );
  }
)

export default Input;
