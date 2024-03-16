import { useState } from "react";
import Button from "./ui/Button";
import Pen from "./ui/Pen";
import Modal from "./ui/Modal";
interface IProps {
  _id: string;
  title: string;
  description: string;
  Priority?: string;
  idx: number;
  
  onOpenEditModal: (todo: {
    id: string;
    title: string;
    description: string;
    priority: string;
  }) => void;

  onSubmitRemoveTodo: (id: string) => void;
  isRemoving: string;
}

const TodoItem = ({
  _id,
  title,
  description,
  Priority = "2",
  idx,
  onOpenEditModal,
  onSubmitRemoveTodo,
  isRemoving
}: IProps) => {
  const todosPostionsMd = [
    "md:top-1 md:left-10",
    "md:top-20 md:left-4",
    "md:top-40 md:left-7",
    "md:top-60 md:left-16",
    "md:top-60 md:right-16",
    "md:top-40 md:right-7",
    "md:top-20 md:right-4",
    "md:top-1 md:right-10",
  ];

  const todosPostionsLg = [
    "lg:top-1 lg:left-10",
    "lg:top-24 lg:left-4",
    "lg:top-44 lg:left-7",
    "lg:top-64 lg:left-16",
    "lg:top-64 lg:right-16",
    "lg:top-44 lg:right-7",
    "lg:top-42 lg:right-4",
    "lg:top-1 lg:right-10",
  ];

  const todosPostionsXl = [
    "xl:top-1 xl:left-10",
    "xl:top-28 xl:left-4",
    "xl:top-56 xl:left-7",
    "xl:top-80 xl:left-16",
    "xl:top-80 xl:right-16",
    "xl:top-56 xl:right-7",
    "xl:top-28 xl:right-4",
    "xl:top-1 xl:right-10",
  ];

  const [isTodoOpen, setIsTodoOpen] = useState(false);

  const handleTodoOpen = () => {
    setIsTodoOpen(true);
  }

  const handleTodoClose = () => {
    setIsTodoOpen(false);
  }



  return (
    <div
      key={_id}
      className={`flex w-full items-center justify-between bg-gradient-to-br from-transparent via-transparent to-todo-bg backdrop-blur-md duration-300 px-3 py-2 md:py-1 shadow-custom-orange rounded-2xl md:absolute md:w-52 lg:w-60 xl:w-80 ${todosPostionsMd[idx]} ${todosPostionsLg[idx]} ${todosPostionsXl[idx]}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleTodoOpen();
        }
      }}
    >

      <p 
        className="w-full font-semibold text-white font-SourceSerifPro"
        onClick={handleTodoOpen}
      >
        {title}
      </p>
      <div className="flex items-center justify-end w-full space-x-5">
        {/* delete */}
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onSubmitRemoveTodo(_id)}}
        >
          {
            isRemoving === _id ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span 
                className={`w-7 h-7 rounded-full border-2 ${Priority === "3" ? "border-red-500" : Priority === "2" ? "border-yellow-500" : Priority === "1" ? "border-green-500" : ""
                } flex items-center justify-center`}
              ></span>
            )
          }
        </Button>

        <Button
          onClick={(event) =>{
            event.stopPropagation();
              onOpenEditModal({
                id: _id,
                title: title,
                description: description,
                priority: Priority,
              })}
          }
        >
          <Pen />
        </Button>
      </div>

      <Modal isOpen={isTodoOpen} closeModal={handleTodoClose} title="Todo Details">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white font-SourceSerifPro">
            {title}
          </h1>
          <p className="text-lg font-semibold text-white font-SourceSerifPro">
            Priority: {Priority === "3" ? "High" : Priority === "2" ? "Medium" : Priority === "1" ? "Low" : ""}
          </p>
          <p className="text-lg font-semibold text-white font-SourceSerifPro">
            {description}
          </p>
          <Button 
              className="absolute top-0 right-5 text-white text-2xl font-bold px-2 font-mono"
              onClick={handleTodoClose}
            >
              X
            </Button>
          <div className="flex items-center justify-center space-x-3">
            <Button
              className="rounded-xl bg-green-500 hover:bg-green-600 px-2 w-full"
              onClick={
                () => {
                  onOpenEditModal({
                    id: _id,
                    title: title,
                    description: description,
                    priority: Priority,
                  });
                  handleTodoClose();
                }
              }
            >
              Update
            </Button>

            <Button
              className="rounded-xl bg-red-500 hover:bg-red-600 px-2 w-full"
              onClick={() => {
                onSubmitRemoveTodo(_id);
                handleTodoClose();
              }}
            >
              Delete
            </Button>

          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TodoItem;
