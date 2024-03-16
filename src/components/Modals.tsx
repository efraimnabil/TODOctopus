import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import GradientBorder from "./ui/GradientBorder";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";

interface EditTodoModalProps {
  isEditModalOpen: boolean;
  onCloseEditModal: () => void;
  editTodo: ITodo;
  handleEditTodoChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleEditTodoSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isUpdating: boolean;
}

interface AddTodoModalProps {
  isOpenAddModal: boolean;
  closeAddModal: () => void;
  addTodo: ITodo;
  handleAddTodoChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleAddTodoSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isAdding: boolean;
}

const EditTodoModal = ({
  isEditModalOpen,
  onCloseEditModal,
  editTodo,
  handleEditTodoChange,
  handleEditTodoSubmit,
  isUpdating,
}: EditTodoModalProps) => {
  return (
    <Modal
      isOpen={isEditModalOpen}
      closeModal={onCloseEditModal}
      title="Edit Todo"
    >
      <form className="space-y-3" onSubmit={handleEditTodoSubmit}>
        <div className="space-y-1">
          <label
            htmlFor="title"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Title
          </label>
          <Input
            value={editTodo.title}
            name="title"
            placeholder="Title"
            onChange={handleEditTodoChange}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="priority"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Priority
          </label>
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
              <label
                htmlFor="1"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                1
              </label>
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
              <label
                htmlFor="2"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                2
              </label>
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
              <label
                htmlFor="3"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                3
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Description
          </label>
          <Textarea
            value={editTodo.description}
            name="description"
            placeholder="Description"
            onChange={handleEditTodoChange}
          />
        </div>
        <div className="flex justify-start space-x-3 mt-4">
          <Button
            className="bg-gradient-to-br from-pink-trans to-orange-trans text-white rounded-3xl w-24 text-center text-lg py-1 md:text-md md:w-28 font-SourceSerifPro"
            isLoading={isUpdating}
          >
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
  );
};

const AddTodoModal = ({
  isOpenAddModal,
  closeAddModal,
  addTodo,
  handleAddTodoChange,
  handleAddTodoSubmit,
  isAdding,
}: AddTodoModalProps) => {
  return (
    <Modal isOpen={isOpenAddModal} closeModal={closeAddModal} title="Add Todo">
      <form className="space-y-3" onSubmit={handleAddTodoSubmit}>
        <div className="space-y-1">
          <label
            htmlFor="title"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Title
          </label>
          <Input
            value={addTodo.title}
            required
            name="title"
            placeholder="Title"
            onChange={handleAddTodoChange}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="priority"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Priority
          </label>
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
              <label
                htmlFor="1"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                1
              </label>
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
              <label
                htmlFor="2"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                2
              </label>
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
              <label
                htmlFor="3"
                className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
              >
                3
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="text-sm font-SourceSerifPro ml-1 font-medium text-gray-900 dark:text-gray-300"
          >
            Description
          </label>
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
  );
};

export { EditTodoModal, AddTodoModal };
