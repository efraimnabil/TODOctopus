import InputErrorMessage from "../components/InputErrorMessage";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useForm, SubmitHandler } from "react-hook-form";
import { RegisterForm } from "../data";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../validations";
import axiosInstance from "../config/axios.config";
import toast from "react-hot-toast";
import { useState } from "react";
import { AxiosError } from "axios";
import { IErrorRes } from "../interfaces";

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
  const [isloading, setIsLoading] = useState(false);

  // ** Handlers
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    console.log(data);
    setIsLoading(true);

    try {
      const {status} = await axiosInstance.post('/auth/local/register', data);
      console.log(status);
      if (status === 200) {
        toast.success('You will be redirected to login page after 3 seconds',{
          position: 'top-center',
          duration: 3000,
          style: {
            backgroundColor: 'black',
            color: '#fff',
            width: 'fit-content',
          }
        });
      }
      
    } catch (err) {
      const errorObj = err as AxiosError<IErrorRes>;
      const message = errorObj.response?.data.error.message || 'Something went wrong';
      toast.error(message, {
        position: 'top-center',
        style: {
          backgroundColor: 'black',
          color: '#fff',
          width: 'fit-content',
        }
      });
    }
    finally {
      setIsLoading(false);
    }
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

        <Button fullWidth isLoading={isloading}>
          Register
        </Button>
      </form>
    </div>
  );
};

export default RegisterPage;
