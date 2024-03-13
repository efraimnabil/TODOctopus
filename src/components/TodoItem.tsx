import Button from "./ui/Button";
import Pen from "./ui/Pen";
interface IProps {
  _id: string;
  title: string;
  description: string;
  Priority?: string;
  idx: number;

  openConfirmModal: (todo: {
    _id: string;
    title: string;
    description: string;
    priority: string;
  }) => void;
  
  onOpenEditModal: (todo: {
    id: string;
    title: string;
    description: string;
    priority: string;
  }) => void;
}

const TodoItem = ({
  _id,
  title,
  description,
  Priority = "2",
  idx,
  openConfirmModal,
  onOpenEditModal,
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

  return (
    <div
      key={_id}
      className={`flex w-full items-center justify-between bg-gradient-to-br from-transparent via-transparent to-todo-bg backdrop-blur-md duration-300 px-3 py-2 md:py-1 lg:py-2 shadow-custom-orange rounded-2xl md:absolute md:w-52 lg:w-60 xl:w-80 ${todosPostionsMd[idx]} ${todosPostionsLg[idx]} ${todosPostionsXl[idx]}`}
    >

      <p className="w-full font-semibold text-white font-SourceSerifPro">
        {title}
      </p>
      <div className="flex items-center justify-end w-full space-x-5">
        {/* delete */}
        <Button
          onClick={() =>
            openConfirmModal(
              {
                _id: _id,
                title: title,
                description: description,
                priority: Priority,
              })
          }
        >
          <span 
            className={`w-7 h-7 rounded-full border-2 ${Priority === "3" ? "border-red-500" : Priority === "2" ? "border-yellow-500" : Priority === "1" ? "border-green-500" : ""
            } flex items-center justify-center`}
          ></span>
        </Button>

        <Button
          onClick={() =>
            
            {
              console.log("id", _id);
              onOpenEditModal({
                id: _id,
                title: title,
                description: description,
                priority: Priority,
              })
            }
          }
        >
          <Pen />
        </Button>
      </div>
    </div>
  );
};

export default TodoItem;
