import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "../components/ui/Button";
import axiosInstance from "../config/axios.config";
import TodoSkeleton from "../components/TodoSkeleton";
import Paginator from "../components/Paginator";
import hand1 from "../assets/hand1.svg";
import hand2 from "../assets/hand2.svg";
import hand3 from "../assets/hand3.svg";
import hand4 from "../assets/hand4.svg";
import hand5 from "../assets/hand5.svg";
import hand6 from "../assets/hand6.svg";
import hand7 from "../assets/hand7.svg";
import hand8 from "../assets/hand8.svg";
import plus from "../assets/plus.svg";
import TodoItem from "../components/TodoItem";
import Select from "../components/ui/Select";
import toast from "react-hot-toast";
import { AddTodoModal, EditTodoModal } from "../components/Modals";
const TodoList = () => {
  const SortByOptions = [
    { id: 1, name: 'Newest', value: 'createdAt' },
    { id: 2, name: 'Oldest', value: '-createdAt' },
    { id: 3, name: 'highest priority', value: 'priority' },
    { id: 4, name: 'lowest priority', value: '-priority' },
  ]

  const [selected, setSelected] = useState(SortByOptions[0]);
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string>("")
  const [isAdding, setIsAdding] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [queryVersion, setQueryVersion] = useState(1);
  const [page, setPage] = useState<number>(1);
  const [editTodo, setEditTodo] = useState<ITodo>({
    id: "",
    title: "",
    description: "",
    priority: "1",
  });
  const [addTodo, setAddTodo] = useState<ITodo>({
    id: "",
    title: "",
    description: "",
    priority: "1",
  });
  const { isLoading, data, isFetching } = useAuthQuery({
    // todoList+$todotoedit.id
    queryKey: [`todos-page-${page}`, `${queryVersion}`, `${selected.value}`],
    url: `/tasks/tasks?page=${page}&sort=${selected.value}`,
    config: {
      headers: {
        Authorization: `Bearer ${userData?.token}`,
      },
    },
  });

  console.log(data);

  // map to know wich hand to use
  const hands = [hand1, hand2, hand3, hand4, hand5, hand6, hand7, hand8];
  const hand = hands[data?.tasks?.length - 1] || hands[7];

  // ** Handlers

  const onClickPrev = () => {
    setPage((prev) => prev - 1);
  };

  const onClickNext = () => {
    setPage((prev) => prev + 1);
  };

  const onCloseEditModal = () => {
    setEditTodo({
      id: "",
      title: "",
      description: "",
      priority: "1",
    });
    setIsEditModalOpen(false);
  };

  const onOpenEditModal = (todo: ITodo) => {
    setEditTodo(todo);
    console.log(todo.id);
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setIsOpenAddModal(true);
  };

  const closeAddModal = () => {
    setIsOpenAddModal(false);
  };

  const handleEditTodoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditTodo((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddTodoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAddTodo((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { status } = await axiosInstance.patch(
        `/tasks/task/${editTodo.id}`,
        {
          title: editTodo.title,
          description: editTodo.description,
          priority: editTodo.priority,
        },
        {
          headers: {
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );
      if (status === 200) {
        toast.success("Todo updated successfully");
        onCloseEditModal();
        // ** Refetch the todos
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to update todo, please try again");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const {status} = await axiosInstance.post(
        `/tasks/task`,
        {
            title: addTodo.title,
            description: addTodo.description,
            priority: addTodo.priority,
            _id: userData?.user?._id
        },
        {
          headers: {
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );
      if (status === 201) {
        closeAddModal();

        if (data?.tasks?.length === 8) {
          setPage((prev) => prev + 1);
        }
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to add todo, please try again");
    }
    finally {
      setAddTodo({
        id: "",
        title: "",
        description: "",
        priority: "1",
      });
      setIsAdding(false);
    }
  };

  const onSubmitRemoveTodo = async (id: string) => {
    try {
      setIsRemoving(id);
      const { status } = await axiosInstance.delete(`/tasks/task/${id}`, {
        headers: {
          Authorization: `Bearer ${userData?.token}`,
        },
      });
      if (status === 204) {
        toast.success("Todo removed successfully");
        if (data?.tasks?.length === 1) {
          if (page > 1) {
            setPage((prev) => prev - 1);
          }
        }
        if (data?.pagination?.total % 8 === 1) {
          toast.success("You have killed an Octopus 🐙");
        }
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to remove todo, please try again");
    }
    finally {
      setIsRemoving("")
    }
  };

  const renderTodos = data?.tasks?.map(
    ({ _id, attributes, }: { _id: string; attributes: ITodo }, idx: number) => (
      <TodoItem
        key={_id}
        _id={_id}
        idx={idx}
        Priority={attributes.priority}
        title={attributes.title}
        description={attributes.description}
        onOpenEditModal={() => onOpenEditModal({ ...attributes, id: _id })}
        onSubmitRemoveTodo={onSubmitRemoveTodo}
        isRemoving={isRemoving}
      />
    )
  );
  
  return (
    <div className="space-y-1 w-full flex flex-col items-center gap-10">
      <div className="flex flex-col md:flex-row gap-3 justify-between space-x-2 w-full">
        <div>
          <h1 className="text-2xl font-bold text-white font-SourceSerifPro">
            Finish your tasks, Kill Your Octopuses
          </h1>
          <h1 className="text-xl font-bold text-white font-SourceSerifPro">
            You have {data?.pagination?.pageCount} Octopuses, {data?.pagination?.total} tasks
          </h1>
        </div>
        <div className="flex gap-5 justify-end items-center">
            <Select options={SortByOptions} selected={selected} setSelected={setSelected} />
            <Button 
              className="text-white bg-gradient-to-bl from-pink-trans to-orange-trans hover:from-pink-500 hover:to-orange-500 rounded-lg"
              onClick={openAddModal}
            >
              <img src={plus} alt="add" className="w-10 h-10" />
            </Button>
          </div>
      </div>

      {isLoading ? (
        <div className="space-y-1">
            <TodoSkeleton />
        </div>
      ) : data?.tasks?.length ? (
        <div className="flex flex-col w-full items-center justify-center gap-3 md:relative">
          
          <img src={hand} alt="hand" className="w-44 h-44 md:w-60 md:h-60 lg:w-72 lg:h-72 xl:w-96 xl:h-96" />

          {renderTodos}

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <h1 className="text-2xl font-bold text-white font-SourceSerifPro">
            No Octopus found
          </h1>
        </div>
      )}
      {
        data?.tasks?.length ? (
          <Paginator
            page={page}
            pageCount={data?.pagination?.pageCount}
            total={data?.pagination?.total}
            isLoading={isLoading || isFetching}
            onClickPrev={onClickPrev}
            onClickNext={onClickNext}
          />
        ) : null
      }

      <AddTodoModal
        addTodo={addTodo}
        handleAddTodoChange={handleAddTodoChange}
        isAdding={isAdding}
        closeAddModal={closeAddModal}
        handleAddTodoSubmit={handleAddTodoSubmit}
        isOpenAddModal={isOpenAddModal}
      />

      <EditTodoModal
        editTodo={editTodo}
        handleEditTodoChange={handleEditTodoChange}
        isUpdating={isUpdating}
        onCloseEditModal={onCloseEditModal}
        handleEditTodoSubmit={handleEditTodoSubmit}
        isEditModalOpen={isEditModalOpen}
      />
      
    </div>
  );
};

export default TodoList;
