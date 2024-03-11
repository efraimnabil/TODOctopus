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
import TodoItem from "../components/TodoItem";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [queryVersion, setQueryVersion] = useState(1);
  const [page, setPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"DESC" | "ASC">("DESC");
  const [editTodo, setEditTodo] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
  });
  const [addTodo, setAddTodo] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
  });
  const { isLoading, data, isFetching } = useAuthQuery({
    // todoList+$todotoedit.id
    queryKey: [`todos-page-${page}`, `${queryVersion}`, `${sortBy}`],
    url: `/todos?pagination[pageSize]=${8}&pagination[page]=${page}&sort=createdAt:${sortBy}`,
    config: {
      headers: {
        Authorization: `Bearer ${userData?.jwt}`,
      },
    },
  });
  console.log(data);

  // map to know wich hand to use
  const hands = [hand1, hand2, hand3, hand4, hand5, hand6, hand7, hand8];
  const hand = hands[data?.data?.length - 1] || hands[7];

  // ** Handlers

  const onClickPrev = () => {
    setPage((prev) => prev - 1);
  };

  const onClickNext = () => {
    setPage((prev) => prev + 1);
  };

  const onChangeSortBy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "DESC" | "ASC");
  };

  const onCloseEditModal = () => {
    setEditTodo({
      id: 0,
      title: "",
      description: "",
    });
    setIsEditModalOpen(false);
  };

  const onOpenEditModal = (todo: ITodo) => {
    setEditTodo(todo);
    setIsEditModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsOpenConfirmModal(false);
  };

  const openConfirmModal = (todo: ITodo) => {
    setEditTodo(todo);
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
      const { status } = await axiosInstance.put(
        `/todos/${editTodo.id}`,
        {
          data: {
            title: editTodo.title,
            description: editTodo.description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${userData?.jwt}`,
          },
        }
      );
      if (status === 200) {
        onCloseEditModal();
        // ** Refetch the todos
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { status } = await axiosInstance.post(
        `/todos`,
        {
          data: {
            title: addTodo.title,
            description: addTodo.description,
            user: [userData.user.id],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${userData?.jwt}`,
          },
        }
      );
      if (status === 200) {
        closeAddModal();

        // ** Refetch the todos
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.log(error);
    }
    finally {
      setAddTodo({
        id: 0,
        title: "",
        description: "",
      });
    }
  };

  const onSubmitRemoveTodo = async () => {
    try {
      const { status } = await axiosInstance.delete(`/todos/${editTodo.id}`, {
        headers: {
          Authorization: `Bearer ${userData?.jwt}`,
        },
      });
      if (status === 200) {
        closeConfirmModal();
        // ** Refetch the todos
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {}
  };

  const renderTodos = data?.data?.map(
    ({ id, attributes }: { id: number; attributes: ITodo }, idx: number) => (
      <TodoItem
        key={id}
        id={id}
        idx={idx}
        title={attributes.title}
        description={attributes.description}
        onOpenEditModal={() => onOpenEditModal(attributes)}
        openConfirmModal={() => openConfirmModal(attributes)}
      />
    )
  );

  const beforeElementStyles: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '50px',
    border: '2px solid transparent',
    background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  };

  return (
    <div className="space-y-1 w-full flex flex-col items-center gap-10">
      <div className="flex flex-col md:flex-row gap-3 justify-between space-x-2 w-full">
        <div>
          <h1 className="text-2xl font-bold text-white font-SourceSerifPro">
            Finish your tasks, Kill Your Octopuses
          </h1>
          <h1 className="text-xl font-bold text-white font-SourceSerifPro">
            You have {data?.meta?.pagination.pageCount} Octopuses, {data?.meta?.pagination.total} tasks
          </h1>
        </div>
        <div className="flex gap-5 justify-end items-center">
            <select
              className="bg-gradient-to-br from-pink-trans to-orange-trans hover:from-pink-500 hover:to-orange-500 rounded-lg py-2 px-3 focus:bg-gray-200 focus:text-white focus:outline-none"
              value={sortBy}
              onChange={onChangeSortBy}
            >
              <option disabled className="text-gray-500">
                Sort by
              </option>
              <option value="ASC" className="text-gray-950">
                Oldest
              </option>
              <option value="DESC" className="text-gray-950">
                Latest
              </option>
            </select>
            <Button 
            className="bg-gradient-to-bl from-pink-trans to-orange-trans hover:from-pink-500 hover:to-orange-500 rounded-lg"
              onClick={openAddModal}
            >
              <svg width="50" height="50" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_200_6476" style={{maskType: "alpha"}}
                  maskUnits="userSpaceOnUse" x="0" y="0" width="33" height="33">
                  <rect x="0.29248" y="0.291992" width="32.4154" height="32.4154" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_200_6476)">
                  <path d="M15.4874 17.5133H8.73417C8.44716 17.5133 8.20658 17.4162 8.01242 17.2219C7.81827 17.0277 7.72119 16.787 7.72119 16.4999C7.72119 16.2127 7.81827 15.9722 8.01242 15.7783C8.20658 15.5843 8.44716 15.4874 8.73417 15.4874H15.4874V8.73417C15.4874 8.44716 15.5845 8.20658 15.7787 8.01242C15.973 7.81827 16.2136 7.72119 16.5008 7.72119C16.7879 7.72119 17.0285 7.81827 17.2224 8.01242C17.4163 8.20658 17.5133 8.44716 17.5133 8.73417V15.4874H24.2665C24.5535 15.4874 24.7941 15.5845 24.9882 15.7787C25.1824 15.973 25.2795 16.2136 25.2795 16.5008C25.2795 16.7879 25.1824 17.0285 24.9882 17.2224C24.7941 17.4163 24.5535 17.5133 24.2665 17.5133H17.5133V24.2665C17.5133 24.5535 17.4162 24.7941 17.2219 24.9882C17.0277 25.1824 16.787 25.2795 16.4999 25.2795C16.2127 25.2795 15.9722 25.1824 15.7783 24.9882C15.5843 24.7941 15.4874 24.5535 15.4874 24.2665V17.5133Z" fill="white"/>
                  </g>
                  </svg>
            </Button>
          </div>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <TodoSkeleton key={i} />
          ))}
        </div>
      ) : data?.data?.length ? (
        <div className="flex flex-col w-full items-center justify-center gap-3 md:relative">
          
          <img src={hand} alt="hand" className="w-44 h-44 md:w-60 md:h-60 lg:w-72 lg:h-72 xl:w-96 xl:h-96" />
          
          {renderTodos}</div>
      ) : (
        <p>No todos found</p>
      )}
      <Paginator
        page={page}
        pageCount={data?.meta?.pagination.pageCount}
        total={data?.meta?.pagination.total}
        isLoading={isLoading || isFetching}
        onClickPrev={onClickPrev}
        onClickNext={onClickNext}
      />
      {/* Add todo Modal */}
      <Modal
        isOpen={isOpenAddModal}
        closeModal={closeAddModal}
        title="Add Todo"
      >
        <form className="space-y-3" onSubmit={handleAddTodoSubmit}>
          <Input
            value={addTodo.title}
            name="title"
            placeholder="Title"
            onChange={handleAddTodoChange}
          />
          <Textarea
            value={addTodo.description}
            name="description"
            placeholder="Description"
            onChange={handleAddTodoChange}
          />
          <div className="flex justify-start space-x-3 mt-4">
            <Button 
              className="bg-gradient-to-br from-pink-trans to-orange-trans text-white rounded-3xl w-24 text-center text-lg py-1 md:text-md md:w-28 font-SourceSerifPro"
            >
              Add
            </Button>
            <Button 
              className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28 font-SourceSerifPro"
              onClick={closeAddModal} 
              type="button"
            >
              Cancel
              <span style={beforeElementStyles}></span>
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
          <Input
            value={editTodo.title}
            name="title"
            placeholder="Title"
            onChange={handleEditTodoChange}
          />
          <Textarea
            value={editTodo.description}
            name="description"
            placeholder="Description"
            onChange={handleEditTodoChange}
          />
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
              <span style={beforeElementStyles}></span>
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
          >
            Yes, remove
          </Button>
          <Button 
            className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28 font-SourceSerifPro"
            onClick={closeConfirmModal} 
            type="button"
          >
            Cancel
            <span style={beforeElementStyles}></span>
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TodoList;
