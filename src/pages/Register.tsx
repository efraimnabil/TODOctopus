import InputErrorMessage from "../components/InputErrorMessage";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useForm, SubmitHandler } from "react-hook-form";
import { RegisterForm } from "../data";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../validations";

interface IFormInput {
  username: string;
  email: string;
  password: string;
}

const RegisterPage = () => {
  const { 
    register, 
    handleSubmit, 
    formState: {errors}
  } = useForm<IFormInput>(
    {
      resolver: yupResolver(registerSchema)
    }
  );

  // ** Handlers
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data);
  };


  // ** Renders

  const renderRegisterForm = RegisterForm.map(({name, placeholder, type, validation}, index) => {
    return (
      <div key={index} className="mb-4">
        <Input 
          type={type}
          placeholder={placeholder}
          {...register(name, validation)}
        />
        {errors[name] && <InputErrorMessage msg={errors[name]?.message} />}
      </div>
    );
  });

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-center mb-4 text-3xl font-semibold">Register to get access!</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {renderRegisterForm}

        <Button fullWidth>Register</Button>
      </form>
    </div>
  );
};

export default RegisterPage;
