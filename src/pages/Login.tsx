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

interface IFormInput {
  identifier: string;
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

  // ** Handlers
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    console.log(data);
    setIsLoading(true);

    try {
      const {status, data: resData} = await axiosInstance.post('/auth/local', data);
      console.log(status);
      console.log(resData);
      if (status === 200) {
        toast.success('You are logged in, We will redirect you to home page in 2 seconds', {
          position: 'top-center',
          style: {
            backgroundColor: 'black',
            color: '#fff',
            width: 'fit-content',
          }
        });

        localStorage.setItem('loggedInUser', JSON.stringify(resData));

        setTimeout(() => {
          location.replace('/');
        }, 2000);
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

  const renderLoginForm = LoginForm.map(({name, placeholder, type, validation}, index) => {
    return (
      <div key={index}>
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
      <h2 className="text-center mb-4 text-3xl font-semibold">Login to get access!</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {renderLoginForm}

        <Button fullWidth isLoading={isloading}>
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
