import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";
import axiosInstance from "../config/axios.config";
import TodoSkeleton from "./TodoSkeleton";
import Paginator from "./Paginator";
import hand1 from "../assets/hand1.svg";
import hand2 from "../assets/hand2.svg";
import hand3 from "../assets/hand3.svg";
import hand4 from "../assets/hand4.svg";
import hand5 from "../assets/hand5.svg";
import hand6 from "../assets/hand6.svg";
import hand7 from "../assets/hand7.svg";
import hand8 from "../assets/hand8.svg";
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
  const hand = hands[data?.data?.length - 1];

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
    ({ id, attributes }: { id: number; attributes: ITodo }) => (
      <div
        key={id}
        className="flex items-center justify-between duration-300 p-3 shadow-custom-orange rounded-2xl"
      >
        <p className="w-full font-semibold text-white font-SourceSerifPro">
          {attributes.title}
        </p>
        <div className="flex items-center justify-end w-full space-x-5">
          {/* delete */}
          <Button
            onClick={() =>
              openConfirmModal({
                id,
                title: attributes.title,
                description: attributes.description,
              })
            }
          >
            <span className="w-8 h-8 rounded-full border border-white flex items-center justify-center"></span>
          </Button>

          {/* edit  */}
          <Button
            onClick={() =>
              onOpenEditModal({
                id,
                title: attributes.title,
                description: attributes.description,
              })
            }
            isLoading={isUpdating}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask
                id="mask0_176_4169"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="16"
                height="16"
              >
                <rect
                  x="0.476807"
                  y="0.476562"
                  width="15.1751"
                  height="15.1751"
                  fill="url(#paint0_linear_176_4169)"
                  fill-opacity="0.8"
                />
              </mask>
              <g mask="url(#mask0_176_4169)">
                <path
                  d="M3.63837 12.49H4.43602L10.9086 6.01748L10.1109 5.21982L3.63837 11.6924V12.49ZM3.26144 13.4384C3.09952 13.4384 2.96379 13.3837 2.85426 13.2741C2.74471 13.1646 2.68994 13.0289 2.68994 12.8669V11.7714C2.68994 11.6172 2.71953 11.4702 2.77872 11.3305C2.83789 11.1907 2.91935 11.069 3.02311 10.9652L11.0302 2.96183C11.1258 2.87498 11.2314 2.80788 11.3469 2.76051C11.4624 2.71314 11.5836 2.68945 11.7103 2.68945C11.8371 2.68945 11.9599 2.71195 12.0788 2.75695C12.1976 2.80194 12.3028 2.87347 12.3944 2.97155L13.1665 3.7534C13.2646 3.845 13.3346 3.9504 13.3763 4.06961C13.4181 4.18881 13.4389 4.30801 13.4389 4.42721C13.4389 4.55435 13.4172 4.67569 13.3738 4.79122C13.3304 4.90676 13.2613 5.01234 13.1665 5.10795L5.16315 13.1053C5.05939 13.209 4.93764 13.2905 4.7979 13.3497C4.65815 13.4088 4.51118 13.4384 4.35699 13.4384H3.26144ZM10.5027 5.62564L10.1109 5.21982L10.9086 6.01748L10.5027 5.62564Z"
                  fill="white"
                  fill-opacity="0.8"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_176_4169"
                  x1="15.6475"
                  y1="15.6473"
                  x2="0.476807"
                  y2="0.476562"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#FF00C2" />
                  <stop offset="1" stop-color="#FF4D00" />
                </linearGradient>
              </defs>
            </svg>
          </Button>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-1 ">
      <div className="flex items-center justify-between space-x-2">
        <Button onClick={openAddModal}>Add Todo</Button>
        <div className="flex items-center justify-between space-x-2 text-md">
          <select
            className="border-2 border-indigo-600 rounded-md p-2"
            value={sortBy}
            onChange={onChangeSortBy}
          >
            <option disabled>Sort by</option>
            <option value="ASC">Oldest</option>
            <option value="DESC">Latest</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <img src={hand} alt="hand" className="w-44 h-44" />
      </div>

      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <TodoSkeleton key={i} />
          ))}
        </div>
      ) : data.data?.length ? (
        <div className="space-y-3">{renderTodos}</div>
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
            <Button className="bg-indigo-700 hover:bg-indigo-800">Add</Button>
            <Button onClick={closeAddModal} type="button">
              Cancel
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
            <Button className="bg-indigo-700 hover:bg-indigo-800">
              Update
            </Button>
            <Button onClick={onCloseEditModal} type="button">
              Cancel
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
          <Button onClick={onSubmitRemoveTodo}>Yes, remove</Button>
          <Button onClick={closeConfirmModal} type="button">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TodoList;
