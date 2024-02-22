import InputErrorMessage from "../components/InputErrorMessage";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useForm, SubmitHandler } from "react-hook-form";

interface IFormInput {
  username: string;
  email: string;
  password: string;
}

const RegisterPage = () => {
  const { register, handleSubmit, formState: {errors} } = useForm<IFormInput>();
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data);
  };
  console.log(errors);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-center mb-4 text-3xl font-semibold">Register to get access!</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input 
          placeholder="Username" 
          {...register("username", {
            required: "Usename is required!",
            minLength: 3
          })}
        />
        {errors?.username && errors.username.type === "required" && <InputErrorMessage msg="Username is required!" />}
        {errors?.username && errors.username.type === "minLength" && <InputErrorMessage msg="Username must be at least 3 characters long!" />}
        <Input 
          placeholder="Email address" 
          {...register("email", {
            required: "Email is required!", 
            pattern: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/
          })} />
        {errors?.email && errors.email.type === "required" && <InputErrorMessage msg="Email is required!" />}
        {errors?.email && errors.email.type === "pattern" && <InputErrorMessage msg="Email is not valid!" />}
        <Input 
          placeholder="Password" 
          {...register("password", {
            required: "Password is required!", 
            minLength: 6
          })} />
        {errors?.password && errors.password.type === "required" && <InputErrorMessage msg="Password is required!" />}
        {errors?.password && errors.password.type === "minLength" && <InputErrorMessage msg="Password must be at least 6 characters long!" />}

  
        <Button fullWidth>Register</Button>
      </form>
    </div>
  );
};

export default RegisterPage;
