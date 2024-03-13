interface IProps {
    currentPriority: number;
}

const Priority = ({currentPriority}: IProps) => {
  return (
    <span
        className={`${
            currentPriority === 1
            ? "bg-red-500"
            : currentPriority === 2
            ? "bg-yellow-500"
            : currentPriority === 3
            ? "bg-green-500"
            : ""
        } text-white font-bold py-1 px-2 rounded-full`}
    >
        {currentPriority}
    </span>
  )
}

export default Priority