interface IProps {
    msg: string;
}

const InputErrorMessage = ({msg}: IProps) => {
  return (
    <div className="text-red-500 text-sm">
      {msg}
    </div>
  )
}

export default InputErrorMessage