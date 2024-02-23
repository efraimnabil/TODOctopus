export interface IRegisterInput {
    name: "username" | "email" | "password";
    placeholder: string;
    type: string;
    validation: {
        required?: boolean;
        minLength?: number;
        pattern?: RegExp;
    };
}

export interface ILoginInput {
    name: "identifier" | "password";
    placeholder: string;
    type: string;
    validation: {
        required?: boolean;
        minLength?: number;
        pattern?: RegExp;
    };
}

export interface IErrorRes{
    error: {
        // details?: {
        //     errors: {
        //         message: string;
        //     }[];
        // };
        message?: string;
    };
}

