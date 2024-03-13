import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Textarea from "../components/ui/Textarea";
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
import GradientBorder from "../components/ui/GradientBorder";
import Select from "../components/ui/Select";
import toast from "react-hot-toast";
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
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
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

  const closeConfirmModal = () => {
    setIsOpenConfirmModal(false);
  };

  const openConfirmModal = (todo: ITodo) => {
    setEditTodo(todo);
    console.log(todo);
    setIsOpenConfirmModal(true);
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

  const onSubmitRemoveTodo = async () => {
    try {
      setIsRemoving(true);
      const { status } = await axiosInstance.delete(`/tasks/task/${editTodo.id}`, {
        data: {
          userId: userData?.id,
        },
        headers: {
          Authorization: `Bearer ${userData?.token}`,
        },
      });
      if (status === 204) {
        closeConfirmModal();
        toast.success("Todo removed successfully");
        if (data?.tasks?.length === 1) {
          toast.success("You Killed an Octopus 🐙");
          if (page > 1) {
            setPage((prev) => prev - 1);
          }
        }
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      toast.error("Failed to remove todo, please try again");
    }
    finally {
      setIsRemoving(false);
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
        openConfirmModal={() => openConfirmModal({ ...attributes, id: _id })}
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
            You have {data?.pagination.pageCount} Octopuses, {data?.pagination.total} tasks
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
            pageCount={data?.pagination.pageCount}
            total={data?.pagination.total}
            isLoading={isLoading || isFetching}
            onClickPrev={onClickPrev}
            onClickNext={onClickNext}
          />
        ) : null
      }
      {/* Add todo Modal */}
      <Modal
        isOpen={isOpenAddModal}
        closeModal={closeAddModal}
        title="Add Todo"
      >
        <form className="space-y-3" onSubmit={handleAddTodoSubmit}>
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Title</label>
            <Input
              value={addTodo.title}
              required
              name="title"
              placeholder="Title"
              onChange={handleAddTodoChange}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="priority" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Priority</label>
            <div className="flex items-center space-x-3">
             <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="1"
                  name="priority"
                  value="1"
                  checked={addTodo.priority === "1"}
                  onChange={handleAddTodoChange}
                />
                <label htmlFor="1" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">1</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="2"
                  name="priority"
                  value="2"
                  checked={addTodo.priority === "2"}
                  onChange={handleAddTodoChange}
                />
                <label htmlFor="2" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">2</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="3"
                  name="priority"
                  value="3"
                  checked={addTodo.priority === "3"}
                  onChange={handleAddTodoChange}
                />
                <label htmlFor="3" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">3</label>
              </div>
            </div>

          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Description</label>
            <Textarea
              value={addTodo.description}
              name="description"
              placeholder="Description"
              onChange={handleAddTodoChange}
            />
          </div>
          <div className="flex justify-start space-x-3 mt-4">
            <Button 
              className="bg-gradient-to-br from-pink-trans to-orange-trans text-white rounded-3xl w-24 text-center text-lg py-1 md:text-md md:w-28 font-SourceSerifPro"
              isLoading={isAdding}
            >
              Add
            </Button>
            <Button 
              className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28 font-SourceSerifPro"
              onClick={closeAddModal} 
              type="button"
            >
              Cancel
              <span style={GradientBorder}></span>
            </Button>
          </div>
        </form>
      </Modal>

      {/**Edit todo Modal */}
      <Modal
        isOpen={isEditModalOpen}
        closeModal={onCloseEditModal}
        title="Edit Todo"
      >
        <form className="space-y-3" onSubmit={handleEditTodoSubmit}>
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Title</label>
            <Input
              value={editTodo.title}
              name="title"
              placeholder="Title"
              onChange={handleEditTodoChange}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="priority" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Priority</label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="1"
                  name="priority"
                  value="1"
                  checked={editTodo.priority === "1"}
                  onChange={handleEditTodoChange}
                />
                <label htmlFor="1" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">1</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="2"
                  name="priority"
                  value="2"
                  checked={editTodo.priority === "2"}
                  onChange={handleEditTodoChange}
                />
                <label htmlFor="2" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">2</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="3"
                  name="priority"
                  value="3"
                  checked={editTodo.priority === "3"}
                  onChange={handleEditTodoChange}
                />
                <label htmlFor="3" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">3</label>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300">Description</label>
              <Textarea
              value={editTodo.description}
              name="description"
              placeholder="Description"
              onChange={handleEditTodoChange}
            />
          </div>
          <div className="flex justify-start space-x-3 mt-4">
            <Button className="bg-gradient-to-br from-pink-trans to-orange-trans text-white rounded-3xl w-24 text-center text-lg py-1 md:text-md md:w-28 font-SourceSerifPro" isLoading={isUpdating}>
              Update
            </Button>
            <Button
              className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28 font-SourceSerifPro"
              onClick={onCloseEditModal} 
              type="button"
            >
              Cancel
              <span style={GradientBorder}></span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE TODO CONFIRM MODAL */}
      <Modal
        isOpen={isOpenConfirmModal}
        closeModal={closeConfirmModal}
        title="Are you sure you want to remove this Todo from your Store?"
        description="Deleting this Todo will remove it permanently from your inventory. Any associated data, sales history, and other related information will also be deleted. Please make sure this is the intended action."
      >
        <div className="flex items-center space-x-3">
          <Button 
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl w-28 text-center text-lg py-1 md:text-md md:w-32 font-SourceSerifPro"
            onClick={onSubmitRemoveTodo}
            isLoading={isRemoving}
          >
            Yes, remove
          </Button>
          <Button 
            className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28 font-SourceSerifPro"
            onClick={closeConfirmModal} 
            type="button"
          >
            Cancel
            <span style={GradientBorder}></span>
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TodoList;
