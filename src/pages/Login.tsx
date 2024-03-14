import { SubmitHandler, useForm } from "react-hook-form";
import InputErrorMessage from "../components/InputErrorMessage";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { LoginForm } from "../data";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoginSchema } from "../validations";
import { useState } from "react";
import axiosInstance from "../config/axios.config";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { IErrorRes } from "../interfaces";
import { Link } from "react-router-dom";

interface IFormInput {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { 
    register, 
    handleSubmit, 
    formState: {errors}
  } = useForm<IFormInput>(
    {
      resolver: yupResolver(LoginSchema)
    }
  );
  const [isloading, setIsLoading] = useState(false);

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

  // ** Handlers
  const onSubmit: SubmitHandler<IFormInput> = async (loginData) => {
    console.log(loginData);
    setIsLoading(true);

    try {
      const {status, data} =  await axiosInstance.post('/users/login', loginData);
      if (status === 200) {
        toast.success('You are logged in, We will redirect you to home page in 2 seconds', {
          position: 'top-center',
          style: {
            backgroundColor: 'black',
            color: '#fff',
            width: 'fit-content',
          }
        });

        localStorage.setItem('loggedInUser', JSON.stringify(data));

        setTimeout(() => {
          location.replace('/');
        }, 2000);
      }

    } catch (err) {
      console.log(err);
      const errorObj = err as AxiosError<IErrorRes>;
      const message = errorObj.response?.data?.message || 'Something went wrong';
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

  const renderLoginForm = LoginForm.map(({name, placeholder, type, validation}, index) => {
    return (
      <div key={index}>
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
        Login to get access!
      </h2>

      <form 
        className="z-10 rounded-[30px] relative py-12 px-8 bg-white-08 flex flex-col gap-8" 
        onSubmit={handleSubmit(onSubmit)}
      >
        {renderLoginForm}

        <p
          className="text-white text-sm"
        >
          Don't have an account? <Link to="/register" className="text-pink-500">Register</Link>
        </p>

        <Button 
          isLoading={isloading}
          className="bg-gradient-to-tl from-pink-trans to-orange-trans text-white rounded-3xl text-center text-lg py-2"
        >
          Login
        </Button>

        <span className="-z-10" style={beforeElementStyles}></span>
      </form>

    </div>
  );
};

export default LoginPage;
