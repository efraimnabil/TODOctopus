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
import { useNavigate } from "react-router-dom";
interface IFormInput {
  username: string;
  email: string;
  password: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
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
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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

  const beforeElementStyles: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '30px',
    border: '2px solid transparent',
    background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  };

  const renderRegisterForm = RegisterForm.map(({name, placeholder, type, validation}, index) => {
    return (
      <div key={index} className="mb-4">
        <label 
          className="text-md font-semibold text-white ml-1"
          htmlFor={name}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </label>
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
    <div className="max-w-sm mx-auto">
      <h2 
        className="text-center mb-4 text-3xl font-semibold text-white"
      >
        Register to get access!
      </h2>
      <form 
        className="z-10 rounded-[30px] relative py-12 px-8 bg-white-08 flex flex-col gap-8" 
        onSubmit={handleSubmit(onSubmit)}>
        {renderRegisterForm}

        <Button 
          fullWidth 
          isLoading={isloading}
          className="bg-gradient-to-tl from-pink-trans to-orange-trans text-white rounded-3xl text-center text-lg py-2"
        >
          Register
        </Button>

        <span className="-z-10" style={beforeElementStyles}></span>
      </form>
    </div>
  );
};

export default RegisterPage;
