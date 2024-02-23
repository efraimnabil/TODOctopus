import { ILoginInput, IRegisterInput } from "../interfaces";

export const RegisterForm: IRegisterInput[] = [
    {
        name: 'username',
        placeholder: 'Username',
        type: 'text',
        validation: {
            required: true,
            minLength: 5,
        },
    },
    {
        name: 'email',
        placeholder: 'Email',
        type: 'email',
        validation: {
            required: true,
            pattern: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/
        },
    },
    {
        name: 'password',
        placeholder: 'Password',
        type: 'password',
        validation: {
            required: true,
            minLength: 5,
        },
    }
];

export const LoginForm: ILoginInput[] = [
    {
        name: 'identifier',
        placeholder: 'Email',
        type: 'email',
        validation: {
            required: true,
            pattern: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/
        },
    },
    {
        name: 'password',
        placeholder: 'Password',
        type: 'password',
        validation: {
            required: true,
            minLength: 5,
        },
    }
];